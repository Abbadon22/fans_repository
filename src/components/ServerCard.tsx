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
        className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-sky/5"
        aria-hidden
      />
      <div className="relative p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="panel-title">Сервер группы</p>
            {isOfficial && (
              <p className="mt-0.5 text-[10px] text-mint">Официальный хост Fans</p>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" className="btn-soft text-[10px]" onClick={() => void copyAddress()}>
              {copied === "ip" ? "✓ IP" : "IP"}
            </button>
            <button type="button" className="btn-soft text-[10px]" onClick={() => void copySteamLink()}>
              {copied === "steam" ? "✓ Steam" : "Steam-ссылка"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-line-strong bg-void/50 px-4 py-3">
          <p className="font-mono text-lg font-semibold tracking-tight text-white">
            {config.server_ip}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-brand">:{config.server_port}</p>
        </div>

      </div>
    </section>
  );
}
