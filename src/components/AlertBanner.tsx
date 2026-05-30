interface AlertBannerProps {
  variant: "warn" | "error" | "info";
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANTS = {
  warn: "border-brand/30 bg-brand/10 text-emerald-100",
  error: "border-red-500/30 bg-red-500/10 text-red-200",
  info: "border-sky/30 bg-sky/10 text-sky-100",
};

export function AlertBanner({ variant, title, message, actionLabel, onAction }: AlertBannerProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${VARIANTS[variant]}`}
      role="alert"
    >
      <div className="min-w-0">
        <p className="text-base font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm opacity-80">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" className="btn-soft shrink-0 border-current/20" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
