import type { MapConfig } from "./types";

const DEFAULT_CONFIG: MapConfig = {
  serverHost: "epyc2.worldhosts.fun",
  webPort: 22499,
  basePath: "",
  apiTokenName: "web",
  apiTokenSecret: "",
  apiMode: "auto",
  mapSize: 6144,
  mapBlockSize: 128,
  maxZoom: 4,
  pollIntervalMs: 3000,
  showLandClaims: true,
  showHostiles: true,
  showOfflinePlayers: true,
};

let cached: MapConfig | null = null;

/** Загрузка config.json из public/. */
export async function loadMapConfig(): Promise<MapConfig> {
  if (cached) return cached;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Partial<MapConfig>;
      cached = { ...DEFAULT_CONFIG, ...data };
      return cached;
    }
  } catch {
    // fallback
  }
  cached = DEFAULT_CONFIG;
  return cached;
}

/** Базовый URL API (в dev — через Vite proxy). */
export function getApiBase(config: MapConfig): string {
  if (import.meta.env.DEV) {
    return config.basePath || "";
  }
  const path = config.basePath.replace(/\/$/, "");
  return `http://${config.serverHost}:${config.webPort}${path}`;
}
