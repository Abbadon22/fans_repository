# Mods — zip-архивы модов

## Добавление мода

1. Положите `.zip` в эту папку.
2. В корне проекта: `npm run manifest:sync`
3. Закоммитьте `manifest.json` и zip (если ≤95 MB).

## Большие файлы (>95 MB)

GitHub **не принимает** файлы больше 100 MB в репозиторий.

Пример: `BdubsVehicles.zip` (~339 MB) — в `.gitignore`, URL в манифесте ведёт на **Release**:

`https://github.com/Abbadon22/fans_repository/releases/download/mods/BdubsVehicles.zip`

### Загрузка в Release `mods`

1. https://github.com/Abbadon22/fans_repository/releases
2. **Draft a new release** (или отредактируйте существующий)
3. Tag: `mods` (имя должно совпадать с `--release-tag` в скрипте)
4. Прикрепите большие zip как assets
5. **Publish release**

Лаунчер скачает по URL из `manifest.json` — редиректы GitHub поддерживаются.
