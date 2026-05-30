import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
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
    installMissingMods,
    refreshModsCheck,
    openGameFolder,
    savePassword,
    saveAutoSteamConnect,
    exportLogs,
    clearLogs,
    checkAppUpdate,
  } = useLauncher();

  const busy = state.isChecking || state.isDownloading;
  const showProgress =
    state.isDownloading || (busy && (state.progress > 0 || state.downloadProgress != null));
  const showCheckingBar = state.isChecking && !state.downloadProgress;

  const modItems = modStatuses(state.manifest, state.modCheck);
  const missingModsCount = modItems.filter((i) => i.status === "missing").length;
  const okModsCount = modItems.filter((i) => i.status === "ok").length;
  const pendingInstall = state.modCheck?.pending_install ?? 0;

  const needsModsInstall =
    state.gameDir !== null && !state.isReady && !busy && pendingInstall > 0;

  useEffect(() => {
    if (autoModsNavDone.current || busy || !needsModsInstall) return;
    autoModsNavDone.current = true;
    setView("mods");
  }, [busy, needsModsInstall]);

  const playDisabled =
    !state.isReady || busy || state.gameRunning;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CustomTitlebar />

      <div className="flex min-h-0 flex-1">
        <AppSidebar
          view={view}
          onViewChange={setView}
          modsBadge={missingModsCount > 0 ? missingModsCount : undefined}
          status={state.status}
          isReady={state.isReady}
          gameRunning={state.gameRunning}
          busy={busy}
          modsOk={okModsCount}
          modsTotal={state.manifest.length}
          onPlay={() => void launchGame()}
          playDisabled={playDisabled}
        />

        <main className="content-shell flex min-h-0 min-w-0 flex-1 flex-col bg-void/30">
          {view === "main" && (
            <MainView
              status={state.status}
              hasFolder={state.gameDir !== null}
              isReady={state.isReady}
              gameRunning={state.gameRunning}
              config={state.config}
              pendingInstall={pendingInstall}
              busy={busy}
              showProgress={showProgress || showCheckingBar}
              showCheckingBar={showCheckingBar}
              downloadProgress={state.downloadProgress}
              logs={state.logs}
              onClearLogs={clearLogs}
              onExportLogs={() => void exportLogs()}
              onGoToMods={() => setView("mods")}
              onSelectFolder={() => void selectFolder()}
              onRecheckMods={refreshModsCheck}
            />
          )}

          {view === "mods" && (
            <ModsView
              manifest={state.manifest}
              modCheck={state.modCheck}
              busy={busy}
              showProgress={showProgress || showCheckingBar}
              showCheckingBar={showCheckingBar}
              downloadProgress={state.downloadProgress}
              pendingInstall={pendingInstall}
              onRefresh={refreshModsCheck}
              onInstall={() => void installMissingMods()}
            />
          )}

          {view === "settings" && (
            <SettingsView
              config={state.config}
              gameDir={state.gameDir}
              busy={busy}
              onSelectFolder={() => void selectFolder()}
              onOpenGameFolder={() => void openGameFolder()}
              onSavePassword={savePassword}
              onSaveAutoSteamConnect={saveAutoSteamConnect}
              onCheckAppUpdate={() => void checkAppUpdate()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
