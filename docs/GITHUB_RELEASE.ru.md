# GitHub: релизы и автообновление

Репозиторий: [Abbadon22/fans_repository](https://github.com/Abbadon22/fans_repository)

| Файл | Назначение |
|------|------------|
| `manifest.json` (корень репо) | Список модов для лаунчера |
| GitHub Release `v1.0.0` | Установщик `.exe` + `latest.json` для автообновления |

## Секрет GitHub Actions

В репозитории: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Значение |
|--------|----------|
| `TAURI_SIGNING_PRIVATE_KEY` | Содержимое файла `src-tauri/keys/fans-launcher.key` (локально, **не коммитить**) |

Публичный ключ уже в `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).

## Новый релиз

1. Поднимите версию в `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
2. Закоммитьте и запушьте.
3. Создайте тег и запушьте:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

Workflow `.github/workflows/release.yml` соберёт NSIS-установщик и опубликует Release с `latest.json`.

## Локальная сборка с подписью

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = "src-tauri\keys\fans-launcher.key"
npm run tauri:build
```

Артефакты: `src-tauri\target\release\bundle\nsis\`

## Автообновление у игроков

При запуске лаунчер проверяет:

`https://github.com/Abbadon22/fans_repository/releases/latest/download/latest.json`

Если версия новее — скачивает и переустанавливает (нужен установленный через `.exe` вариант, не dev).
