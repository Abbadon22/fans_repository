import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** Проверить GitHub Releases и установить обновление лаунчера. */
export async function checkAppUpdate(onLog?: (line: string) => void): Promise<boolean> {
  if (import.meta.env.DEV) {
    onLog?.("Проверка обновлений лаунчера пропущена (режим разработки)");
    return false;
  }

  try {
    const update = await check();
    if (!update) {
      onLog?.("Обновлений лаунчера нет");
      return false;
    }

    onLog?.(`Доступна версия лаунчера ${update.version}, загрузка…`);
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
