use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Конфигурация лаунчера, хранится в config.json рядом с исполняемым файлом.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LauncherConfig {
    pub server_ip: String,
    pub server_port: u16,
    pub server_password: String,
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
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Ошибка чтения config.json: {e}"))?;
        serde_json::from_str(&content).map_err(|e| format!("Некорректный config.json: {e}"))
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
            server_ip: "epyc2.worldhosts.fun".to_string(),
            server_port: 27681,
            server_password: "changeme".to_string(),
            game_dir: None,
        }
    }

    /// Путь к папке игры (обязателен для запуска).
    pub fn game_dir_path(&self) -> Result<PathBuf, String> {
        let dir = self
            .game_dir
            .as_ref()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "Папка с игрой не выбрана. Укажите каталог с 7DaysToDie.exe".to_string())?;
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
