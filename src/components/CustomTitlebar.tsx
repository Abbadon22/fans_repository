import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type AppView = "main" | "settings";

interface CustomTitlebarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
}

export function CustomTitlebar({ view, onViewChange }: CustomTitlebarProps) {
  const win = getCurrentWindow();

  return (
    <div className="titlebar flex h-9 shrink-0 select-none items-stretch border-b border-line bg-void/95">
      <div
        data-tauri-drag-region
        className="flex min-w-0 flex-1 items-center gap-2.5 pl-3"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-brand/20 text-[10px] font-black text-brand">
          7
        </div>
        <span data-tauri-drag-region className="truncate text-xs font-semibold text-gray-300">
          Fans Launcher
        </span>
      </div>

      <nav className="flex shrink-0 items-stretch">
        <TabButton active={view === "main"} onClick={() => onViewChange("main")}>
          Главная
        </TabButton>
        <TabButton active={view === "settings"} onClick={() => onViewChange("settings")}>
          Настройки
        </TabButton>
      </nav>

      <div data-tauri-drag-region className="w-6 shrink-0" />

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
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 text-xs font-semibold transition ${
        active
          ? "border-brand text-white"
          : "border-transparent text-gray-500 hover:text-gray-300"
      }`}
    >
      {children}
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
