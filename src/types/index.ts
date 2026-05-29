/** Конфигурация лаунчера (config.json). */
export interface LauncherConfig {
  server_ip: string;
  server_port: number;
  server_password: string;
  game_dir: string | null;
}

/** Запись манифеста мода. */
export interface ModManifestEntry {
  name: string;
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

/** Состояние UI лаунчера. */
export interface LauncherState {
  isChecking: boolean;
  isDownloading: boolean;
  progress: number;
  downloadProgress: DownloadProgress | null;
  status: string;
  isReady: boolean;
  logs: string[];
  gameDir: string | null;
  configPath: string | null;
}
