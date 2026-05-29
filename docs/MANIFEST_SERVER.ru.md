# Манифест модов на сервере

Лаунчер **не хранит список модов внутри exe**. При каждой проверке он запрашивает JSON по URL из `config.json`:

```json
"manifest_url": "http://epyc2.worldhosts.fun:22499/launcher/manifest.json"
```

## Формат файла

Массив объектов (или обёртка `{ "mods": [ ... ] }`):

```json
[
  {
    "name": "ИмяПапкиМода-",
    "url": "https://... ссылка на .zip ...",
    "sha256": "hex-хеш архива"
  }
]
```

Шаблон для загрузки на сервер: `public/launcher/manifest.json` в репозитории лаунчера.

## Как раздать файл с сервера

Нужен **обычный HTTP(S)** — игра по порту `27681` манифест не отдаёт.

Варианты:

1. **Веб-панель 7DTD (порт 22499)** — если хостинг позволяет положить статику в корень сайта, разместите `launcher/manifest.json` так, чтобы открывался по URL из `manifest_url`.
2. **Nginx / Apache** рядом с сервером — alias на папку с `manifest.json`.
3. **Любой HTTPS** (GitHub raw, CDN, Яндекс.Диск API в поле `url` модов) — укажите полный URL в `manifest_url` в `config.json` у игроков.

Проверка с ПК:

```text
curl -I http://epyc2.worldhosts.fun:22499/launcher/manifest.json
```

Должен быть ответ **200** и `Content-Type: application/json` (желательно).

## Поведение лаунчера

1. Скачать `manifest_url`
2. При ошибке сети — взять **кэш** (`.launcher-cache/manifest.json` рядом с exe)
3. Если кэша нет — **локальный** `manifest.json` из сборки (запасной)

## Добавить новый мод

1. Добавьте запись в `manifest.json` на сервере
2. Игроки нажимают **«Обновить»** в блоке «Модпак» или перезапускают проверку

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

### Манифест на GitHub

Можно отдавать JSON так:

```text
https://raw.githubusercontent.com/USER/REPO/main/launcher/manifest.json
```

И в `config.json` у игроков:

```json
"manifest_url": "https://raw.githubusercontent.com/USER/REPO/main/launcher/manifest.json"
```

После `git push` обновление списка модов у всех — по кнопке «Обновить» (кэш GitHub иногда задерживает raw на 1–2 минуты).

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
