/**
 * Writes `side` into public/manifest.json and manifest.json from local zips.
 * Usage: node scripts/apply-mod-sides.mjs
 */
import AdmZip from "adm-zip";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");
const tmpDir = join(modsDir, "_tmp");

function analyzeZip(zipPath, displayName) {
  const zip = new AdmZip(zipPath);
  const base = zipPath.split(/[/\\]/).pop() ?? "";
  let dll = 0;
  let unity = 0;
  let tex = 0;
  let xui = 0;
  let config = 0;

  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    const n = e.entryName.replace(/\\/g, "/");
    if (/__MACOSX|\.DS_Store/.test(n)) continue;
    if (/\.dll$/i.test(n)) dll++;
    if (/\.unity3d$/i.test(n) || /Resources\//i.test(n)) unity++;
    if (/\.(png|jpg|dds)$/i.test(n) || /UIAtlases/i.test(n)) tex++;
    if (/\/XUi\//i.test(n)) xui++;
    if (/\/Config\//i.test(n)) config++;
  }

  const serverInName = /server[- ]?side/i.test(base) || /server[- ]?side/i.test(displayName);
  const clientInName = /client[- ]?side/i.test(base) || /client[- ]?side/i.test(displayName);

  if (/^(0-)?quartz|smxcore|zsmxhud/i.test(base)) return "client";
  if (clientInName && !serverInName) return "client";
  if (serverInName && dll === 0 && unity === 0 && tex === 0) return "server";
  if (dll > 0 || unity > 0) return "both";
  if (config > 0 && dll === 0 && unity === 0 && tex === 0) return "server";
  if (xui > 0 && config > 0 && unity === 0 && dll === 0) return "both";
  return "both";
}

function resolveZip(archive) {
  for (const dir of [modsDir, tmpDir]) {
    const p = join(dir, archive);
    if (existsSync(p)) return p;
  }
  return null;
}

const manifestPath = join(root, "public", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const entry of manifest) {
  const archive = entry.archive ?? `${entry.name}.zip`;
  const zipPath = resolveZip(archive);
  entry.side = zipPath ? analyzeZip(zipPath, entry.name) : entry.side ?? "both";
}

const json = `${JSON.stringify(manifest, null, 2)}\n`;
for (const path of [manifestPath, join(root, "manifest.json")]) {
  writeFileSync(path, json, "utf8");
  console.log("→", path);
}

for (const e of manifest) {
  console.log(`  [${e.side}] ${e.name}`);
}
