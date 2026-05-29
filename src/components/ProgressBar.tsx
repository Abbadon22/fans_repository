import type { DownloadProgress } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../utils/format";

interface ProgressBarProps {
  progress: DownloadProgress | null;
  visible: boolean;
}

/** Полоса прогресса загрузки модов со скоростью и ETA. */
export function ProgressBar({ progress, visible }: ProgressBarProps) {
  if (!visible || !progress) return null;

  const clamped = Math.min(100, Math.max(0, progress.percent));
  const hasTotal = progress.totalBytes > 0;

  return (
    <div className="w-full space-y-2 rounded-lg border border-surface-border bg-surface-elevated/60 p-3">
      <div className="flex items-start justify-between gap-2 text-xs">
        <div className="min-w-0">
          <p className="font-medium text-gray-200">Загрузка модов</p>
          <p className="truncate text-gray-500" title={progress.modName}>
            {progress.modName} ({progress.modIndex + 1}/{progress.modTotal})
          </p>
        </div>
        <span className="shrink-0 font-semibold text-accent">{clamped.toFixed(0)}%</span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-border"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-200 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400">
        <div>
          <p className="text-gray-600">Скачано</p>
          <p className="text-gray-300">
            {hasTotal
              ? `${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}`
              : formatBytes(progress.downloadedBytes)}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Скорость</p>
          <p className="text-gray-300">{formatSpeed(progress.speedBps)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Осталось</p>
          <p className="text-gray-300">{formatEta(progress.etaSeconds)}</p>
        </div>
      </div>
    </div>
  );
}
