import { useState } from "react";
import type { LauncherConfig } from "../types";
import { FAN_SERVER_HOST, FAN_SERVER_PORT } from "../constants";

interface ServerCardProps {
  config: LauncherConfig;
  className?: string;
}

export function ServerCard({ config, className = "" }: ServerCardProps) {
  const [copied, setCopied] = useState(false);
  const address = `${config.server_ip}:${config.server_port}`;
  const isOfficial =
    config.server_ip === FAN_SERVER_HOST && config.server_port === FAN_SERVER_PORT;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className={`panel relative flex min-h-0 flex-col overflow-hidden p-0 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-3 p-4">
        <div>
          <p className="panel-title">Сервер Fans</p>
          {isOfficial && (
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              Официальный хост
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void copyAddress()}
          title="Скопировать адрес"
          className={`group w-full rounded-xl border px-4 py-3.5 text-left transition ${
            copied
              ? "border-mint/40 bg-mint/10"
              : "border-line-strong bg-void/70 hover:border-brand/35 hover:bg-brand/5"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-400">
            {copied ? "Скопировано" : "IP:порт · нажмите"}
          </p>
          <p className="mt-1 break-all font-mono text-base font-semibold leading-tight text-white">
            {config.server_ip}
            <span className="text-brand">:{config.server_port}</span>
          </p>
        </button>
      </div>
    </section>
  );
}
