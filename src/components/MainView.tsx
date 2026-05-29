import { AppHeader } from "./AppHeader";
import { ModsPanel } from "./ModsPanel";
import { ProgressBar } from "./ProgressBar";
import { ServerCard } from "./ServerCard";
import { StatusLog } from "./StatusLog";
import type { LauncherConfig, LauncherPhase, ModCheckResult, ModManifestEntry } from "../types";
import type { DownloadProgress } from "../types";

interface MainViewProps {
  phase: LauncherPhase;
  status: string;
  hasFolder: boolean;
  isReady: boolean;
  config: LauncherConfig | null;
  manifest: ModManifestEntry[];
  manifestSource: string | null;
  modCheck: ModCheckResult | null;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  logs: string[];
  onRefreshMods: () => void;
  onClearLogs: () => void;
}

export function MainView({
  phase,
  status,
  hasFolder,
  isReady,
  config,
  manifest,
  manifestSource,
  modCheck,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  logs,
  onRefreshMods,
  onClearLogs,
}: MainViewProps) {
  return (
    <>
      <AppHeader phase={phase} status={status} hasFolder={hasFolder} isReady={isReady} />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_min(300px,32%)] gap-4 px-6 py-4">
        <div className="flex min-h-0 flex-col gap-3">
          {config ? (
            <ServerCard config={config} />
          ) : (
            <section className="panel flex shrink-0 items-center justify-center p-6 text-sm text-gray-500">
              Загрузка…
            </section>
          )}

          {(showProgress || showCheckingBar) && (
            <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
          )}

          <ModsPanel
            manifest={manifest}
            manifestSource={manifestSource}
            modCheck={modCheck}
            busy={busy}
            onRefresh={onRefreshMods}
          />
        </div>

        <StatusLog logs={logs} onClear={onClearLogs} />
      </div>
    </>
  );
}
