interface PlayButtonProps {
  disabled: boolean;
  disabledHint?: string;
  loading: boolean;
  gameRunning: boolean;
  loadingLabel?: string;
  ready?: boolean;
  onPlay: () => void;
  onRetry?: () => void;
  showRetry: boolean;
  className?: string;
}

export function PlayButton({
  disabled,
  disabledHint,
  loading,
  gameRunning,
  loadingLabel = "Подождите…",
  ready = false,
  onPlay,
  onRetry,
  showRetry,
  className = "",
}: PlayButtonProps) {
  const playDisabled = disabled || loading || gameRunning;

  let label = "Играть";
  if (gameRunning) label = "Игра запущена";
  else if (loading) label = loadingLabel;

  return (
    <div className={`flex min-w-0 items-stretch gap-2 ${className}`}>
      <button
        type="button"
        onClick={onPlay}
        disabled={playDisabled}
        title={playDisabled && disabledHint ? disabledHint : undefined}
        className={`play-btn relative flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-xl px-4 transition active:scale-[0.99] disabled:cursor-not-allowed ${
          gameRunning
            ? "play-btn-running"
            : ready && !playDisabled
              ? "play-btn-ready"
              : "play-btn-idle"
        }`}
      >
        <span className="play-btn-shine pointer-events-none absolute inset-0" aria-hidden />
        {loading ? (
          <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 text-white">
            {gameRunning ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
            ) : (
              <PlayIcon />
            )}
          </span>
        )}
        <span className="relative text-sm font-bold tracking-wide text-white">{label}</span>
      </button>

      {showRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="btn-soft shrink-0 rounded-xl px-4 py-2.5 text-sm"
        >
          Повторить
        </button>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 14 16" fill="currentColor" aria-hidden>
      <path d="M2 1.5v13l11-6.5L2 1.5z" />
    </svg>
  );
}
