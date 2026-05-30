/** Официальный сервер Fans (должен совпадать с Rust FAN_SERVER_*). */
export const FAN_SERVER_HOST = "epyc2.worldhosts.fun";
export const FAN_SERVER_PORT = 27681;
export const FAN_WEB_PORT = 22499;
export const APP_VERSION = "1.0.12";

/** Манифест на GitHub; zip-моды — Яндекс.Диск (url в manifest.json). */
export const FAN_MANIFEST_URL =
  "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json";

export function isLegacyLocalServer(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  return !v || v === "localhost" || v === "127.0.0.1" || v.startsWith("127.");
}

/** Кратко — что нового в текущей версии (показывается в настройках). */
export const WHATS_NEW: readonly string[] = [
  "Скачиваются только недостающие моды, не весь модпак",
  "Лишние моды в Mods/ удаляются, если их нет в манифесте",
  "Автоподключение к серверу через Steam после «Играть»",
  "Проверка модов при запуске без автозагрузки — установка по кнопке",
  "Журнал можно сохранить в файл",
  "Мод Dismember Randomizer в модпаке",
];
