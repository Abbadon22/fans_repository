import { apiFetch } from "./client";
import {
  normalizeHostile,
  normalizeLandClaim,
  normalizeOnlinePlayer,
  normalizePlayerLocation,
} from "./normalize";
import type {
  HostileEntity,
  LandClaim,
  MapConfig,
  OnlinePlayer,
  PlayerLocation,
  ServerStats,
} from "../types";

/** Legacy Alloc API. */
export async function fetchPlayersAlloc(config: MapConfig): Promise<OnlinePlayer[]> {
  const data = await apiFetch<Record<string, unknown>[]>(config, "/api/getplayersonline");
  return (Array.isArray(data) ? data : []).map((p) => normalizeOnlinePlayer(p));
}

export async function fetchPlayersLocationAlloc(
  config: MapConfig,
): Promise<PlayerLocation[]> {
  const url = "/api/getplayerslocation?offline=true";
  const data = await apiFetch<Record<string, unknown>[]>(config, url);
  return (Array.isArray(data) ? data : []).map((p) => normalizePlayerLocation(p));
}

export async function fetchLandClaimsAlloc(config: MapConfig): Promise<LandClaim[]> {
  const data = await apiFetch<Record<string, unknown>[]>(config, "/api/getlandclaims");
  return (Array.isArray(data) ? data : []).map((c) => normalizeLandClaim(c));
}

export async function fetchHostilesAlloc(config: MapConfig): Promise<HostileEntity[]> {
  const data = await apiFetch<Record<string, unknown>[]>(config, "/api/gethostilelocation");
  return (Array.isArray(data) ? data : []).map((h) => normalizeHostile(h));
}

export async function fetchStatsAlloc(config: MapConfig): Promise<ServerStats | null> {
  return apiFetch<ServerStats>(config, "/api/getstats");
}
