import { ModsPanel } from "./ModsPanel";
import { ProgressBar } from "./ProgressBar";
import { ViewHeader } from "./ViewHeader";
import type { ModCheckResult, ModManifestEntry } from "../types";
import type { DownloadProgress } from "../types";
import { modStatuses } from "../utils/mods";

interface ModsViewProps {
  manifest: ModManifestEntry[];
  manifestSource: string | null;
  modCheck: ModCheckResult | null;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  pendingInstall: number;
  onRefresh: () => void;
}

export function ModsView({
  manifest,
  manifestSource,
  modCheck,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  pendingInstall,
  onRefresh,
}: ModsViewProps) {
  const items = modStatuses(manifest, modCheck);
  const okCount = items.filter((i) => i.status === "ok").length;
  const missingCount = items.filter((i) => i.status === "missing").length;

  const subtitle =
    manifestSource != null
      ? `${okCount}/${manifest.length} готово${missingCount > 0 ? ` · ${missingCount} нужно обновить` : ""}`
      : `${manifest.length} модов в манифесте`;

  return (
    <>
      <ViewHeader
        title="Модпак сервера"
        subtitle={subtitle}
        action={
          <button type="button" className="btn-soft" disabled={busy} onClick={onRefresh}>
            {busy ? "Проверка…" : "Обновить список"}
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        {manifestSource && (
          <p className="shrink-0 truncate text-xs text-gray-500" title={manifestSource}>
            Источник: {manifestSource}
          </p>
        )}

        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        <ModsPanel
          manifest={manifest}
          manifestSource={null}
          modCheck={modCheck}
          pendingInstall={pendingInstall}
          busy={busy}
          onRefresh={onRefresh}
          hideHeader
        />
      </div>
    </>
  );
}
