import type { ModManifestEntry, ModCheckResult } from "../types";
import { modStatuses } from "../utils/mods";

interface ModsPanelProps {
  manifest: ModManifestEntry[];
  manifestSource: string | null;
  modCheck: ModCheckResult | null;
  busy: boolean;
  onRefresh: () => void;
}

export function ModsPanel({
  manifest,
  manifestSource,
  modCheck,
  busy,
  onRefresh,
}: ModsPanelProps) {
  const items = modStatuses(manifest, modCheck);
  const okCount = items.filter((i) => i.status === "ok").length;

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="panel-title">Модпак</p>
            {manifest.length > 0 && (
              <span className="rounded-md bg-void/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-gray-400">
                {okCount}/{manifest.length}
              </span>
            )}
          </div>
          {manifestSource && (
            <p className="mt-0.5 truncate text-[10px] text-gray-600" title={manifestSource}>
              {manifestSource}
            </p>
          )}
        </div>
        <button type="button" className="btn-soft shrink-0" disabled={busy} onClick={onRefresh}>
          {busy ? "…" : "Обновить"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        {manifest.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              ◫
            </div>
            <p className="text-sm text-gray-400">Манифест пуст</p>
            <p className="max-w-xs text-[11px] text-gray-600">
              Добавьте zip в Mods/ и выполните npm run manifest:sync
            </p>
          </div>
        ) : (
          <ul className="space-y-2 overflow-y-auto pr-0.5">
            {items.map((item) => (
              <li
                key={item.key}
                className="group rounded-xl border border-line bg-void/30 px-3 py-2.5 transition hover:border-line-strong hover:bg-void/50"
                title={item.detail}
              >
                <div className="flex items-start gap-3">
                  <StatusDot status={item.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-100">{item.name}</p>
                      {item.archive && (
                        <span className="shrink-0 rounded bg-panel-raised px-1.5 py-0.5 font-mono text-[9px] text-gray-500">
                          {item.archive}
                        </span>
                      )}
                    </div>
                    {item.folders.length > 1 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.folders.map((folder) => (
                          <span
                            key={folder}
                            className="rounded-md border border-line bg-panel/60 px-1.5 py-0.5 font-mono text-[9px] text-gray-400"
                          >
                            {folder}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.detail && (
                      <p className="mt-1 truncate text-[10px] text-amber-200/70">{item.detail}</p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatusDot({ status }: { status: "ok" | "missing" | "unknown" }) {
  const cls =
    status === "ok"
      ? "bg-mint shadow-[0_0_10px_rgba(52,211,153,0.45)]"
      : status === "missing"
        ? "bg-brand shadow-[0_0_10px_rgba(255,107,44,0.45)] animate-pulse"
        : "bg-gray-600";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function StatusPill({ status }: { status: "ok" | "missing" | "unknown" }) {
  const cls =
    status === "ok"
      ? "bg-mint/10 text-mint ring-mint/20"
      : status === "missing"
        ? "bg-brand/10 text-brand ring-brand/20"
        : "bg-panel-raised text-gray-500 ring-line";
  const label = status === "ok" ? "OK" : status === "missing" ? "Нужен" : "—";
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}>
      {label}
    </span>
  );
}
