import type { ModCheckResult, ModManifestEntry } from "../types";
import type { AppUpdateInfo, UpdateNotification } from "../types/updates";

const DISMISS_STORAGE_KEY = "fans-launcher-dismissed-updates";

export function manifestSignature(entries: ModManifestEntry[]): string {
  return entries
    .map((e) => `${e.archive ?? e.name}:${e.sha256}`)
    .sort()
    .join("|");
}

export function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function saveDismissedIds(ids: Set<string>): void {
  localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...ids]));
}

export function dismissNotificationId(id: string): Set<string> {
  const next = loadDismissedIds();
  next.add(id);
  saveDismissedIds(next);
  return next;
}

const MANIFEST_ACK_KEY = "fans-launcher-manifest-sig";

export function loadAcknowledgedManifestSig(): string | null {
  return localStorage.getItem(MANIFEST_ACK_KEY);
}

export function acknowledgeManifestSig(sig: string): void {
  localStorage.setItem(MANIFEST_ACK_KEY, sig);
}

export function isRemoteManifestSource(source: string | null): boolean {
  if (!source) return false;
  const s = source.toLowerCase();
  return s.includes("сервер") || s.includes("github") || s.startsWith("http");
}

export function detectManifestListChange(
  entries: ModManifestEntry[],
  source: string | null,
): boolean {
  if (!isRemoteManifestSource(source)) return false;
  const sig = manifestSignature(entries);
  const prev = loadAcknowledgedManifestSig();
  if (prev === null) {
    acknowledgeManifestSig(sig);
    return false;
  }
  return prev !== sig;
}

export interface BuildNotificationsInput {
  appUpdate: AppUpdateInfo | null;
  modCheck: ModCheckResult | null;
  gameDir: string | null;
  manifestListChanged: boolean;
  manifestCount: number;
  busy: boolean;
  dismissedIds: Set<string>;
}

export function buildUpdateNotifications(input: BuildNotificationsInput): UpdateNotification[] {
  const items: UpdateNotification[] = [];
  const { appUpdate, modCheck, gameDir, manifestListChanged, manifestCount, busy, dismissedIds } =
    input;

  if (appUpdate) {
    const id = `launcher:${appUpdate.version}`;
    if (!dismissedIds.has(id)) {
      items.push({
        id,
        kind: "launcher",
        title: "Обновление лаунчера",
        message: `Доступна версия ${appUpdate.version} (у вас ${appUpdate.currentVersion}). Установить сейчас?`,
        primaryLabel: busy ? "Подождите…" : "Обновить лаунчер",
        primaryAction: "install_launcher",
        dismissible: true,
      });
    }
  }

  if (manifestListChanged && gameDir) {
    const sigId = "manifest:changed";
    if (!dismissedIds.has(sigId)) {
      items.push({
        id: sigId,
        kind: "manifest",
        title: "Список модов обновлён",
        message: `На сервере новый manifest (${manifestCount} модов). Проверьте вкладку «Моды» и при необходимости установите обновления.`,
        primaryLabel: "Открыть моды",
        primaryAction: "go_mods",
        dismissible: true,
      });
    }
  }

  const pending = modCheck?.pending_install ?? 0;
  if (gameDir && pending > 0) {
    const id = `mods:pending:${pending}`;
    if (!dismissedIds.has(id)) {
      items.push({
        id,
        kind: "mods_install",
        title: "Нужно обновить моды",
        message: `${pending} мод(ов) нужно установить или обновить перед игрой на сервере.`,
        primaryLabel: busy ? "Идёт загрузка…" : `Установить ${pending} мод(ов)`,
        primaryAction: "install_mods",
        dismissible: true,
      });
    }
  } else if (gameDir && modCheck && !modCheck.ok && (modCheck.missing?.length ?? 0) > 0) {
    const id = `mods:issues:${modCheck.missing.length}`;
    if (!dismissedIds.has(id)) {
      items.push({
        id,
        kind: "mods_issues",
        title: "Проблемы с модами",
        message: `Обнаружено ${modCheck.missing.length} проблем(ы). Откройте вкладку «Моды» для деталей.`,
        primaryLabel: "Открыть моды",
        primaryAction: "go_mods",
        dismissible: true,
      });
    }
  }

  const order: Record<UpdateNotification["kind"], number> = {
    launcher: 0,
    manifest: 1,
    mods_install: 2,
    mods_issues: 3,
  };
  return items.sort((a, b) => order[a.kind] - order[b.kind]);
}
