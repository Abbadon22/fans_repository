import type { ReactNode } from "react";
import type { AppView } from "./CustomTitlebar";
import { APP_VERSION } from "../constants";

interface AppSidebarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  modsBadge?: number;
  status: string;
  isReady: boolean;
  gameRunning: boolean;
  busy: boolean;
  modsOk: number;
  modsTotal: number;
  onPlay: () => void;
  playDisabled: boolean;
}

export function AppSidebar({
  view,
  onViewChange,
  modsBadge,
  status,
  isReady,
  gameRunning,
  busy,
  modsOk,
  modsTotal,
  onPlay,
  playDisabled,
}: AppSidebarProps) {
  const playLabel = gameRunning
    ? "Игра запущена"
    : busy
      ? "Подождите…"
      : "Играть";

  return (
    <aside className="sidebar flex w-[220px] shrink-0 flex-col border-r border-line bg-panel/40">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-dim/15 ring-1 ring-brand/20">
          <span className="text-sm font-black text-brand">7</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Fans</p>
          <p className="text-[10px] text-gray-500">v{APP_VERSION}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        <NavItem
          active={view === "main"}
          label="Игра"
          icon={<IconPlay />}
          onClick={() => onViewChange("main")}
        />
        <NavItem
          active={view === "mods"}
          label="Моды"
          icon={<IconMods />}
          badge={modsBadge}
          hint={modsTotal > 0 ? `${modsOk}/${modsTotal}` : undefined}
          onClick={() => onViewChange("mods")}
        />
        <NavItem
          active={view === "settings"}
          label="Настройки"
          icon={<IconSettings />}
          onClick={() => onViewChange("settings")}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-3 p-4">
        <div className="rounded-xl border border-line bg-void/50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <StatusDot ready={isReady} running={gameRunning} busy={busy} />
            <p className="min-w-0 truncate text-xs font-medium text-gray-300">{status}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPlay}
          disabled={playDisabled}
          className={gameRunning ? "btn-play-running w-full" : "btn-play w-full"}
        >
          {playLabel}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  label,
  icon,
  badge,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  badge?: number;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-brand/15 text-white ring-1 ring-brand/25"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      <span className={active ? "text-brand" : "text-gray-500"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && !badge && (
        <span className="font-mono text-[10px] tabular-nums text-gray-600">{hint}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatusDot({
  ready,
  running,
  busy,
}: {
  ready: boolean;
  running: boolean;
  busy: boolean;
}) {
  const cls = running
    ? "bg-sky shadow-[0_0_8px_rgba(56,189,248,0.5)]"
    : ready
      ? "bg-mint shadow-[0_0_8px_rgba(52,211,153,0.45)]"
      : busy
        ? "bg-brand animate-pulse"
        : "bg-gray-600";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5v14l11-7L8 5z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconMods() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
