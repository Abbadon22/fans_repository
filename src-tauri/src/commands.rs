use crate::config::LauncherConfig;
use crate::mods::{
    check_mods_internal, download_and_install_mods_internal, load_manifest, ManifestLoadResult,
    ModCheckResult,
};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

/// Глобальное состояние приложения (кэш конфига).
pub struct AppState {
    pub config: Mutex<LauncherConfig>,
}

fn emit_log(app: &AppHandle, message: &str) {
    let _ = app.emit("log", message);
}

/// Ссылка автоподключения (официальный способ для Steam-версии 7DTD).
/// @see https://community.thefunpimps.com/threads/command-line-interface-join-server.25272/
fn build_steam_connect_url(ip: &str, port: u16, password: &str) -> String {
    let endpoint = format!("{}:{}", ip.trim(), port);
    let pw = password.trim();
    if pw.is_empty() {
        format!("steam://connect/{endpoint}")
    } else {
        format!("steam://connect/{endpoint}/{}", urlencoding::encode(pw))
    }
}

/// Выбор папки с игрой через системный диалог.
#[tauri::command]
pub async fn select_game_folder(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let folder = rfd::AsyncFileDialog::new()
        .set_title("Выберите папку с 7 Days to Die")
        .pick_folder()
        .await
        .ok_or_else(|| "Выбор папки отменён".to_string())?;

    let path = folder.path().to_path_buf();
    let exe = path.join("7DaysToDie.exe");
    if !exe.is_file() {
        return Err(format!(
            "В выбранной папке нет 7DaysToDie.exe: {}",
            path.display()
        ));
    }

    let mut config = state.config.lock().await;
    config.game_dir = Some(path.to_string_lossy().into_owned());
    config.save()?;

    emit_log(&app, &format!("Папка игры сохранена: {}", path.display()));

    Ok(path.to_string_lossy().into_owned())
}

/// Сохранить путь к игре вручную (если передан с фронтенда).
#[tauri::command]
pub async fn set_game_folder(
    path: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let path_buf = Path::new(&path);
    let exe = path_buf.join("7DaysToDie.exe");
    if !exe.is_file() {
        return Err(format!("В папке «{path}» не найден 7DaysToDie.exe"));
    }

    let mut config = state.config.lock().await;
    config.game_dir = Some(path.clone());
    config.save()?;

    emit_log(&app, &format!("Папка игры: {path}"));
    Ok(path)
}

/// Загрузить текущий конфиг (без пароля в логах).
#[tauri::command]
pub async fn get_config(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<LauncherConfig, String> {
    let mut config = state.config.lock().await;
    if config.fix_legacy_local_server() {
        config.save()?;
        emit_log(
            &app,
            &format!(
                "Адрес сервера обновлён на {}:{}",
                config.server_ip, config.server_port
            ),
        );
    }
    Ok(config.clone())
}

/// Проверить моды по манифесту.
#[tauri::command]
pub async fn check_mods(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ModCheckResult, String> {
    let config = state.config.lock().await.clone();
    config.game_dir_path()?;

    let loaded = load_manifest(&app, &config).await?;
    emit_log(
        &app,
        &format!(
            "Манифест: {} ({} модов)",
            loaded.source,
            loaded.entries.len()
        ),
    );
    let result = check_mods_internal(&config, &loaded.entries);

    if result.ok {
        emit_log(&app, "Проверка модов: всё в порядке.");
    } else {
        for msg in &result.missing {
            emit_log(&app, &format!("⚠ {msg}"));
        }
    }

    Ok(result)
}

/// Скачать и установить моды.
#[tauri::command]
pub async fn download_and_install_mods(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state.config.lock().await.clone();
    config.game_dir_path()?;
    config.validate_game_exe()?;

    let loaded = load_manifest(&app, &config).await?;
    emit_log(
        &app,
        &format!(
            "Манифест: {} — загрузка {} мод(ов)…",
            loaded.source,
            loaded.entries.len()
        ),
    );

    let result = download_and_install_mods_internal(app.clone(), config, loaded.entries).await;

    if let Err(ref e) = result {
        emit_log(&app, &format!("Ошибка: {e}"));
        let _ = app.emit("progress", 0.0);
    } else {
        let _ = app.emit("progress", 100.0);
    }

    result
}

/// Запустить 7DaysToDie.exe из папки игры.
#[tauri::command]
pub async fn launch_game(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let config = state.config.lock().await.clone();
    let exe = config.validate_game_exe()?;
    let game_dir = exe
        .parent()
        .ok_or_else(|| "Не удалось определить папку игры".to_string())?;

    emit_log(&app, &format!("Запуск: {}", exe.display()));

    std::process::Command::new(&exe)
        .current_dir(game_dir)
        .spawn()
        .map_err(|e| format!("Не удалось запустить игру: {e}"))?;

    Ok("Игра запущена — подключитесь к серверу вручную".to_string())
}

/// Ссылка steam://connect для ярлыка / ручного копирования.
#[tauri::command]
pub async fn get_steam_connect_url(state: State<'_, AppState>) -> Result<String, String> {
    let config = state.config.lock().await;
    Ok(build_steam_connect_url(
        &config.server_ip,
        config.server_port,
        &config.server_password,
    ))
}

/// Путь к config.json для отображения в UI.
#[tauri::command]
pub async fn get_config_path() -> Result<String, String> {
    LauncherConfig::config_path().map(|p| p.to_string_lossy().into_owned())
}

/// Сохранить пароль сервера в config.json.
#[tauri::command]
pub async fn save_server_password(
    password: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<LauncherConfig, String> {
    let mut config = state.config.lock().await;
    config.server_password = password;
    config.fix_legacy_local_server();
    config.save()?;
    emit_log(&app, "Пароль сервера сохранён в config.json");
    Ok(config.clone())
}

/// Список модов (с сервера, кэша или локального файла).
#[tauri::command]
pub async fn get_manifest(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ManifestLoadResult, String> {
    let config = state.config.lock().await.clone();
    let loaded = load_manifest(&app, &config).await?;
    emit_log(
        &app,
        &format!(
            "Манифест: {} ({} модов)",
            loaded.source,
            loaded.entries.len()
        ),
    );
    Ok(loaded)
}

/// Открыть папку или файл в проводнике Windows.
#[tauri::command]
pub async fn reveal_path(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err(format!("Путь не существует: {path}"));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path_buf.as_os_str())
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {e}"))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = path_buf;
        Err("Открытие папки поддерживается только в Windows".to_string())
    }
}
