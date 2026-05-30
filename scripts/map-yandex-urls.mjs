/**
 * Сопоставляет ссылки Яндекс.Диска с zip по SHA256 (локальные Mods/*.zip).
 * Usage: node scripts/map-yandex-urls.mjs
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");

const YANDEX_URLS = [
  "https://disk.yandex.ru/d/-4-Sx1MpR1zUng",
  "https://disk.yandex.ru/d/SsBobuDX8xnVNQ",
  "https://disk.yandex.ru/d/KDL0eCM7MlzLZA",
  "https://disk.yandex.ru/d/BTwpd5bEeCStxQ",
  "https://disk.yandex.ru/d/qdfLtluXFX4jaA",
  "https://disk.yandex.ru/d/odpbmKJryvSv9w",
  "https://disk.yandex.ru/d/ezeBDtOVuXFebA",
  "https://disk.yandex.ru/d/3F1QAJ6MZSNJGQ",
  "https://disk.yandex.ru/d/Ms7FGNtemx8DgQ",
  "https://disk.yandex.ru/d/oXPe9-5w0UihwQ",
  "https://disk.yandex.ru/d/n6z8JFgQKfoLeA",
];

function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (c) => hash.update(c))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

async function sha256FromYandex(url) {
  const api = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(url)}`;
  const meta = await fetch(api);
  if (!meta.ok) throw new Error(`API ${meta.status} ${url}`);
  const { href } = await meta.json();
  const res = await fetch(href);
  if (!res.ok) throw new Error(`GET ${res.status} ${url}`);
  const hash = createHash("sha256");
  for await (const chunk of Readable.fromWeb(res.body)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  const localZips = readdirSync(modsDir).filter((f) => f.toLowerCase().endsWith(".zip"));
  const hashToArchive = new Map();
  for (const archive of localZips) {
    const h = await sha256File(join(modsDir, archive));
    hashToArchive.set(h, archive);
    console.log(`локально: ${archive} → ${h.slice(0, 16)}…`);
  }

  console.log("\nСканирование Яндекс.Диска…\n");
  const mapped = {};
  const used = new Set();

  for (const url of YANDEX_URLS) {
    process.stdout.write(`${url.slice(-12)} … `);
    const h = await sha256FromYandex(url);
    const archive = hashToArchive.get(h);
    console.log(archive ? `✓ ${archive}` : `? неизвестный хеш ${h}`);
    if (archive) {
      mapped[archive] = url;
      used.add(h);
    }
  }

  const missing = [...hashToArchive.entries()].filter(([h]) => !used.has(h));
  if (missing.length) {
    console.warn("\n⚠ Нет ссылки на Яндексе для:");
    for (const [, archive] of missing) console.warn(`  - ${archive}`);
  }

  const out = join(root, "scripts", "mod-urls.json");
  writeFileSync(out, `${JSON.stringify(mapped, null, 2)}\n`, "utf8");
  console.log(`\n→ ${out} (${Object.keys(mapped).length} записей)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
