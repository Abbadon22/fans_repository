import { StatusLog } from "./StatusLog";
import { ViewHeader } from "./ViewHeader";

interface LogViewProps {
  logs: string[];
  onClear: () => void;
  onExport: () => void;
}

export function LogView({ logs, onClear, onExport }: LogViewProps) {
  const subtitle =
    logs.length === 0
      ? "Проверка модов, загрузка, запуск игры…"
      : `${logs.length} ${logs.length === 1 ? "запись" : logs.length < 5 ? "записи" : "записей"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ViewHeader
        title="Журнал"
        subtitle={subtitle}
        action={
          <div className="flex shrink-0 gap-2">
            {logs.length > 0 && (
              <>
                <button type="button" className="btn-soft px-3 py-1.5 text-xs" onClick={onExport}>
                  Сохранить
                </button>
                <button type="button" className="btn-soft px-3 py-1.5 text-xs" onClick={onClear}>
                  Очистить
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4 pb-6">
        <StatusLog logs={logs} hideHeader className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
