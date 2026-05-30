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
  { id: "folder", label: "Папка игры", hint: "7DaysToDie.exe" },
  { id: "mods", label: "Модпак", hint: "Проверка и установка" },
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
  const modPercent =
    manifestCount > 0 ? Math.round((modOkCount / manifestCount) * 100) : 0;

  const headline = gameRunning
    ? "Игра запущена"
    : isReady
      ? "Готово к запуску"
      : busy
        ? status
        : !hasFolder
          ? "Настройка лаунчера"
          : pendingInstall > 0
            ? "Нужны моды"
            : "Почти готово";

  const subline = gameRunning
    ? "Закройте игру, чтобы снова использовать лаунчер"
    : isReady
      ? "Нажмите «Играть» внизу — Steam подключит к серверу"
      : !hasFolder
        ? "Укажите папку Steam с установленной 7 Days to Die"
        : pendingInstall > 0
          ? `${pendingInstall} мод(ов) ожидают загрузки · ${modOkCount} из ${manifestCount} уже на месте`
          : hasFolder
            ? "Откройте вкладку «Моды» и завершите проверку"
            : status;

  return (
    <section className="panel relative overflow-hidden p-0">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-sky/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge phase={phase} />
            {isReady && !gameRunning && (
              <span className="text-xs font-medium text-mint">Все проверки пройдены</span>
            )}
          </div>

          <div className="flex items-start gap-4">
            <ReadinessOrb
              ready={isReady && !gameRunning}
              active={busy}
              warn={!isReady && !busy && !gameRunning}
              running={gameRunning}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">{headline}</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{subline}</p>
              {gameDir && (
                <p
                  className="mt-2 truncate font-mono text-[11px] text-gray-600"
                  title={gameDir}
                >
                  {gameDir}
                </p>
              )}
            </div>
          </div>

          {manifestCount > 0 && hasFolder && (
            <div>
              <div className="mb-1.5 flex justify-between text-[11px] font-medium text-gray-500">
                <span>Модпак сервера</span>
                <span className="tabular-nums text-gray-400">
                  {modOkCount} / {manifestCount}
                  {pendingInstall > 0 && (
                    <span className="text-brand"> · +{pendingInstall} к загрузке</span>
                  )}
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

          <div className="flex flex-wrap gap-2">
            {!hasFolder && (
              <button type="button" className="btn-soft border-brand/40 bg-brand/15 text-brand" onClick={onSelectFolder}>
                Выбрать папку игры
              </button>
            )}
            {hasFolder && pendingInstall > 0 && !busy && (
              <button type="button" className="btn-soft border-brand/40 bg-brand/15 text-brand" onClick={onGoToMods}>
                Установить {pendingInstall} мод(ов)
              </button>
            )}
            {hasFolder && !isReady && !busy && pendingInstall === 0 && (
              <button type="button" className="btn-soft" onClick={onGoToMods}>
                Открыть моды
              </button>
            )}
            {hasFolder && gameDir && (
              <button type="button" className="btn-soft" onClick={onSelectFolder}>
                Сменить папку
              </button>
            )}
          </div>
        </div>

        <ol className="flex gap-2 lg:flex-col lg:gap-1.5 lg:pt-1">
          {STEPS.map((step, index) => {
            const stepIndex = STEPS.findIndex((s) => s.id === current);
            const done = index < stepIndex;
            const currentStep = index === stepIndex;
            return (
              <li
                key={step.id}
                className={`flex min-w-[100px] flex-1 flex-col rounded-xl border px-3 py-2.5 transition lg:min-w-[168px] lg:flex-none ${
                  done
                    ? "border-mint/25 bg-mint/5"
                    : currentStep
                      ? "border-brand/35 bg-brand/10 ring-1 ring-brand/20"
                      : "border-line bg-void/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      done
                        ? "bg-mint/20 text-mint"
                        : currentStep
                          ? "bg-brand/25 text-brand"
                          : "bg-panel-raised text-gray-600"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${currentStep ? "text-white" : "text-gray-400"}`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="mt-1 pl-8 text-[10px] text-gray-500">{step.hint}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function ReadinessOrb({
  ready,
  active,
  warn,
  running,
}: {
  ready: boolean;
  active: boolean;
  warn: boolean;
  running: boolean;
}) {
  const ring = running
    ? "from-emerald-400/40 to-brand/30"
    : ready
      ? "from-mint/50 to-brand/40"
      : active
        ? "from-sky/40 to-brand/30"
        : warn
          ? "from-brand/40 to-amber-500/20"
          : "from-gray-600/30 to-gray-700/20";

  const icon = running ? "●" : ready ? "✓" : active ? "…" : "!";

  return (
    <div
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ring} ring-2 ring-white/10`}
      aria-hidden
    >
      <span
        className={`text-xl font-black ${ready || running ? "text-white" : active ? "text-sky animate-pulse" : "text-brand"}`}
      >
        {icon}
      </span>
      {active && (
        <span className="absolute inset-0 animate-pulse rounded-2xl ring-2 ring-brand/40" />
      )}
    </div>
  );
}
