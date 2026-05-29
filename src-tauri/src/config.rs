use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Официальный сервер Fans (всегда используется вместо localhost в старых config.json).
pub const FAN_SERVER_IP: &str = "epyc2.worldhosts.fun";
pub const FAN_SERVER_PORT: u16 = 27681;
/// URL манифеста модов на GitHub (raw, корень репозитория).
pub const FAN_MANIFEST_URL: &str =
    "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json";

/// GitHub Releases — автообновление лаунчера.
pub const FAN_UPDATER_ENDPOINT: &str =
    "https://github.com/Abbadon22/fans_repository/releases/latest/download/latest.json";

fn default_manifest_url() -> String {
    FAN_MANIFEST_URL.to_string()
}

/// Конфигурация лаунчера, хранится в config.json рядом с исполняемым файлом.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LauncherConfig {
    pub server_ip: String,
    pub server_port: u16,
    pub server_password: String,
    /// URL списка модов (JSON). Обновляется на сервере без пересборки лаунчера.
    #[serde(default = "default_manifest_url")]
    pub manifest_url: String,
    #[serde(default)]
    pub game_dir: Option<String>,
}

impl LauncherConfig {
    /// Путь к config.json в директории исполняемого файла лаунчера.
    pub fn config_path() -> Result<PathBuf, String> {
        let exe = std::env::current_exe()
            .map_err(|e| format!("Не удалось определить путь к лаунчеру: {e}"))?;
        let dir = exe
            .parent()
            .ok_or_else(|| "Не удалось определить папку лаунчера".to_string())?;
        Ok(dir.join("config.json"))
    }

    /// Загрузить конфиг или создать с дефолтными значениями.
    pub fn load() -> Result<Self, String> {
        let path = Self::config_path()?;
        if !path.exists() {
            let default = Self::default_with_template();
            default.save()?;
            return Ok(default);
        }
        let content =
            fs::read_to_string(&path).map_err(|e| format!("Ошибка чтения config.json: {e}"))?;
        let mut config: Self =
            serde_json::from_str(&content).map_err(|e| format!("Некорректный config.json: {e}"))?;
        if config.fix_legacy_local_server() {
            config.save()?;
        }
        if config.fix_legacy_manifest_url() {
            config.save()?;
        }
        Ok(config)
    }

    /// Переключить старый URL манифеста (сервер :22499) на GitHub.
    pub fn fix_legacy_manifest_url(&mut self) -> bool {
        let legacy = self.manifest_url.contains(":22499/")
            || self.manifest_url.contains("/launcher/manifest.json")
            || self.manifest_url.is_empty();
        if !legacy {
            return false;
        }
        self.manifest_url = default_manifest_url();
        true
    }

    /// Заменить устаревший localhost/127.0.0.1 на сервер группы.
    pub fn fix_legacy_local_server(&mut self) -> bool {
        let local = self.server_ip.is_empty()
            || self.server_ip.eq_ignore_ascii_case("localhost")
            || self.server_ip == "127.0.0.1"
            || self.server_ip.starts_with("127.");
        if !local {
            return false;
        }
        self.server_ip = FAN_SERVER_IP.to_string();
        self.server_port = FAN_SERVER_PORT;
        true
    }

    /// Сохранить конфиг на диск.
    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path()?;
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Ошибка сериализации config.json: {e}"))?;
        fs::write(&path, content).map_err(|e| format!("Ошибка записи config.json: {e}"))
    }

    /// Шаблон конфига для первого запуска — отредактируйте server_* вручную.
    fn default_with_template() -> Self {
        Self {
            server_ip: FAN_SERVER_IP.to_string(),
            server_port: FAN_SERVER_PORT,
            server_password: "changeme".to_string(),
            manifest_url: default_manifest_url(),
            game_dir: None,
        }
    }

    /// Путь к папке игры (обязателен для запуска).
    pub fn game_dir_path(&self) -> Result<PathBuf, String> {
        let dir = self
            .game_dir
            .as_ref()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| {
                "Папка с игрой не выбрана. Укажите каталог с 7DaysToDie.exe".to_string()
            })?;
        Ok(PathBuf::from(dir))
    }

    /// Проверка наличия исполняемого файла игры.
    pub fn validate_game_exe(&self) -> Result<PathBuf, String> {
        let game_dir = self.game_dir_path()?;
        let exe = game_dir.join("7DaysToDie.exe");
        if !exe.is_file() {
            return Err(format!(
                "В папке «{}» не найден 7DaysToDie.exe",
                game_dir.display()
            ));
        }
        Ok(exe)
    }

    /// Папка Mods внутри каталога игры.
    pub fn mods_dir(&self) -> Result<PathBuf, String> {
        Ok(self.game_dir_path()?.join("Mods"))
    }
}
