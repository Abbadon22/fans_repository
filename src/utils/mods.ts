import type { ModCheckResult, ModManifestEntry } from "../types";

export type ModInstallStatus = "ok" | "missing" | "unknown";

/** Статус каждого мода по результату проверки. */
export function modStatuses(
  manifest: ModManifestEntry[],
  check: ModCheckResult | null,
): { name: string; status: ModInstallStatus; detail?: string }[] {
  if (!check) {
    return manifest.map((m) => ({ name: m.name, status: "unknown" as const }));
  }
  if (check.ok) {
    return manifest.map((m) => ({ name: m.name, status: "ok" as const }));
  }

  return manifest.map((entry) => {
    const issue = check.missing.find((msg) => msg.includes(entry.name));
    if (issue) {
      return { name: entry.name, status: "missing" as const, detail: issue };
    }
    return { name: entry.name, status: "ok" as const };
  });
}
