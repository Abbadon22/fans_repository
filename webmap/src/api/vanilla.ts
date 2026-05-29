import { apiFetch } from "./client";
import { normalizeOnlinePlayer } from "./normalize";
import type { MapConfig, OnlinePlayer, ServerStats } from "../types";

interface VanillaPlayerResponse {
  data?: { players?: Record<string, unknown>[] };
}

interface VanillaMapConfigResponse {
  data?: {
    maxZoom?: number;
    mapBlockSize?: number;
    enabled?: boolean;
    mapSize?: { x?: number; z?: number };
  };
}

interface VanillaServerInfoItem {
  name: string;
  type: string;
  value: string | number | boolean;
}

interface VanillaServerInfoResponse {
  data?: VanillaServerInfoItem[];
}

/** Игроки онлайн — vanilla API `/api/player`. */
export async function fetchPlayersVanilla(config: MapConfig): Promise<OnlinePlayer[]> {
  const body = await apiFetch<VanillaPlayerResponse>(config, "/api/player");
  const list = body.data?.players ?? [];
  return list.map((p) => normalizeOnlinePlayer(p));
}

/** Параметры карты с сервера. */
export async function fetchMapConfigVanilla(
  config: MapConfig,
): Promise<{ mapSize: number; mapBlockSize: number; maxZoom: number; enabled: boolean } | null> {
  const body = await apiFetch<VanillaMapConfigResponse>(config, "/api/map/config");
  const size = body.data?.mapSize;
  if (!size) return null;
  const mapSize = Math.max(Number(size.x ?? 0), Number(size.z ?? 0));
  return {
    mapSize: mapSize || config.mapSize,
    mapBlockSize: body.data?.mapBlockSize ?? config.mapBlockSize,
    maxZoom: body.data?.maxZoom ?? config.maxZoom,
    enabled: body.data?.enabled ?? true,
  };
}

/** Базовая статистика из `/api/serverinfo`. */
export async function fetchStatsVanilla(config: MapConfig): Promise<ServerStats | null> {
  const body = await apiFetch<VanillaServerInfoResponse>(config, "/api/serverinfo");
  const items = body.data ?? [];
  const get = (name: string) => items.find((i) => i.name === name)?.value;

  const online = Number(get("CurrentPlayers") ?? get("Players") ?? 0);
  const max = Number(get("MaxPlayers") ?? get("ServerMaxPlayerCount") ?? 0);

  return {
    players: { online: Number.isFinite(online) ? online : 0, max: Number.isFinite(max) ? max : 0 },
  };
}
