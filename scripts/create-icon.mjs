/**
 * Генерация квадратной PNG-иконки 512×512 без внешних зависимостей (CRC32 + deflate).
 */
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIZE = 512;

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

// RGBA: фон #1a1d24, круг #e85d04
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
let off = 0;
for (let y = 0; y < SIZE; y++) {
  raw[off++] = 0; // filter none
  for (let x = 0; x < SIZE; x++) {
    const cx = x - SIZE / 2;
    const cy = y - SIZE / 2;
    const r = SIZE * 0.35;
    const inCircle = cx * cx + cy * cy <= r * r;
    if (inCircle) {
      raw[off++] = 232;
      raw[off++] = 93;
      raw[off++] = 4;
      raw[off++] = 255;
    } else {
      raw[off++] = 26;
      raw[off++] = 29;
      raw[off++] = 36;
      raw[off++] = 255;
    }
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
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
console.log(`Created ${out} (${SIZE}x${SIZE})`);
