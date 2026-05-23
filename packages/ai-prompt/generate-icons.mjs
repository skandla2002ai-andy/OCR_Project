/**
 * Pure-JS PWA icon generator.
 * Uses only Node built-ins (zlib, fs/path) — no native modules required.
 * Generates: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico
 */
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── CRC32 (needed for PNG chunk integrity) ──────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB = Buffer.alloc(4); lenB.writeUInt32BE(data.length, 0);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// ── Pixel renderer: dark bg + indigo circle + chat lines ────────
function pixel(x, y, size) {
  const cx = x - size / 2, cy = y - size / 2;
  const r = Math.sqrt(cx * cx + cy * cy);
  const radius = size * 0.42;

  // Rounded-square background check using superellipse
  const bx = Math.abs(x / size - 0.5), by = Math.abs(y / size - 0.5);
  const cornerRadius = 0.18;
  const inRoundRect = bx <= 0.5 - cornerRadius || by <= 0.5 - cornerRadius ||
    Math.sqrt((bx - (0.5 - cornerRadius)) ** 2 + (by - (0.5 - cornerRadius)) ** 2) <= cornerRadius;

  if (!inRoundRect) return [0, 0, 0]; // transparent edge → black (PNG RGB)

  const nx = x / size, ny = y / size;

  // Chat bubble: occupies 0.18–0.82 x, 0.20–0.72 y
  const inBubble = nx > 0.18 && nx < 0.82 && ny > 0.20 && ny < 0.72;
  const bubbleRadius = 0.07;
  // tail triangle (bottom-left of bubble)
  const inTail = nx > 0.18 && nx < 0.40 && ny > 0.66 && ny < 0.82 &&
    (ny - 0.66) > (nx - 0.18) * 1.2;

  if (inBubble || inTail) {
    // Indigo gradient left→right
    const t = nx;
    const R = Math.round(0x63 * (1 - t) + 0x8b * t);
    const G = Math.round(0x66 * (1 - t) + 0x5c * t);
    const B = Math.round(0xf1 * (1 - t) + 0xf6 * t);
    return [R, G, B];
  }

  // Message lines inside bubble (white)
  const lineY = [0.34, 0.44, 0.54];
  const lineX1 = [0.26, 0.26, 0.26];
  const lineX2 = [0.58, 0.74, 0.66];
  const lineH = 0.04;
  for (let i = 0; i < lineY.length; i++) {
    if (ny > lineY[i] && ny < lineY[i] + lineH && nx > lineX1[i] && nx < lineX2[i]) {
      const opacity = i === 0 ? 0.95 : i === 1 ? 0.80 : 0.65;
      const bg = [0x0f, 0x17, 0x2a]; // background colour
      const wh = 255;
      return [
        Math.round(wh * opacity + bg[0] * (1 - opacity)),
        Math.round(wh * opacity + bg[1] * (1 - opacity)),
        Math.round(wh * opacity + bg[2] * (1 - opacity)),
      ];
    }
  }

  // Background: dark navy gradient
  const t = (nx + ny) / 2;
  return [
    Math.round(0x0f * (1 - t) + 0x1e * t),
    Math.round(0x17 * (1 - t) + 0x29 * t),
    Math.round(0x2a * (1 - t) + 0x3b * t),
  ];
}

// ── PNG builder ──────────────────────────────────────────────────
function buildPNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB (no alpha for simplicity)

  // Build raw scanlines (filter byte 0 + RGB pixels)
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(size * stride);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size);
      const off = y * stride + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Minimal ICO builder (single 32×32 PNG inside ICO container) ─
function buildICO(pngBuf) {
  // ICO header: ICONDIR
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type: icon
  header.writeUInt16LE(1, 4);   // count: 1 image

  // ICONDIRENTRY (16 bytes)
  const entry = Buffer.alloc(16);
  entry[0] = 32;  // width
  entry[1] = 32;  // height
  entry[2] = 0;   // color count
  entry[3] = 0;   // reserved
  entry.writeUInt16LE(1, 4);  // planes
  entry.writeUInt16LE(32, 6); // bit count
  entry.writeUInt32LE(pngBuf.length, 8);  // size of image data
  entry.writeUInt32LE(6 + 16, 12);        // offset (header + entry)

  return Buffer.concat([header, entry, pngBuf]);
}

// ── Generate all files ───────────────────────────────────────────
const out = (name) => resolve(__dir, 'public', name);

console.log('Generating PWA icons...');

const png512 = buildPNG(512);
const png192 = buildPNG(192);
const png180 = buildPNG(180);
const png32  = buildPNG(32);

writeFileSync(out('icon-512.png'),         png512);  console.log('  ✓ icon-512.png');
writeFileSync(out('icon-maskable-512.png'),png512);  console.log('  ✓ icon-maskable-512.png');
writeFileSync(out('icon-192.png'),         png192);  console.log('  ✓ icon-192.png');
writeFileSync(out('apple-touch-icon.png'), png180);  console.log('  ✓ apple-touch-icon.png');
writeFileSync(out('favicon.ico'),          buildICO(png32)); console.log('  ✓ favicon.ico');

// favicon.svg alias (already created)
console.log('Done.');
