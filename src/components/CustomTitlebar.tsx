import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { APP_VERSION } from "../constants";

export type AppView = "main" | "mods" | "settings";

interface CustomTitlebarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  modsBadge?: number;
}

export function CustomTitlebar({ view, onViewChange, modsBadge }: CustomTitlebarProps) {
  const win = getCurrentWindow();

  return (
    <div className="titlebar grid h-10 shrink-0 select-none grid-cols-[minmax(0,1fr)_auto_auto] items-center border-b border-line bg-void/90 backdrop-blur-md">
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

      <nav className="flex h-10 items-center">
        <TabButton active={view === "main"} onClick={() => onViewChange("main")}>
          Главная
        </TabButton>
        <TabButton active={view === "mods"} onClick={() => onViewChange("mods")} badge={modsBadge}>
          Моды
        </TabButton>
        <TabButton active={view === "settings"} onClick={() => onViewChange("settings")}>
          Настройки
        </TabButton>
      </nav>

      <div className="flex h-10 items-center">
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

function TabButton({
  active,
  onClick,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-10 items-center gap-1.5 border-b-2 px-3.5 text-sm font-semibold transition ${
        active
          ? "border-brand text-white"
          : "border-transparent text-gray-500 hover:text-gray-300"
      }`}
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-x-3 -bottom-px h-4 bg-brand/20 blur-md"
          aria-hidden
        />
      )}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="relative z-10 rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
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
