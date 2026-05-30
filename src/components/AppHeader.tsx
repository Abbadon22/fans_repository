import type { LauncherPhase } from "../types";
import { StatusBadge } from "./StatusBadge";
import { StepIndicator } from "./StepIndicator";

interface AppHeaderProps {
  phase: LauncherPhase;
  status: string;
  hasFolder: boolean;
  isReady: boolean;
}

export function AppHeader({ phase, status, hasFolder, isReady }: AppHeaderProps) {
  return (
    <header className="relative shrink-0 overflow-hidden border-b border-line px-6 py-5">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-8 top-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/25 via-panel-raised to-void ring-1 ring-brand/25">
            <span className="text-xl font-black text-glow-brand text-brand">7</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-void bg-mint" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand/90">
              Fans Group
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">7 Days to Die</h1>
            <p className="mt-1 max-w-md truncate text-sm text-gray-400">{status}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <StatusBadge phase={phase} />
          <StepIndicator phase={phase} hasFolder={hasFolder} isReady={isReady} />
        </div>
      </div>
    </header>
  );
}
