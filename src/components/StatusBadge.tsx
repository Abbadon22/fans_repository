import type { LauncherPhase } from "../types";

const LABELS: Record<LauncherPhase, string> = {
  boot: "Загрузка",
  "no-folder": "Нужна папка",
  checking: "Проверка",
  downloading: "Загрузка",
  ready: "Готов",
  error: "Ошибка",
};

const STYLES: Record<LauncherPhase, string> = {
  boot: "bg-panel-raised text-gray-400 ring-line",
  "no-folder": "bg-brand/10 text-brand ring-brand/25",
  checking: "bg-sky/10 text-sky ring-sky/25",
  downloading: "bg-sky/10 text-sky ring-sky/25",
  ready: "bg-mint/10 text-mint ring-mint/25",
  error: "bg-red-500/10 text-red-400 ring-red-500/25",
};

interface StatusBadgeProps {
  phase: LauncherPhase;
}

export function StatusBadge({ phase }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${STYLES[phase]}`}
    >
      {(phase === "checking" || phase === "downloading" || phase === "boot") && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {phase === "ready" && <span className="h-1.5 w-1.5 rounded-full bg-mint" />}
      {LABELS[phase]}
    </span>
  );
}
