import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDir = join(root, 'assets');
mkdirSync(assetDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function isRoundedRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x >= right || y < top || y >= bottom) return false;
  const cx = x < left + radius ? left + radius : x >= right - radius ? right - radius - 1 : x;
  const cy = y < top + radius ? top + radius : y >= bottom - radius ? bottom - radius - 1 : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function blend(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function makePng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.max(3, Math.round(size * 0.18));
  const tabLeft = Math.round(size * 0.18);
  const tabTop = Math.round(size * 0.25);
  const tabRight = Math.round(size * 0.82);
  const tabBottom = Math.round(size * 0.68);
  const tabRadius = Math.max(2, Math.round(size * 0.08));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const insideBackground = isRoundedRect(x, y, 0, 0, size, size, radius);
      if (!insideBackground) continue;

      const t = (x + y) / (size * 2);
      pixels[offset] = blend(15, 14, t);
      pixels[offset + 1] = blend(23, 116, t);
      pixels[offset + 2] = blend(42, 144, t);
      pixels[offset + 3] = 255;

      if (isRoundedRect(x, y, tabLeft, tabTop, tabRight, tabBottom, tabRadius)) {
        pixels[offset] = 248;
        pixels[offset + 1] = 250;
        pixels[offset + 2] = 252;
      }

      const lineY = Math.round(size * 0.47);
      if (y >= lineY && y < lineY + Math.max(1, Math.round(size * 0.04)) && x >= tabLeft + size * 0.12 && x < tabRight - size * 0.2) {
        pixels[offset] = 20;
        pixels[offset + 1] = 184;
        pixels[offset + 2] = 166;
      }

      const caretX = Math.round(size * 0.64);
      if (x >= caretX && x < caretX + Math.max(1, Math.round(size * 0.04)) && y >= tabTop + size * 0.11 && y < tabBottom - size * 0.1) {
        pixels[offset] = 249;
        pixels[offset + 1] = 115;
        pixels[offset + 2] = 22;
      }
    }
  }

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(assetDir, `icon${size}.png`), makePng(size));
}
