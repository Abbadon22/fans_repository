import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  DownloadProgress,
  LauncherConfig,
  LauncherState,
  ModCheckResult,
} from "../types";

/** Payload от Rust (snake_case). */
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

const initialState: LauncherState = {
  isChecking: false,
  isDownloading: false,
  progress: 0,
  downloadProgress: null,
  status: "Инициализация…",
  isReady: false,
  logs: [],
  gameDir: null,
  configPath: null,
};

export function useLauncher() {
  const [state, setState] = useState<LauncherState>(initialState);
  const bootstrapped = useRef(false);

  const appendLog = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString("ru-RU");
    setState((s) => ({
      ...s,
      logs: [...s.logs, `[${ts}] ${line}`].slice(-200),
    }));
  }, []);

  const setStatus = useCallback((status: string) => {
    setState((s) => ({ ...s, status }));
  }, []);

  /** Полный цикл: проверка → при необходимости загрузка модов. */
  const runModPipeline = useCallback(async () => {
    setState((s) => ({
      ...s,
      isChecking: true,
      isReady: false,
      progress: 0,
      downloadProgress: null,
      status: "Проверка модов…",
    }));

    try {
      const check = await invoke<ModCheckResult>("check_mods");

      if (check.ok) {
        appendLog("Моды актуальны.");
        setState((s) => ({
          ...s,
          isChecking: false,
          isDownloading: false,
          isReady: true,
          progress: 100,
          downloadProgress: null,
          status: "Готово к запуску",
        }));
        return;
      }

      appendLog(`Требуется обновление: ${check.missing.length} проблем(ы).`);
      setState((s) => ({
        ...s,
        isChecking: false,
        isDownloading: true,
        downloadProgress: null,
        status: "Загрузка и установка модов…",
      }));

      await invoke<string>("download_and_install_mods");

      setState((s) => ({
        ...s,
        isDownloading: false,
        isReady: true,
        progress: 100,
        downloadProgress: null,
        status: "Готово к запуску",
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Ошибка: ${msg}`);
      setState((s) => ({
        ...s,
        isChecking: false,
        isDownloading: false,
        isReady: false,
        downloadProgress: null,
        status: "Ошибка — см. лог",
      }));
    }
  }, [appendLog]);

  const selectFolder = useCallback(async () => {
    try {
      const path = await invoke<string>("select_game_folder");
      setState((s) => ({ ...s, gameDir: path }));
      appendLog(`Выбрана папка: ${path}`);
      await runModPipeline();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(msg);
      setStatus("Выбор папки отменён или ошибка");
    }
  }, [appendLog, runModPipeline, setStatus]);

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

  // Подписка на события прогресса и логов от Rust
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    void (async () => {
      unsubs.push(
        await listen<number>("progress", (event) => {
          setState((s) => ({ ...s, progress: event.payload }));
        }),
      );
      unsubs.push(
        await listen<DownloadProgressPayload>("download-progress", (event) => {
          setState((s) => ({
            ...s,
            progress: event.payload.percent,
            downloadProgress: mapDownloadProgress(event.payload),
          }));
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
  }, [appendLog]);

  // Первый запуск: загрузка конфига и автопроверка модов
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    void (async () => {
      try {
        const configPath = await invoke<string>("get_config_path");
        const config = await invoke<LauncherConfig>("get_config");

        setState((s) => ({
          ...s,
          gameDir: config.game_dir,
          configPath,
        }));

        appendLog(`Конфиг: ${configPath}`);

        if (!config.game_dir) {
          setStatus("Выберите папку с игрой");
          appendLog("Папка игры не задана — укажите каталог с 7DaysToDie.exe");
          return;
        }

        appendLog(`Папка игры: ${config.game_dir}`);
        await runModPipeline();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        appendLog(`Ошибка инициализации: ${msg}`);
        setStatus("Ошибка инициализации");
      }
    })();
  }, [appendLog, runModPipeline, setStatus]);

  return {
    state,
    selectFolder,
    launchGame,
    retryMods,
  };
}
