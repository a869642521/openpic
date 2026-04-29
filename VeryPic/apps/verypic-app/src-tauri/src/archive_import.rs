//! ZIP / RAR 拖入：解压匹配扩展名的图片到临时目录，供 `parse_paths` / `count_valid_files` 扫描。

use nanoid::nanoid;
use std::collections::HashSet;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use unrar::Archive;
use zip::read::ZipArchive;

/// 单条目解压上限（缓解 zip 炸弹 / 异常大包）
const MAX_ARCHIVE_ENTRY_BYTES: u64 = 512 * 1024 * 1024;

fn import_temp_root() -> PathBuf {
    std::env::temp_dir()
        .join("verypic-archive-import")
        .join(nanoid!())
}

fn valid_ext_hashset(valid_exts: &[String]) -> HashSet<String> {
    valid_exts.iter().map(|e| e.to_lowercase()).collect()
}

fn path_has_allowed_extension(path_like: &str, ext_set: &HashSet<String>) -> bool {
    Path::new(path_like)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| ext_set.contains(&e.to_lowercase()))
        .unwrap_or(false)
}

/// 防路径穿越：仅允许相对路径且路径分量均为 Normal
fn safe_relative_archive_path(name: &str) -> Option<PathBuf> {
    let normalized = name.replace('\\', "/");
    let trimmed = normalized.trim_start_matches('/');
    if trimmed.is_empty() || trimmed.ends_with('/') {
        return None;
    }
    let p = Path::new(trimmed);
    for c in p.components() {
        if !matches!(c, std::path::Component::Normal(_)) {
            return None;
        }
    }
    Some(p.to_path_buf())
}

fn path_is_zip_archive(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|s| s.to_str())
            .map(|e| e.eq_ignore_ascii_case("zip"))
            .unwrap_or(false)
}

fn path_is_rar_archive(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|s| s.to_str())
            .map(|e| e.eq_ignore_ascii_case("rar"))
            .unwrap_or(false)
}

fn unrar_io_err(e: impl std::fmt::Display) -> io::Error {
    io::Error::new(io::ErrorKind::Other, e.to_string())
}

fn finalize_extract_root(temp_root: PathBuf, extracted_any: bool) -> io::Result<Vec<String>> {
    if !extracted_any {
        let _ = fs::remove_dir_all(&temp_root);
        return Ok(vec![]);
    }
    Ok(vec![temp_root.to_string_lossy().into_owned()])
}

fn extract_zip_image_entries(zip_path: &Path, valid_exts: &[String]) -> io::Result<Vec<String>> {
    let ext_set = valid_ext_hashset(valid_exts);
    let temp_root = import_temp_root();
    fs::create_dir_all(&temp_root)?;

    let zf = File::open(zip_path)?;
    let mut archive = ZipArchive::new(zf)?;
    let mut extracted_any = false;

    for i in 0..archive.len() {
        let mut entry = match archive.by_index(i) {
            Ok(e) => e,
            Err(_) => continue,
        };
        if entry.is_dir() {
            continue;
        }
        let raw_name = entry.name().to_owned();
        if !path_has_allowed_extension(&raw_name, &ext_set) {
            continue;
        }
        if entry.size() > MAX_ARCHIVE_ENTRY_BYTES {
            continue;
        }
        let Some(rel) = safe_relative_archive_path(&raw_name) else {
            continue;
        };
        let out_path = temp_root.join(&rel);
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut outfile = fs::File::create(&out_path)?;
        if io::copy(&mut entry, &mut outfile).is_err() {
            let _ = fs::remove_file(&out_path);
            continue;
        }
        extracted_any = true;
    }

    finalize_extract_root(temp_root, extracted_any)
}

fn extract_rar_image_entries(rar_path: &Path, valid_exts: &[String]) -> io::Result<Vec<String>> {
    let ext_set = valid_ext_hashset(valid_exts);
    let temp_root = import_temp_root();
    fs::create_dir_all(&temp_root)?;

    let mut arch = Archive::new(rar_path)
        .open_for_processing()
        .map_err(unrar_io_err)?;

    let mut extracted_any = false;

    loop {
        arch = match arch.read_header().map_err(unrar_io_err)? {
            Some(file_state) => {
                let (is_dir, is_enc, fname, size) = {
                    let e = file_state.entry();
                    (
                        e.is_directory(),
                        e.is_encrypted(),
                        e.filename.to_string_lossy().into_owned(),
                        e.unpacked_size,
                    )
                };

                if is_dir || is_enc {
                    file_state.skip().map_err(unrar_io_err)?
                } else if !path_has_allowed_extension(&fname, &ext_set) || size > MAX_ARCHIVE_ENTRY_BYTES {
                    file_state.skip().map_err(unrar_io_err)?
                } else if let Some(rel) = safe_relative_archive_path(&fname) {
                    let out_path = temp_root.join(&rel);
                    if let Some(parent) = out_path.parent() {
                        fs::create_dir_all(parent)?;
                    }
                    match file_state.read().map_err(unrar_io_err) {
                        Ok((data, next)) => {
                            if fs::write(&out_path, &data).is_ok() {
                                extracted_any = true;
                            }
                            next
                        }
                        Err(e) => {
                            let _ = fs::remove_dir_all(&temp_root);
                            return Err(e);
                        }
                    }
                } else {
                    file_state.skip().map_err(unrar_io_err)?
                }
            }
            None => break,
        };
    }

    finalize_extract_root(temp_root, extracted_any)
}

/// 将输入路径中的 zip/rar 展开为临时目录路径；普通路径原样保留。
pub fn expand_input_paths_for_scan(paths: Vec<String>, valid_exts: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for p in paths {
        let path = Path::new(&p);
        if path_is_zip_archive(path) {
            match extract_zip_image_entries(path, valid_exts) {
                Ok(dirs) => out.extend(dirs),
                Err(e) => log::warn!("verypic: zip 读取或解压失败 {}: {}", p, e),
            }
        } else if path_is_rar_archive(path) {
            match extract_rar_image_entries(path, valid_exts) {
                Ok(dirs) => out.extend(dirs),
                Err(e) => log::warn!("verypic: rar 读取或解压失败 {}: {}", p, e),
            }
        } else {
            out.push(p);
        }
    }
    out
}
