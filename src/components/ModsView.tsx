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
  onRefresh,
}: ModsViewProps) {
  const items = modStatuses(manifest, modCheck);
  const okCount = items.filter((i) => i.status === "ok").length;

  return (
    <>
      <ViewHeader
        title="Модпак сервера"
        subtitle={
          manifestSource
            ? `${okCount}/${manifest.length} готово · ${manifestSource}`
            : `${manifest.length} модов в манифесте`
        }
        action={
          <button type="button" className="btn-soft" disabled={busy} onClick={onRefresh}>
            {busy ? "Проверка…" : "Обновить список"}
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        <ModsPanel
          manifest={manifest}
          manifestSource={null}
          modCheck={modCheck}
          busy={busy}
          onRefresh={onRefresh}
          hideHeader
        />
      </div>
    </>
  );
}
