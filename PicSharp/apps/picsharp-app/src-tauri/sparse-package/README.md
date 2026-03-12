# PicSharp Sparse Package（Windows 11 主层级右键菜单）

本 Sparse Package 使 PicSharp 右键菜单出现在 Windows 11 主层级，而非「显示更多选项」中。

## 前置条件

- Windows 11 22000+
- 已安装 Windows SDK（需 `makeappx.exe`）

## 自动安装

在 PicSharp 设置中启用「右键菜单集成」时，若检测到 DLL 与 manifest，将自动尝试安装 Sparse Package。

## 手动打包与安装

```powershell
# 1. 构建 shell-command DLL
cd PicSharp
cargo build -p picsharp-shell-command --release

# 2. 准备打包目录
$packDir = "$env:TEMP\PicSharpSparsePkg"
New-Item -ItemType Directory -Force $packDir
Copy-Item target\release\picsharp_shell_command.dll $packDir
Copy-Item apps\picsharp-app\src-tauri\sparse-package\AppxManifest.xml $packDir

# 3. 打包（需 Windows SDK）
$makeappx = (Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\makeappx.exe" | Sort-Object -Descending | Select-Object -First 1).FullName
& $makeappx pack /d $packDir /p "$packDir\PicSharp.ContextMenu.appx"

# 4. 安装
Add-AppxPackage -Path "$packDir\PicSharp.ContextMenu.appx" -Register
```

## 卸载

```powershell
Get-AppxPackage -Name "PicSharp.ContextMenu" | Remove-AppxPackage
```

## CLSID

- 后台压缩: `ac652165-9b15-48e8-a09d-e67452cbb971`
- 后台监听: `7d788199-bfba-4128-ab4c-a9a3ec12f0fa`
- 打开设置: `d15e4e90-c56c-48be-b021-ee9bfa496c19`
