fn main() {
    #[cfg(target_os = "windows")]
    {
        use std::env;
        use std::fs;
        use std::path::{Path, PathBuf};
        use std::process::Command;

        /// 仅当源文件比目标更新或大小不同时才复制，避免无谓触碰目标文件的 mtime。
        /// 这可以防止 Tauri CLI 文件监视器因 build.rs 的重复复制而陷入无限重建循环。
        fn copy_if_changed(src: &Path, dst: &Path) -> std::io::Result<()> {
            if dst.exists() {
                let src_meta = fs::metadata(src)?;
                let dst_meta = fs::metadata(dst)?;
                if src_meta.len() == dst_meta.len() {
                    if let (Ok(src_mtime), Ok(dst_mtime)) =
                        (src_meta.modified(), dst_meta.modified())
                    {
                        if dst_mtime >= src_mtime {
                            return Ok(());
                        }
                    }
                }
            }
            if let Some(parent) = dst.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(src, dst)?;
            Ok(())
        }

        fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
            fs::create_dir_all(dst)?;
            for entry in fs::read_dir(src)? {
                let entry = entry?;
                let ty = entry.file_type()?;
                let dst_path = dst.join(entry.file_name());
                if ty.is_dir() {
                    copy_dir_recursive(&entry.path(), &dst_path)?;
                } else if ty.is_file() {
                    if let Some(parent) = dst_path.parent() {
                        fs::create_dir_all(parent)?;
                    }
                    fs::copy(entry.path(), dst_path)?;
                }
            }
            Ok(())
        }

        // release 模式下严格校验关键文件必须存在
        fn assert_file_exists_release(path: &Path, label: &str) {
            if !path.exists() {
                panic!("{label} is missing: {}", path.display());
            }
            if !path.is_file() {
                panic!("{label} is not a file: {}", path.display());
            }
        }

        let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
        let is_release = profile == "release";
        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        // src-tauri -> verypic-app -> apps -> monorepo root
        let workspace_root = manifest_dir.ancestors().nth(3).unwrap();
        let sidecar_pkg = workspace_root.join("packages").join("verypic-sidecar");

        // 前置检查：确保 pnpm install 已执行，sharp 可用
        let sharp_check = Command::new("node")
            .args(&[
                "-e",
                "try { require.resolve('sharp', { paths: [process.cwd()] }); process.exit(0); } catch (e) { console.error('Sharp not found. Run: pnpm install (at monorepo root)'); process.exit(1); }",
            ])
            .current_dir(&sidecar_pkg)
            .output();
        if let Ok(out) = sharp_check {
            if !out.status.success() && is_release {
                eprintln!("{}", String::from_utf8_lossy(&out.stderr));
                panic!(
                    "Sharp package not found. Please run 'pnpm install' at monorepo root ({}), then rebuild.",
                    workspace_root.display()
                );
            }
        } else if is_release {
            panic!("Failed to run node for sharp check. Ensure Node.js and pnpm install are available.");
        }

        println!("cargo:rerun-if-changed={}", manifest_dir.join("icons").join("icon.ico").display());
        println!("cargo:rerun-if-changed={}", manifest_dir.join("icons").join("icon.png").display());
        println!("cargo:rerun-if-changed={}", sidecar_pkg.join("src").display());
        println!("cargo:rerun-if-changed={}", sidecar_pkg.join("package.json").display());
        println!(
            "cargo:rerun-if-changed={}",
            sidecar_pkg.join("esbuild.config.mjs").display()
        );
        println!(
            "cargo:rerun-if-changed={}",
            workspace_root.join("pnpm-lock.yaml").display()
        );
        println!(
            "cargo:rerun-if-changed={}",
            manifest_dir
                .parent()
                .unwrap_or_else(|| panic!("invalid manifest dir: {}", manifest_dir.display()))
                .join("scripts")
                .join("postbuild-smokecheck.mjs")
                .display()
        );

        let resources_dir = manifest_dir.join("resources");

        // ── 1. 构建 sidecar（esbuild only, no pkg）───────────────────────────
        let binaries_dir = manifest_dir.join("binaries");
        let sidecar_dst = binaries_dir.join("verypic-sidecar-x86_64-pc-windows-msvc.exe");

        if is_release {
            // 1a. esbuild + copy-native-deps
            let status = Command::new("pnpm.cmd")
                .args(&["build-node:win-x64"])
                .current_dir(&sidecar_pkg)
                .status()
                .unwrap_or_else(|error| panic!("failed to start sidecar build: {error}"));
            if !status.success() {
                panic!("sidecar build failed with status: {status}");
            }

            // 1b. Copy node.exe as the sidecar binary (replaces pkg exe)
            let node_exe = {
                let output = Command::new("where.exe")
                    .arg("node")
                    .output()
                    .unwrap_or_else(|e| panic!("failed to locate node.exe: {e}"));
                let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let first_line = path_str.lines().next().unwrap_or("").trim().to_string();
                PathBuf::from(first_line)
            };
            assert_file_exists_release(&node_exe, "node.exe");

            std::fs::create_dir_all(&binaries_dir)
                .unwrap_or_else(|error| panic!("failed to create binaries dir: {error}"));
            if sidecar_dst.exists() {
                std::fs::remove_file(&sidecar_dst)
                    .unwrap_or_else(|error| panic!("failed to remove stale sidecar binary: {error}"));
            }
            std::fs::copy(&node_exe, &sidecar_dst)
                .unwrap_or_else(|error| panic!("failed to copy node.exe as sidecar: {error}"));
            assert_file_exists_release(&sidecar_dst, "copied sidecar binary (node.exe)");

            // 1c. Copy JS bundles to resources/sidecar/
            let sidecar_js_dst = resources_dir.join("sidecar");
            if sidecar_js_dst.exists() {
                let _ = fs::remove_dir_all(&sidecar_js_dst);
            }
            fs::create_dir_all(&sidecar_js_dst)
                .unwrap_or_else(|error| panic!("failed to create sidecar js dir: {error}"));
            let dist_dir = sidecar_pkg.join("dist");
            for file in &["index.js", "dispatcher.js"] {
                let src = dist_dir.join(file);
                assert_file_exists_release(&src, &format!("sidecar bundle {file}"));
                fs::copy(&src, sidecar_js_dst.join(file))
                    .unwrap_or_else(|error| panic!("failed to copy {file}: {error}"));
            }

            // 1d. Copy native_modules (produced by copy-native-deps.mjs) to resources/node_modules/
            let native_modules_src = sidecar_pkg.join("native_modules");
            if native_modules_src.exists() {
                let native_modules_dst = resources_dir.join("node_modules");
                if native_modules_dst.exists() {
                    let _ = fs::remove_dir_all(&native_modules_dst);
                }
                copy_dir_recursive(&native_modules_src, &native_modules_dst)
                    .unwrap_or_else(|error| panic!("failed to copy native_modules: {error}"));
            }
        } else {
            // dev: try to copy node.exe if sidecar doesn't exist yet
            std::fs::create_dir_all(&binaries_dir).ok();
            if !sidecar_dst.exists() {
                if let Ok(output) = Command::new("where.exe").arg("node").output() {
                    let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if let Some(first_line) = path_str.lines().next() {
                        let node_exe = PathBuf::from(first_line.trim());
                        if node_exe.exists() {
                            let _ = std::fs::copy(&node_exe, &sidecar_dst);
                        }
                    }
                }
            }
        }

        // ── 2. 构建并复制 verypic-shell-command DLL ─────────────────────────
        let target_dir = workspace_root.join("target").join(&profile);
        let dll_src = target_dir.join("verypic_shell_command.dll");
        let dll_dst = resources_dir.join("verypic_shell_command.dll");

        if is_release {
            let shell_cmd_target = workspace_root.join("target").join("shell-command");
            let status = Command::new(env::var("CARGO").unwrap_or_else(|_| "cargo".to_string()))
                .args(&[
                    "build",
                    "-p",
                    "verypic-shell-command",
                    "--release",
                    "--target-dir",
                    shell_cmd_target.to_str().unwrap_or("target/shell-command"),
                ])
                .current_dir(workspace_root)
                .status()
                .unwrap_or_else(|error| panic!("failed to build verypic-shell-command: {error}"));
            if !status.success() {
                panic!("verypic-shell-command build failed with status: {status}");
            }

            let shell_dll = shell_cmd_target.join("release").join("verypic_shell_command.dll");
            let effective_dll_src = if shell_dll.exists() { &shell_dll } else { &dll_src };

            if effective_dll_src.exists() {
                std::fs::create_dir_all(&resources_dir).ok();
                let _ = std::fs::copy(effective_dll_src, &dll_dst);

                let sparse_src_dir = manifest_dir.join("sparse-package");
                let manifest_src = sparse_src_dir.join("AppxManifest.xml");
                let manifest_dst = resources_dir.join("AppxManifest.xml");
                if manifest_src.exists() {
                    let _ = std::fs::copy(&manifest_src, &manifest_dst);
                }

                let logo_src = sparse_src_dir.join("Assets").join("StoreLogo.png");
                let logo_dst_dir = resources_dir.join("Assets");
                if logo_src.exists() {
                    std::fs::create_dir_all(&logo_dst_dir)
                        .unwrap_or_else(|error| panic!("failed to create logo dir: {error}"));
                    std::fs::copy(&logo_src, logo_dst_dir.join("StoreLogo.png"))
                        .unwrap_or_else(|error| panic!("failed to copy StoreLogo.png: {error}"));
                }
            }
        } else if dll_src.exists() {
            std::fs::create_dir_all(&resources_dir).ok();
            let _ = copy_if_changed(&dll_src, &dll_dst);

            let sparse_src_dir = manifest_dir.join("sparse-package");
            let manifest_src = sparse_src_dir.join("AppxManifest.xml");
            let manifest_dst = resources_dir.join("AppxManifest.xml");
            if manifest_src.exists() {
                let _ = copy_if_changed(&manifest_src, &manifest_dst);
            }

            let logo_src = sparse_src_dir.join("Assets").join("StoreLogo.png");
            let logo_dst_dir = resources_dir.join("Assets");
            if logo_src.exists() {
                std::fs::create_dir_all(&logo_dst_dir)
                    .unwrap_or_else(|error| panic!("failed to create logo dir: {error}"));
                let logo_dst = logo_dst_dir.join("StoreLogo.png");
                copy_if_changed(&logo_src, &logo_dst)
                    .unwrap_or_else(|error| panic!("failed to copy StoreLogo.png: {error}"));
            }
        }

        // ── 3. 安装包级自检（仅 release 模式）────────────────────────────────
        if is_release {
            let sharp_runtime_dst = resources_dir
                .join("node_modules")
                .join("@img")
                .join("sharp-win32-x64");
            assert_file_exists_release(
                &sharp_runtime_dst.join("lib").join("sharp-win32-x64.node"),
                "sharp runtime native module",
            );
            assert_file_exists_release(
                &sharp_runtime_dst.join("lib").join("libvips-42.dll"),
                "sharp runtime libvips dll",
            );
            assert_file_exists_release(
                &resources_dir.join("sidecar").join("index.js"),
                "sidecar JS bundle",
            );
        }
    }

    tauri_build::build()
}
