import { useMemo, useState } from "react";
import type { ModManifestEntry, ModCheckResult } from "../types";
import { useModal } from "../context/ModalContext";
import { countBySide, modSideShort } from "../utils/modSide";
import { clientInstallRows, modStatuses, type ModInstallStatus } from "../utils/mods";

interface ModsPanelProps {
  manifest: ModManifestEntry[];
  modCheck: ModCheckResult | null;
  pendingInstall: number;
  busy: boolean;
  onRefresh: () => void;
  onOpenModsFolder?: () => void;
  onRemoveMod?: (modName: string) => void;
  onReinstallAll?: () => void;
  hideHeader?: boolean;
}

export function ModsPanel({
  manifest,
  modCheck,
  pendingInstall,
  busy,
  onRefresh,
  onOpenModsFolder,
  onRemoveMod,
  onReinstallAll,
  hideHeader = false,
}: ModsPanelProps) {
  const { confirm } = useModal();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "missing" | "ok">("all");

  const items = modStatuses(manifest, modCheck);
  const clientItems = clientInstallRows(items);
  const sideCounts = countBySide(manifest);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "missing" && item.status !== "missing") return false;
      if (filter === "ok" && item.status !== "ok" && item.status !== "server_skip") return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.archive?.toLowerCase().includes(q) ?? false) ||
        item.folders.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [items, query, filter]);

  const okCount = clientItems.filter((i) => i.status === "ok").length;
  const missingCount = clientItems.filter((i) => i.status === "missing").length;
  const removed = modCheck?.removed ?? [];

  const handleReinstallAll = async () => {
    const n = sideCounts.clientInstall;
    const ok = await confirm({
      title: "Переустановить моды?",
      message: `Будут удалены и скачаны заново ${n} мод(ов) для вашего ПК.`,
      confirmLabel: "Переустановить",
      cancelLabel: "Отмена",
      variant: "danger",
    });
    if (ok) onReinstallAll?.();
  };

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      {!hideHeader && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="panel-title">Модпак</p>
              {manifest.length > 0 && (
                <span className="rounded-md bg-void/80 px-2 py-0.5 text-xs font-bold tabular-nums text-gray-300">
                  {okCount}/{sideCounts.clientInstall}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {onReinstallAll && sideCounts.clientInstall > 0 && (
              <button
                type="button"
                className="btn-soft border-amber-500/30 text-amber-200/90"
                disabled={busy}
                onClick={() => void handleReinstallAll()}
              >
                Переустановить все
              </button>
            )}
            <button type="button" className="btn-soft" disabled={busy} onClick={onRefresh}>
              {busy ? "…" : "Обновить"}
            </button>
            {onOpenModsFolder && (
              <button type="button" className="btn-soft" disabled={busy} onClick={onOpenModsFolder}>
                Mods/
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {manifest.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <input
              type="search"
              className="input-field min-w-[140px] flex-1"
              placeholder="Поиск мода…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={busy}
            />
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Все
            </FilterChip>
            <FilterChip active={filter === "missing"} onClick={() => setFilter("missing")}>
              Нужны
            </FilterChip>
            <FilterChip active={filter === "ok"} onClick={() => setFilter("ok")}>
              Готовы
            </FilterChip>
          </div>
        )}

        {manifest.length > 0 && (
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <StatCard label="К установке" value={sideCounts.clientInstall} tone="neutral" />
            <StatCard label="Готово" value={okCount} tone="ok" />
            <StatCard
              label="К загрузке"
              value={pendingInstall > 0 ? pendingInstall : missingCount}
              tone={pendingInstall > 0 || missingCount > 0 ? "warn" : "neutral"}
            />
          </div>
        )}

        {removed.length > 0 && !busy && (
          <div className="shrink-0 rounded-xl border border-line-strong bg-void/50 px-4 py-3 text-sm text-gray-300">
            <p className="font-semibold text-gray-200">Удалено с диска</p>
            <p className="mt-1 text-xs text-gray-500">{removed.join(", ")}</p>
          </div>
        )}

        {manifest.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-lg text-brand">
              ◫
            </div>
            <p className="text-base text-gray-300">Манифест пуст</p>
            <p className="max-w-sm text-sm text-gray-500">
              Обновите список или проверьте manifest.json на GitHub
            </p>
          </div>
        ) : pendingInstall > 0 && !busy ? (
          <div className="shrink-0 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3 text-sm text-emerald-100/90">
            <span className="font-semibold">{pendingInstall} мод(ов)</span> будут скачаны на ваш ПК.
          </div>
        ) : missingCount > 0 && !busy ? (
          <div className="shrink-0 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3 text-sm text-emerald-100/90">
            <span className="font-semibold">{missingCount} мод(ов)</span> требуют установки —
            нажмите «Установить» внизу.
          </div>
        ) : null}

        {manifest.length > 0 && (
          <ul className="scroll-area min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm text-gray-500">Ничего не найдено</li>
            ) : (
              filtered.map((item, index) => (
                <ModRow
                  key={item.key}
                  index={index}
                  item={item}
                  busy={busy}
                  onRemoveMod={onRemoveMod}
                />
              ))
            )}
          </ul>
        )}
      </div>
    </section>
  );
}

function ModRow({
  index,
  item,
  busy,
  onRemoveMod,
}: {
  index: number;
  item: ReturnType<typeof modStatuses>[number];
  busy: boolean;
  onRemoveMod?: (modName: string) => void;
}) {
  const { confirm } = useModal();

  const handleRemove = async () => {
    if (item.status === "server_skip") return;
    const ok = await confirm({
      title: `Удалить «${item.name}»?`,
      message: `Будут удалены папки:\n${item.folders.join("\n")}`,
      confirmLabel: "Удалить",
      cancelLabel: "Отмена",
      variant: "danger",
    });
    if (ok) onRemoveMod?.(item.name);
  };

  return (
    <li
      className="group rounded-xl border border-line bg-void/30 px-4 py-3 transition hover:border-line-strong hover:bg-void/50"
      title={item.detail}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-gray-600">
          {String(index + 1).padStart(2, "0")}
        </span>
        <StatusDot status={item.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium text-gray-100">{item.name}</p>
            <SideBadge side={item.side} />
            {item.archive && (
              <span className="shrink-0 rounded bg-panel-raised px-2 py-0.5 font-mono text-[11px] text-gray-400">
                {item.archive}
              </span>
            )}
          </div>
          {(item.folders.length > 1 || item.folders[0] !== item.name) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.folders.map((folder) => (
                <span
                  key={folder}
                  className="rounded-md border border-line bg-panel/60 px-2 py-0.5 font-mono text-[11px] text-gray-400"
                >
                  {folder}
                </span>
              ))}
            </div>
          )}
          {item.detail && (
            <p className="mt-1.5 text-xs text-emerald-200/70">{item.detail}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={item.status} />
          {onRemoveMod && item.status !== "server_skip" && (
            <button
              type="button"
              className="rounded-lg border border-line px-2 py-1 text-[10px] font-medium text-gray-500 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
              disabled={busy}
              title="Удалить мод с диска"
              onClick={() => void handleRemove()}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function SideBadge({ side }: { side: string }) {
  const short = modSideShort(side);
  const cls =
    side === "server"
      ? "bg-sky-500/15 text-sky-300 ring-sky-500/25"
      : side === "client"
        ? "bg-violet-500/15 text-violet-300 ring-violet-500/25"
        : "bg-amber-500/10 text-amber-200/90 ring-amber-500/20";
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}>
      {short}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-brand/15 text-brand ring-1 ring-brand/30"
          : "border border-line bg-void/50 text-gray-500 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "neutral";
}) {
  const valueCls =
    tone === "ok" ? "text-mint" : tone === "warn" ? "text-brand" : "text-white";
  return (
    <div className="rounded-xl border border-line bg-void/40 px-3 py-2.5 text-center">
      <p className={`text-xl font-bold tabular-nums ${valueCls}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: ModInstallStatus }) {
  const cls =
    status === "ok"
      ? "bg-mint shadow-[0_0_10px_rgba(52,211,153,0.45)]"
      : status === "missing"
        ? "bg-brand shadow-[0_0_10px_rgba(16,185,129,0.45)] animate-pulse"
        : status === "server_skip"
          ? "bg-sky-500/80"
          : "bg-gray-600";
  return <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function StatusPill({ status }: { status: ModInstallStatus }) {
  const cls =
    status === "ok"
      ? "bg-mint/10 text-mint ring-mint/20"
      : status === "missing"
        ? "bg-brand/10 text-brand ring-brand/20"
        : status === "server_skip"
          ? "bg-sky-500/10 text-sky-300 ring-sky-500/20"
          : "bg-panel-raised text-gray-500 ring-line";
  const label =
    status === "ok"
      ? "Готов"
      : status === "missing"
        ? "Нужен"
        : status === "server_skip"
          ? "Сервер"
          : "Ожидание";
  return (
    <span
      className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase ring-1 ${cls}`}
    >
      {label}
    </span>
  );
}
