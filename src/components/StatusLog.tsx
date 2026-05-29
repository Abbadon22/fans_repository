import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
  onClear?: () => void;
}

export function StatusLog({ logs, onClear }: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="panel-title">Журнал</p>
        {onClear && logs.length > 0 && (
          <button type="button" className="btn-soft px-2 py-1 text-[10px]" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-void/40 p-3 font-mono text-[11px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <span className="text-gray-600">// ожидание событий</span>
        ) : (
          logs.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              className={`mb-1 whitespace-pre-wrap break-all border-l-2 pl-2 ${
                line.includes("Ошибка") || line.includes("⚠")
                  ? "border-brand text-amber-200/90"
                  : line.includes("Готово") || line.includes("актуальны")
                    ? "border-mint text-gray-300"
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
