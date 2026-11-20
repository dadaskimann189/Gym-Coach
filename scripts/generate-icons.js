import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer + 1 filter byte per scanline
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Pulse icon
function drawPulseIcon(x, y, w, h, isMaskable = false) {
  // Normalized 0 to 1
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const distCenter = Math.hypot(nx - cx, ny - cy);

  // Background: Rich dark slate (#0B0C0E) with subtle radial gradient
  let bgR = 12 + Math.floor(15 * (1 - Math.min(1, distCenter * 1.5)));
  let bgG = 13 + Math.floor(16 * (1 - Math.min(1, distCenter * 1.5)));
  let bgB = 16 + Math.floor(20 * (1 - Math.min(1, distCenter * 1.5)));

  // If maskable, safe zone is inner 80%. If not maskable, round corners nicely.
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerRadius));
    const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerRadius));
    const distCorner = Math.hypot(dx, dy);
    if (distCorner > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded squircle
    }
  }

  // Draw Pulse Waveform / "P" monogram in center
  // Scale factor: maskable is scaled down by 0.75 to fit inside safe-zone
  const scale = isMaskable ? 0.72 : 0.88;
  const px = (nx - 0.5) / scale + 0.5;
  const py = (ny - 0.5) / scale + 0.5;

  // Let's draw an energetic EKG heartbeat / pulse line across + gym aesthetic
  // Heartbeat line coordinates:
  // Points: (0.18, 0.52) -> (0.35, 0.52) -> (0.42, 0.30) -> (0.50, 0.72) -> (0.58, 0.38) -> (0.64, 0.52) -> (0.82, 0.52)
  const pts = [
    [0.16, 0.52],
    [0.34, 0.52],
    [0.42, 0.26],
    [0.51, 0.74],
    [0.59, 0.38],
    [0.65, 0.52],
    [0.84, 0.52],
  ];

  function distToSegment(x, y, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(x - x1, y - y1);
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1)));
  }

  let minLineDist = 999;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < minLineDist) minLineDist = d;
  }

  const lineWidth = 0.024;
  const glowWidth = 0.085;

  if (minLineDist <= lineWidth) {
    // Core pulse line: Bright energetic red/coral (#FF453A to #FF6B60)
    const factor = minLineDist / lineWidth;
    const r = Math.round(255 - factor * 10);
    const g = Math.round(69 + factor * 30);
    const b = Math.round(58 + factor * 20);
    return [r, g, b, 255];
  } else if (minLineDist <= glowWidth) {
    // Pulse glow
    const intensity = Math.pow(1 - (minLineDist - lineWidth) / (glowWidth - lineWidth), 1.8);
    const r = Math.min(255, Math.round(bgR + 255 * intensity * 0.85));
    const g = Math.min(255, Math.round(bgG + 69 * intensity * 0.6));
    const b = Math.min(255, Math.round(bgB + 58 * intensity * 0.6));
    return [r, g, b, 255];
  }

  // Two decorative barbell weight accent circles at start and end of pulse
  const dStart = Math.hypot(px - 0.16, py - 0.52);
  const dEnd = Math.hypot(px - 0.84, py - 0.52);
  if (dStart <= 0.032 || dEnd <= 0.032) {
    return [255, 69, 58, 255];
  }

  // High peak glow accent on top vertex (0.42, 0.26)
  const dPeak = Math.hypot(px - 0.42, py - 0.26);
  if (dPeak <= 0.04) {
    const f = 1 - dPeak / 0.04;
    return [
      Math.min(255, Math.round(bgR + 255 * f)),
      Math.min(255, Math.round(bgG + 200 * f)),
      Math.min(255, Math.round(bgB + 180 * f)),
      255,
    ];
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Apple Touch Icon: 180x180 PNG
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawPulseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleIcon);

// 2. PWA 192x192 PNG
const pwa192 = createPNG(192, 192, (x, y, w, h) => drawPulseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), pwa192);

// 3. PWA 512x512 PNG
const pwa512 = createPNG(512, 512, (x, y, w, h) => drawPulseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), pwa512);

// 4. PWA Maskable 512x512 PNG
const pwaMaskable = createPNG(512, 512, (x, y, w, h) => drawPulseIcon(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// 5. SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="120" fill="#0B0C0E"/>
  <path d="M80 266 H174 L215 133 L261 379 L302 195 L333 266 H432" stroke="#FF453A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="80" cy="266" r="16" fill="#FF453A"/>
  <circle cx="432" cy="266" r="16" fill="#FF453A"/>
  <circle cx="215" cy="133" r="12" fill="#FFFFFF"/>
</svg>`;
fs.writeFileSync(path.join(outDir, 'icon.svg'), svg);

console.log('Successfully generated all PWA icons in /public!');
