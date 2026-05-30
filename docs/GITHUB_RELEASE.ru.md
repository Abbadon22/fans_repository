# GitHub: автообновление лаунчера и релизы

Репозиторий: [Abbadon22/fans_repository](https://github.com/Abbadon22/fans_repository)

| Что | Где | Зачем |
|-----|-----|-------|
| Код лаунчера | этот проект → `main` | исходники |
| `manifest.json` | корень репо | список модов (обновляется без переустановки лаунчера) |
| GitHub Release `v*` | Releases | `.exe` установщик + `latest.json` для автообновления |

---

## Как это работает у игроков

1. Один раз ставят **Fans Launcher_*_x64-setup.exe** с GitHub Release.
2. При каждом запуске лаунчер проверяет:
   `https://github.com/Abbadon22/fans_repository/releases/latest/download/latest.json`
3. Если версия на GitHub новее — скачивает установщик, ставит и перезапускается.
4. Моды по-прежнему тянутся из `manifest.json` — это отдельно от обновления лаунчера.

> Автообновление **не работает** в `npm run tauri:dev` и если запускать `fans-launcher.exe` без установки через NSIS.

---

## Шаг 1. Ключи подписи (один раз)

Updater проверяет подпись обновлений. Нужна пара ключей minisign.

### Если ключи уже есть

Файлы должны лежать здесь:

- `src-tauri/keys/fans-launcher.key` — **приватный, не коммитить**
- `src-tauri/keys/fans-launcher.key.pub` — публичный, в git

Публичный ключ уже прописан в `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

### Если ключей нет — сгенерировать

```powershell
cd C:\Users\Abbadon\Desktop\fans_launcher
npx tauri signer generate -w src-tauri\keys\fans-launcher.key -f --ci
```

Флаг `--ci` — ключ **без пароля** (удобно для CI и локальной сборки).

После генерации:

1. Скопируйте содержимое `src-tauri\keys\fans-launcher.key.pub` в `tauri.conf.json` → `plugins.updater.pubkey` (если ключ новый).
2. **Не коммитьте** `.key` — он уже в `.gitignore`.

---

## Шаг 2. Секрет GitHub Actions (один раз)

1. Откройте репозиторий: https://github.com/Abbadon22/fans_repository
2. **Settings → Secrets and variables → Actions → New repository secret**
3. Имя: `TAURI_SIGNING_PRIVATE_KEY`
4. Значение: **полное содержимое** файла `src-tauri\keys\fans-launcher.key` (многострочный текст, включая `untrusted comment` и `secret key`).

Без этого секрета CI соберёт `.exe`, но **не создаст** подписанный `latest.json` и автообновление сломается.

---

## Шаг 3. Первый релиз v1.0.0

### 3.1. Проверьте версию

Во всех трёх файлах должна быть **одна и та же** версия, например `1.0.0`:

| Файл | Поле |
|------|------|
| `package.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version` |
| `src-tauri/tauri.conf.json` | `"version"` |

### 3.2. Локальная сборка (проверка)

```powershell
npm install
npm run tauri:build
```

Скрипт сам подхватит ключ из `src-tauri\keys\fans-launcher.key`.

Должны появиться:

```
src-tauri\target\release\bundle\nsis\Fans Launcher_1.0.0_x64-setup.exe
src-tauri\target\release\bundle\nsis\Fans Launcher_1.0.0_x64-setup.exe.sig
```

Если сборка просит `Password:` — просто Enter (для `--ci` ключа).

### 3.3. Закоммитьте и запушьте код

```powershell
git add .
git commit -m "Restore launcher auto-update via GitHub Releases"
git push origin main
```

### 3.4. Создайте тег и запушьте

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Workflow `.github/workflows/release.yml` автоматически:

- соберёт NSIS-установщик;
- создаст GitHub Release `v1.0.0`;
- загрузит `.exe`, `.sig` и **`latest.json`**.

### 3.5. Проверьте Release

Откройте: https://github.com/Abbadon22/fans_repository/releases

В релизе должны быть:

- `Fans Launcher_1.0.0_x64-setup.exe`
- `latest.json`

Проверьте, что `latest.json` открывается:

https://github.com/Abbadon22/fans_repository/releases/latest/download/latest.json

---

## Шаг 4. Раздайте друзьям

Отправьте ссылку на Release или сам `.exe` установщик.

**Важно:** друзья должны ставить через **setup.exe**, не копировать `fans-launcher.exe` из `target`. Только установленная версия умеет автообновляться.

---

## Шаг 5. Выпуск новой версии (v1.0.1, v1.1.0…)

1. Поднимите версию в `package.json`, `Cargo.toml`, `tauri.conf.json`.
2. Закоммитьте, запушьте `main`.
3. Создайте новый тег:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

4. Дождитесь зелёного CI в **Actions**.
5. У игроков с уже установленным лаунчером обновление придёт при следующем запуске (или по кнопке «Проверить обновления» в Настройках).

---

## Частые проблемы

| Симптом | Причина | Решение |
|---------|---------|---------|
| `A public key has been found, but no private key` | нет ключа при сборке | положите `.key` или задайте `TAURI_SIGNING_PRIVATE_KEY` |
| CI упал на подписи | нет секрета `TAURI_SIGNING_PRIVATE_KEY` | добавьте секрет (шаг 2) |
| «Обновлений нет», хотя Release есть | версия в Release ≤ текущей | поднимите версию в конфигах |
| Ошибка подписи у игроков | pubkey в `tauri.conf.json` не совпадает с ключом CI | синхронизируйте `.pub` и секрет |
| Обновление не проверяется | запуск не через NSIS | переустановите через setup.exe |
| `Password:` при сборке | ключ с паролем | Enter или `$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "…"` |

---

## Локальная сборка без подписи (не для релиза)

Если ключа нет — установщик соберётся, но updater-артефакты не подпишутся. Для теста UI достаточно; для GitHub Release — **обязательна** подпись.

---

## Краткий чеклист перед первым релизом

- [ ] `fans-launcher.key` и `.pub` на месте
- [ ] `pubkey` в `tauri.conf.json` совпадает с `.pub`
- [ ] Секрет `TAURI_SIGNING_PRIVATE_KEY` в GitHub
- [ ] Версия одинакова в трёх файлах
- [ ] `npm run tauri:build` проходит без ошибок
- [ ] Код запушен в `main`
- [ ] Тег `v1.0.0` запушен
- [ ] В Release есть `latest.json` и `.exe`
