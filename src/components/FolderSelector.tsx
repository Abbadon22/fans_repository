interface FolderSelectorProps {
  gameDir: string | null;
  disabled: boolean;
  onSelect: () => void;
}

export function FolderSelector({ gameDir, disabled, onSelect }: FolderSelectorProps) {
  return (
    <section className="panel p-4 lg:max-w-2xl">
      <p className="panel-title mb-3">Папка игры</p>
      <div
        className="input-field mb-3 min-h-[3.25rem] truncate font-mono text-sm leading-relaxed text-gray-300"
        title={gameDir ?? undefined}
      >
        {gameDir ?? "Укажите папку Steam с 7 Days to Die"}
      </div>
      <button type="button" className="btn-soft w-full sm:w-auto" disabled={disabled} onClick={onSelect}>
        {gameDir ? "Сменить папку…" : "Выбрать папку…"}
      </button>
      <p className="mt-2 text-sm text-gray-500">
        В каталоге должен быть{" "}
        <span className="font-mono text-gray-400">7DaysToDie.exe</span>
      </p>
    </section>
  );
}
