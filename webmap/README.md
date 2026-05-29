# Fans Server Map (7D2D-WebMap / ServerMap)

Интерактивная карта сервера на базе **Alloc Server Fixes / Web Dashboard API**:
- тайлы мира `/map/{z}/{x}/{y}.png`
- игроки онлайн в реальном времени (`/api/getplayersonline`)
- позиции оффлайн-игроков (`/api/getplayerslocation`)
- land claims (`/api/getlandclaims`)
- враги (`/api/gethostilelocation`)
- пользовательские метки (localStorage)

## Где serveradmin.xml?

Файл **на сервере** (панель хостинга → `Saves/serveradmin.xml`), **не** в папке игры на вашем ПК.  
Подробно: [docs/SERVER_SETUP.ru.md](docs/SERVER_SETUP.ru.md) · шаблон: [docs/serveradmin.template.xml](docs/serveradmin.template.xml)

## Требования на сервере

1. **Web Dashboard Enabled** = true  
2. **Enable Map Rendering** = true  
3. В `serveradmin.xml` на сервере — токен API (или пустой секрет в config, если хост уже открыл API для всех):

```xml
<apitokens>
  <token name="web" secret="YOUR_SECRET" permission_level="2000" />
</apitokens>
<webmodules>
  <module name="web.map" permission_level="2000" />
  <module name="webapi.getplayersonline" permission_level="2000" />
  <module name="webapi.getplayerslocation" permission_level="2000" />
  <module name="webapi.getlandclaims" permission_level="2000" />
  <module name="webapi.gethostilelocation" permission_level="2000" />
  <module name="webapi.getstats" permission_level="2000" />
</webmodules>
```

> Порт Web Dashboard обычно **8080**, не игровой порт (27681).

## Установка

```bash
cd webmap
npm install
cp public/config.example.json public/config.json
cp .env.example .env
# отредактируйте apiTokenSecret, webPort и VITE_MAP_PROXY_TARGET
npm run dev
```

**Проверка:** в браузере должен открываться `http://ВАШ_ХОСТ:8080` (Web Dashboard).  
Если там `ECONNREFUSED` — откройте порт в панели хостинга (см. [docs/SERVER_SETUP.ru.md](docs/SERVER_SETUP.ru.md)).

Откройте: http://localhost:5174

## Конфиг `public/config.json`

| Поле | Описание |
|------|----------|
| `serverHost` | IP/домен сервера (`epyc2.worldhosts.fun`) |
| `webPort` | Web Dashboard порт (обычно 8080) |
| `apiTokenName` / `apiTokenSecret` | Токен из serveradmin.xml |
| `mapSize` | Размер мира (8192 для 8k) |
| `pollIntervalMs` | Интервал обновления игроков (мс) |

## Сборка

```bash
npm run build
npm run preview
```

## Примечание

Если API возвращает 403/404 — проверьте права `webpermission` и что карта уже отрендерена (`visitmap` или исследование мира).
