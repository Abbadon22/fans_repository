use crate::config::LauncherConfig;
use crate::download_control::DownloadControl;
use std::sync::Arc;
use crate::process_util::is_7dtd_running;
#[cfg(target_os = "windows")]
use crate::process_util::platform;
use crate::mods::{
    check_mods_internal, clear_all_manifest_mods, download_and_install_mods_internal,
    entries_needing_install, load_manifest, remove_manifest_mod, remove_mods_not_in_manifest,
    ManifestLoadResult, ModCheckResult,
};
use std::path::Path;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_opener::OpenerExt;
use tokio::sync::Mutex;

/// Глобальное состояние приложения (кэш конфига).
pub struct AppState {
    pub config: Mutex<LauncherConfig>,
    pub download: Arc<DownloadControl>,
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
    if config.fix_legacy_manifest_url() {
        config.save()?;
        emit_log(&app, "URL манифеста обновлён на GitHub");
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
    let removed = remove_mods_not_in_manifest(&app, &config, &loaded.entries)?;
    let mut result = check_mods_internal(&config, &loaded.entries);
    result.removed = removed;

    if !result.removed.is_empty() {
        emit_log(
            &app,
            &format!(
                "Удалено {} мод(ов), не входящих в манифест",
                result.removed.len()
            ),
        );
    }

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
    let _ = remove_mods_not_in_manifest(&app, &config, &loaded.entries)?;
    let to_install = entries_needing_install(&config, &loaded.entries)?;

    if to_install.is_empty() {
        emit_log(&app, "Все моды уже установлены — загрузка не требуется.");
        let _ = app.emit("progress", 100.0);
        return Ok("Моды уже актуальны".to_string());
    }

    let skipped = loaded.entries.len().saturating_sub(to_install.len());
    if skipped > 0 {
        emit_log(
            &app,
            &format!(
                "Пропущено {skipped} актуальных мод(ов), загрузка {}…",
                to_install.len()
            ),
        );
    } else {
        emit_log(
            &app,
            &format!(
                "Манифест: {} — загрузка {} мод(ов)…",
                loaded.source,
                to_install.len()
            ),
        );
    }

    state.download.reset();
    let result = download_and_install_mods_internal(
        app.clone(),
        config,
        to_install,
        state.download.clone(),
    )
    .await;

    if let Err(ref e) = result {
        emit_log(&app, &format!("Ошибка: {e}"));
        let _ = app.emit("progress", 0.0);
    } else {
        let _ = app.emit("progress", 100.0);
    }

    result
}

/// Удалить один мод с диска (папки и маркеры), затем перепроверить модпак.
#[tauri::command]
pub async fn remove_mod(
    mod_name: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ModCheckResult, String> {
    let config = state.config.lock().await.clone();
    config.game_dir_path()?;

    let loaded = load_manifest(&app, &config).await?;
    remove_manifest_mod(&app, &config, &loaded.entries, mod_name.trim())?;

    let removed = remove_mods_not_in_manifest(&app, &config, &loaded.entries)?;
    let mut result = check_mods_internal(&config, &loaded.entries);
    result.removed = removed;

    if result.ok {
        emit_log(&app, "После удаления: модпак в порядке.");
    } else {
        emit_log(
            &app,
            &format!(
                "После удаления: к установке {} мод(ов)",
                result.pending_install
            ),
        );
    }

    Ok(result)
}

/// Удалить все моды манифеста с диска и скачать заново.
#[tauri::command]
pub async fn reinstall_all_mods(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state.config.lock().await.clone();
    config.game_dir_path()?;
    config.validate_game_exe()?;

    let loaded = load_manifest(&app, &config).await?;
    if loaded.entries.is_empty() {
        return Err("Манифест пуст — нечего переустанавливать".to_string());
    }

    emit_log(
        &app,
        &format!(
            "Полная переустановка модпака ({} модов)…",
            loaded.entries.len()
        ),
    );

    clear_all_manifest_mods(&app, &config, &loaded.entries)?;

    state.download.reset();
    let result = download_and_install_mods_internal(
        app.clone(),
        config,
        loaded.entries,
        state.download.clone(),
    )
    .await;

    if let Err(ref e) = result {
        emit_log(&app, &format!("Ошибка переустановки: {e}"));
        let _ = app.emit("progress", 0.0);
    } else {
        let _ = app.emit("progress", 100.0);
        emit_log(&app, "Переустановка модпака завершена.");
    }

    result
}

/// Приостановить загрузку модов.
#[tauri::command]
pub async fn pause_download(state: State<'_, AppState>) -> Result<(), String> {
    state.download.pause();
    Ok(())
}

/// Продолжить загрузку модов.
#[tauri::command]
pub async fn resume_download(state: State<'_, AppState>) -> Result<(), String> {
    state.download.resume();
    Ok(())
}

/// Отменить загрузку модов.
#[tauri::command]
pub async fn cancel_download(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    state.download.cancel();
    emit_log(&app, "Загрузка отменена пользователем");
    let _ = app.emit("progress", 0.0);
    Ok(())
}

/// Запущен ли процесс 7DaysToDie.exe.
#[tauri::command]
pub fn is_game_running() -> bool {
    is_7dtd_running()
}

fn game_process_running() -> bool {
    is_7dtd_running()
}

/// Запустить 7DaysToDie.exe из папки игры.
#[tauri::command]
pub async fn launch_game(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    if game_process_running() {
        return Err("Игра уже запущена".to_string());
    }

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

    let mut message = "Игра запущена".to_string();
    if config.auto_steam_connect {
        let steam_url = build_steam_connect_url(
            &config.server_ip,
            config.server_port,
            &config.server_password,
        );
        emit_log(&app, "Подключение к серверу через Steam…");
        if let Err(e) = app.opener().open_url(&steam_url, None::<&str>) {
            emit_log(&app, &format!("Steam connect: {e}"));
            message.push_str(" — откройте сервер вручную (Steam connect не удался)");
        } else {
            message.push_str(" — Steam открыл подключение к серверу");
        }
    } else {
        message.push_str(" — подключитесь к серверу вручную в игре");
    }

    Ok(message)
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

/// Открыть steam://connect в Steam (без запуска игры).
#[tauri::command]
pub async fn open_steam_connect(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let config = state.config.lock().await;
    let url = build_steam_connect_url(
        &config.server_ip,
        config.server_port,
        &config.server_password,
    );
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Не удалось открыть Steam: {e}"))?;
    emit_log(&app, "Открыто подключение Steam к серверу");
    Ok(())
}

/// Открыть папку Mods игры в проводнике.
#[tauri::command]
pub async fn open_mods_folder(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let config = state.config.lock().await;
    let mods_dir = config.mods_dir()?;
    std::fs::create_dir_all(&mods_dir)
        .map_err(|e| format!("Не удалось создать Mods: {e}"))?;
    reveal_path_impl(&mods_dir)?;
    emit_log(&app, &format!("Открыта папка: {}", mods_dir.display()));
    Ok(())
}

fn reveal_path_impl(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("Путь не существует: {}", path.display()));
    }

    #[cfg(target_os = "windows")]
    {
        platform::command_no_window("explorer")
            .arg(path.as_os_str())
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {e}"))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Открытие папки поддерживается только на Windows".to_string())
    }
}

/// Включить/выключить автоподключение Steam после запуска игры.
#[tauri::command]
pub async fn save_auto_steam_connect(
    enabled: bool,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<LauncherConfig, String> {
    let mut config = state.config.lock().await;
    config.auto_steam_connect = enabled;
    config.save()?;
    emit_log(
        &app,
        if enabled {
            "Автоподключение Steam: включено"
        } else {
            "Автоподключение Steam: выключено"
        },
    );
    Ok(config.clone())
}

/// Сохранить журнал в текстовый файл.
#[tauri::command]
pub async fn export_logs(content: String) -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new()
        .set_title("Сохранить журнал")
        .set_file_name("fans-launcher-log.txt")
        .add_filter("Текст", &["txt"])
        .save_file()
        .await;

    let Some(file) = file else {
        return Ok(None);
    };

    std::fs::write(file.path(), content.as_bytes())
        .map_err(|e| format!("Не удалось сохранить файл: {e}"))?;

    Ok(Some(file.path().to_string_lossy().into_owned()))
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
    reveal_path_impl(Path::new(&path))
}
