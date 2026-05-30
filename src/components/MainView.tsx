import { AlertBanner } from "./AlertBanner";
import { AppHeader, type HeaderStat } from "./AppHeader";
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
  const needsMods = hasFolder && !isReady && !busy && modCheck && !modCheck.ok;
  const needsFolder = !hasFolder && !busy;

  const stats = [
    {
      label: "Игра",
      value: gameRunning
        ? "Запущена"
        : isReady
          ? "Готова"
          : busy
            ? "Подготовка…"
            : "Не готова",
      tone: gameRunning ? "active" : isReady ? "ok" : busy ? "neutral" : "warn",
      onClick: undefined,
    },
    {
      label: "Моды",
      value: manifestCount > 0 ? `${okCount} / ${manifestCount}` : "—",
      tone: modCheck?.ok ? "ok" : needsMods ? "warn" : "neutral",
      onClick: needsMods ? onGoToMods : undefined,
    },
    {
      label: "Папка",
      value: hasFolder ? "Выбрана" : "Не выбрана",
      tone: hasFolder ? "ok" : "warn",
      onClick: !hasFolder ? onSelectFolder : undefined,
    },
  ] satisfies readonly HeaderStat[];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader
        phase={phase}
        status={status}
        hasFolder={hasFolder}
        isReady={isReady}
        gameRunning={gameRunning}
        stats={stats}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
        {needsFolder && (
          <AlertBanner
            variant="info"
            title="Папка игры не выбрана"
            message="Укажите каталог с 7DaysToDie.exe"
            actionLabel="Выбрать папку"
            onAction={onSelectFolder}
          />
        )}

        {!needsFolder && needsMods && (
          <AlertBanner
            variant="warn"
            title="Требуется обновление модов"
            message={
              pendingInstall > 0
                ? `К загрузке: ${pendingInstall} мод(ов) — откройте вкладку «Моды» и нажмите «Установить»`
                : `${modCheck?.missing.length ?? 0} проблем — см. вкладку «Моды»`
            }
            actionLabel="К модам"
            onAction={onGoToMods}
          />
        )}

        {!needsFolder && removedMods.length > 0 && !busy && (
          <AlertBanner
            variant="info"
            title="Очистка модпака"
            message={`Удалены папки, которых нет в манифесте: ${removedMods.join(", ")}`}
          />
        )}

        {!needsFolder && !needsMods && gameRunning && (
          <AlertBanner
            variant="info"
            title="Игра запущена"
            message="Закройте 7 Days to Die, чтобы снова нажать «Играть» в лаунчере"
          />
        )}

        {(showProgress || showCheckingBar) && (
          <ProgressBar progress={downloadProgress} visible checking={showCheckingBar} />
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          {config ? (
            <ServerCard config={config} className="min-h-[280px] lg:min-h-0" />
          ) : (
            <section className="panel flex min-h-[200px] items-center justify-center p-6 text-sm text-gray-500">
              Загрузка…
            </section>
          )}
          <StatusLog logs={logs} onClear={onClearLogs} onExport={onExportLogs} className="min-h-[280px] lg:min-h-0" />
        </div>
      </div>
    </div>
  );
}
