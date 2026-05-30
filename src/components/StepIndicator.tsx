import type { LauncherPhase } from "../types";

const STEPS = [
  { id: "folder", label: "Папка", icon: "📁" },
  { id: "mods", label: "Моды", icon: "◫" },
  { id: "play", label: "Старт", icon: "▶" },
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
    <ol className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={step.id} className="flex items-center">
            {i > 0 && (
              <span
                className={`mx-1 h-px w-4 ${done ? "bg-mint/40" : "bg-line"}`}
                aria-hidden
              />
            )}
            <span
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                done
                  ? "bg-mint/10 text-mint"
                  : current
                    ? "bg-brand/15 text-brand ring-1 ring-brand/25"
                    : "text-gray-600"
              }`}
            >
              <span className="opacity-80">{done ? "✓" : step.icon}</span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
