interface FolderSelectorProps {
  gameDir: string | null;
  disabled: boolean;
  onSelect: () => void;
}

/** Выбор папки с установленной игрой. */
export function FolderSelector({
  gameDir,
  disabled,
  onSelect,
}: FolderSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
        Папка игры
      </label>
      <div className="flex gap-2">
        <div
          className="min-w-0 flex-1 truncate rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-gray-300"
          title={gameDir ?? undefined}
        >
          {gameDir ?? "Не выбрана"}
        </div>
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className="shrink-0 rounded-lg border border-surface-border bg-surface-elevated px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Обзор…
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Должен содержать <code className="text-gray-400">7DaysToDie.exe</code>
      </p>
    </div>
  );
}
