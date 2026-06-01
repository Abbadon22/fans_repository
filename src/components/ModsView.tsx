import { ModsPanel } from "./ModsPanel";
import { ProgressBar } from "./ProgressBar";
import { ViewHeader } from "./ViewHeader";
import type { ModCheckResult, ModManifestEntry } from "../types";
import type { DownloadProgress } from "../types";
import { useModal } from "../context/ModalContext";
import { countBySide } from "../utils/modSide";
import { clientInstallRows, modStatuses } from "../utils/mods";

interface ModsViewProps {
  manifest: ModManifestEntry[];
  manifestSource: string | null;
  modCheck: ModCheckResult | null;
  busy: boolean;
  showProgress: boolean;
  showCheckingBar: boolean;
  downloadProgress: DownloadProgress | null;
  downloadPaused: boolean;
  pendingInstall: number;
  onRefresh: () => void;
  onOpenModsFolder: () => void;
  onRemoveMod: (modName: string) => void;
  onReinstallAll: () => void;
  onPauseDownload: () => void;
  onResumeDownload: () => void;
  onCancelDownload: () => void;
}

export function ModsView({
  manifest,
  manifestSource,
  modCheck,
  busy,
  showProgress,
  showCheckingBar,
  downloadProgress,
  downloadPaused,
  pendingInstall,
  onRefresh,
  onOpenModsFolder,
  onRemoveMod,
  onReinstallAll,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
}: ModsViewProps) {
  const { confirm } = useModal();
  const items = modStatuses(manifest, modCheck);
  const clientItems = clientInstallRows(items);
  const okCount = clientItems.filter((i) => i.status === "ok").length;
  const missingCount = clientItems.filter((i) => i.status === "missing").length;
  const { clientInstall, server } = countBySide(manifest);

  const subtitle =
    manifestSource != null
      ? `${okCount}/${clientInstall} на клиенте${server > 0 ? ` · ${server} только сервер` : ""}${missingCount > 0 ? ` · ${missingCount} к загрузке` : ""}`
      : `${manifest.length} модов в манифесте`;

  return (
    <>
      <ViewHeader
        title="Модпак сервера"
        subtitle={subtitle}
        action={
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="btn-soft border-amber-500/30 text-amber-200/90"
              disabled={busy || clientInstall === 0}
              onClick={() => {
                void (async () => {
                  const ok = await confirm({
                    title: "Переустановить моды?",
                    message: `Удалить и скачать заново ${clientInstall} мод(ов) для вашего ПК.\n\n${server} server-only не затрагиваются.`,
                    confirmLabel: "Переустановить",
                    cancelLabel: "Отмена",
                    variant: "danger",
                  });
                  if (ok) onReinstallAll();
                })();
              }}
            >
              Переустановить все
            </button>
            <button type="button" className="btn-soft" disabled={busy} onClick={onRefresh}>
              {busy ? "Проверка…" : "Обновить"}
            </button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        {manifestSource && (
          <p className="shrink-0 truncate text-xs text-gray-500" title={manifestSource}>
            Источник: {manifestSource}
          </p>
        )}

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

        <ModsPanel
          manifest={manifest}
          manifestSource={null}
          modCheck={modCheck}
          pendingInstall={pendingInstall}
          busy={busy}
          onRefresh={onRefresh}
          onOpenModsFolder={onOpenModsFolder}
          onRemoveMod={onRemoveMod}
          onReinstallAll={onReinstallAll}
          hideHeader
        />
      </div>
    </>
  );
}
