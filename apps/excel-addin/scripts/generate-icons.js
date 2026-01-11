/**
 * Icon Generation Script for VariScout Excel Add-in
 *
 * Generates placeholder icons at required sizes for Office Add-in manifest.
 *
 * Required sizes:
 * - 16x16 (small icon for ribbon)
 * - 32x32 (standard icon)
 * - 64x64 (high-res icon)
 * - 80x80 (largest icon)
 *
 * Run: node scripts/generate-icons.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsDir = join(__dirname, '../assets');

// Simple 1x1 blue pixel PNG as base (will be a placeholder)
// In production, replace with actual branded icons
const sizes = [16, 32, 64, 80];

/**
 * Creates a simple colored square PNG
 * This is a minimal PNG implementation for placeholder purposes
 */
function createPlaceholderPNG(size) {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const width = size;
  const height = size;
  const bitDepth = 8;
  const colorType = 2; // RGB
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(bitDepth, 8);
  ihdrData.writeUInt8(colorType, 9);
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data)
  // Simple blue (#3b82f6) solid color
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Create a simple gradient/pattern for the placeholder
      const isInner = x > size * 0.2 && x < size * 0.8 && y > size * 0.2 && y < size * 0.8;
      if (isInner) {
        // Blue center (chart bars)
        rawData.push(59, 130, 246); // #3b82f6
      } else {
        // Slate background
        rawData.push(30, 41, 59); // #1e293b
      }
    }
  }

  // Compress with zlib (using Node's built-in)
  const compressed = deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = [];

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0; // Ensure unsigned
  }

  for (let i = 0; i < data.length; i++) {
    crc = (table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }

  return (crc ^ 0xffffffff) >>> 0; // Ensure unsigned
}

// Generate icons
console.log('Generating placeholder icons for VariScout Excel Add-in...');

for (const size of sizes) {
  const png = createPlaceholderPNG(size);
  const filename = `icon-${size}.png`;
  const filepath = join(assetsDir, filename);
  writeFileSync(filepath, png);
  console.log(`  Created: ${filename} (${size}x${size})`);
}

console.log('\nPlaceholder icons created in apps/excel-addin/assets/');
console.log('Replace these with actual branded icons before AppSource submission.');
