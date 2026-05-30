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
    <div className="titlebar flex h-10 shrink-0 select-none items-stretch border-b border-line bg-void/90 backdrop-blur-md">
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center gap-2.5 pl-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand/30 to-brand-dim/20 ring-1 ring-brand/25">
          <span className="text-[10px] font-black text-brand">7</span>
        </div>
        <span data-tauri-drag-region className="truncate text-xs font-semibold text-gray-300">
          Fans Launcher
        </span>
        <span
          data-tauri-drag-region
          className="rounded bg-panel-raised/80 px-1.5 py-0.5 font-mono text-[9px] text-gray-500"
        >
          v{APP_VERSION}
        </span>
      </div>

      <nav className="flex shrink-0 items-stretch">
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

      <div data-tauri-drag-region className="w-4 shrink-0" />

      <div className="flex shrink-0 items-stretch">
        <WinButton label="Свернуть" onClick={() => void win.minimize()}>
          <span className="mb-2 block h-px w-2.5 bg-current" />
        </WinButton>
        <WinButton label="Развернуть" onClick={() => void win.toggleMaximize()}>
          <span className="block h-2 w-2 border border-current" />
        </WinButton>
        <WinButton label="Закрыть" danger onClick={() => void win.close()}>
          <span className="text-sm leading-none">×</span>
        </WinButton>
      </div>
    </div>
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
      className={`relative flex items-center gap-1.5 border-b-2 px-4 text-xs font-semibold transition ${
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
        <span className="relative z-10 rounded-full bg-brand px-1.5 py-px text-[9px] font-bold text-white">
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
      className={`flex w-11 items-center justify-center text-gray-400 transition hover:bg-white/5 hover:text-white ${
        danger ? "hover:bg-red-600 hover:text-white" : ""
      }`}
    >
      {children}
    </button>
  );
}
