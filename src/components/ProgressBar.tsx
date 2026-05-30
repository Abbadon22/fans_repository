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
      <div className="panel px-5 py-4">
        <p className="text-sm text-gray-400">Проверка модов…</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-void">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand/80" />
        </div>
      </div>
    );
  }

  if (!progress) return null;

  const clamped = Math.min(100, Math.max(0, progress.percent));
  const modStep =
    progress.modTotal > 0
      ? ` · ${Math.min(progress.modIndex + 1, progress.modTotal)}/${progress.modTotal}`
      : "";

  return (
    <div className="panel space-y-3 px-5 py-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-gray-300">
          {progress.modName}
          {modStep}
        </span>
        <span className="shrink-0 font-bold tabular-nums text-brand">{clamped.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-void">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-dim to-brand transition-all duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {progress.totalBytes > 0 && (
        <p className="text-[11px] text-gray-600">
          {formatBytes(progress.downloadedBytes)} / {formatBytes(progress.totalBytes)} ·{" "}
          {formatSpeed(progress.speedBps)} · {formatEta(progress.etaSeconds)}
        </p>
      )}
    </div>
  );
}
