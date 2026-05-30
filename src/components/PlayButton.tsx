interface PlayButtonProps {
  disabled: boolean;
  loading: boolean;
  gameRunning: boolean;
  loadingLabel?: string;
  onPlay: () => void;
  onRetry?: () => void;
  showRetry: boolean;
}

export function PlayButton({
  disabled,
  loading,
  gameRunning,
  loadingLabel = "Подождите…",
  onPlay,
  onRetry,
  showRetry,
}: PlayButtonProps) {
  const playDisabled = disabled || loading || gameRunning;

  return (
    <div className="flex min-w-0 flex-1 gap-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={playDisabled}
        className={gameRunning ? "btn-play-running flex-1" : "btn-play flex-1"}
      >
        {gameRunning ? "●  Игра запущена" : loading ? loadingLabel : "▶  Играть"}
      </button>
      {showRetry && onRetry && (
        <button type="button" onClick={onRetry} disabled={loading} className="btn-soft px-5 py-3">
          Повторить
        </button>
      )}
    </div>
  );
}
