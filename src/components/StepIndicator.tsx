import type { LauncherPhase } from "../types";

const STEPS = [
  { id: "folder", label: "Папка" },
  { id: "mods", label: "Моды" },
  { id: "play", label: "Старт" },
] as const;

function stepIndex(phase: LauncherPhase, hasFolder: boolean, isReady: boolean): number {
  if (!hasFolder) return 0;
  if (phase === "checking" || phase === "downloading") return 1;
  if (isReady) return 2;
  if (phase === "error") return 1;
  return hasFolder ? 1 : 0;
}

interface StepIndicatorProps {
  phase: LauncherPhase;
  hasFolder: boolean;
  isReady: boolean;
}

export function StepIndicator({ phase, hasFolder, isReady }: StepIndicatorProps) {
  const active = stepIndex(phase, hasFolder, isReady);

  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={step.id} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-700">·</span>}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                done
                  ? "bg-mint/10 text-mint"
                  : current
                    ? "bg-brand/15 text-brand"
                    : "text-gray-600"
              }`}
            >
              {done ? "✓ " : ""}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
