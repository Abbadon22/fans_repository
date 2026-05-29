# Fans Launcher — 7 Days to Die

Лаунчер для закрытой группы (Steam-версия): выбор папки игры, проверка/установка модов по манифесту, запуск с `-connect` и `-password`.

## Требования

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload) — для Windows

## Установка зависимостей

```bash
npm install
```

## Настройка перед сборкой

1. **`public/manifest.json`** — укажите прямые URL (или публичные ключи Яндекс.Диска) и реальные SHA256 ZIP-архивов модов.
2. **`config.json`** — создаётся автоматически при первом запуске рядом с `.exe` лаунчера. Скопируйте `config.example.json` и задайте:
   - `server_ip`, `server_port`, `server_password`
   - `game_dir` — заполнится после выбора папки в UI

### SHA256 архива

```powershell
Get-FileHash -Path mod.zip -Algorithm SHA256
```

### Яндекс.Диск

В `manifest.json` можно использовать:

```text
https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=<URL-encoded public link>
```

Лаунчер получит JSON с полем `href` и скачает файл по прямой ссылке (с поддержкой HTTP-редиректов).

## Интерактивная карта сервера (`webmap/`)

Отдельный проект на Leaflet + API Alloc/Web Dashboard:
- игроки онлайн/оффлайн, land claims, враги, пользовательские метки
- real-time через polling API

```bash
cd webmap
npm install
cp public/config.example.json public/config.json
npm run dev
```

Подробности: [webmap/README.md](webmap/README.md)

## Разработка

```bash
npm run tauri:dev
```

## Сборка релиза

```bash
npm run tauri:build
```

Готовый установщик/EXE: `src-tauri/target/release/bundle/`.

Рядом с собранным `fans-launcher.exe` (или в папке установки) лежит **`config.json`** — редактируйте параметры сервера там же.

## Структура Mods

После установки:

```text
<GameDir>/Mods/
  ServerCore/
    .launcher_sha256
    ...
  QOL_Pack/
    ...
```

## Безопасность

- Проверка SHA256 перед распаковкой
- Защита от Zip Slip при извлечении
- Валидация `7DaysToDie.exe` и путей записи
