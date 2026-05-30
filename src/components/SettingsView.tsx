import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { LauncherConfig } from "../types";
import { APP_VERSION, FAN_MANIFEST_URL, FAN_SERVER_HOST, FAN_SERVER_PORT } from "../constants";
import { FolderSelector } from "./FolderSelector";
import { ViewHeader } from "./ViewHeader";

const RELEASES_URL = "https://github.com/Abbadon22/fans_repository/releases";

interface SettingsViewProps {
  config: LauncherConfig | null;
  configPath: string | null;
  gameDir: string | null;
  busy: boolean;
  onSelectFolder: () => void;
  onOpenGameFolder: () => void;
  onOpenConfigFolder: () => void;
  onSavePassword: (password: string) => Promise<void>;
  onCheckAppUpdate: () => void;
}

export function SettingsView({
  config,
  configPath,
  gameDir,
  busy,
  onSelectFolder,
  onOpenGameFolder,
  onOpenConfigFolder,
  onSavePassword,
  onCheckAppUpdate,
}: SettingsViewProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <>
      <ViewHeader title="Настройки" subtitle={`Fans Launcher v${APP_VERSION}`} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-4 lg:grid-cols-2">
        <section className="panel p-4">
          <p className="panel-title mb-3">Сервер</p>
          <p className="font-mono text-sm text-white">
            {config?.server_ip ?? FAN_SERVER_HOST}
            <span className="text-brand">:{config?.server_port ?? FAN_SERVER_PORT}</span>
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            Адрес задаётся лаунчером. Меняйте только пароль ниже.
          </p>
        </section>

        <section className="panel space-y-3 p-4">
          <p className="panel-title">Пароль сервера</p>
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
            className="btn-soft"
            disabled={busy || saving || !password.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить пароль"}
          </button>
        </section>

        <FolderSelector gameDir={gameDir} disabled={busy} onSelect={onSelectFolder} />

        <section className="panel space-y-3 p-4">
          <p className="panel-title">Лаунчер</p>
          <p className="text-[11px] text-gray-500">
            Автообновление с GitHub Releases. Работает у версии, установленной через setup.exe.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-soft" disabled={busy} onClick={onCheckAppUpdate}>
              Проверить обновления
            </button>
            <button
              type="button"
              className="btn-soft"
              onClick={() => void openUrl(RELEASES_URL)}
            >
              Страница релизов
            </button>
          </div>
        </section>

        <section className="panel space-y-3 p-4">
          <p className="panel-title">Манифест модов</p>
          <p className="break-all text-[10px] text-gray-600">{FAN_MANIFEST_URL}</p>
          <button
            type="button"
            className="btn-soft"
            onClick={() => void openUrl(FAN_MANIFEST_URL)}
          >
            Открыть manifest.json
          </button>
        </section>

        <section className="panel space-y-3 p-4 lg:col-span-2">
          <p className="panel-title">Файлы</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-soft"
              disabled={busy || !gameDir}
              onClick={onOpenGameFolder}
            >
              Папка игры
            </button>
            <button
              type="button"
              className="btn-soft"
              disabled={busy || !configPath}
              onClick={onOpenConfigFolder}
            >
              Папка config.json
            </button>
          </div>
          {configPath && (
            <p className="break-all text-[10px] text-gray-600" title={configPath}>
              {configPath}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
