import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
  hideHeader?: boolean;
}

export function StatusLog({
  logs,
  onClear,
  onExport,
  className = "",
  hideHeader = false,
}: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden ${
        hideHeader ? className : `panel h-full p-0 ${className}`
      }`}
    >
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between gap-1 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            <p className="panel-title">Журнал</p>
            <p className="text-[10px] text-gray-600">{logs.length} записей</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {onExport && logs.length > 0 && (
              <button
                type="button"
                className="btn-soft px-2.5 py-1 text-xs"
                onClick={onExport}
                title="Сохранить в файл"
              >
                Сохранить
              </button>
            )}
            {onClear && logs.length > 0 && (
              <button
                type="button"
                className="btn-soft px-2.5 py-1 text-xs"
                onClick={onClear}
                title="Очистить"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        className={`scroll-area min-h-0 flex-1 overflow-y-auto bg-void/50 p-4 font-mono text-[11px] leading-relaxed ${
          hideHeader ? "panel rounded-xl" : ""
        }`}
      >
        {logs.length === 0 ? (
          <p className="text-gray-600">
            Здесь появятся события: проверка модов, загрузка, запуск игры…
          </p>
        ) : (
          logs.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              className={`mb-1.5 whitespace-pre-wrap break-all rounded-md border-l-2 py-0.5 pl-2.5 ${
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
