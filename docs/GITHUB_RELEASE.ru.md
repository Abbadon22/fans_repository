# GitHub: manifest и релизы лаунчера

Репозиторий: [Abbadon22/fans_repository](https://github.com/Abbadon22/fans_repository)

| Файл | Назначение |
|------|------------|
| `manifest.json` (корень репо) | Список модов — лаунчер подтягивает при каждом запуске |
| GitHub Release `v*` | Установщик `.exe` для друзей (без автообновления) |

## Манифест модов

Лаунчер по умолчанию читает:

`https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json`

Обновите `manifest.json` в репо — игроки получат новый список модов при следующем запуске лаунчера.

## Сборка установщика

```powershell
npm install
npm run tauri:build
```

Готовый файл:

`src-tauri\target\release\bundle\nsis\Fans Launcher_1.0.0_x64-setup.exe`

Подпись ключей и `latest.json` **не нужны** — раздаёте `.exe` вручную (Discord, Release и т.д.).

## CI-релиз (опционально)

```powershell
git tag v1.0.1
git push origin v1.0.1
```

Workflow `.github/workflows/release.yml` соберёт NSIS без updater-артефактов.
