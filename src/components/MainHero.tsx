import type { LauncherPhase } from "../types";
import { StatusBadge } from "./StatusBadge";

export type MainStepId = "folder" | "mods" | "play";

interface MainHeroProps {
  phase: LauncherPhase;
  status: string;
  hasFolder: boolean;
  isReady: boolean;
  gameRunning: boolean;
  busy: boolean;
  manifestCount: number;
  modOkCount: number;
  pendingInstall: number;
  gameDir: string | null;
  onSelectFolder: () => void;
  onGoToMods: () => void;
}

const STEPS: { id: MainStepId; label: string; hint: string }[] = [
  { id: "folder", label: "Папка игры", hint: "Каталог с 7DaysToDie.exe" },
  { id: "mods", label: "Модпак", hint: "Список сервера Fans" },
  { id: "play", label: "Запуск", hint: "Кнопка «Играть» внизу" },
];

function activeStep(
  hasFolder: boolean,
  isReady: boolean,
  busy: boolean,
  pendingInstall: number,
): MainStepId {
  if (!hasFolder) return "folder";
  if (busy || pendingInstall > 0 || !isReady) return "mods";
  return "play";
}

function stepIndex(id: MainStepId): number {
  return STEPS.findIndex((s) => s.id === id);
}

export function MainHero({
  phase,
  status,
  hasFolder,
  isReady,
  gameRunning,
  busy,
  manifestCount,
  modOkCount,
  pendingInstall,
  gameDir,
  onSelectFolder,
  onGoToMods,
}: MainHeroProps) {
  const current = activeStep(hasFolder, isReady, busy, pendingInstall);
  const currentIdx = stepIndex(current);
  const modPercent =
    manifestCount > 0 ? Math.round((modOkCount / manifestCount) * 100) : 0;

  const headline = gameRunning
    ? "Игра запущена"
    : isReady
      ? "Всё готово — можно играть"
      : busy
        ? status
        : !hasFolder
          ? "Добро пожаловать"
          : pendingInstall > 0
            ? "Осталось установить моды"
            : "Завершите проверку модпака";

  const subline = gameRunning
    ? "Закройте игру, чтобы снова запустить лаунчер"
    : isReady
      ? "Всё настроено — запуск внизу"
      : !hasFolder
        ? "Папка Steam с 7 Days to Die"
        : pendingInstall > 0
          ? `${modOkCount} из ${manifestCount} · осталось ${pendingInstall}`
          : "Вкладка «Моды» или «Повторить»";

  const onStepClick = (id: MainStepId) => {
    if (id === "folder") onSelectFolder();
    else if (id === "mods") onGoToMods();
  };

  const checks = [
    {
      done: hasFolder,
      title: "Папка с игрой",
      detail: hasFolder ? "Указана" : "Не выбрана",
      action: !hasFolder ? "Выбрать" : "Сменить",
      onClick: onSelectFolder,
    },
    {
      done: hasFolder && isReady && pendingInstall === 0,
      title: "Модпак сервера",
      detail:
        manifestCount > 0
          ? `${modOkCount} / ${manifestCount}${pendingInstall > 0 ? ` (+${pendingInstall})` : ""}`
          : "—",
      action: "Открыть",
      onClick: onGoToMods,
    },
    {
      done: isReady && !gameRunning,
      title: "Готов к запуску",
      detail: isReady ? "Да" : gameRunning ? "Игра открыта" : "Нет",
      action: null,
      onClick: undefined,
    },
  ];

  return (
    <section className="panel relative flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-40"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/20 ring-1 ring-brand/30">
              <span className="text-sm font-black text-brand">7</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand/90">
                Fans Group
              </p>
              <p className="text-xs font-semibold text-white">7 Days to Die</p>
            </div>
          </div>
          <StatusBadge phase={phase} />
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <ReadinessRing
            percent={hasFolder ? modPercent : 0}
            ready={isReady && !gameRunning}
            active={busy}
            running={gameRunning}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight text-white">{headline}</h1>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">{subline}</p>
            {gameDir && (
              <button
                type="button"
                className="mt-1.5 block max-w-full truncate text-left font-mono text-[10px] text-gray-600 hover:text-brand"
                title={gameDir}
                onClick={onSelectFolder}
              >
                {gameDir}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-xl border border-line bg-void/50 p-2.5">
          <p className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Проверки
          </p>
          <ul className="flex min-h-0 flex-1 flex-col justify-center gap-2">
            {checks.map((item) => (
              <li
                key={item.title}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${
                  item.done ? "border-mint/20 bg-mint/5" : "border-line bg-panel/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    item.done ? "bg-mint/20 text-mint" : "bg-panel-raised text-gray-600"
                  }`}
                >
                  {item.done ? "✓" : "·"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-200">{item.title}</p>
                  <p className="text-[10px] text-gray-500">{item.detail}</p>
                </div>
                {item.action && item.onClick && (
                  <button
                    type="button"
                    className="btn-soft shrink-0 px-2 py-1 text-[10px]"
                    onClick={item.onClick}
                  >
                    {item.action}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {hasFolder && manifestCount > 0 && (
          <div className="shrink-0">
            <div className="mb-1 flex justify-between text-[10px] font-medium text-gray-500">
              <span>Модпак</span>
              <span className="tabular-nums text-gray-400">
                {modOkCount} / {manifestCount}
                {pendingInstall > 0 && <span className="text-brand"> · +{pendingInstall}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-void">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-dim to-mint transition-all duration-500"
                style={{ width: `${modPercent}%` }}
              />
            </div>
          </div>
        )}

        <nav className="shrink-0" aria-label="Шаги">
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((step, index) => {
              const done = index < currentIdx;
              const currentStep = index === currentIdx;
              const clickable = step.id === "folder" || step.id === "mods";

              return (
                <li key={step.id} className="min-w-0">
                  <button
                    type="button"
                    disabled={!clickable && !done}
                    onClick={() => clickable && onStepClick(step.id)}
                    className={`flex h-full w-full flex-col rounded-xl border px-2 py-2 text-left transition ${
                      done
                        ? "border-mint/30 bg-mint/5 hover:border-mint/45"
                        : currentStep
                          ? "border-brand/40 bg-brand/10 ring-1 ring-brand/20"
                          : "border-line bg-void/30 opacity-75"
                    } ${clickable || done ? "cursor-pointer hover:brightness-110" : "cursor-default"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                          done
                            ? "bg-mint/25 text-mint"
                            : currentStep
                              ? "bg-brand/25 text-brand"
                              : "bg-panel-raised text-gray-600"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <span
                        className={`truncate text-xs font-semibold ${currentStep ? "text-white" : "text-gray-400"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 pl-[1.625rem] text-[9px] leading-tight text-gray-500">
                      {step.hint}
                    </p>
                    {currentStep && !done && (
                      <p className="mt-0.5 pl-[1.625rem] text-[9px] font-medium text-brand">Сейчас</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </section>
  );
}

function ReadinessRing({
  percent,
  ready,
  active,
  running,
}: {
  percent: number;
  ready: boolean;
  active: boolean;
  running: boolean;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  const stroke = running || ready ? "#34d399" : active ? "#38bdf8" : "#10b981";

  return (
    <div className="relative flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-void" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className={`relative flex h-12 w-12 flex-col items-center justify-center rounded-xl ring-1 ring-white/10 ${
          ready || running
            ? "bg-gradient-to-br from-mint/25 to-brand/15"
            : "bg-gradient-to-br from-panel-raised to-void/80"
        }`}
      >
        <span className="text-sm font-black text-white">
          {running ? "●" : ready ? "✓" : `${percent}%`}
        </span>
      </div>
    </div>
  );
}
