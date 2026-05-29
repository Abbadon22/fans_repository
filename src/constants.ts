/** Официальный сервер Fans (должен совпадать с Rust FAN_SERVER_*). */
export const FAN_SERVER_HOST = "epyc2.worldhosts.fun";
export const FAN_SERVER_PORT = 27681;

export function isLegacyLocalServer(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  return !v || v === "localhost" || v === "127.0.0.1" || v.startsWith("127.");
}
