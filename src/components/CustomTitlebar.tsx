import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type AppView = "main" | "mods" | "settings";

export function CustomTitlebar() {
  const win = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="titlebar flex h-9 shrink-0 items-center justify-end border-b border-line bg-void/80 backdrop-blur-md"
    >
      <div className="flex h-9 items-center">
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
      className={`flex h-9 w-11 shrink-0 items-center justify-center text-gray-400 transition hover:bg-white/5 hover:text-white ${
        danger ? "hover:bg-red-600 hover:text-white" : ""
      }`}
    >
      {children}
    </button>
  );
}
