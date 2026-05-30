import { AlertBanner } from "./AlertBanner";
import { MainHero } from "./MainHero";
import { ProgressBar } from "./ProgressBar";
import { ServerCard } from "./ServerCard";
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
  onGoToMods,
  onSelectFolder,
}: MainViewProps) {
  const okCount = modCheck?.ok ? manifestCount : manifestOkCount;
  const showRemovedBanner =
    hasFolder && removedMods.length > 0 && !busy && isReady && pendingInstall === 0;

  return (
    <div className="scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-5">
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

        {config ? (
          <ServerCard config={config} />
        ) : (
          <section className="panel flex min-h-[200px] items-center justify-center p-8 text-sm text-gray-500">
            Загрузка настроек…
          </section>
        )}
      </div>
    </div>
  );
}
