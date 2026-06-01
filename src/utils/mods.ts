import type { ModCheckResult, ModManifestEntry } from "../types";
import { modSideLabel, requiresClientInstall } from "./modSide";

export type ModInstallStatus = "ok" | "missing" | "unknown" | "server_skip";

export interface ModStatusRow {
  key: string;
  name: string;
  archive?: string;
  side: string;
  folders: string[];
  status: ModInstallStatus;
  detail?: string;
}

function entryFolders(entry: ModManifestEntry): string[] {
  if (entry.names?.length) return entry.names;
  return [entry.name];
}

/** Статус каждого мода по результату проверки. */
export function modStatuses(
  manifest: ModManifestEntry[],
  check: ModCheckResult | null,
): ModStatusRow[] {
  return manifest.map((entry) => {
    const folders = entryFolders(entry);
    const side = entry.side ?? "both";
    const row: ModStatusRow = {
      key: entry.archive ?? entry.name,
      name: entry.name,
      archive: entry.archive,
      side,
      folders,
      status: "unknown",
    };

    if (!requiresClientInstall(entry)) {
      return {
        ...row,
        status: "server_skip",
        detail: modSideLabel(side) + " — лаунчер не скачивает на ваш ПК",
      };
    }

    if (!check) return row;

    if (check.ok) {
      return { ...row, status: "ok" };
    }

    const entryPrefix = `Мод «${entry.name}»`;
    const issue = check.missing.find(
      (msg) =>
        msg.startsWith(entryPrefix) ||
        folders.some((folder) => msg.includes(`«${folder}»`)),
    );

    if (issue) {
      return { ...row, status: "missing", detail: issue };
    }

    return { ...row, status: "ok" };
  });
}

/** Моды, которые реально ставит лаунчер. */
export function clientInstallRows(rows: ModStatusRow[]): ModStatusRow[] {
  return rows.filter((r) => r.status !== "server_skip");
}
