import type { DownloadProgress } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../utils/format";
import { DownloadControls } from "./DownloadControls";

interface ProgressBarProps {
  progress: DownloadProgress | null;
  visible: boolean;
  checking?: boolean;
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function ProgressBar({
  progress,
  visible,
  checking,
  paused = false,
  onPause,
  onResume,
  onCancel,
}: ProgressBarProps) {
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
      ? `Мод ${Math.min(progress.modIndex + 1, progress.modTotal)} из ${progress.modTotal}`
      : "";

  const showControls = onPause && onResume && onCancel;

  return (
    <div className="panel shrink-0 space-y-2 px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {paused ? "Пауза" : "Загрузка"}
            {modStep && <span className="font-normal text-gray-500"> · {modStep}</span>}
          </p>
          <p className="truncate text-xs text-gray-500">{progress.modName}</p>
        </div>
        <span className="shrink-0 text-2xl font-bold tabular-nums leading-none text-brand">
          {clamped.toFixed(0)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-void">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-dim to-brand transition-all duration-200 ${
            paused ? "opacity-60" : ""
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500">
        <span>
          {hasTotal
            ? `${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}`
            : formatBytes(progress.downloadedBytes)}
        </span>
        <span className="text-center">{paused ? "—" : formatSpeed(progress.speedBps)}</span>
        <span className="text-right">{paused ? "пауза" : formatEta(progress.etaSeconds)}</span>
      </div>

      {showControls && (
        <DownloadControls
          paused={paused}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
