interface FolderSelectorProps {
  gameDir: string | null;
  disabled: boolean;
  onSelect: () => void;
}

export function FolderSelector({ gameDir, disabled, onSelect }: FolderSelectorProps) {
  return (
    <section className="panel p-4">
      <p className="panel-title mb-3">Папка игры</p>
      <div
        className="input-field mb-3 min-h-[3rem] truncate font-mono text-xs leading-relaxed text-gray-400"
        title={gameDir ?? undefined}
      >
        {gameDir ?? "Укажите папку Steam с 7 Days to Die"}
      </div>
      <button type="button" className="btn-soft w-full" disabled={disabled} onClick={onSelect}>
        {gameDir ? "Сменить папку…" : "Выбрать папку…"}
      </button>
      <p className="mt-2 text-[10px] text-gray-600">
        В каталоге должен быть <span className="font-mono text-gray-500">7DaysToDie.exe</span>
      </p>
    </section>
  );
}
