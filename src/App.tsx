import { useEffect, useRef, useState } from "react";
import { AppFooter } from "./components/AppFooter";
import { CustomTitlebar, type AppView } from "./components/CustomTitlebar";
import { MainView } from "./components/MainView";
import { ModsView } from "./components/ModsView";
import { SettingsView } from "./components/SettingsView";
import { useLauncher } from "./hooks/useLauncher";
import { modStatuses } from "./utils/mods";

export default function App() {
  const [view, setView] = useState<AppView>("main");
  const autoModsNavDone = useRef(false);
  const {
    state,
    selectFolder,
    launchGame,
    retryMods,
    installMissingMods,
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

  const missingModsCount = modStatuses(state.manifest, state.modCheck).filter(
    (i) => i.status === "missing",
  ).length;

  const needsModsInstall =
    state.gameDir !== null && !state.isReady && !busy && state.modCheck && !state.modCheck.ok;

  useEffect(() => {
    if (autoModsNavDone.current || busy || !needsModsInstall) return;
    if (state.phase === "error" || (state.modCheck && !state.modCheck.ok)) {
      autoModsNavDone.current = true;
      setView("mods");
    }
  }, [busy, needsModsInstall, state.modCheck, state.phase]);

  const showFooter = view === "main" || view === "mods";
  const footerMode = view === "mods" ? "mods" : "main";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CustomTitlebar
        view={view}
        onViewChange={setView}
        modsBadge={missingModsCount > 0 ? missingModsCount : undefined}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "main" && (
          <MainView
            phase={state.phase}
            status={state.status}
            hasFolder={state.gameDir !== null}
            isReady={state.isReady}
            config={state.config}
            modCheck={state.modCheck}
            busy={busy}
            showProgress={showProgress || showCheckingBar}
            showCheckingBar={showCheckingBar}
            downloadProgress={state.downloadProgress}
            logs={state.logs}
            onClearLogs={clearLogs}
            onGoToMods={() => setView("mods")}
            onSelectFolder={() => void selectFolder()}
          />
        )}

        {view === "mods" && (
          <ModsView
            manifest={state.manifest}
            manifestSource={state.manifestSource}
            modCheck={state.modCheck}
            busy={busy}
            showProgress={showProgress || showCheckingBar}
            showCheckingBar={showCheckingBar}
            downloadProgress={state.downloadProgress}
            onRefresh={refreshModsCheck}
          />
        )}

        {view === "settings" && (
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

      {showFooter && (
        <AppFooter
          mode={footerMode}
          disabled={!state.isReady}
          loading={busy}
          loadingLabel={state.isDownloading ? "Загрузка…" : "Проверка…"}
          showRetry={!state.isReady && !busy && state.gameDir !== null}
          showInstall={Boolean(needsModsInstall)}
          onPlay={() => void launchGame()}
          onRetry={retryMods}
          onInstall={() => void installMissingMods()}
        />
      )}
    </div>
  );
}
