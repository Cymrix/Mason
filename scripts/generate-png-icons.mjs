import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node.js PNG encoder without external dependencies
function createPNG(width, height, getPixel) {
  // getPixel(x, y) => [r, g, b, a] (0-255)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = [0]; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      row.push(r, g, b, a);
    }
    rawRows.push(Buffer.from(row));
  }
  const rawData = Buffer.concat(rawRows);
  const compressedData = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // Precompute CRC table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[i] = c >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const crcValue = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcValue, 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk: width (4), height (4), bitDepth (1), colorType (1 = RGBA = 6), comp (1), filter (1), interlace (1)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateMasonIcon(size, isMaskable = false) {
  return createPNG(size, size, (x, y) => {
    const nx = x / size;
    const ny = y / size;

    // Dark sleek gradient background (#090d16 to #020617)
    let r = Math.floor(10 + ny * 6);
    let g = Math.floor(14 + nx * 10);
    let b = Math.floor(24 + (nx + ny) * 15);
    let a = 255;

    // Grid lines
    const gridSpacing = size / 8;
    if ((x % Math.floor(gridSpacing) === 0) || (y % Math.floor(gridSpacing) === 0)) {
      r = Math.min(255, r + 20);
      g = Math.min(255, g + 40);
      b = Math.min(255, b + 60);
    }

    // Cyan glowing center "M" / Citadel symbol
    const cx = size / 2;
    const cy = size / 2;
    const dx = (x - cx) / (size * 0.4);
    const dy = (y - cy) / (size * 0.4);

    // Outer boundary check for "M" glyph shape
    const inLeftPillar = nx >= 0.22 && nx <= 0.36 && ny >= 0.28 && ny <= 0.76;
    const inRightPillar = nx >= 0.64 && nx <= 0.78 && ny >= 0.28 && ny <= 0.76;
    const inCenterApex = ny >= 0.24 && ny <= 0.58 && Math.abs(nx - 0.5) <= (0.28 - (ny - 0.24) * 0.45);
    const inCenterCut = ny >= 0.38 && ny <= 0.76 && Math.abs(nx - 0.5) <= (0.16 - (ny - 0.38) * 0.25);

    if ((inLeftPillar || inRightPillar || inCenterApex) && !inCenterCut) {
      // Vivid glowing cyan gradient
      const glow = 1 - Math.sqrt(dx * dx + dy * dy) * 0.5;
      r = Math.floor(6 * glow);
      g = Math.floor(182 * glow + 40);
      b = Math.floor(212 * glow + 40);
    }

    // Glowing keystone in center bottom
    const inKeystone = ny >= 0.48 && ny <= 0.74 && Math.abs(nx - 0.5) <= (0.07 + (ny - 0.48) * 0.05);
    if (inKeystone) {
      r = 34;
      g = 211;
      b = 238;
    }

    return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)), a];
  });
}

const icon192 = generateMasonIcon(192);
const icon512 = generateMasonIcon(512);
const iconMaskable = generateMasonIcon(512, true);

fs.writeFileSync(path.resolve('./public/icon-192.png'), icon192);
fs.writeFileSync(path.resolve('./public/icon-512.png'), icon512);
fs.writeFileSync(path.resolve('./public/icon-maskable.png'), iconMaskable);

console.log('PNG Icons generated successfully (192x192, 512x512, maskable).');
