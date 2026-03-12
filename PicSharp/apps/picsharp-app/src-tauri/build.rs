fn main() {
    // 在 Windows 上构建并复制 picsharp-shell-command DLL 到 resources
    #[cfg(target_os = "windows")]
    {
        use std::env;
        use std::path::PathBuf;
        use std::process::Command;

        let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        let workspace_root = manifest_dir.ancestors().nth(2).unwrap(); // src-tauri -> picsharp-app -> PicSharp
        let target_dir = workspace_root.join("target").join(&profile);
        let dll_src = target_dir.join("picsharp_shell_command.dll");
        let resources_dir = manifest_dir.join("resources");
        let dll_dst = resources_dir.join("picsharp_shell_command.dll");

        // 只在 release 构建时编译 DLL，dev 模式直接使用已有的 DLL
        if profile == "release" {
            let _ = Command::new(env::var("CARGO").unwrap_or_else(|_| "cargo".to_string()))
                .args(&["build", "-p", "picsharp-shell-command", "--release"])
                .current_dir(workspace_root)
                .status();
        }

        if dll_src.exists() {
            std::fs::create_dir_all(&resources_dir).ok();
            let _ = std::fs::copy(&dll_src, &dll_dst);

            let sparse_src_dir = manifest_dir.join("sparse-package");

            // 复制 AppxManifest
            let manifest_src = sparse_src_dir.join("AppxManifest.xml");
            let manifest_dst = resources_dir.join("AppxManifest.xml");
            if manifest_src.exists() {
                let _ = std::fs::copy(&manifest_src, &manifest_dst);
            }

            // 复制 Assets/StoreLogo.png
            let logo_src = sparse_src_dir.join("Assets").join("StoreLogo.png");
            let logo_dst_dir = resources_dir.join("Assets");
            if logo_src.exists() {
                std::fs::create_dir_all(&logo_dst_dir).ok();
                let _ = std::fs::copy(&logo_src, logo_dst_dir.join("StoreLogo.png"));
            }
        }
    }

    tauri_build::build()
}
