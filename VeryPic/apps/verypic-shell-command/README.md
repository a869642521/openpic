# verypic-shell-command

Windows 11 IExplorerCommand COM 扩展，为 VeryPic 提供右键菜单动词。

主程序需写入 `HKCU\Software\VeryPic\ContextMenu\ExePath`，指向主程序 exe 的完整路径。

将 `verypic_shell_command.dll` 注册到以下位置（需管理员权限）：

```
HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\VeryPicCompress
HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\VeryPicWatch
HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\VeryPicSettings
```

输出：`target/release/verypic_shell_command.dll`
