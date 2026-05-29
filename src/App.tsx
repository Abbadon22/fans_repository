import { FolderSelector } from "./components/FolderSelector";
import { PlayButton } from "./components/PlayButton";
import { ProgressBar } from "./components/ProgressBar";
import { StatusLog } from "./components/StatusLog";
import { useLauncher } from "./hooks/useLauncher";

export default function App() {
  const { state, selectFolder, launchGame, retryMods } = useLauncher();

  const busy = state.isChecking || state.isDownloading;
  const showProgress =
    state.isDownloading || (busy && (state.progress > 0 || state.downloadProgress != null));

  return (
    <div className="flex min-h-screen flex-col p-6">
      <header className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Fans Launcher
        </h1>
        <p className="mt-1 text-sm text-gray-500">7 Days to Die — закрытая группа</p>
        <p className="mt-2 text-xs text-gray-600">{state.status}</p>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <ProgressBar progress={state.downloadProgress} visible={showProgress} />

        <FolderSelector
          gameDir={state.gameDir}
          disabled={busy}
          onSelect={() => void selectFolder()}
        />

        <PlayButton
          disabled={!state.isReady}
          loading={busy}
          onPlay={() => void launchGame()}
          onRetry={retryMods}
          showRetry={!state.isReady && !busy && state.gameDir !== null}
        />

        {state.configPath && (
          <p className="text-center text-[10px] text-gray-600" title={state.configPath}>
            config.json рядом с лаунчером
          </p>
        )}

        <StatusLog logs={state.logs} />
      </main>
    </div>
  );
}
