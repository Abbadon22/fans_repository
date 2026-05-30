/**
 * Сканирует Mods/*.zip → SHA256 + папки модов внутри архива → manifest.json
 *
 * Usage: npm run manifest:sync
 *        npm run manifest:sync -- --repo Abbadon22/fans_repository --branch main
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const repo = arg("--repo", "Abbadon22/fans_repository");
const branch = arg("--branch", "main");
const urlBase = `https://raw.githubusercontent.com/${repo}/${branch}/Mods`;

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

/** Верхнеуровневые папки модов в zip (по ModInfo.xml или по структуре). */
function detectModFolders(zip) {
  const entries = zip.getEntries();
  const roots = new Set();

  for (const entry of entries) {
    const normalized = entry.entryName.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const root = parts[0];
    if (SKIP_ROOTS.has(root) || root.startsWith(".")) continue;
    roots.add(root);
  }

  const withModInfo = [...roots].filter((root) =>
    entries.some((e) => {
      const p = e.entryName.replace(/\\/g, "/");
      return p.startsWith(`${root}/`) && p.endsWith("ModInfo.xml");
    }),
  );

  const names = (withModInfo.length > 0 ? withModInfo : [...roots]).sort();
  return names;
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

  if (zips.length === 0) {
    console.warn("В Mods/ нет .zip файлов.");
  }

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

    const entry = {
      archive,
      name: displayName(archive, names),
      names,
      url: `${urlBase}/${encodeURIComponent(archive)}`,
      sha256,
    };

    manifest.push(entry);
    console.log(`✓ ${archive}`);
    console.log(`  sha256: ${sha256}`);
    console.log(`  mods:   ${names.join(", ")}`);
  }

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  const targets = [join(root, "manifest.json"), join(root, "public", "manifest.json")];

  for (const path of targets) {
    writeFileSync(path, json, "utf8");
    console.log(`→ ${path}`);
  }

  console.log(`\nГотово: ${manifest.length} записей в manifest.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
