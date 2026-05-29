interface PlayButtonProps {
  disabled: boolean;
  loading: boolean;
  loadingLabel?: string;
  onPlay: () => void;
  onRetry?: () => void;
  showRetry: boolean;
}

export function PlayButton({
  disabled,
  loading,
  loadingLabel = "Подождите…",
  onPlay,
  onRetry,
  showRetry,
}: PlayButtonProps) {
  return (
    <div className="flex min-w-0 flex-1 gap-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={disabled || loading}
        className="btn-play flex-1"
      >
        {loading ? loadingLabel : "▶  Подключиться (Steam)"}
      </button>
      {showRetry && onRetry && (
        <button type="button" onClick={onRetry} disabled={loading} className="btn-soft px-5 py-3">
          Повторить
        </button>
      )}
    </div>
  );
}
