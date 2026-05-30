import { useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { ProgressBar } from "./ProgressBar";
import { ServerCard } from "./ServerCard";
import { StatusLog } from "./StatusLog";
import type { LauncherConfig } from "../types";
import type { DownloadProgress } from "../types";

interface MainViewProps {
  status: string;
  hasFolder: boolean;
  isReady: boolean;
  gameRunning: boolean;
  config: LauncherConfig | null;
  pendingInstall: number;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  logs: string[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  onGoToMods: () => void;
  onSelectFolder: () => void;
  onRecheckMods?: () => void;
}

export function MainView({
  status,
  hasFolder,
  isReady,
  gameRunning,
  config,
  pendingInstall,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  logs,
  onClearLogs,
  onExportLogs,
  onGoToMods,
  onSelectFolder,
  onRecheckMods,
}: MainViewProps) {
  const [logOpen, setLogOpen] = useState(false);

  const needsFolder = !hasFolder && !busy;
  const needsMods = hasFolder && !isReady && !busy && pendingInstall > 0;

  let headline = "Готово к запуску";
  let hint = "Нажмите «Играть» в боковой панели — Steam подключит к серверу.";
  let tone: "ready" | "warn" | "info" = "ready";

  if (gameRunning) {
    headline = "Игра запущена";
    hint = "Закройте 7 Days to Die, чтобы снова запустить из лаунчера.";
    tone = "info";
  } else if (needsFolder) {
    headline = "Выберите папку игры";
    hint = "Укажите каталог Steam, где лежит 7DaysToDie.exe.";
    tone = "warn";
  } else if (busy) {
    headline = status;
    hint = "Дождитесь окончания операции.";
    tone = "info";
  } else if (needsMods) {
    headline = `Нужно установить ${pendingInstall} мод(ов)`;
    hint = "Откройте раздел «Моды» и нажмите «Установить».";
    tone = "warn";
  } else if (!isReady) {
    headline = status;
    hint = "Проверьте раздел «Моды» или запустите проверку снова.";
    tone = "warn";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ContentHeader title="Игра" subtitle={gameRunning ? "Сессия активна" : undefined} />

      <div className="scroll-area flex min-h-0 flex-1 flex-col gap-5 px-8 py-6">
        <section className={`hero-card hero-card--${tone}`}>
          <h2 className="text-lg font-semibold text-white">{headline}</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-400">{hint}</p>
          {needsFolder && (
            <button type="button" className="btn-soft mt-4" onClick={onSelectFolder}>
              Выбрать папку…
            </button>
          )}
          {needsMods && (
            <button type="button" className="btn-soft mt-4 border-brand/30 text-brand" onClick={onGoToMods}>
              Перейти к модам
            </button>
          )}
          {!needsFolder && !needsMods && !isReady && !busy && onRecheckMods && (
            <button type="button" className="btn-soft mt-4" onClick={onRecheckMods}>
              Проверить моды
            </button>
          )}
        </section>

        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        {config && hasFolder && (
          <ServerCard config={config} compact />
        )}

        <section className="panel overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-400 transition hover:bg-white/[0.02] hover:text-gray-200"
            onClick={() => setLogOpen((v) => !v)}
          >
            <span>Журнал событий</span>
            <span className="text-xs text-gray-600">{logOpen ? "Скрыть" : "Показать"}</span>
          </button>
          {logOpen && (
            <div className="border-t border-line">
              <StatusLog
                logs={logs}
                onClear={onClearLogs}
                onExport={onExportLogs}
                embedded
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
