/** Официальный сервер Fans (должен совпадать с Rust FAN_SERVER_*). */
export const FAN_SERVER_HOST = "epyc2.worldhosts.fun";
export const FAN_SERVER_PORT = 27681;
export const FAN_WEB_PORT = 22499;
export const APP_VERSION = "1.0.13";

/** Страница релизов — единственный способ скачать лаунчер для игроков. */
export const RELEASES_URL =
  "https://github.com/Abbadon22/fans_repository/releases/latest";

/** Манифест на GitHub; zip-моды — Яндекс.Диск (url в manifest.json). */
export const FAN_MANIFEST_URL =
  "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json";

export function isLegacyLocalServer(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  return !v || v === "localhost" || v === "127.0.0.1" || v.startsWith("127.");
}

/** Кратко — что нового в текущей версии (показывается в настройках). */
export const WHATS_NEW: readonly string[] = [
  "Обновлённая главная: статус, шаги 1–2–3, прогресс модпака",
  "Боковая навигация и поиск в списке модов",
  "Кнопка «Подключиться в Steam» на главной",
  "Открытие папки Mods из настроек и вкладки модов",
  "«Повторить» сначала проверяет, потом ставит только нужное",
  "Подсказка, почему кнопка «Играть» недоступна",
];
