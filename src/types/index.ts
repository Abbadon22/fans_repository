/** Конфигурация лаунчера (config.json). */
export interface LauncherConfig {
  server_ip: string;
  server_port: number;
  server_password: string;
  /** URL JSON-манифеста модов на сервере. */
  manifest_url: string;
  game_dir: string | null;
}

/** Ответ загрузки манифеста с бэкенда. */
export interface ManifestLoadResult {
  entries: ModManifestEntry[];
  source: string;
}

/** Запись манифеста мода. */
export interface ModManifestEntry {
  name: string;
  /** Папки модов внутри одного zip. */
  names?: string[];
  /** Имя zip в репозитории Mods/. */
  archive?: string;
  url: string;
  sha256: string;
}

/** Результат проверки модов с бэкенда. */
export interface ModCheckResult {
  ok: boolean;
  missing: string[];
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
