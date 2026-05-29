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
    <header className="relative shrink-0 overflow-hidden border-b border-line px-6 py-4">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-40"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-dim/20 ring-1 ring-brand/30">
            <span className="text-lg font-black text-brand">7</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">
              Fans Group
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white">7 Days to Die</h1>
            <p className="mt-0.5 max-w-md truncate text-sm text-gray-400">{status}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <StatusBadge phase={phase} />
          <StepIndicator phase={phase} hasFolder={hasFolder} isReady={isReady} />
        </div>
      </div>
    </header>
  );
}
