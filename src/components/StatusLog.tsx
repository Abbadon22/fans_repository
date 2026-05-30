import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
  /** Встроенный вид для боковой панели */
  variant?: "panel" | "sidebar";
}

export function StatusLog({
  logs,
  onClear,
  onExport,
  className = "",
  variant = "panel",
}: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sidebar = variant === "sidebar";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden ${
        sidebar ? "flex-1 bg-void/40" : `panel h-full p-0 ${className}`
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-1 border-line ${
          sidebar ? "border-t px-2 py-2" : "border-b px-4 py-2.5"
        }`}
      >
        <div className="min-w-0">
          <p className={sidebar ? "text-[10px] font-bold uppercase tracking-wide text-gray-500" : "panel-title"}>
            Журнал
          </p>
          {!sidebar && <p className="text-[10px] text-gray-600">{logs.length} записей</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          {onExport && logs.length > 0 && (
            <button
              type="button"
              className={`btn-soft ${sidebar ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
              onClick={onExport}
              title="Сохранить в файл"
            >
              {sidebar ? "↓" : "Сохранить"}
            </button>
          )}
          {onClear && logs.length > 0 && (
            <button
              type="button"
              className={`btn-soft ${sidebar ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
              onClick={onClear}
              title="Очистить"
            >
              {sidebar ? "×" : "Очистить"}
            </button>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className={`scroll-area min-h-0 flex-1 overflow-y-auto font-mono leading-relaxed ${
          sidebar ? "px-2 py-2 text-[10px]" : "bg-void/50 p-4 text-[11px]"
        }`}
      >
        {logs.length === 0 ? (
          <p className="text-gray-600">
            {sidebar ? "События появятся здесь…" : "Здесь появятся события: проверка модов, загрузка, запуск игры…"}
          </p>
        ) : (
          logs.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              className={`mb-1 whitespace-pre-wrap break-all border-l-2 pl-2 ${
                sidebar ? "py-0" : "mb-1.5 rounded-md py-0.5 pl-2.5"
              } ${
                line.includes("Ошибка") || line.includes("⚠")
                  ? "border-brand/80 text-emerald-100/90"
                  : line.includes("Готово") ||
                      line.includes("актуальны") ||
                      line.includes("установлен")
                    ? "border-mint/60 text-gray-300"
                    : "border-transparent text-gray-500"
              }`}
            >
              {line}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
