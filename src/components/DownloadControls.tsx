interface DownloadControlsProps {
  paused: boolean;
  disabled?: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  className?: string;
}

export function DownloadControls({
  paused,
  disabled,
  onPause,
  onResume,
  onCancel,
  className = "",
}: DownloadControlsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {paused ? (
        <button
          type="button"
          className="btn-soft border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand"
          disabled={disabled}
          onClick={onResume}
        >
          Продолжить
        </button>
      ) : (
        <button
          type="button"
          className="btn-soft px-3 py-1.5 text-xs"
          disabled={disabled}
          onClick={onPause}
        >
          Пауза
        </button>
      )}
      <button
        type="button"
        className="btn-soft border-red-500/30 px-3 py-1.5 text-xs text-red-300/90 hover:border-red-500/50 hover:bg-red-500/10"
        disabled={disabled}
        onClick={onCancel}
      >
        Отмена
      </button>
    </div>
  );
}
