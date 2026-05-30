import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, "src-tauri", "keys", "fans-launcher.key");

if (existsSync(keyPath)) {
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
    process.env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyPath, "utf8").trim();
  }
  delete process.env.TAURI_SIGNING_PRIVATE_KEY_PATH;
  if (process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD === undefined) {
    process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "";
  }
  console.log("Подпись updater: ключ загружен из src-tauri/keys/fans-launcher.key");
} else {
  console.warn("Ключ src-tauri/keys/fans-launcher.key не найден — updater-артефакты не подпишутся.");
  console.warn("Сгенерируйте: npx tauri signer generate -w src-tauri/keys/fans-launcher.key -f --ci");
}

const result = spawnSync("npx", ["tauri", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
