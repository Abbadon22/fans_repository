import dns from "node:dns";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// На Windows Node часто ходит на IPv6 первым — порт открыт только на IPv4 → ECONNREFUSED
dns.setDefaultResultOrder("ipv4first");

const proxyOpts = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
  timeout: 30_000,
  proxyTimeout: 30_000,
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // IP надёжнее hostname при проблемах с DNS/IPv6 (см. .env)
  const target =
    env.VITE_MAP_PROXY_TARGET || "http://213.152.43.100:22499";

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": proxyOpts(target),
        "/map": proxyOpts(target),
        "/legacymap": proxyOpts(target),
        "/sse": proxyOpts(target),
      },
    },
  };
});
