use log::{error, info};
use std::process::Command;
use tauri::ipc::Response;
use tauri::{command, Manager};
use tauri::{AppHandle, Runtime};

#[cfg(target_os = "macos")]
#[command]
pub async fn ipc_open_system_preference_notifications() -> Response {
    match Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.notifications")
        .spawn()
    {
        Ok(_) => {
            info!("Successfully opened Notifications settings");
            Response::new(
                serde_json::json!({
                    "success": true,
                })
                .to_string(),
            )
        }
        Err(e) => {
            let error_msg = format!("Failed to open Notifications settings on macOS: {}", e);
            error!("{}", error_msg);
            Response::new(
                serde_json::json!({
                    "success": false,
                    "error": error_msg
                })
                .to_string(),
            )
        }
    }
}

#[cfg(target_os = "windows")]
#[command]
pub async fn ipc_open_system_preference_notifications() -> Response {
    let methods = vec![
        ("explorer", vec!["ms-settings:notifications"]),
        ("start", vec!["ms-settings:notifications"]),
        ("cmd", vec!["/c", "start", "ms-settings:notifications"]),
    ];

    for (cmd, args) in methods {
        match Command::new(cmd).args(&args).spawn() {
            Ok(_) => {
                info!("Successfully opened Notifications settings on Windows");
                return Response::new(
                    serde_json::json!({
                        "success": true,
                    })
                    .to_string(),
                );
            }
            Err(e) => {
                let error_msg = format!("Failed to open Notifications settings on Windows: {}", e);
                error!("{}", error_msg);
                return Response::new(
                    serde_json::json!({
                        "success": false,
                        "error": error_msg
                    })
                    .to_string(),
                );
            }
        }
    }

    let error_msg = "Failed to open Notifications settings on Windows. Please open Settings > System > Notifications manually.".to_string();
    error!("{}", error_msg);
    Response::new(
        serde_json::json!({
            "success": false,
            "error": error_msg
        })
        .to_string(),
    )
}

#[cfg(target_os = "linux")]
#[command]
pub async fn ipc_open_system_preference_notifications() -> Response {
    // Detect desktop environment
    // let desktop_env = std::env::var("XDG_CURRENT_DESKTOP")
    //     .or_else(|_| std::env::var("DESKTOP_SESSION"))
    //     .unwrap_or_default()
    //     .to_lowercase();

    // Define commands for different desktop environments
    // let commands = match desktop_env.as_str() {
    //     env if env.contains("gnome") => vec![
    //         ("gnome-control-center", vec!["notifications"]),
    //         ("/usr/bin/gnome-control-center", vec!["notifications"]),
    //     ],
    //     env if env.contains("kde") || env.contains("plasma") => vec![
    //         ("systemsettings5", vec!["kcm_notifications"]),
    //         ("kcmshell5", vec!["kcm_notifications"]),
    //     ],
    //     env if env.contains("xfce") => vec![
    //         ("xfce4-notifyd-config", vec![]),
    //         ("xfce4-settings-manager", vec!["-s", "xfce4-notifyd"]),
    //     ],
    //     env if env.contains("mate") => vec![
    //         ("mate-notification-properties", vec![]),
    //         ("mate-control-center", vec!["notifications"]),
    //     ],
    //     env if env.contains("cinnamon") => vec![
    //         ("cinnamon-settings", vec!["notifications"]),
    //         ("/usr/bin/cinnamon-settings", vec!["notifications"]),
    //     ],
    //     env if env.contains("lxqt") => vec![("lxqt-config-notificationd", vec![])],
    //     _ => vec![
    //         // Fallback: try common commands
    //         ("gnome-control-center", vec!["notifications"]),
    //         ("systemsettings5", vec!["kcm_notifications"]),
    //         ("xfce4-notifyd-config", vec![]),
    //         ("mate-notification-properties", vec![]),
    //         ("cinnamon-settings", vec!["notifications"]),
    //     ],
    // };

    // Try each command until one succeeds
    // for (cmd, args) in commands {
    //     match Command::new(cmd).args(&args).spawn() {
    //         Ok(_) => {
    //             return Response::new(
    //                 serde_json::json!({
    //                     "success": true,
    //                 })
    //                 .to_string(),
    //             );
    //         }
    //         Err(_) => continue,
    //     }
    // }

    // // If all commands fail, try to open generic settings
    // let fallback_commands: Vec<(&_, Vec<_>)> = vec![
    //     ("gnome-control-center", vec![]),
    //     ("systemsettings5", vec![]),
    //     ("xfce4-settings-manager", vec![]),
    //     ("mate-control-center", vec![]),
    //     ("cinnamon-settings", vec![]),
    //     ("lxqt-config", vec![]),
    // ];

    // for (cmd, args) in fallback_commands {
    //     match Command::new(cmd).args(&args).spawn() {
    //         Ok(_) => {
    //             return Response::new(
    //                 serde_json::json!({
    //                     "success": true,
    //                 })
    //                 .to_string(),
    //             );
    //         }
    //         Err(_) => continue,
    //     }
    // }

    // Response::new(serde_json::json!({
    //     "success": false,
    //     "error": format!(
    //         "Failed to open Notifications settings on Linux. Desktop environment: {}. Please open your system settings and navigate to Notifications manually.",
    //         desktop_env
    //     )
    // }).to_string())
    Response::new(
        serde_json::json!({
            "success": false,
            "error": "Opening system notification settings is not supported on this platform"
        })
        .to_string(),
    )
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
#[command]
pub async fn ipc_open_system_preference_notifications() -> Response {
    Response::new(
        serde_json::json!({
            "success": false,
            "error": "Opening system notification settings is not supported on this platform"
        })
        .to_string(),
    )
}

pub async fn kill_processes_by_name(process_name_pattern: &str) -> Result<String, String> {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        use std::process::Command;

        let current_pid = std::process::id();

        let pgrep_output = Command::new("pgrep")
            .arg("-f")
            .arg(process_name_pattern)
            .output();

        match pgrep_output {
            Ok(output) => {
                if output.status.success() {
                    let pids_str = String::from_utf8_lossy(&output.stdout);
                    let pids: Vec<&str> = pids_str
                        .trim()
                        .split('\n')
                        .filter(|&s| !s.is_empty())
                        .collect();

                    if pids.is_empty() {
                        return Ok(format!(
                            "No processes found containing '{}'",
                            process_name_pattern
                        ));
                    }

                    let mut killed_count = 0;
                    let mut errors = Vec::new();

                    for pid_str in pids {
                        if let Ok(pid) = pid_str.parse::<u32>() {
                            if pid == current_pid {
                                continue;
                            }

                            let kill_result = Command::new("kill").arg("-9").arg(pid_str).output();

                            match kill_result {
                                Ok(kill_output) => {
                                    if kill_output.status.success() {
                                        killed_count += 1;
                                    } else {
                                        let error_msg =
                                            String::from_utf8_lossy(&kill_output.stderr);
                                        errors.push(format!(
                                            "Failed to kill process {}: {}",
                                            pid, error_msg
                                        ));
                                    }
                                }
                                Err(e) => {
                                    errors.push(format!("Failed to execute kill command: {}", e));
                                }
                            }
                        }
                    }

                    let mut result = format!(
                        "Successfully killed {} processes containing '{}'",
                        killed_count, process_name_pattern
                    );
                    if !errors.is_empty() {
                        result.push_str(&format!("\nErrors:\n{}", errors.join("\n")));
                    }
                    Ok(result)
                } else {
                    Ok(format!(
                        "No processes found containing '{}'",
                        process_name_pattern
                    ))
                }
            }
            Err(e) => Err(format!("Failed to execute pgrep command: {}", e)),
        }
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        let tasklist_output = Command::new("tasklist")
            .arg("/FI")
            .arg(&format!("IMAGENAME eq *{}*", process_name_pattern))
            .arg("/FO")
            .arg("CSV")
            .output();

        match tasklist_output {
            Ok(output) => {
                if output.status.success() {
                    let output_str = String::from_utf8_lossy(&output.stdout);
                    let lines: Vec<&str> = output_str.lines().collect();

                    let mut killed_count = 0;
                    let mut errors = Vec::new();

                    for line in lines.iter().skip(1) {
                        if line.contains(process_name_pattern) {
                            let parts: Vec<&str> = line.split(',').collect();
                            if parts.len() > 0 {
                                let process_name = parts[0].trim_matches('"');

                                let kill_result = Command::new("taskkill")
                                    .arg("/F")
                                    .arg("/IM")
                                    .arg(process_name)
                                    .output();

                                match kill_result {
                                    Ok(kill_output) => {
                                        if kill_output.status.success() {
                                            killed_count += 1;
                                        } else {
                                            let error_msg =
                                                String::from_utf8_lossy(&kill_output.stderr);
                                            errors.push(format!(
                                                "Failed to kill process {}: {}",
                                                process_name, error_msg
                                            ));
                                        }
                                    }
                                    Err(e) => {
                                        errors.push(format!(
                                            "Failed to execute taskkill command: {}",
                                            e
                                        ));
                                    }
                                }
                            }
                        }
                    }

                    if killed_count == 0 && errors.is_empty() {
                        Ok(format!(
                            "No processes found containing '{}'",
                            process_name_pattern
                        ))
                    } else {
                        let mut result = format!(
                            "Successfully killed {} processes containing '{}'",
                            killed_count, process_name_pattern
                        );
                        if !errors.is_empty() {
                            result.push_str(&format!("\nErrors:\n{}", errors.join("\n")));
                        }
                        Ok(result)
                    }
                } else {
                    Ok(format!(
                        "No processes found containing '{}'",
                        process_name_pattern
                    ))
                }
            }
            Err(e) => Err(format!("Failed to execute tasklist command: {}", e)),
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        Err("This operation is not supported on the current platform".to_string())
    }
}

#[command]
pub async fn ipc_kill_processes_by_name(process_name_pattern: String) -> Result<String, String> {
    kill_processes_by_name(&process_name_pattern).await
}

#[command]
pub async fn ipc_kill_verypic_sidecar_processes() -> Result<String, String> {
    kill_processes_by_name("verypic-sidecar").await
}

#[cfg(target_os = "windows")]
fn try_install_sparse_package(exe_path: &std::path::Path) {
    use std::fs;

    let exe_dir = exe_path.parent().unwrap_or_else(|| std::path::Path::new("."));
    let res_dir = exe_dir.join("resources");

    // 查找 DLL（优先 resources 子目录，其次与 exe 同目录）
    let dll_src = [
        res_dir.join("verypic_shell_command.dll"),
        exe_dir.join("verypic_shell_command.dll"),
    ]
    .into_iter()
    .find(|p| p.exists());

    let dll_src = match dll_src {
        Some(p) => p,
        None => {
            info!("[ContextMenu] Sparse Package: verypic_shell_command.dll not found, skipping Win11 main menu");
            return;
        }
    };

    // 查找 AppxManifest.xml
    let manifest_src = [
        res_dir.join("AppxManifest.xml"),
        exe_dir.join("AppxManifest.xml"),
    ]
    .into_iter()
    .find(|p| p.exists());

    let manifest_src = match manifest_src {
        Some(p) => p,
        None => {
            info!("[ContextMenu] Sparse Package: AppxManifest.xml not found, skipping Win11 main menu");
            return;
        }
    };

    // 查找 StoreLogo（图标）
    let logo_src = [
        res_dir.join("Assets").join("StoreLogo.png"),
        exe_dir.join("Assets").join("StoreLogo.png"),
        res_dir.join("StoreLogo.png"),
    ]
    .into_iter()
    .find(|p| p.exists());

    // 包注册目录：exe_dir/sparse-pkg（与主程序 exe 同级，manifest 放这里）
    // Add-AppxPackage -Register 以此目录为 PackageRootFolder
    // 清单中的 DLL Path("verypic_shell_command.dll") 相对于此目录解析
    let pkg_dir = exe_dir.join("sparse-pkg");
    let pkg_assets_dir = pkg_dir.join("Assets");
    if let Err(e) = fs::create_dir_all(&pkg_assets_dir) {
        info!("[ContextMenu] Sparse Package: failed to create pkg dir: {}", e);
        return;
    }

    // 复制 manifest
    if let Err(e) = fs::copy(&manifest_src, pkg_dir.join("AppxManifest.xml")) {
        info!("[ContextMenu] Sparse Package: failed to copy manifest: {}", e);
        return;
    }

    // 复制 DLL（COM SurrogateServer Path 相对于 PackageRootFolder 解析）
    if let Err(e) = fs::copy(&dll_src, pkg_dir.join("verypic_shell_command.dll")) {
        info!("[ContextMenu] Sparse Package: failed to copy DLL to pkg dir: {}", e);
        return;
    }

    // 复制 Logo（清单中 Properties/Logo 和 VisualElements 图标）
    if let Some(logo) = logo_src {
        let _ = fs::copy(&logo, pkg_assets_dir.join("StoreLogo.png"));
    } else {
        // Logo 缺失时用透明占位图（1x1 最小 PNG）
        let minimal_png: &[u8] = &[
            0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // PNG signature
            0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52, // IHDR chunk length + type
            0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1 pixels
            0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth, color type, etc.
            0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41, // IDAT chunk
            0x54,0x08,0xd7,0x63,0xf8,0xcf,0xc0,0x00, // compressed data
            0x00,0x00,0x02,0x00,0x01,0xe2,0x21,0xbc, // more compressed
            0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4e, // IEND chunk
            0x44,0xae,0x42,0x60,0x82,                // IEND data
        ];
        let _ = fs::write(pkg_assets_dir.join("StoreLogo.png"), minimal_png);
    }

    // 先卸载旧版本（忽略错误）
    let _ = Command::new("powershell")
        .args([
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
            "Get-AppxPackage -Name 'VeryPic.ContextMenu' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue",
        ])
        .output();

    // 确保开发者模式已开启（-Register 不需要签名，但需要 AllowDevelopmentWithoutDevLicense）
    // 注：修改 HKLM 需要管理员权限；若权限不足此步会静默失败，但若已开启则无需
    let _ = Command::new("reg")
        .args([
            "add",
            "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock",
            "/v", "AllowDevelopmentWithoutDevLicense",
            "/t", "REG_DWORD",
            "/d", "1",
            "/f",
        ])
        .output();

    // 用 -Register 方式安装（开发者模式，无需签名）
    let manifest_in_pkg = pkg_dir.join("AppxManifest.xml");
    let ps_cmd = format!(
        "Add-AppxPackage -Register -Path '{}'",
        manifest_in_pkg.to_string_lossy().replace('\'', "''"),
    );
    let add_out = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &ps_cmd])
        .output();

    match add_out {
        Ok(o) if o.status.success() => {
            info!("[ContextMenu] Sparse Package installed (dev-register) → Win11 main level context menu enabled");
        }
        Ok(o) => {
            info!(
                "[ContextMenu] Add-AppxPackage -Register failed\nstdout: {}\nstderr: {}",
                String::from_utf8_lossy(&o.stdout),
                String::from_utf8_lossy(&o.stderr)
            );
            // 回退：尝试 makeappx + -ExternalLocation（需要 SDK 和签名）
            try_install_sparse_package_signed(exe_path, &pkg_dir, &dll_src, &manifest_src);
        }
        Err(e) => {
            info!("[ContextMenu] Add-AppxPackage exec error: {}", e);
        }
    }
}

#[cfg(target_os = "windows")]
fn try_install_sparse_package_signed(
    exe_path: &std::path::Path,
    pkg_dir: &std::path::Path,
    _dll_src: &std::path::Path,
    _manifest_src: &std::path::Path,
) {
    use std::fs;

    let exe_dir = exe_path.parent().unwrap_or_else(|| std::path::Path::new("."));

    let makeappx = match find_makeappx() {
        Some(p) => p,
        None => {
            info!("[ContextMenu] makeappx.exe not found, cannot use signed fallback");
            return;
        }
    };

    let msix_path = std::env::temp_dir().join("VeryPic.ContextMenu.msix");

    let out = Command::new(&makeappx)
        .args(["pack", "/nv", "/o", "/d", pkg_dir.to_str().unwrap(), "/p", msix_path.to_str().unwrap()])
        .output();

    match out {
        Ok(o) if o.status.success() => {
            info!("[ContextMenu] makeappx succeeded (signed fallback)");
        }
        Ok(o) => {
            info!("[ContextMenu] makeappx failed: {}", String::from_utf8_lossy(&o.stderr));
            return;
        }
        Err(e) => {
            info!("[ContextMenu] makeappx exec error: {}", e);
            return;
        }
    }

    let ps_cmd = format!(
        "Add-AppxPackage -ExternalLocation '{}' -Path '{}'",
        exe_dir.to_string_lossy().replace('\'', "''"),
        msix_path.to_string_lossy().replace('\'', "''"),
    );
    let add_out = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &ps_cmd])
        .output();

    match add_out {
        Ok(o) if o.status.success() => {
            info!("[ContextMenu] Sparse Package installed (signed) → Win11 main level context menu enabled");
        }
        Ok(o) => {
            info!(
                "[ContextMenu] Add-AppxPackage -ExternalLocation failed\nstdout: {}\nstderr: {}",
                String::from_utf8_lossy(&o.stdout),
                String::from_utf8_lossy(&o.stderr)
            );
        }
        Err(e) => {
            info!("[ContextMenu] Add-AppxPackage -ExternalLocation exec error: {}", e);
        }
    }
    let _ = fs::remove_file(&msix_path);
}

#[cfg(target_os = "windows")]
fn try_uninstall_sparse_package() {
    let out = Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "Get-AppxPackage -Name 'VeryPic.ContextMenu' -ErrorAction SilentlyContinue | Remove-AppxPackage",
        ])
        .output();
    if let Ok(o) = out {
        if o.status.success() {
            info!("[ContextMenu] Sparse Package uninstalled");
        }
    }
}

#[cfg(target_os = "windows")]
fn find_makeappx() -> Option<std::path::PathBuf> {
    let kits = std::path::Path::new("C:\\Program Files (x86)\\Windows Kits\\10\\bin");
    if !kits.exists() {
        return None;
    }
    let mut versions: Vec<std::path::PathBuf> = std::fs::read_dir(kits)
        .ok()?
        .flatten()
        .map(|e| e.path().join("x64").join("makeappx.exe"))
        .filter(|p| p.exists())
        .collect();
    versions.sort_by(|a, b| b.cmp(a));
    versions.into_iter().next()
}

#[cfg(target_os = "windows")]
#[command]
pub async fn ipc_register_context_menu(enable: bool) -> Result<(), String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe path: {}", e))?;
    let exe_str = exe_path.to_string_lossy();
    let parent_base = "Software\\Classes\\Directory\\shell\\VeryPic";

    if enable {
        // 写入 ExePath 供 IExplorerCommand DLL 读取
        let ctx_base = "Software\\VeryPic\\ContextMenu";
        let _ = reg_set_value(ctx_base, "ExePath", &exe_str);

        try_install_sparse_package(&exe_path);

        // MSIX SurrogateServer 在开发者模式下走 dllhost（out-of-process），
        // 但 IExplorerCommand 没有 proxy/stub，会导致 hang。
        // 额外注册 InprocServer32 让 Shell 直接 in-process 加载 DLL，绕过 dllhost。
        let dll_path = {
            let pkg_dir = exe_path
                .parent()
                .map(|d| d.join("sparse-pkg").join("verypic_shell_command.dll"))
                .filter(|p| p.exists())
                .or_else(|| {
                    exe_path.parent().map(|d| d.join("resources").join("verypic_shell_command.dll"))
                })
                .filter(|p| p.exists())
                .or_else(|| {
                    exe_path.parent().map(|d| d.join("verypic_shell_command.dll"))
                });
            pkg_dir
        };
        if let Some(dll) = dll_path.filter(|p| p.exists()) {
            let dll_str = dll.to_string_lossy();
            let clsids = [
                ("ac652165-9b15-48e8-a09d-e67452cbb971", "VeryPic 后台压缩"),
                ("7d788199-bfba-4128-ab4c-a9a3ec12f0fa", "VeryPic 后台监听"),
                ("d15e4e90-c56c-48be-b021-ee9bfa496c19", "VeryPic 打开设置"),
            ];
            for (clsid, title) in &clsids {
                let clsid_base = format!("Software\\Classes\\CLSID\\{{{}}}", clsid);
                let _ = reg_set_default(&clsid_base, title);
                let inproc = format!("{}\\InprocServer32", clsid_base);
                let _ = reg_set_default(&inproc, &dll_str);
                let _ = reg_set_value(&inproc, "ThreadingModel", "STA");
            }
            info!("[ContextMenu] InprocServer32 registered for all CLSIDs → dll: {}", dll_str);
        } else {
            info!("[ContextMenu] DLL not found, skip InprocServer32 registration");
        }

        // Parent key: MUIVerb + SubCommands="" + Icon
        reg_set_value(parent_base, "MUIVerb", "VeryPic")?;
        reg_set_value(parent_base, "SubCommands", "")?;
        reg_set_value(parent_base, "Icon", &exe_str)?;

        let subcommands: Vec<(&str, &str, Option<String>, bool)> = vec![
            ("01_compress", "后台压缩", Some(format!("\"{}\" --action compress-silent \"%1\"", exe_str)), false),
            ("02_watch", "后台监听", Some(format!("\"{}\" --action watch-silent \"%1\"", exe_str)), true),   // 0x40 = separator after
            ("03_settings", "打开设置", Some(format!("\"{}\" --action settings", exe_str)), false),
        ];

        for (sub_name, display, cmd, sep_after) in &subcommands {
            let sub_base = format!("{}\\shell\\{}", parent_base, sub_name);
            reg_set_value(&sub_base, "MUIVerb", display)?;
            if *sep_after {
                reg_set_dword(&sub_base, "CommandFlags", "0x40")?;
            }
            if let Some(cmd_value) = cmd {
                let cmd_key = format!("{}\\command", sub_base);
                reg_set_default(&cmd_key, cmd_value)?;
            }
            info!("[ContextMenu] Registered sub: {}", sub_name);
        }
        info!("[ContextMenu] Cascading menu registered");
    } else {
        try_uninstall_sparse_package();

        // Delete parent key and all sub-keys recursively（含旧版 shell\\PicSharp）
        for shell_parent in &[
            parent_base,
            "Software\\Classes\\Directory\\shell\\PicSharp",
        ] {
            let _ = Command::new("reg")
                .args(["delete", &format!("HKCU\\{}", shell_parent), "/f"])
                .output();
        }
        // Also clean up old flat entries if present
        for old_key in &[
            "PicSharp_Compress",
            "PicSharp_Watch",
            "VeryPic_Compress",
            "VeryPic_Watch",
        ] {
            let _ = Command::new("reg")
                .args(["delete", &format!("HKCU\\Software\\Classes\\Directory\\shell\\{}", old_key), "/f"])
                .output();
        }
        // 移除 IExplorerCommand DLL 使用的 ExePath（含旧版 PicSharp 路径）
        for ctx in &["HKCU\\Software\\VeryPic\\ContextMenu", "HKCU\\Software\\PicSharp\\ContextMenu"] {
            let _ = Command::new("reg").args(["delete", ctx, "/f"]).output();
        }
        // 移除 InprocServer32 CLSID 注册
        for clsid in &[
            "ac652165-9b15-48e8-a09d-e67452cbb971",
            "7d788199-bfba-4128-ab4c-a9a3ec12f0fa",
            "d15e4e90-c56c-48be-b021-ee9bfa496c19",
        ] {
            let _ = Command::new("reg")
                .args(["delete", &format!("HKCU\\Software\\Classes\\CLSID\\{{{}}}", clsid), "/f"])
                .output();
        }
        info!("[ContextMenu] Removed all VeryPic context menu entries");
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn reg_set_default(key: &str, value: &str) -> Result<(), String> {
    Command::new("reg")
        .args(["add", &format!("HKCU\\{}", key), "/ve", "/d", value, "/f"])
        .output()
        .map_err(|e| format!("reg set default failed for {}: {}", key, e))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn reg_set_value(key: &str, name: &str, value: &str) -> Result<(), String> {
    Command::new("reg")
        .args(["add", &format!("HKCU\\{}", key), "/v", name, "/d", value, "/f"])
        .output()
        .map_err(|e| format!("reg set value failed for {}: {}", key, e))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn reg_set_dword(key: &str, name: &str, data: &str) -> Result<(), String> {
    Command::new("reg")
        .args(["add", &format!("HKCU\\{}", key), "/v", name, "/t", "REG_DWORD", "/d", data, "/f"])
        .output()
        .map_err(|e| format!("reg set dword failed for {}: {}", key, e))?;
    Ok(())
}


#[cfg(not(target_os = "windows"))]
#[command]
pub async fn ipc_register_context_menu(_enable: bool) -> Result<(), String> {
    Err("Context menu integration is only supported on Windows".to_string())
}
#[command]
pub async fn ipc_open_devtool<R: Runtime>(app: AppHandle<R>) -> Response {
    match app.get_webview_window("main") {
        Some(main_window) => {
            main_window.open_devtools();
            Response::new(
                serde_json::json!({
                    "success": true,
                })
                .to_string(),
            )
        }
        None => Response::new(
            serde_json::json!({
                "success": false,
                "error": "Failed to open devtool"
            })
            .to_string(),
        ),
    }
}
