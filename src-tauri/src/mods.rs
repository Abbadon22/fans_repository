use crate::config::LauncherConfig;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
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

/// Запись манифеста мода.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModManifestEntry {
    pub name: String,
    #[serde(default)]
    pub names: Vec<String>,
    #[serde(default)]
    pub archive: Option<String>,
    pub url: String,
    pub sha256: String,
}

impl ModManifestEntry {
    pub fn folder_names(&self) -> Vec<String> {
        if !self.names.is_empty() {
            return self.names.clone();
        }
        vec![self.name.clone()]
    }
}

/// Результат проверки модов.
#[derive(Debug, Serialize)]
pub struct ModCheckResult {
    pub ok: bool,
    pub missing: Vec<String>,
}

const DOWNLOAD_TIMEOUT_SECS: u64 = 300;
const MANIFEST_FETCH_TIMEOUT_SECS: u64 = 20;

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
        if entry.name.trim().is_empty()
            || entry.url.trim().is_empty()
            || entry.sha256.trim().is_empty()
        {
            return Err(format!("некорректная запись мода: {:?}", entry.name));
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

/// Проверить наличие модов и соответствие SHA256 маркерным файлам.
pub fn check_mods_internal(
    config: &LauncherConfig,
    manifest: &[ModManifestEntry],
) -> ModCheckResult {
    let mut missing = Vec::new();

    let mods_dir = match config.mods_dir() {
        Ok(p) => p,
        Err(e) => {
            missing.push(e);
            return ModCheckResult { ok: false, missing };
        }
    };

    if !mods_dir.is_dir() {
        for entry in manifest {
            missing.push(format!("Папка Mods отсутствует, нужен мод: {}", entry.name));
        }
        return ModCheckResult {
            ok: missing.is_empty(),
            missing,
        };
    }

    for entry in manifest {
        let folder_names = entry.folder_names();
        for folder in &folder_names {
            let marker = marker_path(&mods_dir, folder);

            if !marker.is_file() {
                missing.push(format!(
                    "Мод «{}» не установлен лаунчером (нет маркера хеша)",
                    folder
                ));
                continue;
            }

            let stored = fs::read_to_string(&marker)
                .unwrap_or_default()
                .trim()
                .to_lowercase();
            let expected = entry.sha256.trim().to_lowercase();
            if stored != expected {
                missing.push(format!(
                    "Мод «{}»: хеш не совпадает (ожидается {}, в маркере {})",
                    folder, expected, stored
                ));
            }
        }
    }

    ModCheckResult {
        ok: missing.is_empty(),
        missing,
    }
}

/// Скачать и установить все моды из манифеста.
pub async fn download_and_install_mods_internal(
    app: AppHandle,
    config: LauncherConfig,
    manifest: Vec<ModManifestEntry>,
) -> Result<String, String> {
    let mods_dir = config.mods_dir()?;
    fs::create_dir_all(&mods_dir).map_err(|e| format!("Не удалось создать папку Mods: {e}"))?;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(DOWNLOAD_TIMEOUT_SECS))
        .build()
        .map_err(|e| format!("Ошибка HTTP-клиента: {e}"))?;

    let total = manifest.len();
    for (index, entry) in manifest.iter().enumerate() {
        emit_log(
            &app,
            &format!("[{}/{}] Загрузка мода «{}»…", index + 1, total, entry.name),
        );

        let zip_bytes =
            download_with_progress(&app, &client, &entry.url, &entry.name, index, total).await?;

        let actual_hash = sha256_hex(&zip_bytes);
        let expected = entry.sha256.trim().to_lowercase();
        if actual_hash != expected {
            return Err(format!(
                "Неверный SHA256 для «{}»: ожидалось {}, получено {}",
                entry.name, expected, actual_hash
            ));
        }

        emit_log(&app, &format!("Распаковка «{}» в Mods/…", entry.name));
        extract_zip_safe(&zip_bytes, &mods_dir)?;

        ensure_marker_dir(&mods_dir)?;
        for folder in entry.folder_names() {
            fs::write(marker_path(&mods_dir, &folder), &expected)
                .map_err(|e| format!("Не удалось записать маркер хеша для «{folder}»: {e}"))?;
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
    Ok("Моды установлены".to_string())
}

fn emit_log(app: &AppHandle, message: &str) {
    let _ = app.emit("log", message);
}

fn emit_download_progress(app: &AppHandle, payload: DownloadProgressPayload) {
    let _ = app.emit("download-progress", payload.clone());
    let _ = app.emit("progress", payload.percent);
}

/// Разрешить прямую ссылку: Яндекс.Диск API возвращает JSON с полем `href`.
async fn resolve_download_url(client: &reqwest::Client, url: &str) -> Result<String, String> {
    let normalized_url = if url.contains("disk.yandex.ru/") {
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

    let response = client
        .get(&normalized_url)
        .send()
        .await
        .map_err(|e| format!("Ошибка запроса к Яндекс.Диску: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Яндекс.Диск вернул HTTP {} для {}",
            response.status(),
            normalized_url
        ));
    }

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
        return Ok(body.href);
    }

    // Уже прямая ссылка (редирект обработает reqwest)
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
) -> Result<Vec<u8>, String> {
    let resolved = resolve_download_url(client, url).await?;
    emit_log(app, "Получена прямая ссылка на архив, загрузка…");

    let response = client
        .get(&resolved)
        .send()
        .await
        .map_err(|e| format!("Сетевая ошибка при загрузке: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {} при загрузке {}", response.status(), url));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut buffer = Vec::new();
    let mut stream = response.bytes_stream();
    let started = Instant::now();
    let mut last_emit = Instant::now();
    let mut last_downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
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
    mods_dir.join(".launcher-meta")
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
