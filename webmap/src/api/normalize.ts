import type { GamePosition, HostileEntity, LandClaim, OnlinePlayer, PlayerLocation } from "../types";

function pos(raw: Record<string, unknown> | undefined): GamePosition {
  const p = (raw ?? {}) as Record<string, number>;
  return {
    x: Number(p.x ?? p.X ?? 0),
    y: Number(p.y ?? p.Y ?? 0),
    z: Number(p.z ?? p.Z ?? 0),
  };
}

/** Нормализация игрока из Alloc или vanilla JSON. */
export function normalizeOnlinePlayer(raw: Record<string, unknown>): OnlinePlayer {
  const position = pos(raw.position as Record<string, unknown> | undefined);
  return {
    steamid: String(raw.steamid ?? raw.steamId ?? raw.userid ?? raw.id ?? ""),
    entityid: Number(raw.entityid ?? raw.entityId ?? raw.entityID ?? 0),
    name: String(raw.name ?? raw.playerName ?? "Игрок"),
    online: Boolean(raw.online ?? true),
    position,
    health: Number(raw.health ?? raw.Health ?? 0),
    level: Number(raw.level ?? raw.Level ?? 0),
    ping: Number(raw.ping ?? raw.Ping ?? -1),
  };
}

export function normalizePlayerLocation(raw: Record<string, unknown>): PlayerLocation {
  return {
    steamid: String(raw.steamid ?? raw.steamId ?? ""),
    name: String(raw.name ?? "Игрок"),
    online: Boolean(raw.online),
    position: pos(raw.position as Record<string, unknown> | undefined),
  };
}

export function normalizeLandClaim(raw: Record<string, unknown>): LandClaim {
  const sizeRaw = (raw.size ?? {}) as Record<string, number>;
  return {
    owner: String(raw.owner ?? raw.name ?? ""),
    name: raw.name ? String(raw.name) : undefined,
    position: pos(raw.position as Record<string, unknown> | undefined),
    size: {
      x: Number(sizeRaw.x ?? 32),
      y: Number(sizeRaw.y ?? 1),
      z: Number(sizeRaw.z ?? 32),
    },
  };
}

export function normalizeHostile(raw: Record<string, unknown>): HostileEntity {
  return {
    entityid: Number(raw.entityid ?? raw.entityId ?? 0),
    name: String(raw.name ?? "Враг"),
    position: pos(raw.position as Record<string, unknown> | undefined),
  };
}
