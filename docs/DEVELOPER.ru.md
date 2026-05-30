# Документация для разработчика / администратора

Исходники этого репозитория **не предназначены для распространения игрокам**.  
Игрокам выдаётся только **установщик** с [GitHub Releases](https://github.com/Abbadon22/fans_repository/releases).

Публичный [README.md](../README.md) — для обычных пользователей.

---

## Репозиторий

| Что | Где |
|-----|-----|
| Код лаунчера | `main` (приватная разработка) |
| `manifest.json` | корень + `public/` — список модов для игроков |
| Релизы | тег `v*` → CI → NSIS `.exe` + `latest.json` |

Подробно про CI и подпись: [GITHUB_RELEASE.ru.md](./GITHUB_RELEASE.ru.md).

---

## Требования для сборки

- Node.js 18+
- Rust (stable)
- Visual Studio Build Tools (C++), Windows

```powershell
npm install
npm run tauri:dev      # разработка
npm run tauri:build    # установщик NSIS
```

Готовый установщик: `src-tauri\target\release\bundle\nsis\`.

---

## Манифест модов

1. Zip в `Mods/` (для SHA256 и имён папок).
2. Ссылки Яндекс.Диск в `scripts/mod-urls.json`.
3. Синхронизация:

```powershell
npm run manifest:sync
```

4. Commit + push `manifest.json` — игрокам пересборка лаунчера не нужна.

Без локальных zip:

```powershell
npm run manifest:sync -- --hash-from-yandex
```

Сопоставление URL по SHA256: `node scripts/map-yandex-urls.mjs`.

Подробнее: [MANIFEST_SERVER.ru.md](./MANIFEST_SERVER.ru.md) (если есть).

---

## Версия релиза

Одинаковая версия в:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src/constants.ts` → `APP_VERSION`

Публикация:

```powershell
git tag v1.0.x
git push origin main
git push origin v1.0.x
```

Workflow: `.github/workflows/release.yml` (только артефакты релиза, не исходники для игроков).

---

## Маркеры модов

После установки лаунчер пишет хеши в:

```text
<GameDir>/Mods/.launcher-meta/<имя_папки>.sha256
```

---

## Конфиг

Шаблон: [config.example.json](../config.example.json).  
При первом запуске создаётся `config.json` рядом с `.exe` лаунчера.
