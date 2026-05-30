/**
 * Скачивает zip с Яндекс.Диска и считает SHA256.
 * Usage: node scripts/hash-yandex.mjs <yandex-url>
 */
import { createHash } from "node:crypto";
import { Readable } from "node:stream";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/hash-yandex.mjs <yandex-url>");
  process.exit(1);
}

async function resolveYandex(publicUrl) {
  const api = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;
  const res = await fetch(api);
  if (!res.ok) throw new Error(`Yandex API ${res.status}: ${await res.text()}`);
  const { href } = await res.json();
  return href;
}

async function sha256Stream(readable) {
  const hash = createHash("sha256");
  for await (const chunk of readable) hash.update(chunk);
  return hash.digest("hex");
}

const href = await resolveYandex(url);
console.log("href:", href.slice(0, 100) + "...");
const res = await fetch(href);
if (!res.ok) throw new Error(`Download ${res.status}`);
const len = res.headers.get("content-length");
console.log("size:", len ?? "unknown");
const sha = await sha256Stream(Readable.fromWeb(res.body));
console.log("sha256:", sha);
