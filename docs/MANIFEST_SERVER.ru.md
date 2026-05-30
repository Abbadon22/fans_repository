# Манифест модов

Лаунчер при каждой проверке запрашивает JSON по URL из `config.json`.

**Репозиторий:** [github.com/Abbadon22/fans_repository](https://github.com/Abbadon22/fans_repository)

По умолчанию:

```json
"manifest_url": "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json"
```

Zip-архивы модов лежат на **Яндекс.Диске** — ссылки в поле `url` каждой записи манифеста.

## Формат файла

```json
[
  {
    "archive": "MyMod.zip",
    "name": "MyMod",
    "names": ["MyModFolder"],
    "url": "https://disk.yandex.ru/d/XXXXXXXX",
    "sha256": "hex-хеш архива"
  }
]
```

- `url` — публичная ссылка Яндекс.Диск (`disk.yandex.ru/d/...`)
- `sha256` — хеш **скачанного zip** (лаунчер проверяет после загрузки)
- `names` — папки модов внутри архива

Лаунчер сам обращается к API Яндекс.Диска и скачивает файл по прямой ссылке.

## Обновить манифест

1. Положите zip в `Mods/` (локально, для SHA256).
2. Укажите ссылки в `scripts/mod-urls.json`.
3. `npm run manifest:sync`
4. Закоммитьте `manifest.json` в GitHub.

Пересборка лаунчера **не нужна** — достаточно push манифеста.

## Поведение лаунчера

1. Скачать `manifest_url` с GitHub
2. При ошибке — кэш (`.launcher-cache/manifest.json`)
3. Если кэша нет — встроенный `manifest.json` из сборки

При первом запуске v1.0.7+ старые URL (сервер `:22499`) мигрируют на GitHub.

## SHA256

```powershell
Get-FileHash -Path ".\MyMod.zip" -Algorithm SHA256
```

Или без локального zip:

```powershell
npm run manifest:sync -- --hash-from-yandex
```

---

## GitHub Releases (лаунчер)

Обновления **самого лаунчера** — через GitHub Releases (`tauri-plugin-updater`).
