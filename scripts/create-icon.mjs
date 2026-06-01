/**
 * Исходник иконки Fans Launcher 1024×1024 → app-icon.png
 * Далее: npm run icon:gen (tauri icon для всех платформ)
 */
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIZE = 1024;

const BG = [10, 14, 20]; // #0a0e14
const TILE = [16, 185, 129]; // brand #10b981
const TILE_EDGE = [5, 150, 105]; // #059669
const GLYPH = [6, 8, 11]; // #06080b

/** Пиксельная «7» (как в titlebar). */
const SEVEN = [
  "11111111111",
  "00000000001",
  "00000000011",
  "00000000110",
  "00000001100",
  "00000110000",
  "00001100000",
  "00011000000",
  "00110000000",
  "01100000000",
  "11111111111",
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, crc]);
}

function inRoundRect(x, y, left, top, w, h, r) {
  if (x < left || x >= left + w || y < top || y >= top + h) return false;
  const rx = x - left;
  const ry = y - top;
  if (rx < r && ry < r) {
    const dx = r - rx;
    const dy = r - ry;
    return dx * dx + dy * dy <= r * r;
  }
  if (rx >= w - r && ry < r) {
    const dx = rx - (w - r);
    const dy = r - ry;
    return dx * dx + dy * dy <= r * r;
  }
  if (rx < r && ry >= h - r) {
    const dx = r - rx;
    const dy = ry - (h - r);
    return dx * dx + dy * dy <= r * r;
  }
  if (rx >= w - r && ry >= h - r) {
    const dx = rx - (w - r);
    const dy = ry - (h - r);
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function setPx(raw, x, y, r, g, b, a = 255) {
  const off = (y * (SIZE * 4 + 1) + 1) + x * 4;
  raw[off] = r;
  raw[off + 1] = g;
  raw[off + 2] = b;
  raw[off + 3] = a;
}

const tileSize = Math.round(SIZE * 0.62);
const tileLeft = Math.round((SIZE - tileSize) / 2);
const tileTop = tileLeft;
const radius = Math.round(tileSize * 0.14);

const glyphCell = Math.round(tileSize / 14);
const glyphW = SEVEN[0].length * glyphCell;
const glyphH = SEVEN.length * glyphCell;
const glyphLeft = tileLeft + Math.round((tileSize - glyphW) / 2);
const glyphTop = tileTop + Math.round((tileSize - glyphH) / 2);

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
let off = 0;
for (let y = 0; y < SIZE; y++) {
  raw[off++] = 0;
  for (let x = 0; x < SIZE; x++) {
    const cx = x - SIZE / 2;
    const cy = y - SIZE / 2;
    const glow = Math.exp(-(cx * cx + cy * cy) / (SIZE * SIZE * 0.12));

    let r = BG[0];
    let g = BG[1];
    let b = BG[2];

    r = Math.round(lerp(r, TILE[0], glow * 0.12));
    g = Math.round(lerp(g, TILE[1], glow * 0.12));
    b = Math.round(lerp(b, TILE[2], glow * 0.12));

    if (inRoundRect(x, y, tileLeft, tileTop, tileSize, tileSize, radius)) {
      const edge =
        !inRoundRect(x, y, tileLeft + 3, tileTop + 3, tileSize - 6, tileSize - 6, radius - 2);
      if (edge) {
        r = TILE_EDGE[0];
        g = TILE_EDGE[1];
        b = TILE_EDGE[2];
      } else {
        r = TILE[0];
        g = TILE[1];
        b = TILE[2];
      }

      const gx = Math.floor((x - glyphLeft) / glyphCell);
      const gy = Math.floor((y - glyphTop) / glyphCell);
      if (
        gy >= 0 &&
        gy < SEVEN.length &&
        gx >= 0 &&
        gx < SEVEN[gy].length &&
        SEVEN[gy][gx] === "1"
      ) {
        r = GLYPH[0];
        g = GLYPH[1];
        b = GLYPH[2];
      }
    }

    setPx(raw, x, y, r, g, b);
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = Buffer.concat([
  signature,
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = join(__dirname, "..", "app-icon.png");
writeFileSync(out, png);
console.log(`Created ${out} (${SIZE}×${SIZE})`);
