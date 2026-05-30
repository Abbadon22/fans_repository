import { PlayButton } from "./PlayButton";

export type FooterMode = "main" | "mods";

interface AppFooterProps {
  mode: FooterMode;
  disabled: boolean;
  playBlockHint?: string;
  loading: boolean;
  gameRunning: boolean;
  loadingLabel: string;
  showRetry: boolean;
  showInstall: boolean;
  installLabel?: string;
  onPlay: () => void;
  onRetry: () => void;
  onInstall: () => void;
}

export function AppFooter({
  mode,
  disabled,
  playBlockHint,
  loading,
  gameRunning,
  loadingLabel,
  showRetry,
  showInstall,
  installLabel = "⬇  Установить моды",
  onPlay,
  onRetry,
  onInstall,
}: AppFooterProps) {
  return (
    <footer className="shrink-0 border-t border-line bg-gradient-to-t from-panel to-panel/80 px-6 py-4 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {mode === "mods" && showInstall && (
          <button
            type="button"
            className="btn-soft order-2 w-full py-3 sm:order-1 sm:w-auto sm:min-w-[200px]"
            disabled={loading}
            onClick={onInstall}
          >
            {loading && loadingLabel.includes("Загрузка")
              ? loadingLabel
              : installLabel}
          </button>
        )}
        <div className="order-1 min-w-0 flex-1 sm:order-2">
          <PlayButton
            disabled={disabled}
            disabledHint={playBlockHint}
            loading={loading}
            gameRunning={gameRunning}
            loadingLabel={loadingLabel}
            onPlay={onPlay}
            onRetry={mode === "main" ? onRetry : undefined}
            showRetry={mode === "main" && showRetry}
          />
        </div>
      </div>
      {mode === "main" && playBlockHint && !loading && (
        <p className="mt-2 text-center text-xs text-brand/80">{playBlockHint}</p>
      )}
      {mode === "main" && !disabled && !loading && !gameRunning && !playBlockHint && (
        <p className="mt-2 text-center text-xs text-gray-600">
          После запуска Steam подключит к серверу (можно отключить в настройках)
        </p>
      )}
    </footer>
  );
}
