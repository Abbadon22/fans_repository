import type { UpdateNotification, UpdateNotificationAction } from "../types/updates";

interface UpdateNotificationsBarProps {
  notifications: UpdateNotification[];
  busy?: boolean;
  installingLauncher?: boolean;
  onAction: (action: UpdateNotificationAction, notification: UpdateNotification) => void;
  onDismiss: (notification: UpdateNotification) => void;
}

const KIND_STYLES: Record<
  UpdateNotification["kind"],
  { border: string; icon: string; accent: string }
> = {
  launcher: {
    border: "border-sky-500/35",
    icon: "⬆",
    accent: "text-sky-300",
  },
  manifest: {
    border: "border-violet-500/35",
    icon: "📋",
    accent: "text-violet-300",
  },
  mods_install: {
    border: "border-brand/40",
    icon: "⬇",
    accent: "text-brand",
  },
  mods_issues: {
    border: "border-amber-500/40",
    icon: "⚠",
    accent: "text-amber-300",
  },
};

export function UpdateNotificationsBar({
  notifications,
  busy,
  installingLauncher,
  onAction,
  onDismiss,
}: UpdateNotificationsBarProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-line bg-void/40 px-3 py-2">
      <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
        Уведомления
      </p>
      <div className="flex max-h-[min(40vh,220px)] flex-col gap-2 overflow-y-auto">
        {notifications.map((n) => {
          const style = KIND_STYLES[n.kind];
          const primaryDisabled =
            busy && (n.primaryAction === "install_mods" || n.primaryAction === "install_launcher");
          const launcherLoading = installingLauncher && n.primaryAction === "install_launcher";

          return (
            <article
              key={n.id}
              className={`flex items-start gap-3 rounded-xl border bg-panel/90 px-3 py-2.5 shadow-panel ${style.border}`}
              role="status"
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-void/80 text-base ${style.accent}`}
                aria-hidden
              >
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{n.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary px-3 py-1.5 text-xs"
                    disabled={primaryDisabled || launcherLoading}
                    onClick={() => onAction(n.primaryAction, n)}
                  >
                    {launcherLoading ? "Установка…" : n.primaryLabel}
                  </button>
                  {n.dismissible !== false && (
                    <button
                      type="button"
                      className="btn-soft px-3 py-1.5 text-xs"
                      disabled={launcherLoading}
                      onClick={() => onDismiss(n)}
                    >
                      Позже
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
