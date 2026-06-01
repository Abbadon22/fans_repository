import type { AppView } from "./CustomTitlebar";

interface AppSidebarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  modsBadge?: number;
  settingsBadge?: number;
  notificationCount?: number;
  isReady: boolean;
  pendingInstall: number;
}

const NAV: { id: AppView; label: string; icon: string }[] = [
  { id: "main", label: "Главная", icon: "⌂" },
  { id: "mods", label: "Моды", icon: "◫" },
  { id: "log", label: "Журнал", icon: "≡" },
  { id: "settings", label: "Настройки", icon: "⚙" },
];

export function AppSidebar({
  view,
  onViewChange,
  modsBadge,
  settingsBadge,
  notificationCount = 0,
  isReady,
  pendingInstall,
}: AppSidebarProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-line bg-panel/60 backdrop-blur-xl">
      <div className="shrink-0 border-b border-line px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand/90">
          Fans Group
        </p>
        <p className="mt-0.5 text-sm font-semibold text-white">7 Days to Die</p>
        <div className="mt-2.5 flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isReady
                ? "bg-mint shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : pendingInstall > 0
                  ? "animate-pulse bg-brand"
                  : "bg-gray-600"
            }`}
            aria-hidden
          />
          <span className="truncate text-xs text-gray-500">
            {isReady
              ? "Готов"
              : notificationCount > 0
                ? `${notificationCount} уведомл.`
                : pendingInstall > 0
                  ? `${pendingInstall} к загрузке`
                  : "Настройка"}
          </span>
        </div>
      </div>

      <nav className="flex shrink-0 flex-col gap-0.5 p-2">
        {NAV.map((item) => (
          <NavItem
            key={item.id}
            active={view === item.id}
            label={item.label}
            icon={item.icon}
            badge={
              item.id === "mods"
                ? modsBadge
                : item.id === "settings"
                  ? settingsBadge
                  : undefined
            }
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavItem({
  active,
  label,
  icon,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
        active
          ? "bg-brand/15 text-white ring-1 ring-brand/30"
          : "text-gray-400 hover:bg-panel-raised/80 hover:text-gray-200"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${
          active ? "bg-brand/20 text-brand" : "bg-void/60 text-gray-500"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
