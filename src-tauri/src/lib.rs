mod commands;
mod config;
mod mods;

use commands::AppState;
use config::LauncherConfig;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_config = LauncherConfig::load().unwrap_or_default();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            config: tokio::sync::Mutex::new(initial_config),
        })
        .invoke_handler(tauri::generate_handler![
            commands::select_game_folder,
            commands::set_game_folder,
            commands::get_config,
            commands::get_config_path,
            commands::save_server_password,
            commands::get_manifest,
            commands::reveal_path,
            commands::check_mods,
            commands::download_and_install_mods,
            commands::launch_game,
            commands::get_steam_connect_url,
        ])
        .setup(|_| Ok(()))
        .run(tauri::generate_context!())
        .expect("ошибка при запуске Tauri");
}
