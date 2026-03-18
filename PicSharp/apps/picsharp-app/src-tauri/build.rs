fn main() {
    #[cfg(target_os = "windows")]
    {
        use std::env;
        use std::fs;
        use std::path::{Path, PathBuf};
        use std::process::Command;

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
        // src-tauri -> picsharp-app -> apps -> PicSharp (workspace root)
        let workspace_root = manifest_dir.ancestors().nth(3).unwrap();
        let sidecar_pkg = workspace_root.join("packages").join("picsharp-sidecar");

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

        // ── 1. 构建并复制 sidecar ──────────────────────────────────────────────
        let sidecar_bin = sidecar_pkg
            .join("bin")
            .join("picsharp-sidecar-x86_64-pc-windows-msvc.exe");
        let binaries_dir = manifest_dir.join("binaries");
        let sidecar_dst = binaries_dir.join("picsharp-sidecar-x86_64-pc-windows-msvc.exe");

        if is_release {
            // release 时重新 esbuild + pkg 打包 sidecar，保证使用最新代码
            let status = Command::new("pnpm.cmd")
                .args(&["build-sea:win-x64"])
                .current_dir(&sidecar_pkg)
                .status()
                .unwrap_or_else(|error| panic!("failed to start sidecar build: {error}"));
            if !status.success() {
                panic!("sidecar build failed with status: {status}");
            }

            // release 时强制校验并更新 sidecar 二进制
            assert_file_exists_release(&sidecar_bin, "sidecar binary");
            std::fs::create_dir_all(&binaries_dir)
                .unwrap_or_else(|error| panic!("failed to create binaries dir: {error}"));
            if sidecar_dst.exists() {
                std::fs::remove_file(&sidecar_dst)
                    .unwrap_or_else(|error| panic!("failed to remove stale sidecar binary: {error}"));
            }
            std::fs::copy(&sidecar_bin, &sidecar_dst)
                .unwrap_or_else(|error| panic!("failed to copy sidecar binary: {error}"));
            assert_file_exists_release(&sidecar_dst, "copied sidecar binary");
        } else if sidecar_bin.exists() {
            // dev 时如果 sidecar 已存在则更新（不存在则跳过，不阻断 dev 流程）
            std::fs::create_dir_all(&binaries_dir).ok();
            let _ = std::fs::copy(&sidecar_bin, &sidecar_dst);
        }

        // ── 2. 复制 sharp 原生依赖 ────────────────────────────────────────────
        let resources_dir = manifest_dir.join("resources");
        let sharp_runtime_dst = resources_dir
            .join("node_modules")
            .join("@img")
            .join("sharp-win32-x64");

        let sharp_pkg_json = Command::new("node")
            .args(&[
                "-e",
                "console.log(require.resolve('@img/sharp-win32-x64/package', { paths: [process.cwd()] }))",
            ])
            .current_dir(&sidecar_pkg)
            .output();

        match sharp_pkg_json {
            Ok(output) if output.status.success() => {
                let sharp_runtime_src =
                    PathBuf::from(String::from_utf8_lossy(&output.stdout).trim().to_string());
                if let Some(sharp_runtime_src_dir) = sharp_runtime_src.parent() {
                    println!("cargo:rerun-if-changed={}", sharp_runtime_src_dir.display());

                    if sharp_runtime_dst.exists() {
                        let _ = fs::remove_dir_all(&sharp_runtime_dst);
                    }
                    let copy_result =
                        copy_dir_recursive(sharp_runtime_src_dir, &sharp_runtime_dst);

                    if is_release {
                        copy_result.unwrap_or_else(|error| {
                            panic!("failed to copy sharp runtime package: {error}")
                        });
                        // release 时严格校验关键原生文件
                        assert_file_exists_release(
                            &sharp_runtime_dst.join("lib").join("sharp-win32-x64.node"),
                            "sharp runtime native module",
                        );
                        assert_file_exists_release(
                            &sharp_runtime_dst.join("lib").join("libvips-42.dll"),
                            "sharp runtime libvips dll",
                        );
                    } else {
                        // dev 时静默失败
                        let _ = copy_result;
                    }
                }
            }
            Ok(output) => {
                if is_release {
                    panic!(
                        "failed to resolve sharp runtime package: {}",
                        String::from_utf8_lossy(&output.stderr)
                    );
                }
                // dev 时静默跳过
            }
            Err(error) => {
                if is_release {
                    panic!("failed to resolve sharp runtime package: {error}");
                }
                // dev 时静默跳过
            }
        }

        // ── 3. 构建并复制 picsharp-shell-command DLL ─────────────────────────
        let target_dir = workspace_root.join("target").join(&profile);
        let dll_src = target_dir.join("picsharp_shell_command.dll");
        let dll_dst = resources_dir.join("picsharp_shell_command.dll");

        if is_release {
            let shell_cmd_target = workspace_root.join("target").join("shell-command");
            let status = Command::new(env::var("CARGO").unwrap_or_else(|_| "cargo".to_string()))
                .args(&[
                    "build",
                    "-p",
                    "picsharp-shell-command",
                    "--release",
                    "--target-dir",
                    shell_cmd_target.to_str().unwrap_or("target/shell-command"),
                ])
                .current_dir(workspace_root)
                .status()
                .unwrap_or_else(|error| panic!("failed to build picsharp-shell-command: {error}"));
            if !status.success() {
                panic!("picsharp-shell-command build failed with status: {status}");
            }

            let shell_dll = shell_cmd_target.join("release").join("picsharp_shell_command.dll");
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
            let _ = std::fs::copy(&dll_src, &dll_dst);

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

        // ── 4. 安装包级自检（仅 release 模式）────────────────────────────────
        if is_release {
            let app_root = manifest_dir
                .parent()
                .unwrap_or_else(|| panic!("invalid app root for {}", manifest_dir.display()));
            let smokecheck_script = app_root.join("scripts").join("postbuild-smokecheck.mjs");
            let smokecheck_status = Command::new("node")
                .arg(smokecheck_script.to_string_lossy().to_string())
                .arg(sidecar_dst.to_string_lossy().to_string())
                .arg(sharp_runtime_dst.to_string_lossy().to_string())
                .arg(resources_dir.to_string_lossy().to_string())
                .current_dir(app_root)
                .status()
                .unwrap_or_else(|error| panic!("failed to run postbuild smokecheck: {error}"));
            if !smokecheck_status.success() {
                panic!("postbuild smokecheck failed with status: {smokecheck_status}");
            }
        }
    }

    tauri_build::build()
}
