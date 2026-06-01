import { PlayButton } from "./PlayButton";

interface MainPlayBarProps {
  disabled: boolean;
  playBlockHint?: string;
  loading: boolean;
  gameRunning: boolean;
  isReady: boolean;
  loadingLabel: string;
  showRetry: boolean;
  showInstall: boolean;
  installLabel: string;
  onPlay: () => void;
  onRetry: () => void;
  onInstall: () => void;
}

export function MainPlayBar({
  disabled,
  playBlockHint,
  loading,
  gameRunning,
  isReady,
  loadingLabel,
  showRetry,
  showInstall,
  installLabel,
  onPlay,
  onRetry,
  onInstall,
}: MainPlayBarProps) {
  return (
    <div className={playBlockHint ? "space-y-2" : ""}>
      <div className="flex items-stretch gap-2">
        {showInstall && (
          <button
            type="button"
            className="btn-soft shrink-0 rounded-xl border-brand/40 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand"
            disabled={loading}
            onClick={onInstall}
          >
            {loading && loadingLabel.includes("Загрузка") ? loadingLabel : installLabel}
          </button>
        )}

        <PlayButton
          className="min-w-0 flex-1"
          disabled={disabled}
          disabledHint={playBlockHint}
          loading={loading}
          gameRunning={gameRunning}
          loadingLabel={loadingLabel}
          ready={isReady}
          onPlay={onPlay}
          onRetry={onRetry}
          showRetry={showRetry}
        />
      </div>

      {playBlockHint && (
        <p className="text-center text-[11px] text-gray-500">{playBlockHint}</p>
      )}
    </div>
  );
}
