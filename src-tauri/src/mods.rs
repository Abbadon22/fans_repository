use crate::config::LauncherConfig;
use crate::download_control::DownloadControl;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::sync::{Arc, Mutex};
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};
use zip::read::ZipArchive;

/// Детальный прогресс загрузки для UI (скорость, ETA, байты).
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgressPayload {
    pub percent: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub speed_bps: f64,
    pub eta_seconds: Option<u64>,
    pub mod_name: String,
    pub mod_index: usize,
    pub mod_total: usize,
}

/// Файл внутри папки мода (kind: folder).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModFileEntry {
    pub path: String,
    pub sha256: String,
}

/// Запись манифеста мода.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModManifestEntry {
    pub name: String,
    #[serde(default)]
    pub names: Vec<String>,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub archive: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub sha256: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub files: Vec<ModFileEntry>,
    /// `server` | `client` | `both` — что ставить на ПК игрока (лаунчер).
    #[serde(default = "default_mod_side")]
    pub side: String,
}

fn default_mod_side() -> String {
    "both".to_string()
}

impl ModManifestEntry {
    pub fn side_normalized(&self) -> &str {
        let s = self.side.trim();
        if s.eq_ignore_ascii_case("server") {
            "server"
        } else if s.eq_ignore_ascii_case("client") {
            "client"
        } else {
            "both"
        }
    }

    pub fn requires_client_install(&self) -> bool {
        self.side_normalized() != "server"
    }

    pub fn folder_names(&self) -> Vec<String> {
        if !self.names.is_empty() {
            return self.names.clone();
        }
        vec![self.name.clone()]
    }

    pub fn is_folder(&self) -> bool {
        self.kind.as_deref() == Some("folder") || !self.files.is_empty()
    }

    pub fn fingerprint(&self) -> String {
        if self.is_folder() {
            folder_fingerprint(&self.files)
        } else {
            self.sha256
                .as_deref()
                .unwrap_or("")
                .trim()
                .to_lowercase()
        }
    }
}

/// Результат проверки модов.
#[derive(Debug, Serialize)]
pub struct ModCheckResult {
    pub ok: bool,
    pub missing: Vec<String>,
    /// Папки, удалённые как не входящие в манифест.
    pub removed: Vec<String>,
    /// Сколько архивов нужно скачать/переустановить (только client + both).
    pub pending_install: usize,
    /// Моды только для dedicated server — лаунчер их не качает.
    pub skipped_server: usize,
}

const DOWNLOAD_TIMEOUT_SECS: u64 = 300;
const MANIFEST_FETCH_TIMEOUT_SECS: u64 = 20;
const MARKER_DIR_NAME: &str = ".launcher-meta";

/// Служебные моды TFP — дублируют manifest.json; никогда не удалять из Mods/ при очистке.
const PROTECTED_MOD_FOLDERS: &[&str] = &[
    "0_TFP_Harmony",
    "TFP_CommandExtensions",
    "TFP_MapRendering",
    "TFP_WebServer",
];
/// Пауза между модами с Яндекс.Диска (снижает HTTP 429).
const YANDEX_BETWEEN_MODS_MS: u64 = 2500;
const YANDEX_HTTP_MAX_ATTEMPTS: u32 = 7;

type YandexHrefCache = Arc<Mutex<HashMap<String, String>>>;

/// Откуда взят манифест (для UI и логов).
#[derive(Debug, Clone, Serialize)]
pub struct ManifestLoadResult {
    pub entries: Vec<ModManifestEntry>,
    pub source: String,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum ManifestJson {
    List(Vec<ModManifestEntry>),
    Wrapped { mods: Vec<ModManifestEntry> },
}

/// Загрузить манифест: сервер → кэш → встроенный/локальный файл.
pub async fn load_manifest(
    app: &AppHandle,
    config: &LauncherConfig,
) -> Result<ManifestLoadResult, String> {
    let url = config.manifest_url.trim();
    if !url.is_empty() {
        match fetch_manifest_from_url(url).await {
            Ok(entries) => {
                let _ = save_manifest_cache(&entries);
                return Ok(ManifestLoadResult {
                    source: format!("сервер ({url})"),
                    entries,
                });
            }
            Err(net_err) => {
                if let Ok(cached) = load_manifest_cache() {
                    return Ok(ManifestLoadResult {
                        source: format!("кэш (сервер недоступен: {net_err})"),
                        entries: cached,
                    });
                }
                let local = load_manifest_local(app)?;
                return Ok(ManifestLoadResult {
                    source: format!("локальный файл (сервер недоступен: {net_err})"),
                    entries: local,
                });
            }
        }
    }

    let entries = load_manifest_local(app)?;
    Ok(ManifestLoadResult {
        source: "локальный файл".to_string(),
        entries,
    })
}

async fn fetch_manifest_from_url(url: &str) -> Result<Vec<ModManifestEntry>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(MANIFEST_FETCH_TIMEOUT_SECS))
        .user_agent("FansLauncher/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("сеть: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("чтение ответа: {e}"))?;

    parse_manifest_json(&body)
}

fn parse_manifest_json(content: &str) -> Result<Vec<ModManifestEntry>, String> {
    let parsed: ManifestJson =
        serde_json::from_str(content).map_err(|e| format!("некорректный JSON: {e}"))?;

    let entries = match parsed {
        ManifestJson::List(list) => list,
        ManifestJson::Wrapped { mods } => mods,
    };

    if entries.is_empty() {
        return Err("манифест пуст".to_string());
    }

    for entry in &entries {
        if entry.name.trim().is_empty() {
            return Err(format!("некорректная запись мода: {:?}", entry.name));
        }
        let side = entry.side_normalized();
        if side != "server" && side != "client" && side != "both" {
            return Err(format!(
                "мод «{}»: поле side должно быть server, client или both",
                entry.name
            ));
        }
        if entry.is_folder() {
            if entry
                .base_url
                .as_ref()
                .map(|u| u.trim().is_empty())
                .unwrap_or(true)
            {
                return Err(format!("мод «{}»: не задан base_url", entry.name));
            }
            if entry.files.is_empty() {
                return Err(format!("мод «{}»: пустой список files", entry.name));
            }
            for file in &entry.files {
                if file.path.trim().is_empty() || file.sha256.trim().is_empty() {
                    return Err(format!("мод «{}»: некорректный файл в files", entry.name));
                }
            }
        } else if entry.url.as_ref().map(|u| u.trim().is_empty()).unwrap_or(true)
            || entry.sha256.as_ref().map(|h| h.trim().is_empty()).unwrap_or(true)
        {
            return Err(format!("мод «{}»: нужны url и sha256 (или kind: folder)", entry.name));
        }
    }

    Ok(entries)
}

fn manifest_cache_path() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "не удалось определить папку лаунчера".to_string())?;
    Ok(dir.join(".launcher-cache").join("manifest.json"))
}

fn save_manifest_cache(entries: &[ModManifestEntry]) -> Result<(), String> {
    let path = manifest_cache_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn load_manifest_cache() -> Result<Vec<ModManifestEntry>, String> {
    let path = manifest_cache_path()?;
    let content = fs::read_to_string(&path).map_err(|e| format!("кэш {}: {e}", path.display()))?;
    parse_manifest_json(&content)
}

/// Встроенный manifest (release) или public/manifest.json (dev).
fn load_manifest_local(app: &AppHandle) -> Result<Vec<ModManifestEntry>, String> {
    if let Ok(resource) = app.path().resource_dir() {
        let bundled = resource.join("manifest.json");
        if bundled.exists() {
            return parse_manifest_file(&bundled);
        }
    }

    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let candidates = [
        exe.parent()
            .map(|p| p.join("manifest.json"))
            .unwrap_or_default(),
        PathBuf::from("public/manifest.json"),
        PathBuf::from("../public/manifest.json"),
    ];

    for path in &candidates {
        if path.exists() {
            return parse_manifest_file(path);
        }
    }

    Err(
        "manifest.json не найден локально и сервер не отдал список модов. \
         Проверьте manifest_url в config.json и файл на сервере."
            .to_string(),
    )
}

fn parse_manifest_file(path: &Path) -> Result<Vec<ModManifestEntry>, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("не удалось прочитать {}: {e}", path.display()))?;
    parse_manifest_json(&content)
}

fn manifest_folder_names(manifest: &[ModManifestEntry]) -> HashSet<String> {
    manifest
        .iter()
        .flat_map(|entry| entry.folder_names())
        .collect()
}

fn count_server_only(manifest: &[ModManifestEntry]) -> usize {
    manifest
        .iter()
        .filter(|e| !e.requires_client_install())
        .count()
}

/// Убрать с ПК игрока папки модов, которые нужны только на dedicated server.
pub fn purge_server_only_mods_from_client(
    app: &AppHandle,
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> Result<Vec<String>, String> {
    let mods_dir = match config.mods_dir() {
        Ok(p) => p,
        Err(_) => return Ok(Vec::new()),
    };
    if !mods_dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut removed = Vec::new();
    for entry in manifest.iter().filter(|e| !e.requires_client_install()) {
        let had_any = entry.folder_names().iter().any(|folder| {
            mods_dir.join(folder).is_dir() || marker_path(&mods_dir, folder).is_file()
        });
        if had_any {
            clear_mod_entry_files(&mods_dir, entry)?;
            for folder in entry.folder_names() {
                removed.push(folder);
            }
            emit_log(
                app,
                &format!(
                    "Удалён с клиента «{}» (только server — отдаётся с dedicated)",
                    entry.name
                ),
            );
        }
    }
    Ok(removed)
}

fn folder_in_manifest(name: &str, allowed: &HashSet<String>) -> bool {
    if allowed.contains(name) {
        return true;
    }
    #[cfg(windows)]
    {
        return allowed
            .iter()
            .any(|allowed_name| allowed_name.eq_ignore_ascii_case(name));
    }
    #[cfg(not(windows))]
    {
        false
    }
}

fn is_protected_mod_folder(name: &str) -> bool {
    PROTECTED_MOD_FOLDERS
        .iter()
        .any(|protected| name == *protected || name.eq_ignore_ascii_case(protected))
}

/// Удалить из Mods/ папки модов, которых нет в манифесте сервера.
pub fn remove_mods_not_in_manifest(
    app: &AppHandle,
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> Result<Vec<String>, String> {
    let mods_dir = config.mods_dir()?;
    if !mods_dir.is_dir() {
        return Ok(Vec::new());
    }

    let allowed = manifest_folder_names(manifest);
    let mut removed = Vec::new();

    for entry in fs::read_dir(&mods_dir).map_err(|e| {
        format!(
            "Не удалось прочитать папку Mods ({}): {e}",
            mods_dir.display()
        )
    })? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().into_owned();
        if name == MARKER_DIR_NAME
            || is_protected_mod_folder(&name)
            || folder_in_manifest(&name, &allowed)
        {
            continue;
        }

        fs::remove_dir_all(&path).map_err(|e| {
            format!("Не удалось удалить папку мода «{name}» ({}): {e}", path.display())
        })?;

        let marker = marker_path(&mods_dir, &name);
        if marker.is_file() {
            let _ = fs::remove_file(&marker);
        }

        emit_log(
            app,
            &format!("Удалён мод «{name}» — его нет в манифесте сервера"),
        );
        removed.push(name);
    }

    if !removed.is_empty() {
        emit_log(
            app,
            &format!(
                "Очистка Mods/: удалено {} посторонних мод(ов)",
                removed.len()
            ),
        );
    }

    Ok(removed)
}

/// Удалить с диска папки и маркеры одной записи манифеста.
pub fn clear_mod_entry_files(mods_dir: &Path, entry: &ModManifestEntry) -> Result<(), String> {
    for folder in entry.folder_names() {
        let folder_path = mods_dir.join(&folder);
        if folder_path.is_dir() {
            fs::remove_dir_all(&folder_path).map_err(|e| {
                format!(
                    "Не удалось удалить папку мода «{folder}» ({}): {e}",
                    folder_path.display()
                )
            })?;
        }
        let marker = marker_path(mods_dir, &folder);
        if marker.is_file() {
            fs::remove_file(&marker).map_err(|e| {
                format!("Не удалось удалить маркер «{folder}»: {e}")
            })?;
        }
    }
    Ok(())
}

fn folder_name_eq(a: &str, b: &str) -> bool {
    if a == b {
        return true;
    }
    #[cfg(windows)]
    {
        return a.eq_ignore_ascii_case(b);
    }
    #[cfg(not(windows))]
    {
        false
    }
}

fn find_manifest_entry<'a>(
    manifest: &'a [ModManifestEntry],
    mod_name: &str,
) -> Option<&'a ModManifestEntry> {
    let q = mod_name.trim();
    manifest.iter().find(|e| {
        e.name == q
            || e.archive.as_deref() == Some(q)
            || e.folder_names().iter().any(|f| folder_name_eq(f, q))
    })
}

/// Проблемы установки одной записи манифеста (папка + маркер + хеш).
fn entry_folder_issues(mods_dir: &Path, entry: &ModManifestEntry) -> Vec<String> {
    let expected = entry.fingerprint();
    let mut issues = Vec::new();

    for folder in entry.folder_names() {
        let folder_path = mods_dir.join(&folder);
        let marker = marker_path(mods_dir, &folder);

        if !folder_path.is_dir() {
            if marker.is_file() {
                let _ = fs::remove_file(&marker);
            }
            issues.push(format!("папка «{folder}» отсутствует"));
            continue;
        }

        if !marker.is_file() {
            issues.push(format!("«{folder}» не установлен лаунчером"));
            continue;
        }

        let stored = fs::read_to_string(&marker)
            .unwrap_or_default()
            .trim()
            .to_lowercase();
        if stored != expected {
            issues.push(format!("«{folder}»: устарел, нужно обновить"));
        }
    }

    issues
}

/// Удалить мод по имени из манифеста (папки + маркеры).
pub fn remove_manifest_mod(
    app: &AppHandle,
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
    mod_name: &str,
) -> Result<(), String> {
    let entry = find_manifest_entry(manifest, mod_name)
        .ok_or_else(|| format!("Мод «{mod_name}» не найден в манифесте"))?;

    let mods_dir = config.mods_dir()?;
    clear_mod_entry_files(&mods_dir, entry)?;
    emit_log(
        app,
        &format!(
            "Удалён мод «{mod_name}» ({})",
            entry.folder_names().join(", ")
        ),
    );
    Ok(())
}

/// Сбросить установку всех модов из манифеста (перед полной переустановкой).
pub fn clear_all_manifest_mods(
    app: &AppHandle,
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> Result<usize, String> {
    let mods_dir = config.mods_dir()?;
    if !mods_dir.is_dir() {
        fs::create_dir_all(&mods_dir)
            .map_err(|e| format!("Не удалось создать папку Mods: {e}"))?;
        return Ok(0);
    }

    for entry in manifest {
        clear_mod_entry_files(&mods_dir, entry)?;
    }

    emit_log(
        app,
        &format!("Сброшено {} мод(ов) — начинается загрузка…", manifest.len()),
    );
    Ok(manifest.len())
}

/// Проверить наличие модов и соответствие SHA256 маркерным файлам.
pub fn check_mods_internal(
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> ModCheckResult {
    let mut missing = Vec::new();
    let skipped_server = count_server_only(manifest);
    let client_manifest: Vec<ModManifestEntry> = manifest
        .iter()
        .filter(|e| e.requires_client_install())
        .cloned()
        .collect();

    let mods_dir = match config.mods_dir() {
        Ok(p) => p,
        Err(e) => {
            missing.push(e);
            return ModCheckResult {
                ok: false,
                missing,
                removed: Vec::new(),
                pending_install: 0,
                skipped_server,
            };
        }
    };

    if !mods_dir.is_dir() {
        for entry in &client_manifest {
            missing.push(format!("Папка Mods отсутствует, нужен мод: {}", entry.name));
        }
        return ModCheckResult {
            ok: missing.is_empty(),
            missing,
            removed: Vec::new(),
            pending_install: client_manifest.len(),
            skipped_server,
        };
    }

    for entry in &client_manifest {
        let issues = entry_folder_issues(&mods_dir, entry);
        if !issues.is_empty() {
            missing.push(format!("Мод «{}»: {}", entry.name, issues.join("; ")));
        }
    }

    let pending_install = entries_needing_install(config, &client_manifest)
        .map(|v| v.len())
        .unwrap_or(client_manifest.len());

    ModCheckResult {
        ok: missing.is_empty(),
        missing,
        removed: Vec::new(),
        pending_install,
        skipped_server,
    }
}

/// Нужна ли переустановка записи манифеста (нет папки, маркера или хеш устарел).
fn entry_needs_install(mods_dir: &Path, entry: &ModManifestEntry) -> bool {
    !entry_folder_issues(mods_dir, entry).is_empty()
}

/// Только моды, которых нет или которые устарели.
pub fn entries_needing_install(
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> Result<Vec<ModManifestEntry>, String> {
    let mods_dir = config.mods_dir()?;
    if !mods_dir.is_dir() {
        return Ok(manifest
            .iter()
            .filter(|e| e.requires_client_install())
            .cloned()
            .collect());
    }
    Ok(manifest
        .iter()
        .filter(|entry| entry.requires_client_install() && entry_needs_install(&mods_dir, entry))
        .cloned()
        .collect())
}

/// Скачать и установить моды из списка (обычно только отсутствующие).
pub async fn download_and_install_mods_internal(
    app: AppHandle,
    config: LauncherConfig,
    manifest: Vec<ModManifestEntry>,
    control: Arc<DownloadControl>,
) -> Result<String, String> {
    let mods_dir = config.mods_dir()?;
    fs::create_dir_all(&mods_dir).map_err(|e| format!("Не удалось создать папку Mods: {e}"))?;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(DOWNLOAD_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(30))
        .user_agent("FansLauncher/1.0")
        .build()
        .map_err(|e| format!("Ошибка HTTP-клиента: {e}"))?;

    let yandex_href_cache: YandexHrefCache = Arc::new(Mutex::new(HashMap::new()));
    let total = manifest.len();
    for (index, entry) in manifest.iter().enumerate() {
        control.wait_until_running().await?;

        if index > 0 && entry_uses_yandex_disk(entry) {
            tokio::time::sleep(Duration::from_millis(YANDEX_BETWEEN_MODS_MS)).await;
            control.wait_until_running().await?;
        }

        emit_log(
            &app,
            &format!("[{}/{}] Загрузка мода «{}»…", index + 1, total, entry.name),
        );

        if entry.is_folder() {
            install_folder_mod(&app, &client, entry, &mods_dir, index, total, &control).await?;
        } else {
            let url = entry
                .url
                .as_deref()
                .ok_or_else(|| format!("мод «{}»: нет url", entry.name))?;
            let zip_bytes = download_with_progress(
                &app,
                &client,
                url,
                &entry.name,
                index,
                total,
                false,
                &control,
                Some(&yandex_href_cache),
            )
            .await?;

            let actual_hash = sha256_hex(&zip_bytes);
            let expected = entry.fingerprint();
            if actual_hash != expected {
                return Err(format!(
                    "Неверный SHA256 для «{}»: ожидалось {}, получено {}",
                    entry.name, expected, actual_hash
                ));
            }

            emit_log(&app, &format!("Распаковка «{}» в Mods/…", entry.name));
            extract_zip_safe(&zip_bytes, &mods_dir)?;

            for folder in entry.folder_names() {
                if !mods_dir.join(&folder).is_dir() {
                    return Err(format!(
                        "После распаковки «{}» не найдена папка «{folder}» в Mods/. \
                         Проверьте имена в манифесте.",
                        entry.name
                    ));
                }
            }

            ensure_marker_dir(&mods_dir)?;
            for folder in entry.folder_names() {
                fs::write(marker_path(&mods_dir, &folder), &expected).map_err(|e| {
                    format!("Не удалось записать маркер хеша для «{folder}»: {e}")
                })?;
            }
        }

        emit_download_progress(
            &app,
            DownloadProgressPayload {
                percent: ((index + 1) as f64 / total as f64) * 100.0,
                downloaded_bytes: 0,
                total_bytes: 0,
                speed_bps: 0.0,
                eta_seconds: Some(0),
                mod_name: entry.name.clone(),
                mod_index: index,
                mod_total: total,
            },
        );
    }

    emit_log(&app, "Все моды установлены успешно.");
    Ok(if total == 1 {
        "Мод установлен".to_string()
    } else {
        format!("Установлено модов: {total}")
    })
}

fn emit_log(app: &AppHandle, message: &str) {
    let _ = app.emit("log", message);
}

fn emit_download_progress(app: &AppHandle, payload: DownloadProgressPayload) {
    let _ = app.emit("download-progress", payload.clone());
    let _ = app.emit("progress", payload.percent);
}

fn entry_uses_yandex_disk(entry: &ModManifestEntry) -> bool {
    entry
        .url
        .as_deref()
        .map(|u| u.contains("disk.yandex.ru") || u.contains("yandex.ru/d/"))
        .unwrap_or(false)
}

fn is_rate_limited_status(status: reqwest::StatusCode) -> bool {
    matches!(status.as_u16(), 429 | 502 | 503)
}

fn retry_wait_secs(attempt: u32, retry_after: Option<u64>) -> u64 {
    if let Some(secs) = retry_after {
        return secs.clamp(1, 120);
    }
    match attempt {
        1 => 3,
        2 => 6,
        3 => 12,
        4 => 24,
        5 => 45,
        _ => 60,
    }
}

fn parse_retry_after(response: &reqwest::Response) -> Option<u64> {
    response
        .headers()
        .get(reqwest::header::RETRY_AFTER)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
}

/// GET с повторами при 429/503 (лимит Яндекс.Диска).
async fn http_get_with_retry(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    context: &str,
    control: &DownloadControl,
) -> Result<reqwest::Response, String> {
    for attempt in 1..=YANDEX_HTTP_MAX_ATTEMPTS {
        control.wait_until_running().await?;

        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("{context}: сеть — {e}"))?;

        if response.status().is_success() {
            return Ok(response);
        }

        let status = response.status();
        if is_rate_limited_status(status) && attempt < YANDEX_HTTP_MAX_ATTEMPTS {
            let wait = retry_wait_secs(attempt, parse_retry_after(&response));
            emit_log(
                app,
                &format!(
                    "Яндекс.Диск: слишком много запросов (HTTP {status}), пауза {wait} с… (попытка {attempt}/{max})",
                    status = status.as_u16(),
                    wait = wait,
                    attempt = attempt,
                    max = YANDEX_HTTP_MAX_ATTEMPTS,
                ),
            );
            tokio::time::sleep(Duration::from_secs(wait)).await;
            continue;
        }

        return Err(format!("{context}: HTTP {status}"));
    }

    Err(format!(
        "{context}: лимит Яндекс.Диска — попробуйте через несколько минут"
    ))
}

/// Разрешить прямую ссылку: Яндекс.Диск API возвращает JSON с полем `href`.
async fn resolve_download_url(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    control: &DownloadControl,
    cache: Option<&YandexHrefCache>,
) -> Result<String, String> {
    if let Some(c) = cache {
        if let Ok(guard) = c.lock() {
            if let Some(href) = guard.get(url) {
                return Ok(href.clone());
            }
        }
    }

    let normalized_url = if url.contains("disk.yandex.ru/") || url.contains("yandex.ru/d/") {
        let encoded = urlencoding::encode(url);
        format!(
            "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key={encoded}"
        )
    } else {
        url.to_string()
    };

    if !normalized_url.contains("cloud-api.yandex.net") {
        return Ok(url.to_string());
    }

    let response = http_get_with_retry(
        app,
        client,
        &normalized_url,
        "Запрос ссылки Яндекс.Диска",
        control,
    )
    .await?;

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if content_type.contains("application/json") {
        #[derive(Deserialize)]
        struct YandexDownload {
            href: String,
        }
        let body: YandexDownload = response
            .json()
            .await
            .map_err(|e| format!("Некорректный ответ Яндекс.Диска: {e}"))?;
        if let Some(c) = cache {
            if let Ok(mut guard) = c.lock() {
                guard.insert(url.to_string(), body.href.clone());
            }
        }
        return Ok(body.href);
    }

    Ok(normalized_url)
}

/// Скачивание с эмитом прогресса (0–100 внутри текущего мода).
async fn download_with_progress(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    mod_name: &str,
    mod_index: usize,
    mod_total: usize,
    is_file: bool,
    control: &DownloadControl,
    yandex_cache: Option<&YandexHrefCache>,
) -> Result<Vec<u8>, String> {
    let resolved = resolve_download_url(app, client, url, control, yandex_cache).await?;
    if !is_file {
        emit_log(app, "Получена прямая ссылка на архив, загрузка…");
    }

    let context = format!("Загрузка «{mod_name}»");
    let response = http_get_with_retry(app, client, &resolved, &context, control).await?;

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut buffer = Vec::new();
    let mut stream = response.bytes_stream();
    let started = Instant::now();
    let mut last_emit = Instant::now();
    let mut last_downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
        control.wait_until_running().await?;

        let chunk = chunk.map_err(|e| format!("Ошибка чтения потока: {e}"))?;
        downloaded += chunk.len() as u64;
        buffer.extend_from_slice(&chunk);

        if last_emit.elapsed() >= Duration::from_millis(200)
            || total_size > 0 && downloaded >= total_size
        {
            let elapsed = started.elapsed().as_secs_f64().max(0.001);
            let speed_bps = downloaded as f64 / elapsed;
            let delta_bytes = downloaded.saturating_sub(last_downloaded);
            let delta_secs = last_emit.elapsed().as_secs_f64().max(0.001);
            let instant_speed = delta_bytes as f64 / delta_secs;

            let file_pct = if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            };
            let overall = if total_size > 0 {
                ((mod_index as f64 + file_pct / 100.0) / mod_total as f64) * 100.0
            } else {
                ((mod_index as f64) / mod_total as f64) * 100.0
            };

            let eta_seconds = if total_size > 0 && speed_bps > 1.0 {
                let remaining = total_size.saturating_sub(downloaded);
                Some((remaining as f64 / speed_bps).ceil() as u64)
            } else {
                None
            };

            emit_download_progress(
                app,
                DownloadProgressPayload {
                    percent: overall.min(99.0),
                    downloaded_bytes: downloaded,
                    total_bytes: total_size,
                    speed_bps: instant_speed.max(speed_bps),
                    eta_seconds,
                    mod_name: mod_name.to_string(),
                    mod_index,
                    mod_total,
                },
            );

            last_emit = Instant::now();
            last_downloaded = downloaded;
        }
    }

    Ok(buffer)
}

fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn folder_fingerprint(files: &[ModFileEntry]) -> String {
    let mut lines: Vec<String> = files
        .iter()
        .map(|f| format!("{}:{}", f.path.trim(), f.sha256.trim().to_lowercase()))
        .collect();
    lines.sort();
    sha256_hex(lines.join("\n").as_bytes())
}

fn join_download_url(base: &str, relative: &str) -> String {
    let mut url = base.trim_end_matches('/').to_string();
    for segment in relative.split('/') {
        if segment.is_empty() {
            continue;
        }
        url.push('/');
        url.push_str(&urlencoding::encode(segment));
    }
    url
}

async fn install_folder_mod(
    app: &AppHandle,
    client: &reqwest::Client,
    entry: &ModManifestEntry,
    mods_dir: &Path,
    mod_index: usize,
    mod_total: usize,
    control: &DownloadControl,
) -> Result<(), String> {
    let base_url = entry
        .base_url
        .as_deref()
        .ok_or_else(|| format!("мод «{}»: нет base_url", entry.name))?;
    let fingerprint = entry.fingerprint();
    let file_total = entry.files.len();
    let folder = entry
        .folder_names()
        .into_iter()
        .next()
        .ok_or_else(|| format!("мод «{}»: нет имени папки", entry.name))?;

    emit_log(
        app,
        &format!(
            "Синхронизация «{}» — {} файлов с сервера…",
            entry.name, file_total
        ),
    );

    let mod_root = mods_dir.join(&folder);
    fs::create_dir_all(&mod_root)
        .map_err(|e| format!("Не удалось создать {}: {e}", mod_root.display()))?;

    let canonical_root = mod_root
        .canonicalize()
        .map_err(|e| format!("Некорректная папка мода {}: {e}", mod_root.display()))?;

    for (file_idx, file) in entry.files.iter().enumerate() {
        control.wait_until_running().await?;

        let url = join_download_url(base_url, &file.path);
        let label = format!("{} ({}/{})", entry.name, file_idx + 1, file_total);
        let bytes = download_with_progress(
            app,
            client,
            &url,
            &label,
            mod_index,
            mod_total,
            true,
            control,
            None,
        )
        .await?;

        let actual = sha256_hex(&bytes);
        let expected = file.sha256.trim().to_lowercase();
        if actual != expected {
            return Err(format!(
                "Неверный SHA256 для «{}/{}»: ожидалось {}, получено {}",
                folder, file.path, expected, actual
            ));
        }

        let rel_str = file.path.replace('\\', "/");
        let rel = Path::new(&rel_str);
        let out_path = join_safe(&canonical_root, rel)?;
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&out_path, &bytes)
            .map_err(|e| format!("Не удалось записать {}: {e}", out_path.display()))?;
    }

    ensure_marker_dir(mods_dir)?;
    fs::write(marker_path(mods_dir, &folder), &fingerprint)
        .map_err(|e| format!("Не удалось записать маркер хеша для «{folder}»: {e}"))?;

    Ok(())
}

/// Безопасная распаковка ZIP в Mods/ с защитой от Zip Slip.
fn extract_zip_safe(zip_bytes: &[u8], mods_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(mods_dir)
        .map_err(|e| format!("Не удалось создать {}: {e}", mods_dir.display()))?;

    let canonical_base = mods_dir
        .canonicalize()
        .or_else(|_| {
            // Папка только что создана — canonicalize после create_dir_all
            fs::create_dir_all(mods_dir).ok();
            mods_dir.canonicalize()
        })
        .map_err(|e| format!("Некорректная целевая папка Mods: {e}"))?;

    let cursor = std::io::Cursor::new(zip_bytes);
    let mut archive =
        ZipArchive::new(cursor).map_err(|e| format!("Повреждённый ZIP-архив: {e}"))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Ошибка чтения записи ZIP: {e}"))?;

        let entry_path = match file.enclosed_name() {
            Some(p) => p.to_path_buf(),
            None => continue,
        };

        // Убираем ведущие компоненты пути (защита от абсолютных путей в архиве)
        let safe_relative: PathBuf = entry_path
            .components()
            .filter(|c| {
                !matches!(
                    c,
                    Component::ParentDir | Component::RootDir | Component::Prefix(_)
                )
            })
            .collect();

        if safe_relative.as_os_str().is_empty() {
            continue;
        }

        let out_path = join_safe(&canonical_base, &safe_relative)?;

        if file.name().ends_with('/') {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path)
                .map_err(|e| format!("Нет прав на запись {}: {e}", out_path.display()))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

/// Безопасное объединение путей: запрет выхода за пределы base (Zip Slip).
fn join_safe(base: &Path, relative: &Path) -> Result<PathBuf, String> {
    let mut out = base.to_path_buf();
    for component in relative.components() {
        match component {
            Component::Normal(seg) => out.push(seg),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err("Zip Slip: попытка выхода за пределы папки мода".to_string());
            }
        }
    }
    if !out.starts_with(base) {
        return Err(format!(
            "Zip Slip: путь {} вне {}",
            out.display(),
            base.display()
        ));
    }
    Ok(out)
}

fn marker_dir(mods_dir: &Path) -> PathBuf {
    mods_dir.join(MARKER_DIR_NAME)
}

fn ensure_marker_dir(mods_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(marker_dir(mods_dir))
        .map_err(|e| format!("Не удалось создать служебную папку метаданных: {e}"))
}

fn marker_path(mods_dir: &Path, mod_name: &str) -> PathBuf {
    let safe_name: String = mod_name
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
                ch
            } else {
                '_'
            }
        })
        .collect();
    marker_dir(mods_dir).join(format!("{safe_name}.sha256"))
}
