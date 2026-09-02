const fs = require('fs');
const path = require('path');

// Simple helper to create uncompressed PNG images of 120x120 pixels with distinct background colors and inner square
function createPng(r, g, b, label) {
  const width = 120;
  const height = 120;

  // We can create a simple BMP or use a valid standalone PNG with canvas/pure binary chunks
  // Let's create an uncompressed 24-bit BMP which is accepted or generate standard PNG chunks
  // Even better: standard valid PNG with zlib
  const zlib = require('zlib');

  const rawData = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 3 + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Border or pattern
      const isBorder = (x < 6 || x >= width - 6 || y < 6 || y >= height - 6);
      const isInner = (x > 35 && x < 85 && y > 35 && y < 85);
      if (isBorder) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else if (isInner) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 230;
        rawData[pxOffset + 2] = 100;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 2; // Color type: RGB
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const assetsDir = path.join(__dirname, 'test_avatars');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(assetsDir, 'student_avatar.png'), createPng(16, 185, 129, 'STUDENT')); // Emerald Green
fs.writeFileSync(path.join(assetsDir, 'faculty_avatar.png'), createPng(245, 158, 11, 'FACULTY')); // Amber / Gold
fs.writeFileSync(path.join(assetsDir, 'admin_avatar.png'), createPng(139, 92, 246, 'ADMIN'));    // Violet / Purple
fs.writeFileSync(path.join(assetsDir, 'student_replacement.png'), createPng(6, 182, 212, 'REPLACEMENT')); // Cyan

console.log('Created 4 distinct test PNG avatars in:', assetsDir);
