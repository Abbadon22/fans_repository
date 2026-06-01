import { useEffect, useState, type ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { LauncherConfig } from "../types";
import type { AppUpdateInfo } from "../types/updates";
import { APP_VERSION, FAN_MANIFEST_URL, FAN_SERVER_HOST, FAN_SERVER_PORT, RELEASES_URL, WHATS_NEW } from "../constants";
import { ViewHeader } from "./ViewHeader";

interface SettingsViewProps {
  config: LauncherConfig | null;
  configPath: string | null;
  gameDir: string | null;
  manifestCount: number;
  manifestSource: string | null;
  appUpdate: AppUpdateInfo | null;
  busy: boolean;
  installingLauncher?: boolean;
  onSelectFolder: () => void;
  onOpenGameFolder: () => void;
  onOpenModsFolder: () => void;
  onOpenConfigFolder: () => void;
  onSavePassword: (password: string) => Promise<void>;
  onSaveAutoSteamConnect: (enabled: boolean) => Promise<void>;
  onCheckAppUpdate: () => void;
  onInstallAppUpdate: () => void;
}

export function SettingsView({
  config,
  configPath,
  gameDir,
  manifestCount,
  manifestSource,
  appUpdate,
  busy,
  installingLauncher,
  onSelectFolder,
  onOpenGameFolder,
  onOpenModsFolder,
  onOpenConfigFolder,
  onSavePassword,
  onSaveAutoSteamConnect,
  onCheckAppUpdate,
  onInstallAppUpdate,
}: SettingsViewProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const autoSteam = config?.auto_steam_connect !== false;

  useEffect(() => {
    if (config) setPassword(config.server_password);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSavePassword(password);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ViewHeader title="Настройки" subtitle={`Fans Launcher v${APP_VERSION}`} />

      <div className="scroll-area min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="flex flex-col gap-3 px-6 py-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <SettingCard title="Сервер">
              <p className="font-mono text-sm font-semibold text-white">
                {config?.server_ip ?? FAN_SERVER_HOST}
                <span className="text-brand">:{config?.server_port ?? FAN_SERVER_PORT}</span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Адрес задаётся лаунчером
              </p>
            </SettingCard>

            <SettingCard title="Пароль сервера">
              <input
                type="password"
                className="input-field w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль для подключения"
                disabled={busy || saving}
              />
              <button
                type="button"
                className="btn-soft mt-2.5"
                disabled={busy || saving || !password.trim()}
                onClick={() => void handleSave()}
              >
                {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
              </button>
            </SettingCard>
          </div>

          <SettingCard title="Папка игры">
            <div
              className="input-field truncate font-mono text-xs text-gray-300"
              title={gameDir ?? undefined}
            >
              {gameDir ?? "Укажите папку Steam с 7 Days to Die"}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Нужен файл <span className="font-mono text-gray-400">7DaysToDie.exe</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" className="btn-soft" disabled={busy} onClick={onSelectFolder}>
                {gameDir ? "Сменить…" : "Выбрать…"}
              </button>
              <button
                type="button"
                className="btn-soft"
                disabled={busy || !gameDir}
                onClick={onOpenGameFolder}
              >
                Проводник
              </button>
              <button
                type="button"
                className="btn-soft"
                disabled={busy || !gameDir}
                onClick={onOpenModsFolder}
              >
                Папка Mods
              </button>
            </div>
          </SettingCard>

          <SettingCard title="Запуск игры">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line bg-void accent-brand"
                checked={autoSteam}
                disabled={busy}
                onChange={(e) => void onSaveAutoSteamConnect(e.target.checked)}
              />
              <span className="text-sm leading-relaxed text-gray-300">
                После «Играть» открывать подключение к серверу через Steam (
                <span className="font-mono text-xs text-gray-500">steam://connect</span>)
              </span>
            </label>
          </SettingCard>

          <div className="grid grid-cols-2 items-stretch gap-3">
            <SettingCard title="Обновления" stretch footer={
              <>
                {appUpdate ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || installingLauncher}
                    onClick={onInstallAppUpdate}
                  >
                    {installingLauncher ? "Установка…" : `Обновить до ${appUpdate.version}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-soft border-brand/40 bg-brand/15 font-semibold text-brand"
                    onClick={() => void openUrl(RELEASES_URL)}
                  >
                    Скачать установщик
                  </button>
                )}
                <button type="button" className="btn-soft" disabled={busy || installingLauncher} onClick={onCheckAppUpdate}>
                  Проверить
                </button>
              </>
            }>
              {appUpdate ? (
                <p className="text-sm font-semibold text-sky-300">
                  Доступна {appUpdate.version}
                  <span className="mt-1 block text-xs font-normal text-gray-500">
                    У вас {appUpdate.currentVersion}. Уведомление также вверху окна.
                  </span>
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-gray-500">
                  При запуске лаунчер проверяет обновления и показывает панель уведомлений.
                  Новым игрокам —{" "}
                  <span className="font-mono text-gray-400">*-setup.exe</span> с Releases.
                </p>
              )}
            </SettingCard>

            <SettingCard title="Манифест модов" stretch footer={
              <button type="button" className="btn-soft" onClick={() => void openUrl(FAN_MANIFEST_URL)}>
                manifest.json
              </button>
            }>
              <p className="text-sm font-semibold tabular-nums text-white">
                {manifestCount > 0 ? `${manifestCount} модов` : "—"}
              </p>
              {manifestSource && (
                <p className="mt-1.5 truncate text-[10px] text-gray-500" title={manifestSource}>
                  {manifestSource}
                </p>
              )}
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Лишние папки в Mods/ удаляются при проверке
              </p>
            </SettingCard>
          </div>

          <SettingCard title={`Что нового в v${APP_VERSION}`}>
            <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-gray-400">
              {WHATS_NEW.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </SettingCard>

          <SettingCard title="Конфигурация">
            <button
              type="button"
              className="btn-soft"
              disabled={busy || !configPath}
              onClick={onOpenConfigFolder}
            >
              Папка config.json
            </button>
            {configPath && (
              <p className="mt-2 break-all font-mono text-[10px] leading-snug text-gray-600">
                {configPath}
              </p>
            )}
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

function SettingCard({
  title,
  children,
  footer,
  stretch,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  stretch?: boolean;
}) {
  return (
    <section className={`panel flex flex-col p-3.5 ${stretch ? "h-full" : ""}`}>
      <h3 className="panel-title mb-2 shrink-0">{title}</h3>
      <div className={stretch ? "flex flex-1 flex-col" : "flex flex-col gap-0"}>{children}</div>
      {footer && <div className="mt-auto flex shrink-0 flex-wrap gap-2 pt-3">{footer}</div>}
    </section>
  );
}
