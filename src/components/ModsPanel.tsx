import type { ModManifestEntry, ModCheckResult } from "../types";
import { modStatuses } from "../utils/mods";

interface ModsPanelProps {
  manifest: ModManifestEntry[];
  modCheck: ModCheckResult | null;
  busy: boolean;
}

export function ModsPanel({ manifest, modCheck, busy }: ModsPanelProps) {
  const items = modStatuses(manifest, modCheck);

  if (manifest.length === 0) {
    return (
      <div className="panel flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <p className="text-gray-400">Манифест пуст</p>
        <p className="text-sm text-gray-600">Нажмите «Проверить»</p>
      </div>
    );
  }

  return (
    <ul className="scroll-area panel min-h-0 flex-1 divide-y divide-line overflow-y-auto p-1">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-3 rounded-lg px-4 py-3 transition hover:bg-white/[0.02]"
          title={item.detail}
        >
          <StatusDot status={item.status} />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100">{item.name}</p>
          <StatusLabel status={item.status} busy={busy} />
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { status: "ok" | "missing" | "unknown" }) {
  const cls =
    status === "ok"
      ? "bg-mint"
      : status === "missing"
        ? "bg-brand animate-pulse"
        : "bg-gray-600";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function StatusLabel({
  status,
  busy,
}: {
  status: "ok" | "missing" | "unknown";
  busy: boolean;
}) {
  if (busy && status === "unknown") {
    return <span className="text-xs text-gray-600">…</span>;
  }
  const label = status === "ok" ? "OK" : status === "missing" ? "Нужен" : "—";
  const cls =
    status === "ok"
      ? "text-mint"
      : status === "missing"
        ? "text-brand"
        : "text-gray-600";
  return <span className={`shrink-0 text-xs font-semibold uppercase ${cls}`}>{label}</span>;
}
