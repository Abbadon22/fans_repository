import { AlertBanner } from "./AlertBanner";
import { AppHeader } from "./AppHeader";
import { ProgressBar } from "./ProgressBar";
import { ServerCard } from "./ServerCard";
import { StatusLog } from "./StatusLog";
import type { LauncherConfig, LauncherPhase, ModCheckResult } from "../types";
import type { DownloadProgress } from "../types";

interface MainViewProps {
  phase: LauncherPhase;
  status: string;
  hasFolder: boolean;
  isReady: boolean;
  config: LauncherConfig | null;
  modCheck: ModCheckResult | null;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  logs: string[];
  onClearLogs: () => void;
  onGoToMods: () => void;
  onSelectFolder: () => void;
}

export function MainView({
  phase,
  status,
  hasFolder,
  isReady,
  config,
  modCheck,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  logs,
  onClearLogs,
  onGoToMods,
  onSelectFolder,
}: MainViewProps) {
  const needsMods =
    hasFolder && !isReady && !busy && modCheck && !modCheck.ok;
  const needsFolder = !hasFolder && !busy;

  return (
    <>
      <AppHeader phase={phase} status={status} hasFolder={hasFolder} isReady={isReady} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-4 pt-1">
        {needsFolder && (
          <AlertBanner
            variant="info"
            title="Папка игры не выбрана"
            message="Укажите каталог с 7DaysToDie.exe"
            actionLabel="Выбрать папку"
            onAction={onSelectFolder}
          />
        )}

        {needsMods && (
          <AlertBanner
            variant="warn"
            title="Требуется обновление модов"
            message={`${modCheck.missing.length} проблем — откройте вкладку «Моды»`}
            actionLabel="К модам"
            onAction={onGoToMods}
          />
        )}

        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-4">
          {config ? (
            <ServerCard config={config} />
          ) : (
            <section className="panel flex items-center justify-center p-6 text-sm text-gray-500">
              Загрузка…
            </section>
          )}

          <StatusLog logs={logs} onClear={onClearLogs} />
        </div>
      </div>
    </>
  );
}
