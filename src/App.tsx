import { useState } from "react";
import { AppFooter } from "./components/AppFooter";
import { CustomTitlebar, type AppView } from "./components/CustomTitlebar";
import { MainView } from "./components/MainView";
import { SettingsView } from "./components/SettingsView";
import { useLauncher } from "./hooks/useLauncher";

export default function App() {
  const [view, setView] = useState<AppView>("main");
  const {
    state,
    selectFolder,
    launchGame,
    retryMods,
    refreshModsCheck,
    openGameFolder,
    openConfigFolder,
    savePassword,
    clearLogs,
    checkAppUpdate,
  } = useLauncher();

  const busy = state.isChecking || state.isDownloading;
  const showProgress =
    state.isDownloading || (busy && (state.progress > 0 || state.downloadProgress != null));
  const showCheckingBar = state.isChecking && !state.downloadProgress;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CustomTitlebar view={view} onViewChange={setView} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "main" ? (
          <>
            <MainView
              phase={state.phase}
              status={state.status}
              hasFolder={state.gameDir !== null}
              isReady={state.isReady}
              config={state.config}
              manifest={state.manifest}
              manifestSource={state.manifestSource}
              modCheck={state.modCheck}
              busy={busy}
              showProgress={showProgress || showCheckingBar}
              showCheckingBar={showCheckingBar}
              downloadProgress={state.downloadProgress}
              logs={state.logs}
              onRefreshMods={refreshModsCheck}
              onClearLogs={clearLogs}
            />
            <AppFooter
              disabled={!state.isReady}
              loading={busy}
              loadingLabel={state.isDownloading ? "Загрузка…" : "Проверка…"}
              showRetry={!state.isReady && !busy && state.gameDir !== null}
              onPlay={() => void launchGame()}
              onRetry={retryMods}
            />
          </>
        ) : (
          <SettingsView
            config={state.config}
            configPath={state.configPath}
            gameDir={state.gameDir}
            busy={busy}
            onSelectFolder={() => void selectFolder()}
            onOpenGameFolder={() => void openGameFolder()}
            onOpenConfigFolder={() => void openConfigFolder()}
            onSavePassword={savePassword}
            onCheckAppUpdate={() => void checkAppUpdate()}
          />
        )}
      </div>
    </div>
  );
}
