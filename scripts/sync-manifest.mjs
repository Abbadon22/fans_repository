/**
 * Mods/*.zip + scripts/mod-urls.json → manifest.json (zip + Яндекс.Диск)
 *
 * Usage: npm run manifest:sync
 *        npm run manifest:sync -- --hash-from-yandex   # SHA256 с Яндекса (если нет zip локально)
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");
const urlsPath = join(root, "scripts", "mod-urls.json");

const args = process.argv.slice(2);
const hashFromYandex = args.includes("--hash-from-yandex");

const GITHUB_MANIFEST =
  "https://raw.githubusercontent.com/Abbadon22/fans_repository/main/manifest.json";

const SKIP_ROOTS = new Set(["__MACOSX", ".DS_Store", "Thumbs.db"]);

function decodeZipSegment(name) {
  if (!name.includes("%")) return name;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

async function sha256Stream(readable) {
  const hash = createHash("sha256");
  for await (const chunk of readable) hash.update(chunk);
  return hash.digest("hex");
}

async function resolveYandex(publicUrl) {
  const api = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;
  const res = await fetch(api);
  if (!res.ok) {
    throw new Error(`Yandex API ${res.status} для ${publicUrl}: ${await res.text()}`);
  }
  const { href } = await res.json();
  if (!href) throw new Error(`Yandex API: нет href для ${publicUrl}`);
  return href;
}

async function downloadFromYandex(publicUrl) {
  const href = await resolveYandex(publicUrl);
  const res = await fetch(href);
  if (!res.ok) throw new Error(`Скачивание ${res.status} для ${publicUrl}`);
  return Buffer.from(await res.arrayBuffer());
}

async function sha256FromYandex(publicUrl) {
  const bytes = await downloadFromYandex(publicUrl);
  return createHash("sha256").update(bytes).digest("hex");
}

function detectModFolders(zip) {
  const entries = zip.getEntries();
  const roots = new Set();
  for (const entry of entries) {
    const normalized = entry.entryName.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const rootName = decodeZipSegment(parts[0]);
    if (SKIP_ROOTS.has(rootName) || rootName.startsWith(".")) continue;
    roots.add(rootName);
  }
  const withModInfo = [...roots].filter((rootName) =>
    entries.some((e) => {
      const p = e.entryName.replace(/\\/g, "/");
      return p.startsWith(`${rootName}/`) && p.endsWith("ModInfo.xml");
    }),
  );
  return (withModInfo.length > 0 ? withModInfo : [...roots]).sort();
}

function displayName(archive, names) {
  if (names.length === 1) return names[0];
  if (names.length > 1) return `${archive.replace(/\.zip$/i, "")} (${names.length} mods)`;
  return archive.replace(/\.zip$/i, "");
}

async function main() {
  if (!existsSync(urlsPath)) {
    console.error(`Не найден ${urlsPath} — укажите URL модов (Яндекс.Диск).`);
    process.exit(1);
  }
  if (!existsSync(modsDir)) {
    console.error(`Папка не найдена: ${modsDir}`);
    process.exit(1);
  }

  const modUrls = JSON.parse(readFileSync(urlsPath, "utf8"));
  const zips = Object.keys(modUrls).sort((a, b) => a.localeCompare(b, "ru"));
  const manifest = [];

  for (const archive of zips) {
    const yandexUrl = modUrls[archive];
    if (!yandexUrl?.trim()) {
      console.warn(`⚠ ${archive}: нет URL в mod-urls.json, пропуск`);
      continue;
    }

    const zipPath = join(modsDir, archive);
    let sha256;
    let names;

    if (existsSync(zipPath)) {
      sha256 = await sha256File(zipPath);
      names = detectModFolders(new AdmZip(zipPath));
      console.log(`✓ ${archive} [локальный zip]`);
    } else {
      console.log(`… ${archive} [скачивание с Яндекс.Диска]`);
      const bytes = await downloadFromYandex(yandexUrl);
      sha256 = createHash("sha256").update(bytes).digest("hex");
      names = detectModFolders(new AdmZip(bytes));
      console.log(`✓ ${archive} [яндекс]`);
    }

    if (names.length === 0) {
      console.warn(`⚠ ${archive}: не найдены папки модов`);
      continue;
    }

    manifest.push({
      archive,
      name: displayName(archive, names),
      names,
      url: yandexUrl.trim(),
      sha256,
    });

    console.log(`  url:    ${yandexUrl}`);
    console.log(`  sha256: ${sha256}`);
    console.log(`  mods:   ${names.join(", ")}`);
  }

  manifest.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  for (const path of [join(root, "manifest.json"), join(root, "public", "manifest.json")]) {
    writeFileSync(path, json, "utf8");
    console.log(`→ ${path}`);
  }

  console.log(`\nМанифест на GitHub: ${GITHUB_MANIFEST}`);
  console.log(`Закоммитьте manifest.json в репозиторий — игроки подтянут список оттуда.`);
  console.log(`Готово: ${manifest.length} записей.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
