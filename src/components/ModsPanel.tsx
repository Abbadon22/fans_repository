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

  return (
    <section className="panel flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="panel-title">Модпак</p>
          {manifestSource && (
            <p className="truncate text-[10px] text-gray-600" title={manifestSource}>
              {manifestSource}
            </p>
          )}
        </div>
        <button type="button" className="btn-soft shrink-0" disabled={busy} onClick={onRefresh}>
          Обновить
        </button>
      </div>

      {manifest.length === 0 ? (
        <p className="text-sm text-gray-500">Манифест пуст</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-0.5">
          {items.map((item) => (
            <li
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-line bg-void/40 px-3 py-2.5"
              title={item.detail}
            >
              <StatusDot status={item.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-100">{item.name}</p>
                {item.detail && (
                  <p className="truncate text-[10px] text-gray-500">{item.detail}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                  item.status === "ok"
                    ? "bg-mint/10 text-mint"
                    : item.status === "missing"
                      ? "bg-brand/10 text-brand"
                      : "bg-panel-raised text-gray-500"
                }`}
              >
                {item.status === "ok" ? "OK" : item.status === "missing" ? "Нужен" : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusDot({ status }: { status: "ok" | "missing" | "unknown" }) {
  const cls =
    status === "ok"
      ? "bg-mint shadow-[0_0_8px_rgba(52,211,153,0.5)]"
      : status === "missing"
        ? "bg-brand shadow-[0_0_8px_rgba(255,107,44,0.5)]"
        : "bg-gray-600";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden />;
}
