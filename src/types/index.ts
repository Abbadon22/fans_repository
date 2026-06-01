/** Конфигурация лаунчера (config.json). */
export interface LauncherConfig {
  server_ip: string;
  server_port: number;
  server_password: string;
  /** URL JSON-манифеста модов на сервере. */
  manifest_url: string;
  game_dir: string | null;
  /** После «Играть» открыть steam://connect (по умолчанию true). */
  auto_steam_connect?: boolean;
}

/** Ответ загрузки манифеста с бэкенда. */
export interface ManifestLoadResult {
  entries: ModManifestEntry[];
  source: string;
}

/** Сторона установки мода в мультиплеере. */
export type ModSide = "server" | "client" | "both";

/** Запись манифеста мода. */
export interface ModManifestEntry {
  name: string;
  /** Папки модов внутри одного zip. */
  names?: string[];
  /** Имя zip в репозитории Mods/. */
  archive?: string;
  /** server — не качается на ПК игрока; client/both — ставит лаунчер. */
  side?: ModSide;
  url: string;
  sha256: string;
}

/** Результат проверки модов с бэкенда. */
export interface ModCheckResult {
  ok: boolean;
  missing: string[];
  removed: string[];
  pending_install: number;
  skipped_server: number;
}

/** Детальный прогресс загрузки с бэкенда. */
export interface DownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  etaSeconds: number | null;
  modName: string;
  modIndex: number;
  modTotal: number;
}

/** Фаза работы лаунчера для UI. */
export type LauncherPhase =
  | "boot"
  | "no-folder"
  | "checking"
  | "downloading"
  | "ready"
  | "error";

/** Состояние UI лаунчера. */
export interface LauncherState {
  phase: LauncherPhase;
  isChecking: boolean;
  isDownloading: boolean;
  downloadPaused: boolean;
  progress: number;
  downloadProgress: DownloadProgress | null;
  status: string;
  isReady: boolean;
  logs: string[];
  gameDir: string | null;
  configPath: string | null;
  config: LauncherConfig | null;
  manifest: ModManifestEntry[];
  manifestSource: string | null;
  modCheck: ModCheckResult | null;
  gameRunning: boolean;
}
