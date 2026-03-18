use dotenvy_macro::dotenv;
use inspect::Inspect;
use log::{error, info};
use std::fs;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::path::BaseDirectory;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri::{AppHandle, Emitter, Listener, Manager, Url};
use tauri_plugin_fs::FsExt;
mod clipboard;
mod command;
mod file;
mod file_ext;
// mod image_processor;
mod inspect;
// mod tinify;
#[cfg(target_os = "macos")]
#[macro_use]
extern crate cocoa;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;
#[cfg(target_os = "macos")]
mod macos;
mod upload;
mod window;

fn append_debug_log(hypothesis_id: &str, location: &str, message: &str, data: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(r"E:\LyamQL\APP\image-resizer02\debug-fe4f29.log")
    {
        let escaped_data = data.replace('\\', "\\\\").replace('"', "\\\"");
        let escaped_message = message.replace('\\', "\\\\").replace('"', "\\\"");
        let escaped_location = location.replace('\\', "\\\\").replace('"', "\\\"");
        let escaped_hypothesis = hypothesis_id.replace('\\', "\\\\").replace('"', "\\\"");
        let _ = writeln!(
            file,
            "{{\"sessionId\":\"fe4f29\",\"runId\":\"post-build\",\"hypothesisId\":\"{}\",\"location\":\"{}\",\"message\":\"{}\",\"data\":\"{}\",\"timestamp\":{}}}",
            escaped_hypothesis,
            escaped_location,
            escaped_message,
            escaped_data,
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|duration| duration.as_millis())
                .unwrap_or(0)
        );
    }
}

fn init_settings(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    if !app_data_dir.exists() {
        info!("[Init Settings] -> App data dir not exists, create it");
        fs::create_dir_all(&app_data_dir)?;
    }
    let app_settings_path = app_data_dir.join("settings.json");
    let app_default_settings_path = app_data_dir.join("settings.default.json");
    if !app_settings_path.exists() {
        info!("[Init Settings] -> App settings file not exists, init it from config");
        let config_default_settings = app
            .path()
            .resolve("resources/settings.default.json", BaseDirectory::Resource)?;
        let _ = std::fs::copy(&config_default_settings, &app_settings_path);
        let _ = std::fs::copy(&config_default_settings, &app_default_settings_path);
        info!("[Init Settings] -> App settings file init done");
    } else {
        info!("[Init Settings] -> App settings file exists, skip init");
    }
    Ok(())
}

fn init_temp_dir(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let temp_dir = app.path().app_cache_dir()?.join("picsharp_temp");
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir)?;
    }
    fs::create_dir_all(&temp_dir)?;

    Ok(temp_dir)
}

#[cfg(desktop)]
fn allow_file_in_scopes(app: &AppHandle, files: Vec<PathBuf>) {
    let fs_scope = app.fs_scope();
    let asset_protocol_scope = app.asset_protocol_scope();
    for file in &files {
        if let Err(e) = fs_scope.allow_file(file) {
            error!(
                "[allow_file_in_scopes] -> Failed to allow <{}> in fs_scope: {}",
                file.to_string_lossy(),
                e
            );
        }
        if let Err(e) = asset_protocol_scope.allow_file(file) {
            error!(
                "[allow_file_in_scopes] -> Failed to allow <{}> in asset_protocol_scope: {}",
                file.to_string_lossy(),
                e
            );
        }
    }
}

#[cfg(desktop)]
fn set_window_open_with_files(app: &AppHandle, files: Vec<PathBuf>) {
    let files = files
        .into_iter()
        .map(|f| {
            let file = f.to_string_lossy().replace("\\", "\\\\");
            format!("\"{file}\"",)
        })
        .collect::<Vec<_>>()
        .join(",");
    if let Some(window) = app.get_webview_window("main") {
        let payload = format!("{{mode: \"ns_compress\", paths: [{}]}}", files);
        info!("[set_window_open_with_files] -> payload: {}", payload);
        let script = format!("window.LAUNCH_PAYLOAD = {};", payload);
        if let Err(e) = window.eval(&script) {
            error!(
                "[set_window_open_with_files] -> Failed to set open files variable: {}",
                e
            );
        }
    } else {
        error!("[set_window_open_with_files] -> Failed to get main window");
    }
}


fn set_window_open_with_watch(app: &AppHandle, path: PathBuf) {
    let path_str = path.to_string_lossy().replace("\\", "\\\\");
    if let Some(window) = app.get_webview_window("main") {
        let payload = format!("{{mode: \"ns_watch\", paths: [\"{}\"]}}", path_str);
        info!("[set_window_open_with_watch] -> payload: {}", payload);
        let script = format!("window.LAUNCH_PAYLOAD = {};", payload);
        if let Err(e) = window.eval(&script) {
            error!(
                "[set_window_open_with_watch] -> Failed to set watch payload: {}",
                e
            );
        }
    } else {
        error!("[set_window_open_with_watch] -> Failed to get main window");
    }
}


fn set_window_open_with_payload(app: &AppHandle, mode: &str, paths: Vec<PathBuf>) {
    let paths_json = paths
        .iter()
        .map(|p| format!("\"{}\"", p.to_string_lossy().replace("\\", "\\\\")))
        .collect::<Vec<_>>()
        .join(",");
    if let Some(window) = app.get_webview_window("main") {
        let payload = format!("{{mode: \"{}\", paths: [{}]}}", mode, paths_json);
        info!("[set_window_open_with_payload] -> mode={} payload: {}", mode, payload);
        let script = format!("window.LAUNCH_PAYLOAD = {};", payload);
        if let Err(e) = window.eval(&script) {
            error!(
                "[set_window_open_with_payload] -> Failed to set payload: {}",
                e
            );
        }
    } else {
        error!("[set_window_open_with_payload] -> Failed to get main window");
    }
}
#[cfg(desktop)]
fn set_tray(app: &AppHandle) -> Result<(), tauri::Error> {
    let show_i = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
    let tray: tauri::tray::TrayIcon = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app)
        .map_err(|e| {
            log::error!("Failed to build tray icon: {}", e);
            e
        })?;
    Ok(())
}

#[derive(Clone, serde::Serialize)]
#[allow(dead_code)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn get_files_from_argv(argv: Vec<String>) -> Vec<PathBuf> {
    let mut files = Vec::new();
    let mut skip_next = false;
    for maybe_file in argv.iter().skip(1) {
        if skip_next {
            skip_next = false;
            continue;
        }
        if maybe_file == "--action" {
            skip_next = true;
            continue;
        }
        if maybe_file.starts_with("-") {
            continue;
        }
        if let Ok(url) = Url::parse(maybe_file) {
            if let Ok(path) = url.to_file_path() {
                files.push(path);
            } else {
                files.push(PathBuf::from(maybe_file))
            }
        } else {
            files.push(PathBuf::from(maybe_file))
        }
    }
    files
}

fn get_action_from_argv(argv: &[String]) -> Option<String> {
    let mut iter = argv.iter().peekable();
    while let Some(arg) = iter.next() {
        if arg == "--action" {
            return iter.next().map(|s| s.clone());
        }
        if let Some(val) = arg.strip_prefix("--action=") {
            return Some(val.to_string());
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            info!("Single instance init -> args: {:?}", args);
            info!("Single instance init -> cwd: {:?}", cwd);
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap_or_else(|error| {
                    error!(
                        "[Single Instance Init] -> Failed to show main window: {}",
                        error
                    );
                });
                window.set_focus().unwrap_or_else(|error| {
                    error!(
                        "[Single Instance Init] -> Failed to set focus to main window: {}",
                        error
                    );
                });
                let action = get_action_from_argv(&args);
                let files = get_files_from_argv(args.clone());
                match action.as_deref() {
                    Some("watch") => {
                        if let Some(path) = files.first() {
                            allow_file_in_scopes(app, vec![path.clone()]);
                            app.emit("ns_watch", path.to_string_lossy().to_string())
                                .unwrap_or_else(|e| error!("[Single Instance Emit] -> ns_watch: {}", e));
                        }
                    }
                    Some("compress-silent") => {
                        if !files.is_empty() {
                            allow_file_in_scopes(app, files.clone());
                            let paths: Vec<String> = files.iter().map(|f| f.to_string_lossy().to_string()).collect();
                            app.emit("ns_compress", paths)
                                .unwrap_or_else(|e| error!("[Single Instance Emit] -> ns_compress: {}", e));
                        }
                    }
                    Some("watch-silent") => {
                        if let Some(path) = files.first() {
                            allow_file_in_scopes(app, vec![path.clone()]);
                            app.emit("ns_watch_silent", path.to_string_lossy().to_string())
                                .unwrap_or_else(|e| error!("[Single Instance Emit] -> ns_watch_silent: {}", e));
                        }
                    }
                    Some("settings") => {
                        app.emit("ns_settings", ())
                            .unwrap_or_else(|e| error!("[Single Instance Emit] -> ns_settings: {}", e));
                    }
                    _ => {
                        if !files.is_empty() {
                            allow_file_in_scopes(app, files.clone());
                            app.emit(
                                "ns_compress",
                                files
                                    .iter()
                                    .map(|f| f.to_string_lossy().to_string())
                                    .collect::<Vec<_>>(),
                            )
                            .unwrap_or_else(|error| {
                                error!(
                                    "[Single Instance Emit] -> Failed to emit ns_compress event: {}",
                                    error
                                );
                            });
                        }
                    }
                }
            }
        }))
        .plugin(tauri_plugin_process::init())

        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            file::ipc_parse_paths,
            file::ipc_count_valid_files,
            file::ipc_is_file_in_directory,
            file::ipc_copy_image,
            file::ipc_get_file_name,
            clipboard::ipc_parse_clipboard_images,
            // tinify::ipc_tinify,
            // image_processor::compressors::ipc_compress_images,
            // image_processor::compressors::ipc_compress_single_image,
            // image_processor::compressors::ipc_is_apng,
            command::ipc_open_system_preference_notifications,
            command::ipc_kill_processes_by_name,
            command::ipc_kill_picsharp_sidecar_processes,
            command::ipc_open_devtool,
            command::ipc_register_context_menu,
            window::ipc_spawn_window,
            #[cfg(target_os = "macos")]
            macos::traffic_light::set_traffic_lights,
        ]);
    #[cfg(target_os = "macos")]
    let builder = builder.plugin(macos::traffic_light::init());

    builder
        .setup(|app| {
            if let Ok(exe_path) = std::env::current_exe() {
                append_debug_log(
                    "H4",
                    "src-tauri/src/lib.rs:setup",
                    "app-startup-paths",
                    &format!("exe={}", exe_path.display()),
                );
            }
            if let Ok(resource_dir) = app.path().resource_dir() {
                let sharp_runtime = resource_dir
                    .join("node_modules")
                    .join("@img")
                    .join("sharp-win32-x64");
                append_debug_log(
                    "H1",
                    "src-tauri/src/lib.rs:setup",
                    "resource-sharp-runtime",
                    &format!(
                        "resource_dir={} sharp_runtime_exists={}",
                        resource_dir.display(),
                        sharp_runtime.exists()
                    ),
                );
            }
            match init_settings(&app.handle()) {
                Ok(()) => {
                    info!("[init_settings] -> Settings initialized");
                }
                Err(e) => {
                    error!("[init_settings] -> Settings init failed: {}", e);
                }
            }

            match init_temp_dir(&app.handle()) {
                Ok(temp_dir) => {
                    info!("[init_temp_dir] -> Temp dir initialized: {:?}", temp_dir);
                }
                Err(e) => {
                    error!("[init_temp_dir] -> Temp dir init failed: {}", e);
                }
            }

            #[cfg(desktop)]
            if let Err(e) = set_tray(&app.handle()) {
                error!("[set_tray] -> Failed to create tray icon: {}", e);
            }

            let inspect = Inspect::new(app.handle().clone())?;
            file_ext::load(inspect);

            #[cfg(desktop)]
            {
                let argv: Vec<String> = std::env::args().collect();
                let action = get_action_from_argv(&argv);
                let files = get_files_from_argv(argv);
                match action.as_deref() {
                    Some("watch") => {
                        if let Some(path) = files.first() {
                            let app_handle = app.handle().clone();
                            let path_clone = path.clone();
                            allow_file_in_scopes(&app_handle, vec![path.clone()]);
                            app.listen("window-ready", move |_| {
                                info!("[Setup] -> Launching with --action watch: {:?}", path_clone);
                                set_window_open_with_watch(&app_handle, path_clone.clone());
                            });
                        }
                    }
                    Some("compress-silent") => {
                        if !files.is_empty() {
                            let app_handle = app.handle().clone();
                            allow_file_in_scopes(&app_handle, files.clone());
                            app.listen("window-ready", move |_| {
                                info!("[Setup] -> Launching with --action compress (show window)");
                                set_window_open_with_payload(&app_handle, "ns_compress", files.clone());
                            });
                        }
                    }
                    Some("watch-silent") => {
                        if let Some(path) = files.first() {
                            let app_handle = app.handle().clone();
                            let path_clone = path.clone();
                            allow_file_in_scopes(&app_handle, vec![path.clone()]);
                            app.listen("window-ready", move |_| {
                                info!("[Setup] -> Launching with --action watch-silent: {:?}", path_clone);
                                set_window_open_with_payload(&app_handle, "watch-silent", vec![path_clone.clone()]);
                            });
                        }
                    }
                    Some("settings") => {
                        let app_handle = app.handle().clone();
                        app.listen("window-ready", move |_| {
                            info!("[Setup] -> Launching with --action settings");
                            set_window_open_with_payload(&app_handle, "settings", vec![]);
                        });
                    }
                    _ => {
                        if !files.is_empty() {
                            let app_handle = app.handle().clone();
                            allow_file_in_scopes(&app_handle, files.clone());
                            app.listen("window-ready", move |_| {
                                info!("[Setup] -> Launching with files: {:?}", files);
                                set_window_open_with_files(&app_handle, files.clone());
                            });
                        }
                    }
                }
            }
            app.handle()
                .emit("window-ready", ())
                .unwrap_or_else(|error| {
                    error!("[Setup] -> Failed to emit window-ready event: {}", error);
                });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Error while running Picsharp application")
        .run(|app, event| {
            if let tauri::RunEvent::WindowEvent {
                label,
                event: win_event,
                ..
            } = &event
            {
                match win_event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        if let Some(win) = app.get_webview_window(label.as_str()) {
                            if label == "main" {
                                win.hide().unwrap_or_else(|error| {
                                    error!(
                                        "[Close Requested] -> Failed to hide main window: {}",
                                        error
                                    );
                                });
                                api.prevent_close();
                            } else {
                                win.destroy().unwrap_or_else(|error| {
                                    error!(
                                        "[Close Requested] -> Failed to destroy the <{}> window",
                                        error
                                    );
                                });
                            }
                        }
                    }
                    _ => {}
                }
            }
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen {
                has_visible_windows,
                ..
            } = &event
            {
                if !has_visible_windows {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().unwrap_or_else(|error| {
                            error!("[Reopen Event] -> Failed to show main window: {}", error);
                        });
                        window.set_focus().unwrap_or_else(|error| {
                            error!(
                                "[Reopen Event] -> Failed to set focus to main window: {}",
                                error
                            );
                        });
                    }
                }
            }

            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = &event {
                let files = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .collect::<Vec<_>>();

                let app_handler_clone = app.clone();
                allow_file_in_scopes(app, files.clone());
                app.listen("window-ready", move |_| {
                    set_window_open_with_files(&app_handler_clone, files.clone());
                });
            }
        });
}
