import { useEffect, useState, type ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ContentHeader } from "./ContentHeader";
import type { LauncherConfig } from "../types";
import { APP_VERSION, RELEASES_URL } from "../constants";

interface SettingsViewProps {
  config: LauncherConfig | null;
  gameDir: string | null;
  busy: boolean;
  onSelectFolder: () => void;
  onOpenGameFolder: () => void;
  onSavePassword: (password: string) => Promise<void>;
  onSaveAutoSteamConnect: (enabled: boolean) => Promise<void>;
  onCheckAppUpdate: () => void;
}

export function SettingsView({
  config,
  gameDir,
  busy,
  onSelectFolder,
  onOpenGameFolder,
  onSavePassword,
  onSaveAutoSteamConnect,
  onCheckAppUpdate,
}: SettingsViewProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const autoSteam = config?.auto_steam_connect !== false;

  useEffect(() => {
    if (config) setPassword(config.server_password);
  }, [config]);

  const handleSavePassword = async () => {
    setSaving(true);
    try {
      await onSavePassword(password);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ContentHeader title="Настройки" subtitle={`Версия ${APP_VERSION}`} />

      <div className="scroll-area flex min-h-0 flex-1 flex-col gap-6 px-8 py-6">
        <SettingsGroup title="Игра">
          <p className="truncate font-mono text-xs text-gray-500" title={gameDir ?? undefined}>
            {gameDir ?? "Папка не выбрана"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-soft" disabled={busy} onClick={onSelectFolder}>
              {gameDir ? "Сменить папку" : "Выбрать папку"}
            </button>
            {gameDir && (
              <button type="button" className="btn-soft" disabled={busy} onClick={onOpenGameFolder}>
                Открыть в проводнике
              </button>
            )}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-line bg-void accent-brand"
              checked={autoSteam}
              disabled={busy}
              onChange={(e) => void onSaveAutoSteamConnect(e.target.checked)}
            />
            <span className="text-sm text-gray-400">Подключать к серверу через Steam после запуска</span>
          </label>
        </SettingsGroup>

        <SettingsGroup title="Пароль сервера">
          <input
            type="password"
            className="input-field w-full max-w-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль для входа на сервер"
            disabled={busy || saving}
          />
          <button
            type="button"
            className="btn-soft mt-3"
            disabled={busy || saving || !password.trim()}
            onClick={() => void handleSavePassword()}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </SettingsGroup>

        <SettingsGroup title="Обновления">
          <p className="text-sm text-gray-500">Лаунчер обновляется автоматически при запуске.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-soft" disabled={busy} onClick={onCheckAppUpdate}>
              Проверить сейчас
            </button>
            <button
              type="button"
              className="btn-soft text-brand"
              onClick={() => void openUrl(RELEASES_URL)}
            >
              Скачать установщик
            </button>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </section>
  );
}
