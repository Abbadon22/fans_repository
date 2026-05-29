import { useEffect, useState } from "react";
import type { LauncherConfig } from "../types";
import { FolderSelector } from "./FolderSelector";
import { FAN_SERVER_HOST, FAN_SERVER_PORT } from "../constants";

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
      <section className="panel p-4">
        <p className="panel-title mb-3">Сервер</p>
        <p className="font-mono text-sm text-white">
          {config?.server_ip ?? FAN_SERVER_HOST}
          <span className="text-brand">:{config?.server_port ?? FAN_SERVER_PORT}</span>
        </p>
        <p className="mt-2 text-[11px] text-gray-500">
          Адрес сервера задаётся лаунчером. Менять нужно только пароль ниже.
        </p>
      </section>

      <section className="panel space-y-3 p-4">
        <p className="panel-title">Пароль сервера</p>
        <input
          type="password"
          className="input-field w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль для -password=…"
          disabled={busy || saving}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-soft"
            disabled={busy || saving || !password.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить пароль"}
          </button>
        </div>
      </section>

      <FolderSelector gameDir={gameDir} disabled={busy} onSelect={onSelectFolder} />

      <section className="panel space-y-3 p-4">
        <p className="panel-title">Лаунчер</p>
        <p className="text-[11px] text-gray-500">
          Обновления с GitHub Releases (Abbadon22/fans_repository).
        </p>
        <button type="button" className="btn-soft" disabled={busy} onClick={onCheckAppUpdate}>
          Проверить обновления
        </button>
      </section>

      <section className="panel space-y-3 p-4">
        <p className="panel-title">Файлы</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-soft"
            disabled={busy || !gameDir}
            onClick={onOpenGameFolder}
          >
            Открыть папку игры
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
  );
}
