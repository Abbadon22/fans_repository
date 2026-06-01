import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { APP_VERSION } from "../constants";
import type { AppUpdateInfo } from "../types/updates";

let pendingUpdate: Update | null = null;

/** Проверить GitHub Releases без установки. */
export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  if (import.meta.env.DEV) {
    return null;
  }

  try {
    const update = await check();
    if (!update) {
      pendingUpdate = null;
      return null;
    }
    pendingUpdate = update;
    return {
      version: update.version,
      currentVersion: APP_VERSION,
    };
  } catch {
    pendingUpdate = null;
    return null;
  }
}

/** Скачать и установить ранее найденное обновление, затем перезапустить. */
export async function installAppUpdate(onLog?: (line: string) => void): Promise<boolean> {
  if (import.meta.env.DEV) {
    onLog?.("Обновление лаунчера недоступно в режиме разработки");
    return false;
  }

  try {
    let update = pendingUpdate;
    if (!update) {
      update = await check();
      if (!update) {
        onLog?.("Обновлений лаунчера нет");
        pendingUpdate = null;
        return false;
      }
      pendingUpdate = update;
    }

    onLog?.(`Загрузка лаунчера ${update.version}…`);
    await update.downloadAndInstall();
    onLog?.("Обновление установлено, перезапуск…");
    await relaunch();
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    onLog?.(`Обновление лаунчера: ${msg}`);
    return false;
  }
}
