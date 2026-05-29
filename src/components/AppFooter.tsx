import { PlayButton } from "./PlayButton";

interface AppFooterProps {
  disabled: boolean;
  loading: boolean;
  loadingLabel: string;
  showRetry: boolean;
  onPlay: () => void;
  onRetry: () => void;
}

export function AppFooter({
  disabled,
  loading,
  loadingLabel,
  showRetry,
  onPlay,
  onRetry,
}: AppFooterProps) {
  return (
    <footer className="shrink-0 border-t border-line bg-panel/95 px-6 py-4 backdrop-blur-md">
      <PlayButton
        disabled={disabled}
        loading={loading}
        loadingLabel={loadingLabel}
        onPlay={onPlay}
        onRetry={onRetry}
        showRetry={showRetry}
      />
    </footer>
  );
}
