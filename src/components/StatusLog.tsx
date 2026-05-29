import { useEffect, useRef } from "react";

interface StatusLogProps {
  logs: string[];
}

/** Консоль логов внизу окна. */
export function StatusLog({ logs }: StatusLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex min-h-[140px] flex-1 flex-col rounded-lg border border-surface-border bg-black/40">
      <div className="border-b border-surface-border px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        Лог
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-gray-300">
        {logs.length === 0 ? (
          <span className="text-gray-600">Ожидание событий…</span>
        ) : (
          logs.map((line, i) => (
            <div key={`${i}-${line.slice(0, 24)}`} className="whitespace-pre-wrap break-all">
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
