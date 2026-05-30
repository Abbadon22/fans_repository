import { AlertBanner } from "./AlertBanner";
import { MainHero } from "./MainHero";
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
  gameRunning: boolean;
  gameDir: string | null;
  manifestCount: number;
  manifestOkCount: number;
  config: LauncherConfig | null;
  modCheck: ModCheckResult | null;
  removedMods: string[];
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
}

export function MainView({
  phase,
  status,
  hasFolder,
  isReady,
  gameRunning,
  gameDir,
  manifestCount,
  manifestOkCount,
  config,
  modCheck,
  removedMods,
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
}: MainViewProps) {
  const okCount = modCheck?.ok ? manifestCount : manifestOkCount;
  const showRemovedBanner =
    hasFolder && removedMods.length > 0 && !busy && isReady && pendingInstall === 0;

  return (
    <div className="scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 px-5 py-5">
        <MainHero
          phase={phase}
          status={status}
          hasFolder={hasFolder}
          isReady={isReady}
          gameRunning={gameRunning}
          busy={busy}
          manifestCount={manifestCount}
          modOkCount={okCount}
          pendingInstall={pendingInstall}
          gameDir={gameDir}
          onSelectFolder={onSelectFolder}
          onGoToMods={onGoToMods}
        />

        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        {showRemovedBanner && (
          <AlertBanner
            variant="info"
            title="Очистка модпака"
            message={`Удалены папки вне списка сервера: ${removedMods.join(", ")}`}
          />
        )}

        <div className="grid min-h-[320px] flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:min-h-[360px]">
          <div className="flex min-h-[280px] flex-col lg:col-span-5 lg:min-h-0">
            {config ? (
              <ServerCard config={config} className="min-h-0 flex-1" />
            ) : (
              <section className="panel flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
                Загрузка настроек…
              </section>
            )}
          </div>

          <StatusLog
            logs={logs}
            onClear={onClearLogs}
            onExport={onExportLogs}
            className="min-h-[280px] lg:col-span-7 lg:min-h-0"
          />
        </div>
      </div>
    </div>
  );
}
