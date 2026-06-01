import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  DownloadProgress,
  LauncherConfig,
  LauncherPhase,
  LauncherState,
  ManifestLoadResult,
  ModCheckResult,
} from "../types";
import { checkAppUpdate } from "./useAppUpdater";
import { normalizeModCheck } from "../utils/modCheck";

interface DownloadProgressPayload {
  percent: number;
  downloaded_bytes: number;
  total_bytes: number;
  speed_bps: number;
  eta_seconds: number | null;
  mod_name: string;
  mod_index: number;
  mod_total: number;
}

function mapDownloadProgress(p: DownloadProgressPayload): DownloadProgress {
  return {
    percent: p.percent,
    downloadedBytes: p.downloaded_bytes,
    totalBytes: p.total_bytes,
    speedBps: p.speed_bps,
    etaSeconds: p.eta_seconds,
    modName: p.mod_name,
    modIndex: p.mod_index,
    modTotal: p.mod_total,
  };
}

function isDownloadCancelled(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.toLowerCase().includes("отмен");
}

function derivePhase(s: Pick<LauncherState, "isChecking" | "isDownloading" | "isReady" | "gameDir"> & { hadError?: boolean }): LauncherPhase {
  if (!s.gameDir) return "no-folder";
  if (s.isChecking) return "checking";
  if (s.isDownloading) return "downloading";
  if (s.isReady) return "ready";
  if (s.hadError) return "error";
  return s.gameDir ? "checking" : "no-folder";
}

const initialState: LauncherState = {
  phase: "boot",
  isChecking: false,
  isDownloading: false,
  downloadPaused: false,
  progress: 0,
  downloadProgress: null,
  status: "Инициализация…",
  isReady: false,
  logs: [],
  gameDir: null,
  configPath: null,
  config: null,
  manifest: [],
  manifestSource: null,
  modCheck: null,
  gameRunning: false,
};

export function useLauncher() {
  const [state, setState] = useState<LauncherState>(initialState);
  const bootstrapped = useRef(false);
  const hadError = useRef(false);

  const patch = useCallback((partial: Partial<LauncherState>) => {
    setState((s) => {
      const next = { ...s, ...partial };
      return {
        ...next,
        phase: derivePhase({ ...next, hadError: hadError.current && !next.isReady }),
      };
    });
  }, []);

  const appendLog = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString("ru-RU");
    setState((s) => ({
      ...s,
      logs: [...s.logs, `[${ts}] ${line}`].slice(-200),
    }));
  }, []);

  const setStatus = useCallback(
    (status: string) => {
      patch({ status });
    },
    [patch],
  );

  const runCheckOnly = useCallback(async () => {
    try {
      const check = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
      patch({ modCheck: check });
      return check;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Проверка: ${msg}`);
      return null;
    }
  }, [appendLog, patch]);

  const runModCheckOnly = useCallback(async () => {
    hadError.current = false;
    patch({
      isChecking: true,
      isReady: false,
      progress: 0,
      downloadProgress: null,
      status: "Проверка модов…",
    });

    try {
      const check = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
      patch({ modCheck: check });

      if (check.ok) {
        appendLog("Моды актуальны.");
        patch({
          isChecking: false,
          isDownloading: false,
          isReady: true,
          progress: 100,
          downloadProgress: null,
          status: "Готово к запуску",
        });
        return check;
      }

      if (check.removed?.length) {
        appendLog(`Удалено из Mods/: ${check.removed.join(", ")}`);
      }

      const pending = check.pending_install ?? 0;
      appendLog(
        pending > 0
          ? `Нужно установить или обновить: ${pending} мод(ов). Нажмите «Установить» на вкладке «Моды».`
          : `Требуется внимание: ${check.missing.length} проблем(ы).`,
      );
      patch({
        isChecking: false,
        isDownloading: false,
        isReady: false,
        progress: 0,
        downloadProgress: null,
        status:
          pending > 0
            ? `Нужно обновить ${pending} мод(ов)`
            : "Проверьте моды во вкладке «Моды»",
      });
      hadError.current = true;
      return check;
    } catch (e) {
      hadError.current = true;
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Ошибка: ${msg}`);
      patch({
        isChecking: false,
        isDownloading: false,
        isReady: false,
        downloadProgress: null,
        status: "Ошибка — см. журнал",
      });
      return null;
    }
  }, [appendLog, patch]);

  const reloadManifestAndCheck = useCallback(async (): Promise<ModCheckResult | null> => {
    try {
      const loaded = await invoke<ManifestLoadResult>("get_manifest");
      const check = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
      patch({
        manifest: loaded.entries,
        manifestSource: loaded.source,
        modCheck: check,
      });
      return check;
    } catch {
      return null;
    }
  }, [patch]);

  const runInstallPipeline = useCallback(async () => {
    if (!state.gameDir) {
      appendLog("Сначала выберите папку с игрой");
      return;
    }

    hadError.current = false;
    patch({
      isChecking: false,
      isDownloading: true,
      downloadPaused: false,
      isReady: false,
      downloadProgress: null,
      status: "Загрузка и установка модов…",
    });

    try {
      const pending = state.modCheck?.pending_install;
      if (pending && pending > 0) {
        appendLog(`Загрузка ${pending} мод(ов)…`);
      } else {
        appendLog("Загрузка недостающих модов…");
      }

      const result = await invoke<string>("download_and_install_mods");
      appendLog(result);

      const after = await reloadManifestAndCheck();
      patch({
        isDownloading: false,
        downloadPaused: false,
        isReady: after?.ok ?? false,
        progress: 100,
        downloadProgress: null,
        status: after?.ok ? "Готово к запуску" : "Ошибка после установки",
      });
      if (after?.ok) {
        appendLog("Моды установлены.");
      } else if (after) {
        hadError.current = true;
        appendLog("После установки остались проблемы — см. вкладку «Моды»");
      }
    } catch (e) {
      const cancelled = isDownloadCancelled(e);
      if (!cancelled) hadError.current = true;
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(cancelled ? msg : `Ошибка установки: ${msg}`);
      let afterCheck: ModCheckResult | null = null;
      if (cancelled) {
        try {
          afterCheck = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
        } catch {
          /* ignore */
        }
      }
      patch({
        modCheck: afterCheck ?? state.modCheck,
        isDownloading: false,
        downloadPaused: false,
        isReady: afterCheck?.ok ?? false,
        downloadProgress: null,
        status: cancelled ? "Загрузка отменена" : "Ошибка загрузки модов",
      });
    }
  }, [appendLog, patch, reloadManifestAndCheck, state.gameDir, state.modCheck, state.modCheck?.pending_install]);

  const runModPipeline = runModCheckOnly;

  const selectFolder = useCallback(async () => {
    try {
      const path = await invoke<string>("select_game_folder");
      hadError.current = false;
      patch({ gameDir: path });
      appendLog(`Выбрана папка: ${path}`);
      await runModPipeline();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(msg);
      setStatus("Выбор папки отменён или ошибка");
    }
  }, [appendLog, patch, runModPipeline, setStatus]);

  const launchGame = useCallback(async () => {
    try {
      const running = await invoke<boolean>("is_game_running");
      if (running) {
        patch({ gameRunning: true, status: "Игра запущена" });
        return;
      }
      setStatus("Запуск игры…");
      const result = await invoke<string>("launch_game");
      appendLog(result);
      patch({ gameRunning: true, status: "Игра запущена" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Запуск не удался: ${msg}`);
      setStatus("Ошибка запуска");
    }
  }, [appendLog, patch, setStatus]);

  const installMissingMods = useCallback(async () => {
    await runInstallPipeline();
  }, [runInstallPipeline]);

  const removeMod = useCallback(
    async (modName: string) => {
      if (!state.gameDir || state.isChecking || state.isDownloading) return;

      patch({ isChecking: true, status: `Удаление «${modName}»…` });

      try {
        await invoke<ModCheckResult>("remove_mod", { modName });
        const loaded = await invoke<ManifestLoadResult>("get_manifest");
        const check = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
        hadError.current = !check.ok;
        patch({
          manifest: loaded.entries,
          manifestSource: loaded.source,
          modCheck: check,
          isChecking: false,
          isReady: check.ok,
          progress: check.ok ? 100 : 0,
          status: check.ok
            ? "Готово к запуску"
            : (check.pending_install ?? 0) > 0
              ? `Нужно обновить ${check.pending_install} мод(ов)`
              : "Проверьте моды",
        });
        appendLog(`Мод «${modName}» удалён`);
      } catch (e) {
        hadError.current = true;
        const msg = e instanceof Error ? e.message : String(e);
        appendLog(`Не удалось удалить мод: ${msg}`);
        patch({ isChecking: false, status: "Ошибка удаления мода" });
      }
    },
    [appendLog, patch, state.gameDir, state.isChecking, state.isDownloading],
  );

  const reinstallAllMods = useCallback(async () => {
    if (!state.gameDir || state.isDownloading) return;

    hadError.current = false;
    patch({
      isChecking: false,
      isDownloading: true,
      downloadPaused: false,
      isReady: false,
      downloadProgress: null,
      status: "Переустановка всех модов…",
    });
    appendLog(`Полная переустановка ${state.manifest.length} мод(ов)…`);

    try {
      await invoke<string>("reinstall_all_mods");

      const after = await reloadManifestAndCheck();
      patch({
        isDownloading: false,
        downloadPaused: false,
        isReady: after?.ok ?? false,
        progress: 100,
        downloadProgress: null,
        status: after?.ok ? "Готово к запуску" : "Ошибка после переустановки",
      });
      if (after?.ok) {
        appendLog("Все моды переустановлены.");
      } else {
        hadError.current = true;
        appendLog("После переустановки остались проблемы — см. список модов");
      }
    } catch (e) {
      const cancelled = isDownloadCancelled(e);
      if (!cancelled) hadError.current = true;
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(cancelled ? msg : `Ошибка переустановки: ${msg}`);
      let afterCheck: ModCheckResult | null = null;
      if (cancelled) {
        try {
          afterCheck = normalizeModCheck(await invoke<ModCheckResult>("check_mods"));
        } catch {
          /* ignore */
        }
      }
      patch({
        modCheck: afterCheck ?? state.modCheck,
        isDownloading: false,
        downloadPaused: false,
        isReady: afterCheck?.ok ?? false,
        downloadProgress: null,
        status: cancelled ? "Загрузка отменена" : "Ошибка переустановки",
      });
    }
  }, [appendLog, patch, reloadManifestAndCheck, state.gameDir, state.isDownloading, state.manifest.length, state.modCheck]);

  const pauseDownload = useCallback(async () => {
    if (!state.isDownloading || state.downloadPaused) return;
    try {
      await invoke("pause_download");
      patch({ downloadPaused: true, status: "Загрузка на паузе" });
      appendLog("Загрузка приостановлена");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, patch, state.downloadPaused, state.isDownloading]);

  const resumeDownload = useCallback(async () => {
    if (!state.isDownloading || !state.downloadPaused) return;
    try {
      await invoke("resume_download");
      patch({ downloadPaused: false, status: "Загрузка и установка модов…" });
      appendLog("Загрузка продолжена");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, patch, state.downloadPaused, state.isDownloading]);

  const cancelDownload = useCallback(async () => {
    if (!state.isDownloading) return;
    try {
      await invoke("cancel_download");
      patch({ downloadPaused: false });
      appendLog("Отмена загрузки…");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, patch, state.isDownloading]);

  const retryMods = useCallback(async () => {
    const check = await runModCheckOnly();
    if (check && !check.ok) {
      await runInstallPipeline();
    }
  }, [runInstallPipeline, runModCheckOnly]);

  const openModsFolder = useCallback(async () => {
    try {
      await invoke("open_mods_folder");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog]);

  const refreshModsCheck = useCallback(() => {
    if (!state.gameDir || state.isChecking || state.isDownloading) return;
    patch({ isChecking: true, status: "Обновление манифеста и проверка…" });
    void (async () => {
      try {
        const loaded = await invoke<ManifestLoadResult>("get_manifest");
        patch({
          manifest: loaded.entries,
          manifestSource: loaded.source,
        });
        const check = await runCheckOnly();
        patch({
          isChecking: false,
          isReady: check?.ok ?? false,
          status: check?.ok
            ? "Готово к запуску"
            : (check?.pending_install ?? 0) > 0
              ? `Нужно обновить ${check?.pending_install} мод(ов)`
              : "Нужно обновить моды",
        });
        if (check && !check.ok) hadError.current = true;
      } catch (e) {
        hadError.current = true;
        appendLog(e instanceof Error ? e.message : String(e));
        patch({ isChecking: false, status: "Ошибка проверки" });
      }
    })();
  }, [
    appendLog,
    patch,
    runCheckOnly,
    state.gameDir,
    state.isChecking,
    state.isDownloading,
  ]);

  const openGameFolder = useCallback(async () => {
    if (!state.gameDir) return;
    try {
      await invoke("reveal_path", { path: state.gameDir });
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, state.gameDir]);

  const openConfigFolder = useCallback(async () => {
    if (!state.configPath) return;
    try {
      const dir = state.configPath.replace(/[/\\][^/\\]+$/, "");
      await invoke("reveal_path", { path: dir || state.configPath });
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, state.configPath]);

  const clearLogs = useCallback(() => {
    patch({ logs: [] });
  }, [patch]);

  const savePassword = useCallback(
    async (password: string) => {
      const config = await invoke<LauncherConfig>("save_server_password", { password });
      patch({ config });
      appendLog("Пароль обновлён");
    },
    [appendLog, patch],
  );

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const running = await invoke<boolean>("is_game_running");
        if (cancelled) return;
        setState((s) => {
          if (s.gameRunning === running) return s;
          const status =
            running && s.isReady
              ? "Игра запущена"
              : !running && s.status === "Игра запущена" && s.isReady
                ? "Готово к запуску"
                : s.status;
          return { ...s, gameRunning: running, status };
        });
      } catch {
        /* ignore */
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    void (async () => {
      unsubs.push(
        await listen<number>("progress", (event) => {
          patch({ progress: event.payload });
        }),
      );
      unsubs.push(
        await listen<DownloadProgressPayload>("download-progress", (event) => {
          patch({
            progress: event.payload.percent,
            downloadProgress: mapDownloadProgress(event.payload),
          });
        }),
      );
      unsubs.push(
        await listen<string>("log", (event) => {
          appendLog(event.payload);
        }),
      );
    })();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [appendLog, patch]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    void (async () => {
      try {
        const [configPath, config, manifestLoaded] = await Promise.all([
          invoke<string>("get_config_path"),
          invoke<LauncherConfig>("get_config"),
          invoke<ManifestLoadResult>("get_manifest"),
        ]);

        patch({
          gameDir: config.game_dir,
          configPath,
          config,
          manifest: manifestLoaded.entries,
          manifestSource: manifestLoaded.source,
          phase: config.game_dir ? "checking" : "no-folder",
        });

        appendLog(`Конфиг: ${configPath}`);
        appendLog(`Манифест: ${manifestLoaded.source} (${manifestLoaded.entries.length} модов)`);

        void checkAppUpdate(appendLog);

        if (!config.game_dir) {
          setStatus("Выберите папку с 7DaysToDie.exe");
          appendLog("Первый запуск — укажите папку с игрой на главной вкладке");
          return;
        }

        appendLog(`Папка игры: ${config.game_dir}`);
        await runModPipeline();
      } catch (e) {
        hadError.current = true;
        const msg = e instanceof Error ? e.message : String(e);
        appendLog(`Ошибка инициализации: ${msg}`);
        patch({ status: "Ошибка инициализации", phase: "error" });
      }
    })();
  }, [appendLog, patch, runModPipeline, selectFolder, setStatus]);

  const saveAutoSteamConnect = useCallback(
    async (enabled: boolean) => {
      const config = await invoke<LauncherConfig>("save_auto_steam_connect", { enabled });
      patch({ config });
    },
    [patch],
  );

  const exportLogs = useCallback(async () => {
    const text = state.logs.join("\n");
    if (!text.trim()) {
      appendLog("Журнал пуст — нечего сохранять");
      return;
    }
    try {
      const path = await invoke<string | null>("export_logs", { content: text });
      if (path) appendLog(`Журнал сохранён: ${path}`);
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e));
    }
  }, [appendLog, state.logs]);

  return {
    state,
    selectFolder,
    launchGame,
    retryMods,
    installMissingMods,
    removeMod,
    reinstallAllMods,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    refreshModsCheck,
    openGameFolder,
    openModsFolder,
    openConfigFolder,
    savePassword,
    saveAutoSteamConnect,
    exportLogs,
    clearLogs,
    checkAppUpdate: () => checkAppUpdate(appendLog),
  };
}
