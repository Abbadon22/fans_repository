import { PlayButton } from "./PlayButton";

export type FooterMode = "main" | "mods";

interface AppFooterProps {
  mode: FooterMode;
  disabled: boolean;
  playBlockHint?: string;
  loading: boolean;
  gameRunning: boolean;
  loadingLabel: string;
  showInstall: boolean;
  installLabel?: string;
  onPlay: () => void;
  onInstall: () => void;
}

export function AppFooter({
  mode,
  disabled,
  playBlockHint,
  loading,
  gameRunning,
  loadingLabel,
  showInstall,
  installLabel = "⬇  Установить моды",
  onPlay,
  onInstall,
}: AppFooterProps) {
  return (
    <footer className="shrink-0 border-t border-line bg-panel/95 px-5 py-3">
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
            ready={!disabled && !loading && !gameRunning}
            onPlay={onPlay}
            showRetry={false}
          />
        </div>
      </div>
    </footer>
  );
}
