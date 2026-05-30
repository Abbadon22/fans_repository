import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { APP_VERSION } from "../constants";

export type AppView = "main" | "mods" | "settings";

interface CustomTitlebarProps {
  modsBadge?: number;
}

export function CustomTitlebar({ modsBadge: _modsBadge }: CustomTitlebarProps) {
  const win = getCurrentWindow();

  return (
    <div className="titlebar flex h-10 shrink-0 select-none items-center justify-between border-b border-line bg-void/90 backdrop-blur-md">
      <div data-tauri-drag-region className="flex min-w-0 items-center gap-2.5 pl-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand/30 to-brand-dim/20 ring-1 ring-brand/25">
          <span className="text-[10px] font-black text-brand">7</span>
        </div>
        <span data-tauri-drag-region className="truncate text-sm font-semibold text-gray-300">
          Fans Launcher
        </span>
        <span
          data-tauri-drag-region
          className="rounded bg-panel-raised/80 px-1.5 py-0.5 font-mono text-[10px] text-gray-500"
        >
          v{APP_VERSION}
        </span>
      </div>

      <div className="flex h-10 items-center pr-1">
        <WinButton label="Свернуть" onClick={() => void win.minimize()}>
          <MinimizeIcon />
        </WinButton>
        <WinButton label="Развернуть" onClick={() => void win.toggleMaximize()}>
          <MaximizeIcon />
        </WinButton>
        <WinButton label="Закрыть" danger onClick={() => void win.close()}>
          <CloseIcon />
        </WinButton>
      </div>
    </div>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-current">
      <rect x="1" y="5" width="8" height="1" fill="currentColor" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-current">
      <rect
        x="1.5"
        y="1.5"
        width="7"
        height="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-current">
      <path
        d="M2 2 L8 8 M8 2 L2 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WinButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center text-gray-400 transition hover:bg-white/5 hover:text-white ${
        danger ? "hover:bg-red-600 hover:text-white" : ""
      }`}
    >
      {children}
    </button>
  );
}
