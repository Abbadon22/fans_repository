/** Официальный сервер Fans (должен совпадать с Rust FAN_SERVER_*). */
export const FAN_SERVER_HOST = "epyc2.worldhosts.fun";
export const FAN_SERVER_PORT = 27681;
export const FAN_WEB_PORT = 22499;
export const APP_VERSION = "1.0.6";

/** Манифест и моды на игровом сервере. */
export const FAN_MANIFEST_URL = "http://epyc2.worldhosts.fun:22499/manifest.json";
export const FAN_MODS_BASE_URL = "http://epyc2.worldhosts.fun:22499/Mods";

export function isLegacyLocalServer(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  return !v || v === "localhost" || v === "127.0.0.1" || v.startsWith("127.");
}
