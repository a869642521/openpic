# picsharp-shell-command

Windows 11 IExplorerCommand COM 扩展，为 PicSharp 提供右键菜单动词。

## 功能

- **后台压缩**：`--action compress-silent "path1" "path2"`
- **后台监听**：`--action watch-silent "path"`
- **打开设置**：`--action open-settings`

## 注册表

主程序需写入 `HKCU\Software\PicSharp\ContextMenu\ExePath`，指向 PicSharp.exe 的完整路径。

## 注册方式

将 `picsharp_shell_command.dll` 注册到以下位置（需管理员权限）：

```
HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\PicSharpCompress
  (Default) = {CLSID_COMPRESS}

HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\PicSharpWatch
  (Default) = {CLSID_WATCH}

HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers\PicSharpSettings
  (Default) = {CLSID_SETTINGS}
```

CLSID 见 `src/lib.rs`。

## 构建

```bash
cargo build --release
```

输出：`target/release/picsharp_shell_command.dll`

## TODO

当前为骨架实现，`DllGetClassObject` 返回 `E_NOTIMPL`。需实现：

1. **IExplorerCommand**（三个）：`#[implement(IExplorerCommand)]`，实现 `IExplorerCommand_Impl`
2. **IEnumExplorerCommand**：包装单个命令的枚举器
3. **IExplorerCommandProvider**（三个）：`GetCommands` 返回上述枚举器
4. **IClassFactory**（三个）：`CreateInstance` 返回对应 Provider
5. 在 `DllGetClassObject` 中根据 `rclsid` 返回对应 ClassFactory

## 参考

- [IExplorerCommand](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nn-shobjidl_core-iexplorercommand)
- [IExplorerCommandProvider](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nn-shobjidl_core-iexplorercommandprovider)
- windows crate 的 `#[implement]` 宏
