import type { LauncherPhase } from "../types";
import { StatusBadge } from "./StatusBadge";
import { StepIndicator } from "./StepIndicator";

export interface HeaderStat {
  label: string;
  value: string;
  tone: "ok" | "warn" | "neutral" | "active";
  onClick?: () => void;
}

interface AppHeaderProps {
  phase: LauncherPhase;
  status: string;
  hasFolder: boolean;
  isReady: boolean;
  gameRunning?: boolean;
  stats?: HeaderStat[];
}

export function AppHeader({
  phase,
  status,
  hasFolder,
  isReady,
  gameRunning,
  stats,
}: AppHeaderProps) {
  return (
    <header className="relative shrink-0 overflow-hidden border-b border-line px-6 py-4">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-8 top-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/25 via-panel-raised to-void ring-1 ring-brand/25">
            <span className="text-lg font-black text-glow-brand text-brand">7</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-void bg-mint" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand/90">
              Fans Group
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white">7 Days to Die</h1>
            <p className="mt-0.5 truncate text-sm text-gray-400">
              {gameRunning ? "Игра запущена" : status}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge phase={phase} />
          <StepIndicator phase={phase} hasFolder={hasFolder} isReady={isReady} />
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <StatChip key={stat.label} {...stat} />
          ))}
        </div>
      )}
    </header>
  );
}

function StatChip({
  label,
  value,
  tone,
  onClick,
}: HeaderStat) {
  const valueCls =
    tone === "ok"
      ? "text-mint"
      : tone === "warn"
        ? "text-brand"
        : tone === "active"
          ? "text-emerald-300"
          : "text-gray-200";

  const className =
    "flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border border-line bg-void/50 px-2 py-2 text-center transition";

  const inner = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums leading-tight ${valueCls}`}>{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} hover:border-brand/30 hover:bg-void/70`}
      >
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
