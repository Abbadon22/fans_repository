import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { LauncherConfig } from "../types";

interface ServerCardProps {
  config: LauncherConfig;
  compact?: boolean;
  className?: string;
}

export function ServerCard({ config, compact = false, className = "" }: ServerCardProps) {
  const [copied, setCopied] = useState<"ip" | "steam" | null>(null);
  const address = `${config.server_ip}:${config.server_port}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied("ip");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const copySteamLink = async () => {
    try {
      const url = await invoke<string>("get_steam_connect_url");
      await navigator.clipboard.writeText(url);
      setCopied("steam");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (compact) {
    return (
      <section className={`panel flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${className}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Сервер</p>
          <p className="mt-1 font-mono text-lg font-semibold text-white">
            {config.server_ip}
            <span className="text-brand">:{config.server_port}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-soft text-xs" onClick={() => void copyAddress()}>
            {copied === "ip" ? "Скопировано" : "IP"}
          </button>
          <button type="button" className="btn-soft text-xs" onClick={() => void copySteamLink()}>
            {copied === "steam" ? "Скопировано" : "Steam"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`panel p-5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Сервер</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-white">
        {config.server_ip}
        <span className="text-brand">:{config.server_port}</span>
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-soft flex-1" onClick={() => void copyAddress()}>
          {copied === "ip" ? "✓ IP" : "Копировать IP"}
        </button>
        <button type="button" className="btn-soft flex-1" onClick={() => void copySteamLink()}>
          {copied === "steam" ? "✓ Steam" : "Steam-ссылка"}
        </button>
      </div>
    </section>
  );
}
