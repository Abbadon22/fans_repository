import { ContentHeader } from "./ContentHeader";
import { ModsPanel } from "./ModsPanel";
import { ProgressBar } from "./ProgressBar";
import type { ModCheckResult, ModManifestEntry } from "../types";
import type { DownloadProgress } from "../types";
import { modStatuses } from "../utils/mods";

interface ModsViewProps {
  manifest: ModManifestEntry[];
  modCheck: ModCheckResult | null;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  pendingInstall: number;
  onRefresh: () => void;
  onInstall: () => void;
}

export function ModsView({
  manifest,
  modCheck,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  pendingInstall,
  onRefresh,
  onInstall,
}: ModsViewProps) {
  const items = modStatuses(manifest, modCheck);
  const okCount = items.filter((i) => i.status === "ok").length;

  const subtitle =
    manifest.length > 0
      ? `${okCount} из ${manifest.length} установлено`
      : "Список загружается…";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ContentHeader
        title="Моды"
        subtitle={subtitle}
        actions={
          <>
            <button type="button" className="btn-soft" disabled={busy} onClick={onRefresh}>
              {busy ? "…" : "Проверить"}
            </button>
            {pendingInstall > 0 && (
              <button
                type="button"
                className="btn-accent"
                disabled={busy}
                onClick={onInstall}
              >
                Установить {pendingInstall}
              </button>
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 py-6">
        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}
        <ModsPanel manifest={manifest} modCheck={modCheck} busy={busy} />
      </div>
    </div>
  );
}
