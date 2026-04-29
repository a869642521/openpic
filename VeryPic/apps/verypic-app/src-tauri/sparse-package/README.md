# VeryPic Sparse Package（Windows 11 主层级右键菜单）

本 Sparse Package 使 VeryPic 右键菜单出现在 Windows 11 主层级，而非「显示更多选项」中。

在 VeryPic 设置中启用「右键菜单集成」时，若检测到 DLL 与 manifest，将自动尝试安装 Sparse Package。

## 手动打包（开发调试用）

在 monorepo 根目录：

```powershell
cargo build -p verypic-shell-command --release
$packDir = "$env:TEMP\VeryPicSparsePkg"
New-Item -ItemType Directory -Force -Path $packDir | Out-Null
Copy-Item target\release\verypic_shell_command.dll $packDir
Copy-Item apps\verypic-app\src-tauri\sparse-package\AppxManifest.xml $packDir
# 按需复制 StoreLogo.png 到 $packDir\Assets\
# & $makeappx pack /d $packDir /p "$packDir\VeryPic.ContextMenu.appx"
# Add-AppxPackage -Path "$packDir\VeryPic.ContextMenu.appx" -Register
```

卸载：

```powershell
Get-AppxPackage -Name "VeryPic.ContextMenu" | Remove-AppxPackage
```
