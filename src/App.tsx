import { useEffect, useRef, useState } from "react";
import { AppFooter } from "./components/AppFooter";
import { AppSidebar } from "./components/AppSidebar";
import { CustomTitlebar, type AppView } from "./components/CustomTitlebar";
import { MainView } from "./components/MainView";
import { ModsView } from "./components/ModsView";
import { LogView } from "./components/LogView";
import { SettingsView } from "./components/SettingsView";
import { useLauncher } from "./hooks/useLauncher";
import { clientInstallRows, modStatuses } from "./utils/mods";

export default function App() {
  const [view, setView] = useState<AppView>("main");
  const autoModsNavDone = useRef(false);
  const {
    state,
    selectFolder,
    launchGame,
    retryMods,
    installMissingMods,
    removeMod,
    reinstallAllMods,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    refreshModsCheck,
    openGameFolder,
    openModsFolder,
    openConfigFolder,
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

  const modRows = modStatuses(state.manifest, state.modCheck);
  const missingModsCount = clientInstallRows(modRows).filter(
    (i) => i.status === "missing",
  ).length;
  const okModsCount = clientInstallRows(modRows).filter((i) => i.status === "ok").length;

  const pendingInstall = state.modCheck?.pending_install ?? 0;

  const needsModsInstall =
    state.gameDir !== null && !state.isReady && !busy && pendingInstall > 0;

  useEffect(() => {
    if (autoModsNavDone.current || busy || !needsModsInstall) return;
    if (state.phase === "error" || (state.modCheck && !state.modCheck.ok)) {
      autoModsNavDone.current = true;
      setView("mods");
    }
  }, [busy, needsModsInstall, state.modCheck, state.phase]);

  const showFooter = view === "mods";
  const footerMode = view === "mods" ? "mods" : "main";

  const playBlocked = !state.isReady || pendingInstall > 0;
  const playBlockHint =
    pendingInstall > 0
      ? `Сначала установите ${pendingInstall} мод(ов) на вкладке «Моды»`
      : !state.gameDir
        ? "Выберите папку с игрой"
        : !state.isReady
          ? "Дождитесь проверки модов или исправьте ошибки"
          : undefined;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CustomTitlebar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar
          view={view}
          onViewChange={setView}
          modsBadge={missingModsCount > 0 ? missingModsCount : undefined}
          isReady={state.isReady}
          pendingInstall={pendingInstall}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {view === "main" && (
          <MainView
            phase={state.phase}
            status={state.status}
            hasFolder={state.gameDir !== null}
            isReady={state.isReady}
            gameRunning={state.gameRunning}
            gameDir={state.gameDir}
            manifestCount={state.manifest.length}
            manifestOkCount={okModsCount}
            config={state.config}
            modCheck={state.modCheck}
            removedMods={state.modCheck?.removed ?? []}
            pendingInstall={pendingInstall}
            busy={busy}
            showProgress={showProgress || showCheckingBar}
            showCheckingBar={showCheckingBar}
            downloadProgress={state.downloadProgress}
            downloadPaused={state.downloadPaused}
            playBlocked={playBlocked}
            playBlockHint={playBlockHint}
            showInstall={needsModsInstall}
            missingModsCount={missingModsCount}
            onGoToMods={() => setView("mods")}
            onNavigate={setView}
            onSelectFolder={() => void selectFolder()}
            onPlay={() => void launchGame()}
            onRetry={retryMods}
            onInstall={() => void installMissingMods()}
            onOpenGameFolder={() => void openGameFolder()}
            onOpenModsFolder={() => void openModsFolder()}
            onPauseDownload={() => void pauseDownload()}
            onResumeDownload={() => void resumeDownload()}
            onCancelDownload={() => void cancelDownload()}
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
            downloadPaused={state.downloadPaused}
            pendingInstall={pendingInstall}
            onRefresh={refreshModsCheck}
            onOpenModsFolder={() => void openModsFolder()}
            onRemoveMod={(name) => void removeMod(name)}
            onReinstallAll={() => void reinstallAllMods()}
            onPauseDownload={() => void pauseDownload()}
            onResumeDownload={() => void resumeDownload()}
            onCancelDownload={() => void cancelDownload()}
          />
        )}

        {view === "log" && (
          <LogView
            logs={state.logs}
            onClear={clearLogs}
            onExport={() => void exportLogs()}
          />
        )}

        {view === "settings" && (
          <SettingsView
            config={state.config}
            configPath={state.configPath}
            gameDir={state.gameDir}
            manifestCount={state.manifest.length}
            manifestSource={state.manifestSource}
            busy={busy}
            onSelectFolder={() => void selectFolder()}
            onOpenGameFolder={() => void openGameFolder()}
            onOpenModsFolder={() => void openModsFolder()}
            onOpenConfigFolder={() => void openConfigFolder()}
            onSavePassword={savePassword}
            onSaveAutoSteamConnect={saveAutoSteamConnect}
            onCheckAppUpdate={() => void checkAppUpdate()}
          />
        )}
        </div>
      </div>

      {showFooter && (
        <AppFooter
          mode={footerMode}
          disabled={playBlocked}
          playBlockHint={playBlockHint}
          gameRunning={state.gameRunning}
          loading={busy}
          loadingLabel={state.isDownloading ? "Загрузка…" : "Проверка…"}
          showInstall={needsModsInstall}
          installLabel={
            pendingInstall > 0
              ? `⬇  Установить ${pendingInstall} мод(ов)`
              : "⬇  Установить моды"
          }
          onPlay={() => void launchGame()}
          onInstall={() => void installMissingMods()}
        />
      )}
    </div>
  );
}
