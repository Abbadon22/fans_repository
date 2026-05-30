import type { ModCheckResult, ModManifestEntry } from "../types";

export type ModInstallStatus = "ok" | "missing" | "unknown";

export interface ModStatusRow {
  key: string;
  name: string;
  archive?: string;
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
    const row: ModStatusRow = {
      key: entry.archive ?? entry.name,
      name: entry.name,
      archive: entry.archive,
      folders,
      status: "unknown",
    };

    if (!check) return row;

    if (check.ok) {
      return { ...row, status: "ok" };
    }

    const issue = check.missing.find((msg) =>
      folders.some((folder) => msg.includes(`«${folder}»`) || msg.includes(folder)),
    );

    if (issue) {
      return { ...row, status: "missing", detail: issue };
    }

    return { ...row, status: "ok" };
  });
}
