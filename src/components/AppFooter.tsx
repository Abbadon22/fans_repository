import { PlayButton } from "./PlayButton";

export type FooterMode = "main" | "mods";

interface AppFooterProps {
  mode: FooterMode;
  disabled: boolean;
  loading: boolean;
  loadingLabel: string;
  showRetry: boolean;
  showInstall: boolean;
  onPlay: () => void;
  onRetry: () => void;
  onInstall: () => void;
}

export function AppFooter({
  mode,
  disabled,
  loading,
  loadingLabel,
  showRetry,
  showInstall,
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
              : "⬇  Установить / обновить моды"}
          </button>
        )}
        <div className="order-1 min-w-0 flex-1 sm:order-2">
          <PlayButton
            disabled={disabled}
            loading={loading}
            loadingLabel={loadingLabel}
            onPlay={onPlay}
            onRetry={mode === "main" ? onRetry : undefined}
            showRetry={mode === "main" && showRetry}
          />
        </div>
      </div>
      {mode === "main" && !disabled && !loading && (
        <p className="mt-2 text-center text-[10px] text-gray-600">
          После запуска подключитесь к серверу вручную в игре
        </p>
      )}
    </footer>
  );
}
