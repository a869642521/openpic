//! PicSharp Windows 11 IExplorerCommand COM 扩展
//!
//! 实现三个右键菜单动词：后台压缩、后台监听、打开设置。
//! 从 HKCU\Software\PicSharp\ContextMenu\ExePath 读取主程序路径。

#![cfg(windows)]

extern crate windows_core;

use std::ptr;
use std::sync::atomic::{AtomicU32, Ordering};

use windows::core::{Interface, Ref, GUID, IUnknown, PCWSTR, PWSTR};
use windows::core::BOOL;
use windows::Win32::Foundation::{HWND, S_FALSE, S_OK};
use windows::Win32::System::Com::{IBindCtx, IClassFactory};
use windows::Win32::UI::Shell::{ShellExecuteW, SHStrDupW};
use windows::Win32::UI::Shell::IShellItemArray;
use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

// CLSID（与 AppxManifest.xml 一致）
pub const CLSID_COMPRESS: GUID = GUID::from_u128(0xac652165_9b15_48e8_a09d_e67452cbb971);
pub const CLSID_WATCH: GUID = GUID::from_u128(0x7d788199_bfba_4128_ab4c_a9a3ec12f0fa);
pub const CLSID_SETTINGS: GUID = GUID::from_u128(0xd15e4e90_c56c_48be_b021_ee9bfa496c19);

#[derive(Clone, Copy, PartialEq)]
enum VerbType {
    Compress,
    Watch,
    Settings,
}

impl VerbType {
    fn title(&self) -> &'static str {
        match self {
            VerbType::Compress => "PicSharp 后台压缩",
            VerbType::Watch => "PicSharp 后台监听",
            VerbType::Settings => "PicSharp 打开设置",
        }
    }
}

fn get_exe_path_from_registry() -> Option<Vec<u16>> {
    use windows::Win32::System::Registry::{RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY_CURRENT_USER, KEY_READ};

    unsafe {
        let mut hkey = windows::Win32::System::Registry::HKEY::default();
        let ret = RegOpenKeyExW(
            HKEY_CURRENT_USER,
            windows::core::w!("Software\\PicSharp\\ContextMenu"),
            None,
            KEY_READ,
            &mut hkey,
        );

        if ret.is_err() {
            return None;
        }

        let mut size: u32 = 0;
        let _ = RegQueryValueExW(
            hkey,
            windows::core::w!("ExePath"),
            None,
            None,
            None,
            Some(&mut size),
        );

        if size == 0 {
            let _ = RegCloseKey(hkey);
            return None;
        }

        let mut buf = vec![0u8; size as usize];
        let ret = RegQueryValueExW(
            hkey,
            windows::core::w!("ExePath"),
            None,
            None,
            Some(buf.as_mut_ptr()),
            Some(&mut size),
        );
        let _ = RegCloseKey(hkey);

        if ret.is_err() {
            return None;
        }

        let u16_len = buf.len() / 2;
        let ptr = buf.as_ptr() as *const u16;
        let slice = std::slice::from_raw_parts(ptr, u16_len);
        let end = slice.iter().position(|&c| c == 0).unwrap_or(u16_len);
        if end == 0 {
            None
        } else {
            let mut result: Vec<u16> = slice[..end].to_vec();
            result.push(0);
            Some(result)
        }
    }
}

fn launch_exe_with_params(params: &[u16]) {
    if let Some(exe_path) = get_exe_path_from_registry() {
        let params_ptr = if params.is_empty() {
            PCWSTR::null()
        } else {
            PCWSTR::from_raw(params.as_ptr())
        };

        unsafe {
            let _ = ShellExecuteW(
                Some(HWND::default()),
                windows::core::w!("open"),
                PCWSTR::from_raw(exe_path.as_ptr()),
                params_ptr,
                None,
                SW_SHOWNORMAL,
            );
        }
    }
}

fn get_paths_from_shell_item_array(items: Option<&IShellItemArray>) -> Vec<Vec<u16>> {
    let mut paths = Vec::new();
    let items = match items {
        Some(i) => i,
        None => return paths,
    };
    unsafe {
        let count = match items.GetCount() {
            Ok(c) => c,
            Err(_) => return paths,
        };
        if count == 0 {
            return paths;
        }

        for i in 0..count {
            if let Ok(si) = items.GetItemAt(i) {
                if let Ok(path_ptr) = si.GetDisplayName(windows::Win32::UI::Shell::SIGDN_FILESYSPATH) {
                    if !path_ptr.0.is_null() {
                        let len = (0..).take_while(|&j| *path_ptr.0.add(j) != 0).count();
                        let slice = std::slice::from_raw_parts(path_ptr.0, len + 1);
                        paths.push(slice.to_vec());
                        let _ = windows::Win32::System::Com::CoTaskMemFree(Some(path_ptr.0 as *mut _));
                    }
                }
            }
        }
    }
    paths
}

fn build_params(verb: VerbType, paths: &[Vec<u16>]) -> Vec<u16> {
    let action = match verb {
        VerbType::Compress => "compress-silent",
        VerbType::Watch => "watch-silent",
        VerbType::Settings => "settings",
    };

    let mut result: Vec<u16> = "--action ".encode_utf16().collect();
    result.extend(action.encode_utf16());

    if verb != VerbType::Settings && !paths.is_empty() {
        for path in paths {
            result.push(' ' as u16);
            result.push('"' as u16);
            result.extend(path.iter().take_while(|&&c| c != 0).copied());
            result.push('"' as u16);
        }
    }
    result.push(0);
    result
}

// =============================================================================
// IExplorerCommand 实现
// =============================================================================

#[windows::core::implement(windows::Win32::UI::Shell::IExplorerCommand)]
struct PicSharpExplorerCommand {
    verb: VerbType,
}

impl PicSharpExplorerCommand {
    fn new(verb: VerbType) -> Self {
        Self { verb }
    }
}

impl windows::Win32::UI::Shell::IExplorerCommand_Impl for PicSharpExplorerCommand_Impl {
    fn GetTitle(
        &self,
        _psiitemarray: Ref<'_, windows::Win32::UI::Shell::IShellItemArray>,
    ) -> windows::core::Result<PWSTR> {
        let title: Vec<u16> = self.verb.title().encode_utf16().chain(std::iter::once(0)).collect();
        unsafe { SHStrDupW(PCWSTR::from_raw(title.as_ptr())) }
    }

    fn GetIcon(
        &self,
        _psiitemarray: Ref<'_, windows::Win32::UI::Shell::IShellItemArray>,
    ) -> windows::core::Result<PWSTR> {
        if let Some(exe_path) = get_exe_path_from_registry() {
            unsafe { SHStrDupW(PCWSTR::from_raw(exe_path.as_ptr())) }
        } else {
            Ok(PWSTR::null())
        }
    }

    fn GetToolTip(
        &self,
        _psiitemarray: Ref<'_, windows::Win32::UI::Shell::IShellItemArray>,
    ) -> windows::core::Result<PWSTR> {
        Ok(PWSTR::null())
    }

    fn GetCanonicalName(&self) -> windows::core::Result<GUID> {
        Ok(GUID::zeroed())
    }

    fn GetState(
        &self,
        _psiitemarray: Ref<'_, windows::Win32::UI::Shell::IShellItemArray>,
        _foktobeslow: BOOL,
    ) -> windows::core::Result<u32> {
        Ok(windows::Win32::UI::Shell::ECS_ENABLED.0 as u32)
    }

    fn Invoke(
        &self,
        psiitemarray: Ref<'_, windows::Win32::UI::Shell::IShellItemArray>,
        _pbc: Ref<'_, IBindCtx>,
    ) -> windows::core::Result<()> {
        let paths = get_paths_from_shell_item_array((*psiitemarray).as_ref());
        let params = build_params(self.verb, &paths);
        launch_exe_with_params(&params);
        Ok(())
    }

    fn GetFlags(&self) -> windows::core::Result<u32> {
        Ok(windows::Win32::UI::Shell::ECF_DEFAULT.0 as u32)
    }

    fn EnumSubCommands(&self) -> windows::core::Result<windows::Win32::UI::Shell::IEnumExplorerCommand> {
        Err(windows::core::Error::from(windows::Win32::Foundation::E_NOTIMPL))
    }
}

// =============================================================================
// IClassFactory 实现
// =============================================================================

static LOCK_COUNT: AtomicU32 = AtomicU32::new(0);

#[windows::core::implement(IClassFactory)]
struct PicSharpClassFactory {
    verb: VerbType,
}

impl PicSharpClassFactory {
    fn new(verb: VerbType) -> Self {
        Self { verb }
    }
}

impl windows::Win32::System::Com::IClassFactory_Impl for PicSharpClassFactory_Impl {
    fn CreateInstance(
        &self,
        _punkouter: Ref<'_, IUnknown>,
        riid: *const GUID,
        ppvobject: *mut *mut std::ffi::c_void,
    ) -> windows::core::Result<()> {
        if ppvobject.is_null() {
            return Err(windows::core::Error::from(windows::Win32::Foundation::E_POINTER));
        }
        unsafe { *ppvobject = ptr::null_mut() };

        let iid = unsafe { &*riid };
        if *iid != windows::Win32::UI::Shell::IExplorerCommand::IID {
            return Err(windows::core::Error::from(windows::Win32::Foundation::E_NOINTERFACE));
        }

        let cmd = PicSharpExplorerCommand::new(self.verb);
        let cmd: windows::Win32::UI::Shell::IExplorerCommand = cmd.into();
        unsafe {
            *ppvobject = cmd.as_raw() as *mut _;
            std::mem::forget(cmd);
        }
        Ok(())
    }

    fn LockServer(&self, flock: BOOL) -> windows::core::Result<()> {
        if flock.as_bool() {
            LOCK_COUNT.fetch_add(1, Ordering::SeqCst);
        } else {
            LOCK_COUNT.fetch_sub(1, Ordering::SeqCst);
        }
        Ok(())
    }
}

// =============================================================================
// DllGetClassObject / DllCanUnloadNow
// =============================================================================

#[no_mangle]
pub unsafe extern "system" fn DllGetClassObject(
    rclsid: *const GUID,
    riid: *const GUID,
    ppv: *mut *mut std::ffi::c_void,
) -> i32 {
    if rclsid.is_null() || riid.is_null() || ppv.is_null() {
        return 0x80070057_u32 as i32; // E_INVALIDARG
    }
    *ppv = ptr::null_mut();

    let clsid = &*rclsid;
    let iid = &*riid;

    if *iid != IClassFactory::IID {
        return 0x80004002_u32 as i32; // E_NOINTERFACE
    }

    let verb = if *clsid == CLSID_COMPRESS {
        VerbType::Compress
    } else if *clsid == CLSID_WATCH {
        VerbType::Watch
    } else if *clsid == CLSID_SETTINGS {
        VerbType::Settings
    } else {
        return 0x80040111_u32 as i32; // CLASS_E_CLASSNOTAVAILABLE
    };

    let factory = PicSharpClassFactory::new(verb);
    let factory: IClassFactory = factory.into();
    *ppv = factory.as_raw() as *mut _;
    std::mem::forget(factory);
    S_OK.0 as i32
}

#[no_mangle]
pub extern "system" fn DllCanUnloadNow() -> i32 {
    if LOCK_COUNT.load(Ordering::SeqCst) == 0 {
        S_OK.0 as i32
    } else {
        S_FALSE.0 as i32
    }
}
