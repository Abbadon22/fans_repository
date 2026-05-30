# Манифест модов

Лаунчер при каждой проверке запрашивает JSON по URL из `config.json`.

**Репозиторий Fans:** [github.com/Abbadon22/fans_repository](https://github.com/Abbadon22/fans_repository)

По умолчанию:

```json
"manifest_url": "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/launcher/manifest.json"
```

Положите в репозиторий файл **`launcher/manifest.json`** (шаблон — `public/launcher/manifest.json` в проекте лаунчера).
## Формат файла

Массив объектов (или обёртка `{ "mods": [ ... ] }`):

```json
[
  {
    "archive": "MyModPack.zip",
    "name": "MyModPack (2 mods)",
    "names": ["ModFolderA", "ModFolderB"],
    "url": "https://raw.githubusercontent.com/USER/REPO/main/Mods/MyModPack.zip",
    "sha256": "hex-хеш архива"
  }
]
```

- `archive` — имя zip в `Mods/`
- `names` — все папки модов внутри архива (лаунчер проверяет каждую)
- `name` — подпись в UI (генерируется скриптом)

Шаблон для загрузки на сервер: `public/launcher/manifest.json` в репозитории лаунчера.

## Как раздать файл

Основной вариант — **GitHub raw** (см. ниже). Альтернативы:

1. **Nginx / Apache** на сервере игры
2. **Веб-панель 7DTD** (порт 22499), если хостинг отдаёт статику
3. Любой другой HTTPS URL в `manifest_url`
## Поведение лаунчера

1. Скачать `manifest_url`
2. При ошибке сети — взять **кэш** (`.launcher-cache/manifest.json` рядом с exe)
3. Если кэша нет — **локальный** `manifest.json` из сборки (запасной)

## Манифест модов (Mods/)

1. Положите `.zip` архивы в папку **`Mods/`** в корне проекта / репозитория.
2. Синхронизируйте manifest (SHA256 + список папок внутри каждого zip):

```powershell
npm run manifest:sync
```

Скрипт обновит `manifest.json` и `public/manifest.json`. В GitHub попадают только zip из `Mods/`, распакованные папки — нет.

Если в одном архиве **несколько модов** — все верхнеуровневые папки с `ModInfo.xml` попадут в поле `names`.

## Добавить новый мод

1. Добавьте `.zip` в `Mods/` и выполните `npm run manifest:sync`
2. Закоммитьте `manifest.json` и zip, запушьте на GitHub
3. Игроки нажимают **«Обновить»** в блоке «Модпack» или перезапускают проверку

Пересборка лаунчера **не нужна**.

---

## GitHub — подойдёт?

**Да.** В `manifest.json` в поле `url` укажите прямую ссылку на **файл .zip**, а сам манифест тоже можно держать на GitHub.

### Куда класть ZIP модов

| Способ | Пример URL | Комментарий |
|--------|------------|-------------|
| **Releases** (лучше) | `https://github.com/USER/REPO/releases/download/v1.0/MyMod.zip` | Стабильные версии, лаунчер следует редиректам |
| **Raw** | `https://raw.githubusercontent.com/USER/REPO/main/mods/MyMod.zip` | Файл в репозитории, ветка `main` |
| **Не подходит** | `https://github.com/.../blob/main/...zip` | Страница GitHub, не прямая загрузка |

Репозиторий и релизы должны быть **публичными**, иначе лаунчер не скачает без токена.

### Манифест на GitHub (Fans)

```text
https://raw.githubusercontent.com/Abbadon22/fans_repository/main/launcher/manifest.json
```

В `config.json` (уже по умолчанию в новых установках):

```json
"manifest_url": "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/launcher/manifest.json"
```

Проверка:

```text
curl -I https://raw.githubusercontent.com/Abbadon22/fans_repository/main/launcher/manifest.json
```

Ответ **200**, тело — JSON-массив модов.
### Проверка ссылки на мод

В браузере откройте `url` из манифеста — должен **сразу начаться скачивание** zip, без страницы логина GitHub.

---

## Как получить SHA256 архива

Лаунчер сравнивает хеш **скачанного zip** с полем `sha256` в манифесте. Считайте хеш **после упаковки** того же файла, который заливаете на GitHub.

### Windows (PowerShell)

```powershell
Get-FileHash -Path "C:\path\to\MyMod.zip" -Algorithm SHA256
```

В манифест копируйте значение **Hash** целиком, **строчными** буквами (как выдаёт команда):

```text
071a49b75c64dc88912223035b1a3d1a3c2aee271b4587ebb6e695e757de2530
```

### Windows (cmd, без PowerShell)

```cmd
certutil -hashfile "C:\path\to\MyMod.zip" SHA256
```

Первая строка с пробелами — возьмите только hex без пробелов или скопируйте из PowerShell.

### Если меняете zip

Любое изменение архива → **новый SHA256** → обновите строку в `manifest.json` на GitHub, иначе лаунчер решит, что мод «битый», и переустановит.

### Быстрая проверка

1. Скачайте zip по той же ссылке, что в манифесте.
2. Посчитайте хеш локально.
3. Сравните с `sha256` в JSON — должны совпасть.
