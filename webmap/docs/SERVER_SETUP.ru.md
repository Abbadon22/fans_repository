# Где взять serveradmin.xml (если «его нет»)

## Главное

`serveradmin.xml` **не ставится с игрой на ваш ПК**.  
Он создаётся на **выделенном сервере** (у хостера), в папке сохранения мира.

У вас на компьютере его нет — это нормально, если вы не админ сервера и не заходите в файлы хостинга.

---

## Где он лежит на сервере

Типичные пути:

```text
<Saves>/serveradmin.xml
```

или (зависит от хостинга):

```text
.local/share/7DaysToDie/Saves/serveradmin.xml
7DaysToDie/Saves/<имя_мира>/serveradmin.xml
save/Saves/serveradmin.xml
```

На **WorldHosts** и похожих панелях:  
**Файловый менеджер → Saves → serveradmin.xml** (или «Server Admins» в списке конфигов).

Файл появляется **после первого запуска** сервера. Если сервер ещё ни разу не стартовал — файла может не быть.

---

## Что сделать (если вы владелец/админ сервера)

1. **Остановите сервер** (обязательно — иначе правки сотрутся).
2. Откройте `serveradmin.xml` в панели хостинга.
3. Если файла нет — создайте с шаблоном ниже или скопируйте из `webmap/docs/serveradmin.template.xml`.
4. Вставьте блок `<apitokens>` и `<webmodules>` (см. шаблон).
5. Сохраните и **запустите сервер**.
6. В `webmap/public/config.json` укажите тот же `token`, что в XML.

---

## Шаблон (минимум для карты)

См. файл: [serveradmin.template.xml](./serveradmin.template.xml)

В **новых версиях 7DTD** в токене используется атрибут **`secret`**, не `token`:

```xml
<token name="web" secret="ВашСекрет" permission_level="2000" />
```

Продублируйте секрет в `webmap/public/config.json`:

```json
"apiTokenName": "web",
"apiTokenSecret": "ВашСекрет"
```

Готовый файл целиком: [serveradmin.ready.xml](./serveradmin.ready.xml)

---

## Если сервер арендованный и файлов нет в панели

- Напишите в поддержку хостинга:  
  *«Нужен доступ к serveradmin.xml и включены Web Dashboard + Map Rendering»*
- Уточните **Web Dashboard Port** (часто `8080`, не игровой `27681`).
- Без доступа к серверным файлам **свою карту с API подключить нельзя** — только встроенную у хостера («View Live Map»), если она есть.

---

## Ошибка `ECONNREFUSED ...:8080`

Это значит: **с вашего ПК до порта 8080 сервера достучаться нельзя**.

Игра на `27681` и веб-панель на `8080` — **разные порты**. Хостинг часто открывает только игровой.

### Что сделать на WorldHosts / любом хостинге

1. В панели найдите **Ports / Firewall / Additional Ports / Port Forwarding**.
2. Добавьте **TCP 8080** (или тот порт, что в `WebDashboardPort` в serverconfig).
3. Убедитесь, что сервер **запущен** и в логе есть строка про Web Dashboard.
4. Проверьте в браузере: `http://epyc2.worldhosts.fun:8080`  
   Должна открыться панель 7DTD, не «отказ в соединении».
5. Если хостинг выдал **другой внешний порт** (например `28080` → `8080`):
   - в `serverconfig` можно оставить `8080` внутри,
   - в `webmap/public/config.json` укажите **внешний** порт в `webPort`,
   - в `webmap/.env` для dev: `VITE_MAP_PROXY_TARGET=http://epyc2.worldhosts.fun:28080`

### Dev-режим webmap

После смены порта перезапустите:

```bash
cd webmap
npm run dev
```

---

## Без токена (иногда работает)

Если на сервере уже выставлены права `web.map` и API на уровень `2000`, карта может открываться **без** токена.

В `webmap/public/config.json` оставьте пустым:

```json
"apiTokenSecret": ""
```

Если видите ошибки 401/403 — токен в `serveradmin.xml` всё же нужен.

---

## Включение карты в serverconfig

В панели хостинга (Server Options / serverconfig.xml):

| Параметр | Значение |
|----------|----------|
| Web Dashboard Enabled | `true` |
| Enable Map Rendering | `true` |
| Web Dashboard Port | запомните (например `8080`) |

После этого в `webmap/public/config.json` укажите `webPort` с этим портом.
