import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { LauncherConfig } from "../types";
import { FAN_SERVER_HOST, FAN_SERVER_PORT } from "../constants";

interface ServerCardProps {
  config: LauncherConfig;
}

export function ServerCard({ config }: ServerCardProps) {
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

  return (
    <section className="panel relative overflow-hidden p-0">
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-sky/5"
        aria-hidden
      />
      <div className="relative p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="panel-title">Сервер группы</p>
            {isOfficial && (
              <p className="mt-1 flex items-center gap-1 text-[10px] text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                Официальный хост Fans
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" className="btn-soft text-[10px]" onClick={() => void copyAddress()}>
              {copied === "ip" ? "✓ IP" : "Копировать IP"}
            </button>
            <button type="button" className="btn-soft text-[10px]" onClick={() => void copySteamLink()}>
              {copied === "steam" ? "✓ Steam" : "Steam-ссылка"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-line-strong bg-void/60 px-4 py-3.5 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Подключение в игре
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight text-white">
            {config.server_ip}
            <span className="text-brand">:{config.server_port}</span>
          </p>
          <p className="mt-2 text-[10px] text-gray-600">
            Мультиплеер → Подключиться → введите IP и пароль из настроек
          </p>
        </div>
      </div>
    </section>
  );
}
