interface PlayButtonProps {
  disabled: boolean;
  loading: boolean;
  onPlay: () => void;
  onRetry?: () => void;
  showRetry: boolean;
}

/** Кнопка запуска игры. */
export function PlayButton({
  disabled,
  loading,
  onPlay,
  onRetry,
  showRetry,
}: PlayButtonProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={disabled || loading}
        className="flex-1 rounded-lg bg-accent py-3 text-center text-sm font-semibold text-white shadow-lg shadow-accent-muted/30 transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-gray-700 disabled:shadow-none"
      >
        {loading ? "Подождите…" : "Играть"}
      </button>
      {showRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="rounded-lg border border-surface-border px-4 py-3 text-sm text-gray-300 transition hover:bg-surface-elevated disabled:opacity-50"
        >
          Повторить
        </button>
      )}
    </div>
  );
}
