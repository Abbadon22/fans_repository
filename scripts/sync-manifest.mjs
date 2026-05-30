/**
 * Сканирует Mods/*.zip → SHA256 + папки модов → manifest.json
 * URL модов и манифеста — на игровом сервере (по умолчанию).
 *
 * Usage: npm run manifest:sync
 *        npm run manifest:sync -- --server epyc2.worldhosts.fun --web-port 22499
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const serverHost = arg("--server", "epyc2.worldhosts.fun");
const webPort = arg("--web-port", "22499");
const urlBase = `http://${serverHost}:${webPort}/Mods`;
const manifestServerUrl = `http://${serverHost}:${webPort}/manifest.json`;

const SKIP_ROOTS = new Set(["__MACOSX", ".DS_Store", "Thumbs.db"]);

function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

function detectModFolders(zip) {
  const entries = zip.getEntries();
  const roots = new Set();

  for (const entry of entries) {
    const normalized = entry.entryName.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const rootName = parts[0];
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
  if (!existsSync(modsDir)) {
    console.error(`Папка не найдена: ${modsDir}`);
    process.exit(1);
  }

  const zips = readdirSync(modsDir)
    .filter((f) => f.toLowerCase().endsWith(".zip"))
    .sort((a, b) => a.localeCompare(b, "ru"));

  const manifest = [];

  for (const archive of zips) {
    const zipPath = join(modsDir, archive);
    const sha256 = await sha256File(zipPath);
    const zip = new AdmZip(zipPath);
    const names = detectModFolders(zip);

    if (names.length === 0) {
      console.warn(`⚠ ${archive}: не найдены папки модов, пропуск`);
      continue;
    }

    const url = `${urlBase}/${encodeURIComponent(archive)}`;

    manifest.push({
      archive,
      name: displayName(archive, names),
      names,
      url,
      sha256,
    });

    console.log(`✓ ${archive}`);
    console.log(`  url:    ${url}`);
    console.log(`  sha256: ${sha256}`);
    console.log(`  mods:   ${names.join(", ")}`);
  }

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  for (const path of [join(root, "manifest.json"), join(root, "public", "manifest.json")]) {
    writeFileSync(path, json, "utf8");
    console.log(`→ ${path}`);
  }

  console.log(`\nМанифест на сервере: ${manifestServerUrl}`);
  console.log(`Загрузите manifest.json и zip в Mods/ на сервере (${urlBase}/).`);
  console.log(`Готово: ${manifest.length} записей.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
