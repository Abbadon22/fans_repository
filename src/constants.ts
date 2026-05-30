/** Официальный сервер Fans (должен совпадать с Rust FAN_SERVER_*). */
export const FAN_SERVER_HOST = "epyc2.worldhosts.fun";
export const FAN_SERVER_PORT = 27681;
export const APP_VERSION = "1.0.5";

/** Манифест модов на GitHub (raw). */
export const FAN_MANIFEST_URL =
  "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json";

export function isLegacyLocalServer(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  return !v || v === "localhost" || v === "127.0.0.1" || v.startsWith("127.");
}
