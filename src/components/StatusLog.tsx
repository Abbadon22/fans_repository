import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
  onClear?: () => void;
  onExport?: () => void;
  embedded?: boolean;
  className?: string;
}

export function StatusLog({
  logs,
  onClear,
  onExport,
  embedded = false,
  className = "",
}: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const body = (
    <>
      {(onClear || onExport) && logs.length > 0 && (
        <div className="flex justify-end gap-2 border-b border-line px-3 py-2">
          {onExport && (
            <button type="button" className="btn-soft px-2 py-1 text-xs" onClick={onExport}>
              Сохранить
            </button>
          )}
          {onClear && (
            <button type="button" className="btn-soft px-2 py-1 text-xs" onClick={onClear}>
              Очистить
            </button>
          )}
        </div>
      )}
      <div
        ref={scrollRef}
        className={`scroll-area overflow-y-auto font-mono text-xs leading-relaxed ${
          embedded ? "max-h-48 p-3" : "flex-1 p-3"
        }`}
      >
        {logs.length === 0 ? (
          <span className="text-gray-600">Пока пусто</span>
        ) : (
          logs.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              className={`mb-1 whitespace-pre-wrap break-all ${
                line.includes("Ошибка") || line.includes("⚠")
                  ? "text-brand/90"
                  : "text-gray-500"
              }`}
            >
              {line}
            </div>
          ))
        )}
      </div>
    </>
  );

  if (embedded) return <div className={className}>{body}</div>;

  return (
    <section className={`panel flex min-h-0 flex-col overflow-hidden p-0 ${className}`}>
      {body}
    </section>
  );
}
