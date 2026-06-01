import type { AppView } from "./CustomTitlebar";

interface MainQuickActionsProps {
  onNavigate: (view: AppView) => void;
  onOpenGameFolder: () => void;
  onOpenModsFolder: () => void;
  hasFolder: boolean;
  modsBadge?: number;
}

const NAV: { view: AppView; label: string; icon: string }[] = [
  { view: "mods", label: "Моды", icon: "◫" },
  { view: "log", label: "Журнал", icon: "≡" },
  { view: "settings", label: "Настройки", icon: "⚙" },
];

export function MainQuickActions({
  onNavigate,
  onOpenGameFolder,
  onOpenModsFolder,
  hasFolder,
  modsBadge,
}: MainQuickActionsProps) {
  return (
    <section className="panel shrink-0 p-3">
      <p className="panel-title mb-2">Быстрый доступ</p>
      <div className="flex gap-1.5">
        {NAV.map((item) => (
          <button
            key={item.view}
            type="button"
            onClick={() => onNavigate(item.view)}
            className="relative flex flex-1 flex-col items-center gap-1 rounded-lg border border-line bg-void/40 py-2.5 transition hover:border-brand/30 hover:bg-brand/5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel-raised text-sm text-brand">
              {item.icon}
            </span>
            <span className="text-[10px] font-semibold text-gray-300">{item.label}</span>
            {item.view === "mods" && modsBadge !== undefined && modsBadge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                {modsBadge}
              </span>
            )}
          </button>
        ))}
      </div>
      {hasFolder && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button type="button" className="btn-soft py-1.5 text-[10px]" onClick={onOpenGameFolder}>
            Папка игры
          </button>
          <button type="button" className="btn-soft py-1.5 text-[10px]" onClick={onOpenModsFolder}>
            Mods
          </button>
        </div>
      )}
    </section>
  );
}
