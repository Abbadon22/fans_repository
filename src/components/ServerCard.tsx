import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { LauncherConfig } from "../types";
import { FAN_SERVER_HOST, FAN_SERVER_PORT } from "../constants";

interface ServerCardProps {
  config: LauncherConfig;
  className?: string;
}

export function ServerCard({ config, className = "" }: ServerCardProps) {
  const [copied, setCopied] = useState<"ip" | "steam" | null>(null);
  const address = `${config.server_ip}:${config.server_port}`;
  const isOfficial =
    config.server_ip === FAN_SERVER_HOST && config.server_port === FAN_SERVER_PORT;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied("ip");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  const copySteamLink = async () => {
    try {
      const url = await invoke<string>("get_steam_connect_url");
      await navigator.clipboard.writeText(url);
      setCopied("steam");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  const openSteamConnect = async () => {
    try {
      await invoke("open_steam_connect");
      setCopied("steam");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className={`panel relative flex min-h-0 flex-col overflow-hidden p-0 ${className}`}>
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-sky/5"
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col p-4">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="panel-title">Сервер группы</p>
            {isOfficial && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mint">
                <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                Официальный хост Fans
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-line-strong bg-void/60 px-4 py-4 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Подключение в игре
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">
            {config.server_ip}
            <span className="text-brand">:{config.server_port}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Мультиплеер → Подключиться → введите IP и пароль из настроек
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
          <button type="button" className="btn-soft min-w-0 flex-1" onClick={() => void copyAddress()}>
            {copied === "ip" ? "✓ IP" : "Копировать IP"}
          </button>
          <button type="button" className="btn-soft min-w-0 flex-1" onClick={() => void copySteamLink()}>
            {copied === "steam" ? "✓ Ссылка" : "Копировать ссылку"}
          </button>
          <button
            type="button"
            className="btn-soft min-w-0 flex-1 border-brand/30 bg-brand/10 font-semibold text-brand"
            onClick={() => void openSteamConnect()}
          >
            Подключиться в Steam
          </button>
        </div>
      </div>
    </section>
  );
}
