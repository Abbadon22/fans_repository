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
      const check = await invoke<ModCheckResult>("check_mods");
      patch({ modCheck: check });
      return check;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Проверка: ${msg}`);
      return null;
    }
  }, [appendLog, patch]);

  const runModPipeline = useCallback(async () => {
    hadError.current = false;
    patch({
      isChecking: true,
      isReady: false,
      progress: 0,
      downloadProgress: null,
      status: "Проверка модов…",
      modCheck: null,
    });

    try {
      const check = await invoke<ModCheckResult>("check_mods");
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
        return;
      }

      appendLog(`Требуется обновление: ${check.missing.length} проблем(ы).`);
      patch({
        isChecking: false,
        isDownloading: true,
        downloadProgress: null,
        status: "Загрузка и установка модов…",
      });

      await invoke<string>("download_and_install_mods");

      const after = await invoke<ModCheckResult>("check_mods");
      patch({
        modCheck: after,
        isDownloading: false,
        isReady: after.ok,
        progress: 100,
        downloadProgress: null,
        status: after.ok ? "Готово к запуску" : "Ошибка после установки",
      });
      if (!after.ok) hadError.current = true;
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
    }
  }, [appendLog, patch]);

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
      setStatus("Запуск игры…");
      const result = await invoke<string>("launch_game");
      appendLog(result);
      setStatus("Игра запущена");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Запуск не удался: ${msg}`);
      setStatus("Ошибка запуска");
    }
  }, [appendLog, setStatus]);

  const retryMods = useCallback(() => {
    void runModPipeline();
  }, [runModPipeline]);

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
          status: check?.ok ? "Готово к запуску" : "Нужно обновить моды",
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

        if (!config.game_dir) {
          setStatus("Выберите папку с 7DaysToDie.exe");
          appendLog("Первый запуск — откроется выбор папки с игрой");
          await new Promise((r) => setTimeout(r, 400));
          await selectFolder();
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

  return {
    state,
    selectFolder,
    launchGame,
    retryMods,
    refreshModsCheck,
    openGameFolder,
    openConfigFolder,
    savePassword,
    clearLogs,
  };
}
