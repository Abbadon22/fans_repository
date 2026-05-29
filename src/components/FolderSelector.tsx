interface FolderSelectorProps {
  gameDir: string | null;
  disabled: boolean;
  onSelect: () => void;
}

export function FolderSelector({ gameDir, disabled, onSelect }: FolderSelectorProps) {
  return (
    <section className="panel flex h-full flex-col p-4">
      <p className="panel-title mb-3">Установка игры</p>
      <div
        className="input-field mb-3 min-h-[3rem] flex-1 truncate text-xs leading-relaxed"
        title={gameDir ?? undefined}
      >
        {gameDir ?? "Укажите папку Steam с 7 Days to Die"}
      </div>
      <button type="button" className="btn-soft w-full" disabled={disabled} onClick={onSelect}>
        Выбрать папку…
      </button>
      <p className="mt-2 text-[10px] text-gray-600">
        Файл <span className="font-mono text-gray-500">7DaysToDie.exe</span>
      </p>
    </section>
  );
}
