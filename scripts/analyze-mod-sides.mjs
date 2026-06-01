/**
 * Classify 7DTD mods as server / client / both by zip contents.
 * Usage: node scripts/analyze-mod-sides.mjs
 */
import AdmZip from "adm-zip";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const modsDir = join(root, "Mods");
const urlsPath = join(root, "scripts", "mod-urls.json");
const manifest = JSON.parse(readFileSync(join(root, "public", "manifest.json"), "utf8"));

async function yandexHref(publicUrl) {
  const api =
    "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=" +
    encodeURIComponent(publicUrl);
  const res = await fetch(api);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const { href } = await res.json();
  if (!href) throw new Error("no href");
  return href;
}

function parseUrl(value) {
  return typeof value === "string" ? value : value?.url;
}

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

  let side = "both";
  let confidence = "medium";
  const notes = [];

  if (clientInName && !serverInName) {
    side = "client";
    confidence = "high";
    notes.push("явно в названии Client");
  } else if (serverInName && dll === 0 && unity === 0 && tex === 0) {
    side = "server";
    confidence = serverInName ? "high" : "medium";
    notes.push("в названии Server-side, без 3D/текстур/DLL");
  } else if (/hud|smxcore|quartz|zsmx/i.test(base) && dll === 0 && unity === 0) {
    side = "client";
    confidence = "high";
    notes.push("UI/HUD modlet");
  } else if (dll > 0 || unity > 0) {
    side = "both";
    confidence = "high";
    notes.push("DLL или Unity-ассеты");
  } else if (config > 0 && dll === 0 && unity === 0 && tex === 0) {
    side = "server";
    confidence = "medium";
    notes.push("только Config/XML");
  } else if (xui > 0 && tex > 0) {
    side = "both";
    confidence = "medium";
    notes.push("XUi + иконки/текстуры");
  } else if (xui > 0 && config > 0) {
    side = "both";
    confidence = "low";
    notes.push("XUi + Config (часто нужен и серверу, и клиенту)");
  }

  if (side === "server") {
    notes.push("XML с сервера подтягивается клиентам при входе");
  }
  if (side === "both") {
    notes.push("одинаковая папка Mods/ на сервере и у каждого игрока");
  }

  return { side, confidence, notes: notes.join("; "), dll, unity, tex, xui, config };
}

const modUrls = JSON.parse(readFileSync(urlsPath, "utf8"));
const tmpDir = join(modsDir, "_tmp");
mkdirSync(tmpDir, { recursive: true });

const rows = [];

for (const entry of manifest) {
  const archive = entry.archive ?? `${entry.name}.zip`;
  let zipPath = join(modsDir, archive);
  if (!existsSync(zipPath)) {
    zipPath = join(tmpDir, archive);
    if (!existsSync(zipPath)) {
      const url = parseUrl(modUrls[archive]);
      if (!url) {
        rows.push({ name: entry.name, archive, side: "?", confidence: "none", notes: "нет zip и URL" });
        continue;
      }
      process.stdout.write(`Скачивание ${archive}… `);
      const href = await yandexHref(url);
      const res = await fetch(href);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(zipPath, buf);
      console.log(`${(buf.length / 1e6).toFixed(1)} MB`);
    }
  }

  const a = analyzeZip(zipPath, entry.name);
  rows.push({
    name: entry.name,
    folders: entry.names?.length ? entry.names.join(" | ") : entry.name,
    archive,
    ...a,
  });
}

console.log("\n=== Классификация модпака ===\n");
for (const side of ["server", "client", "both"]) {
  const label =
    side === "server"
      ? "В основном Server (достаточно на dedicated + у игроков для EAC/совместимости часто всё равно кладут всё)"
      : side === "client"
        ? "В основном Client (UI/HUD)"
        : "Server + Client (обязательно на обеих сторонах)";
  const list = rows.filter((r) => r.side === side);
  console.log(`## ${label} (${list.length})`);
  for (const r of list) {
    console.log(`- ${r.name}`);
    if (r.folders !== r.name) console.log(`  папки: ${r.folders}`);
    console.log(`  уверенность: ${r.confidence}; ${r.notes}`);
  }
  console.log("");
}

const unknown = rows.filter((r) => r.side === "?");
if (unknown.length) {
  console.log("## Не удалось проверить");
  for (const r of unknown) console.log(`- ${r.name}: ${r.notes}`);
}
