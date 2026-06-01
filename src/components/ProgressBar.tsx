import type { DownloadProgress } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../utils/format";

interface ProgressBarProps {
  progress: DownloadProgress | null;
  visible: boolean;
  checking?: boolean;
}

export function ProgressBar({ progress, visible, checking }: ProgressBarProps) {
  if (!visible) return null;

  if (checking && !progress) {
    return (
      <div className="panel shrink-0 px-3 py-2">
        <p className="mb-1 text-[10px] font-medium text-gray-400">Проверка модов…</p>
        <div className="h-1 overflow-hidden rounded-full bg-void">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand" />
        </div>
      </div>
    );
  }

  if (!progress) return null;

  const clamped = Math.min(100, Math.max(0, progress.percent));
  const hasTotal = progress.totalBytes > 0;
  const modStep =
    progress.modTotal > 0
      ? ` · мод ${Math.min(progress.modIndex + 1, progress.modTotal)}/${progress.modTotal}`
      : "";

  return (
    <div className="panel shrink-0 space-y-1.5 px-3 py-2">
      <div className="flex justify-between gap-2 text-xs">
        <div className="min-w-0">
          <p className="font-medium text-white">Загрузка{modStep}</p>
          <p className="truncate text-gray-500">{progress.modName}</p>
        </div>
        <span className="text-xl font-bold tabular-nums text-brand">{clamped.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-void">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-dim to-brand transition-all duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500">
        <span>
          {hasTotal
            ? `${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}`
            : formatBytes(progress.downloadedBytes)}
        </span>
        <span className="text-center">{formatSpeed(progress.speedBps)}</span>
        <span className="text-right">{formatEta(progress.etaSeconds)}</span>
      </div>
    </div>
  );
}
