/** Режим API сервера. */
export type ApiModeSetting = "auto" | "vanilla" | "alloc";

/** Конфиг карты (public/config.json). */
export interface MapConfig {
  serverHost: string;
  webPort: number;
  basePath: string;
  apiTokenName: string;
  apiTokenSecret: string;
  /** auto — определить при старте (vanilla или Alloc). */
  apiMode?: ApiModeSetting;
  mapSize: number;
  /** Размер тайла с сервера (обычно 128). */
  mapBlockSize: number;
  maxZoom: number;
  pollIntervalMs: number;
  showLandClaims: boolean;
  showHostiles: boolean;
  showOfflinePlayers: boolean;
}

export interface GamePosition {
  x: number;
  y: number;
  z: number;
}

export interface OnlinePlayer {
  steamid: string;
  entityid: number;
  name: string;
  online: boolean;
  position: GamePosition;
  health: number;
  level: number;
  ping: number;
}

export interface PlayerLocation {
  steamid: string;
  name: string;
  online: boolean;
  position: GamePosition;
}

export interface LandClaim {
  owner: string;
  name?: string;
  position: GamePosition;
  size: { x: number; y: number; z: number };
}

export interface HostileEntity {
  entityid: number;
  name: string;
  position: GamePosition;
}

export interface ServerStats {
  gametime?: { days: number; hours: number; minutes: number };
  players?: { online: number; max: number };
}

export interface CustomMarker {
  id: string;
  title: string;
  x: number;
  z: number;
  color: string;
  createdAt: number;
}
