import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
}

export function StatusLog({ logs, onClear, onExport, className = "" }: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <section className={`panel flex h-full min-h-0 flex-col overflow-hidden p-0 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div>
          <p className="panel-title">Журнал</p>
          <p className="text-[10px] text-gray-600">{logs.length} записей</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {onExport && logs.length > 0 && (
            <button type="button" className="btn-soft px-2.5 py-1 text-xs" onClick={onExport}>
              Сохранить
            </button>
          )}
          {onClear && logs.length > 0 && (
            <button type="button" className="btn-soft px-2.5 py-1 text-xs" onClick={onClear}>
              Очистить
            </button>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="scroll-area min-h-0 flex-1 overflow-y-auto bg-void/50 p-4 font-mono text-[11px] leading-relaxed"
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
                  ? "border-brand/80 bg-brand/5 text-emerald-100/90"
                  : line.includes("Готово") ||
                      line.includes("актуальны") ||
                      line.includes("установлен")
                    ? "border-mint/60 bg-mint/5 text-gray-300"
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
