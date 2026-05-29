use crate::config::LauncherConfig;
use crate::mods::{check_mods_internal, download_and_install_mods_internal, load_manifest, ModCheckResult};
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

/// AppId игры в Steam.
const STEAM_APP_ID_7DTD: &str = "251570";

/// Поиск steam.exe в стандартных местах Windows.
fn find_steam_exe() -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(pf86) = std::env::var("PROGRAMFILES(X86)") {
        candidates.push(PathBuf::from(pf86).join("Steam").join("steam.exe"));
    }
    if let Ok(pf) = std::env::var("PROGRAMFILES") {
        candidates.push(PathBuf::from(pf).join("Steam").join("steam.exe"));
    }

    candidates
        .into_iter()
        .find(|path| path.is_file())
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

    emit_log(
        &app,
        &format!("Папка игры сохранена: {}", path.display()),
    );

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
        return Err(format!(
            "В папке «{path}» не найден 7DaysToDie.exe"
        ));
    }

    let mut config = state.config.lock().await;
    config.game_dir = Some(path.clone());
    config.save()?;

    emit_log(&app, &format!("Папка игры: {path}"));
    Ok(path)
}

/// Загрузить текущий конфиг (без пароля в логах).
#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<LauncherConfig, String> {
    let config = state.config.lock().await;
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

    let manifest = load_manifest(&app)?;
    let result = check_mods_internal(&config, &manifest);

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

    let manifest = load_manifest(&app)?;
    emit_log(&app, "Начинаем загрузку и установку модов…");

    let result = download_and_install_mods_internal(app.clone(), config, manifest).await;

    if let Err(ref e) = result {
        emit_log(&app, &format!("Ошибка: {e}"));
        let _ = app.emit("progress", 0.0);
    } else {
        let _ = app.emit("progress", 100.0);
    }

    result
}

/// Запустить игру с параметрами подключения к серверу.
#[tauri::command]
pub async fn launch_game(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state.config.lock().await.clone();
    let exe = config.validate_game_exe()?;

    let connect_arg = format!(
        "-connect={}:{}",
        config.server_ip, config.server_port
    );
    let password_arg = format!("-password={}", config.server_password);

    // Для Steam-версии надёжнее запуск через steam.exe -applaunch.
    if let Some(steam_exe) = find_steam_exe() {
        emit_log(
            &app,
            &format!(
                "Запуск через Steam: {} -applaunch {} {}",
                steam_exe.display(),
                STEAM_APP_ID_7DTD,
                connect_arg
            ),
        );

        std::process::Command::new(&steam_exe)
            .arg("-applaunch")
            .arg(STEAM_APP_ID_7DTD)
            .arg(&connect_arg)
            .arg(&password_arg)
            .spawn()
            .map_err(|e| format!("Не удалось запустить Steam: {e}"))?;
    } else {
        emit_log(
            &app,
            &format!(
                "Steam не найден, fallback на прямой запуск {} {} …",
                exe.display(),
                connect_arg
            ),
        );

        std::process::Command::new(&exe)
            .arg(&connect_arg)
            .arg(&password_arg)
            .current_dir(
                exe.parent()
                    .ok_or_else(|| "Не удалось определить папку игры".to_string())?,
            )
            .spawn()
            .map_err(|e| {
                format!(
                    "Не удалось запустить игру (права доступа или антивирус?): {e}"
                )
            })?;
    }

    Ok("Игра запущена".to_string())
}

/// Путь к config.json для отображения в UI.
#[tauri::command]
pub async fn get_config_path() -> Result<String, String> {
    LauncherConfig::config_path().map(|p| p.to_string_lossy().into_owned())
}

/// Список модов из manifest.json.
#[tauri::command]
pub async fn get_manifest(app: AppHandle) -> Result<Vec<crate::mods::ModManifestEntry>, String> {
    load_manifest(&app)
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
