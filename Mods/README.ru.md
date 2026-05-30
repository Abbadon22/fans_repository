# Mods — zip-архивы модов

Лаунчер скачивает **zip с Яндекс.Диска** (ссылки в `scripts/mod-urls.json`).  
Список модов — **`manifest.json` на GitHub**.

## Обновить манифест

1. Положите `.zip` в `Mods/` (для SHA256 и имён папок внутри).
2. Укажите ссылки Яндекс.Диск в `scripts/mod-urls.json`.
3. Сгенерируйте манифест:

```powershell
npm run manifest:sync
```

Если zip нет локально (только на Яндексе):

```powershell
npm run manifest:sync -- --hash-from-yandex
```

4. Закоммитьте `manifest.json` в репозиторий — игрокам пересборка лаунчера не нужна.

## Переименовать мод в лаунчере

В `scripts/mod-urls.json` задайте **`displayName`** — только подпись в UI (папка в игре не меняется):

```json
"ProjectZv2.6.zip": {
  "url": "https://disk.yandex.ru/d/oRstuop_EmDTqQ",
  "displayName": "Project Z"
}
```

Затем `npm run manifest:sync` и push `manifest.json`. Поле `names` должно совпадать с **папкой внутри zip**.

## Если порядок ссылок неизвестен

Сопоставление по SHA256 (скачивает все ссылки с Яндекса):

```powershell
node scripts/map-yandex-urls.mjs
npm run manifest:sync
```

```json
{
  "MyMod.zip": "https://disk.yandex.ru/d/XXXXXXXX"
}
```

Имена архивов должны совпадать с ключами в JSON.
