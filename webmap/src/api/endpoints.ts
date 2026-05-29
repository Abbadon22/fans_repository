import type { ApiMode } from "./detect";
import {
  fetchHostilesAlloc,
  fetchLandClaimsAlloc,
  fetchPlayersAlloc,
  fetchPlayersLocationAlloc,
  fetchStatsAlloc,
} from "./alloc";
import {
  fetchMapConfigVanilla,
  fetchPlayersVanilla,
  fetchStatsVanilla,
} from "./vanilla";
import type { MapConfig } from "../types";
import type {
  HostileEntity,
  LandClaim,
  OnlinePlayer,
  PlayerLocation,
  ServerStats,
} from "../types";

export { detectApiMode } from "./detect";
export type { ApiMode } from "./detect";

export function mapTileUrlTemplate(config: MapConfig): string {
  const base = import.meta.env.DEV
    ? ""
    : `http://${config.serverHost}:${config.webPort}${config.basePath.replace(/\/$/, "")}`;
  return `${base}/map/{z}/{x}/{y}.png`;
}

export async function fetchMapSettings(
  config: MapConfig,
  mode: ApiMode,
): Promise<MapConfig> {
  if (mode !== "vanilla") return config;
  const remote = await fetchMapConfigVanilla(config).catch(() => null);
  if (!remote) return config;
  return {
    ...config,
    mapSize: remote.mapSize,
    mapBlockSize: remote.mapBlockSize,
    maxZoom: remote.maxZoom,
  };
}

export async function fetchPlayersOnline(
  config: MapConfig,
  mode: ApiMode,
): Promise<OnlinePlayer[]> {
  return mode === "vanilla"
    ? fetchPlayersVanilla(config)
    : fetchPlayersAlloc(config);
}

export async function fetchPlayersLocation(
  config: MapConfig,
  mode: ApiMode,
): Promise<PlayerLocation[]> {
  if (mode === "vanilla") {
    // Vanilla v2: только онлайн через /api/player
    const online = await fetchPlayersVanilla(config);
    return online.map((p) => ({
      steamid: p.steamid,
      name: p.name,
      online: true,
      position: p.position,
    }));
  }
  return fetchPlayersLocationAlloc(config);
}

export async function fetchLandClaims(
  config: MapConfig,
  mode: ApiMode,
): Promise<LandClaim[]> {
  if (mode === "vanilla") {
    return [];
  }
  return fetchLandClaimsAlloc(config);
}

export async function fetchHostiles(
  config: MapConfig,
  mode: ApiMode,
): Promise<HostileEntity[]> {
  if (mode === "vanilla") {
    return [];
  }
  return fetchHostilesAlloc(config);
}

export async function fetchStats(
  config: MapConfig,
  mode: ApiMode,
): Promise<ServerStats | null> {
  return mode === "vanilla"
    ? fetchStatsVanilla(config)
    : fetchStatsAlloc(config).catch(() => null);
}
