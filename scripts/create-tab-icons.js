/**
 * 生成 81×81 TabBar 图标（微信常见线框风格）
 * node scripts/create-tab-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 81;
const GRAY = [122, 126, 131];
const GREEN = [7, 193, 96];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 0);
  return Buffer.concat([len, Buffer.from(type), data, crc]);
}

function inRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
}

function drawHome(x, y) {
  const cx = SIZE / 2;
  const roofY = 22;
  if (y >= roofY && y <= 38 && Math.abs(x - cx) <= (y - roofY) * 1.1) return true;
  return inRect(x, y, 24, 38, 33, 28);
}

function drawShop(x, y) {
  const cells = [
    [22, 22, 16, 16],
    [43, 22, 16, 16],
    [22, 43, 16, 16],
    [43, 43, 16, 16]
  ];
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i];
    if (inRect(x, y, c[0], c[1], c[2], c[3])) return true;
  }
  return false;
}

function drawProject(x, y) {
  const bars = [
    [22, 24, 37, 6],
    [22, 38, 37, 6],
    [22, 52, 28, 6]
  ];
  for (let i = 0; i < bars.length; i += 1) {
    const b = bars[i];
    if (inRect(x, y, b[0], b[1], b[2], b[3])) return true;
  }
  return false;
}

function drawMe(x, y) {
  const cx = SIZE / 2;
  const dy = y - 30;
  if (dy * dy + (x - cx) * (x - cx) <= 144) return true;
  return inRect(x, y, 24, 48, 33, 20);
}

const drawers = {
  home: drawHome,
  shop: drawShop,
  project: drawProject,
  me: drawMe
};

function createPng(drawFn, rgb) {
  const row = Buffer.alloc(1 + SIZE * 3);
  const raw = Buffer.alloc(row.length * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    row[0] = 0;
    for (let x = 0; x < SIZE; x += 1) {
      const on = drawFn(x, y);
      const o = 1 + x * 3;
      if (on) {
        row[o] = rgb[0];
        row[o + 1] = rgb[1];
        row[o + 2] = rgb[2];
      } else {
        row[o] = 255;
        row[o + 1] = 255;
        row[o + 2] = 255;
      }
    }
    row.copy(raw, y * row.length);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const dir = path.join(__dirname, '..', 'miniprogram', 'assets', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

Object.keys(drawers).forEach(function (name) {
  const draw = drawers[name];
  fs.writeFileSync(path.join(dir, name + '.png'), createPng(draw, GRAY));
  fs.writeFileSync(path.join(dir, name + '-active.png'), createPng(draw, GREEN));
  console.log('created', name);
});
