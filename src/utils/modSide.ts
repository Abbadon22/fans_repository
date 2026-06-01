import type { ModManifestEntry, ModSide } from "../types";

export function normalizeSide(side?: string): ModSide {
  const s = side?.trim().toLowerCase();
  if (s === "server" || s === "client" || s === "both") return s;
  return "both";
}

export function requiresClientInstall(entry: ModManifestEntry): boolean {
  return normalizeSide(entry.side) !== "server";
}

export function modSideLabel(side?: string): string {
  switch (normalizeSide(side)) {
    case "server":
      return "Только сервер";
    case "client":
      return "Только клиент";
    default:
      return "Клиент + сервер";
  }
}

export function modSideShort(side?: string): string {
  switch (normalizeSide(side)) {
    case "server":
      return "Server";
    case "client":
      return "Client";
    default:
      return "Both";
  }
}

export function countBySide(manifest: ModManifestEntry[]) {
  let server = 0;
  let client = 0;
  let both = 0;
  for (const e of manifest) {
    const s = normalizeSide(e.side);
    if (s === "server") server++;
    else if (s === "client") client++;
    else both++;
  }
  return { server, client, both, clientInstall: client + both };
}
