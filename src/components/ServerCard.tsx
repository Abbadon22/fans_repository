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

  const flash = (key: "ip" | "steam") => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      flash("ip");
    } catch {
      /* ignore */
    }
  };

  const copySteamLink = async () => {
    try {
      const url = await invoke<string>("get_steam_connect_url");
      await navigator.clipboard.writeText(url);
      flash("steam");
    } catch {
      /* ignore */
    }
  };

  const openSteamConnect = async () => {
    try {
      await invoke("open_steam_connect");
      flash("steam");
    } catch {
      /* ignore */
    }
  };

  return (
    <section className={`panel relative flex h-full min-h-0 flex-col overflow-hidden p-0 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/8 to-transparent"
        aria-hidden
      />

      <div className="relative flex h-full flex-col p-4">
        <div className="mb-3">
          <p className="panel-title">Сервер Fans</p>
          {isOfficial && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              Официальный хост
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line-strong bg-void/70 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">IP:порт</p>
          <p className="mt-1.5 break-all font-mono text-xl font-semibold leading-tight text-white">
            {config.server_ip}
            <span className="text-brand">:{config.server_port}</span>
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-gray-500">
            Пароль — в «Настройки». После «Играть» можно подключиться через Steam.
          </p>
        </div>

        <div className="mt-4 grid flex-1 content-end gap-2">
          <button
            type="button"
            className="btn-soft w-full border-brand/35 bg-brand/12 py-2.5 font-semibold text-brand"
            onClick={() => void openSteamConnect()}
          >
            {copied === "steam" ? "✓ Открыто в Steam" : "Подключиться в Steam"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-soft py-2 text-xs" onClick={() => void copyAddress()}>
              {copied === "ip" ? "✓ IP" : "Копировать IP"}
            </button>
            <button type="button" className="btn-soft py-2 text-xs" onClick={() => void copySteamLink()}>
              {copied === "steam" ? "✓ Ссылка" : "Ссылка Steam"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
