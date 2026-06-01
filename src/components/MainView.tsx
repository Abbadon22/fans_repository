import { AlertBanner } from "./AlertBanner";
import { MainHero } from "./MainHero";
import { MainPlayBar } from "./MainPlayBar";
import { MainQuickActions } from "./MainQuickActions";
import { ProgressBar } from "./ProgressBar";
import { ServerCard } from "./ServerCard";
import type { AppView } from "./CustomTitlebar";
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
  downloadPaused: boolean;
  playBlocked: boolean;
  playBlockHint?: string;
  showInstall: boolean;
  missingModsCount: number;
  onGoToMods: () => void;
  onNavigate: (view: AppView) => void;
  onSelectFolder: () => void;
  onPlay: () => void;
  onRetry: () => void;
  onInstall: () => void;
  onOpenGameFolder: () => void;
  onOpenModsFolder: () => void;
  onPauseDownload: () => void;
  onResumeDownload: () => void;
  onCancelDownload: () => void;
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
  downloadPaused,
  playBlocked,
  playBlockHint,
  showInstall,
  missingModsCount,
  onGoToMods,
  onNavigate,
  onSelectFolder,
  onPlay,
  onRetry,
  onInstall,
  onOpenGameFolder,
  onOpenModsFolder,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
}: MainViewProps) {
  const isDownloading = busy && !showCheckingBar && downloadProgress != null;
  const okCount = modCheck?.ok ? manifestCount : manifestOkCount;
  const showRemovedBanner =
    hasFolder && removedMods.length > 0 && !busy && isReady && pendingInstall === 0;

  const installLabel =
    pendingInstall > 0 ? `Установить ${pendingInstall}` : "Установить моды";

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <div className="grid min-h-0 grid-cols-1 gap-3 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
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
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            downloadPaused={downloadPaused}
            onSelectFolder={onSelectFolder}
            onGoToMods={onGoToMods}
            onPauseDownload={onPauseDownload}
            onResumeDownload={onResumeDownload}
            onCancelDownload={onCancelDownload}
          />

          {(showProgress || showCheckingBar) && (
            <ProgressBar
              progress={downloadProgress}
              visible
              checking={showCheckingBar}
              paused={downloadPaused}
              onPause={onPauseDownload}
              onResume={onResumeDownload}
              onCancel={onCancelDownload}
            />
          )}

          {showRemovedBanner && (
            <AlertBanner
              variant="info"
              title="Очистка"
              message={removedMods.join(", ")}
            />
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
          {config ? (
            <ServerCard config={config} className="min-h-0 flex-1" />
          ) : (
            <section className="panel flex flex-1 items-center justify-center text-xs text-gray-500">
              Загрузка…
            </section>
          )}
          <MainQuickActions
            onNavigate={onNavigate}
            onOpenGameFolder={onOpenGameFolder}
            onOpenModsFolder={onOpenModsFolder}
            hasFolder={hasFolder}
            modsBadge={missingModsCount > 0 ? missingModsCount : undefined}
          />
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <MainPlayBar
          disabled={playBlocked}
          playBlockHint={playBlockHint}
          loading={busy}
          gameRunning={gameRunning}
          isReady={isReady}
          loadingLabel={showCheckingBar && !downloadProgress ? "Проверка…" : "Загрузка…"}
          showRetry={!isReady && !busy && hasFolder}
          showInstall={showInstall}
          installLabel={installLabel}
          onPlay={onPlay}
          onRetry={onRetry}
          onInstall={onInstall}
        />
      </div>
    </div>
  );
}
