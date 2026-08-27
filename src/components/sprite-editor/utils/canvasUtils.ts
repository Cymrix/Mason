import {
  Layer,
  AnimationFrame,
  SerializableLayer,
  SerializableFrame,
  BrushShape,
  SymmetryMode,
  DitherPatternType,
  BlendModeType
} from '../types';
import { hexToRgb } from './palettes';

export const BAYER_2X2 = [
  [0, 2],
  [3, 1]
];

export const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

export const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

/**
 * Creates an in-memory HTMLCanvasElement with crisp pixel smoothing disabled
 */
export const createOffscreenCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
  }
  return canvas;
};

/**
 * Clones a canvas content completely
 */
export const cloneCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const dest = createOffscreenCanvas(source.width, source.height);
  const ctx = dest.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0);
  }
  return dest;
};

/**
 * Clears an entire canvas to transparent
 */
export const clearCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

/**
 * Test whether a pixel coordinate satisfies the selected dithering pattern
 */
export const testDitherPattern = (
  x: number,
  y: number,
  pattern: DitherPatternType
): boolean => {
  if (pattern === 'none') return true;

  const nx = Math.floor(x);
  const ny = Math.floor(y);

  if (pattern === 'checker50') {
    return (nx + ny) % 2 === 0;
  }
  if (pattern === 'bayer2') {
    const v = BAYER_2X2[((ny % 2) + 2) % 2][((nx % 2) + 2) % 2];
    return v < 2;
  }
  if (pattern === 'bayer4') {
    const v = BAYER_4X4[((ny % 4) + 4) % 4][((nx % 4) + 4) % 4];
    return v < 8;
  }
  if (pattern === 'bayer8') {
    const v = BAYER_8X8[((ny % 8) + 8) % 8][((nx % 8) + 8) % 8];
    return v < 32;
  }
  if (pattern === 'horizontal') {
    return ny % 2 === 0;
  }
  if (pattern === 'diagonal') {
    return (nx + ny) % 3 === 0;
  }
  return true;
};

/**
 * Computes all symmetric points based on symmetry mode
 */
export const getSymmetricPoints = (
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  mode: SymmetryMode
): Array<{ x: number; y: number }> => {
  const pts: Array<{ x: number; y: number }> = [{ x, y }];
  if (mode === 'none') return pts;

  const mirrorX = canvasWidth - 1 - x;
  const mirrorY = canvasHeight - 1 - y;

  if (mode === 'horizontal' || mode === 'both') {
    pts.push({ x: mirrorX, y });
  }
  if (mode === 'vertical' || mode === 'both') {
    pts.push({ x, y: mirrorY });
  }
  if (mode === 'both') {
    pts.push({ x: mirrorX, y: mirrorY });
  }

  return pts;
};

/**
 * Draws a single brush dab at integer grid coordinates
 */
export const drawBrushDab = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  colorRgba: { r: number; g: number; b: number; a: number },
  size: number,
  shape: BrushShape,
  dither: DitherPatternType = 'none',
  isEraser: boolean = false
): void => {
  const half = Math.floor(size / 2);
  const startX = cx - half;
  const startY = cy - half;

  ctx.save();
  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  const hexColor = `rgba(${colorRgba.r}, ${colorRgba.g}, ${colorRgba.b}, ${colorRgba.a / 255})`;
  ctx.fillStyle = hexColor;

  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const px = startX + dx;
      const py = startY + dy;

      if (shape === 'circle' && size > 2) {
        const radius = size / 2;
        const distSq = Math.pow(dx + 0.5 - radius, 2) + Math.pow(dy + 0.5 - radius, 2);
        if (distSq > Math.pow(radius, 2)) continue;
      }

      if (!isEraser && dither !== 'none' && !testDitherPattern(px, py, dither)) {
        continue;
      }

      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.restore();
};

/**
 * Standard Bresenham Line Rasterization with Pixel-Perfect stroke support
 */
export const drawBresenhamLine = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colorRgba: { r: number; g: number; b: number; a: number },
  size: number,
  shape: BrushShape,
  pixelPerfect: boolean,
  dither: DitherPatternType,
  symmetry: SymmetryMode,
  canvasWidth: number,
  canvasHeight: number,
  isEraser: boolean = false
): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];

  let cx0 = Math.floor(x0);
  let cy0 = Math.floor(y0);
  const cx1 = Math.floor(x1);
  const cy1 = Math.floor(y1);

  const dx = Math.abs(cx1 - cx0);
  const dy = Math.abs(cy1 - cy0);
  const sx = cx0 < cx1 ? 1 : -1;
  const sy = cy0 < cy1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: cx0, y: cy0 });
    if (cx0 === cx1 && cy0 === cy1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy0 += sy;
    }
  }

  // Filter out L-shaped duplicate corners if pixel-perfect is enabled (1px brush only)
  let renderPoints = points;
  if (pixelPerfect && size === 1 && points.length > 2) {
    const filtered: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < points.length; i++) {
      if (i > 0 && i < points.length - 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        // L-corner detection
        if (
          (prev.x !== next.x && prev.y !== next.y) &&
          ((prev.x === curr.x && next.y === curr.y) || (prev.y === curr.y && next.x === curr.x))
        ) {
          // Check if diagonal step exists
          continue;
        }
      }
      filtered.push(points[i]);
    }
    renderPoints = filtered;
  }

  for (const pt of renderPoints) {
    const syms = getSymmetricPoints(pt.x, pt.y, canvasWidth, canvasHeight, symmetry);
    for (const s of syms) {
      drawBrushDab(ctx, s.x, s.y, colorRgba, size, shape, dither, isEraser);
    }
  }

  return points;
};

/**
 * Flood Fill (Bucket) Algorithm
 */
export const floodFill = (
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillColorRgba: { r: number; g: number; b: number; a: number },
  dither: DitherPatternType = 'none'
): void => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);

  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const getIdx = (x: number, y: number) => (y * w + x) * 4;

  const targetIdx = getIdx(sx, sy);
  const tr = data[targetIdx];
  const tg = data[targetIdx + 1];
  const tb = data[targetIdx + 2];
  const ta = data[targetIdx + 3];

  const fr = fillColorRgba.r;
  const fg = fillColorRgba.g;
  const fb = fillColorRgba.b;
  const fa = fillColorRgba.a;

  // If clicking on same color and no dither, exit early
  if (tr === fr && tg === fg && tb === fb && ta === fa && dither === 'none') {
    return;
  }

  const matchTarget = (x: number, y: number) => {
    const idx = getIdx(x, y);
    return (
      data[idx] === tr &&
      data[idx + 1] === tg &&
      data[idx + 2] === tb &&
      data[idx + 3] === ta
    );
  };

  const visited = new Uint8Array(w * h);
  const queue: Array<[number, number]> = [[sx, sy]];
  visited[sy * w + sx] = 1;

  while (queue.length > 0) {
    const [cx, cy] = queue.pop()!;
    const idx = getIdx(cx, cy);

    if (dither === 'none' || testDitherPattern(cx, cy, dither)) {
      data[idx] = fr;
      data[idx + 1] = fg;
      data[idx + 2] = fb;
      data[idx + 3] = fa;
    }

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const vIdx = ny * w + nx;
        if (visited[vIdx] === 0 && matchTarget(nx, ny)) {
          visited[vIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

/**
 * Rectangle Tool Drawing
 */
export const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colorRgba: { r: number; g: number; b: number; a: number },
  size: number,
  fill: boolean,
  dither: DitherPatternType
): void => {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  ctx.save();
  ctx.fillStyle = `rgba(${colorRgba.r}, ${colorRgba.g}, ${colorRgba.b}, ${colorRgba.a / 255})`;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const isBorder = (x - minX < size) || (maxX - x < size) || (y - minY < size) || (maxY - y < size);
      if (!fill && !isBorder) continue;

      if (dither === 'none' || testDitherPattern(x, y, dither)) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.restore();
};

/**
 * Ellipse Tool Drawing
 */
export const drawEllipse = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colorRgba: { r: number; g: number; b: number; a: number },
  size: number,
  fill: boolean,
  dither: DitherPatternType
): void => {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  if (rx <= 0 || ry <= 0) return;

  const cx = minX + rx;
  const cy = minY + ry;

  ctx.save();
  ctx.fillStyle = `rgba(${colorRgba.r}, ${colorRgba.g}, ${colorRgba.b}, ${colorRgba.a / 255})`;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const normalizedDist = Math.pow((x + 0.5 - cx) / rx, 2) + Math.pow((y + 0.5 - cy) / ry, 2);
      if (normalizedDist > 1.0) continue;

      if (!fill) {
        const innerRx = Math.max(0.1, rx - size);
        const innerRy = Math.max(0.1, ry - size);
        const innerDist = Math.pow((x + 0.5 - cx) / innerRx, 2) + Math.pow((y + 0.5 - cy) / innerRy, 2);
        if (innerDist < 1.0) continue;
      }

      if (dither === 'none' || testDitherPattern(x, y, dither)) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.restore();
};

/**
 * Spray / Airbrush Tool
 */
export const sprayDabs = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  colorRgba: { r: number; g: number; b: number; a: number },
  radius: number,
  density: number,
  dither: DitherPatternType = 'none'
): void => {
  ctx.save();
  ctx.fillStyle = `rgba(${colorRgba.r}, ${colorRgba.g}, ${colorRgba.b}, ${colorRgba.a / 255})`;

  const numParticles = Math.max(2, Math.round(density * (radius / 4)));

  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    const px = Math.round(cx + Math.cos(angle) * r);
    const py = Math.round(cy + Math.sin(angle) * r);

    if (dither === 'none' || testDitherPattern(px, py, dither)) {
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.restore();
};

/**
 * Composite all visible layers of a frame into a single canvas
 */
export const compositeFrame = (
  frame: AnimationFrame,
  width: number,
  height: number
): HTMLCanvasElement => {
  const result = createOffscreenCanvas(width, height);
  const ctx = result.getContext('2d');
  if (!ctx) return result;

  for (const layer of frame.layers) {
    if (!layer.visible || layer.opacity <= 0) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity / 100;

    switch (layer.blendMode) {
      case 'multiply':
        ctx.globalCompositeOperation = 'multiply';
        break;
      case 'screen':
        ctx.globalCompositeOperation = 'screen';
        break;
      case 'overlay':
        ctx.globalCompositeOperation = 'overlay';
        break;
      case 'darken':
        ctx.globalCompositeOperation = 'darken';
        break;
      case 'lighten':
        ctx.globalCompositeOperation = 'lighten';
        break;
      default:
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
  }

  return result;
};

/**
 * Arrange animation frames into a single spritesheet canvas
 */
export const generateSpritesheet = (
  frames: AnimationFrame[],
  frameWidth: number,
  frameHeight: number,
  columns?: number
): { canvas: HTMLCanvasElement; cols: number; rows: number } => {
  const totalFrames = Math.max(1, frames.length);
  const cols = columns && columns > 0 ? columns : totalFrames;
  const rows = Math.ceil(totalFrames / cols);

  const sheetCanvas = createOffscreenCanvas(cols * frameWidth, rows * frameHeight);
  const ctx = sheetCanvas.getContext('2d');
  if (!ctx) return { canvas: sheetCanvas, cols, rows };

  frames.forEach((frame, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const frameCanvas = compositeFrame(frame, frameWidth, frameHeight);
    ctx.drawImage(frameCanvas, col * frameWidth, row * frameHeight);
  });

  return { canvas: sheetCanvas, cols, rows };
};

/**
 * Serialize a Layer with its canvas encoded to base64 PNG dataUrl
 */
export const serializeLayer = (layer: Layer): SerializableLayer => {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    dataUrl: layer.canvas.toDataURL('image/png')
  };
};

/**
 * Serialize an AnimationFrame
 */
export const serializeFrame = (frame: AnimationFrame): SerializableFrame => {
  return {
    id: frame.id,
    name: frame.name,
    duration: frame.duration,
    layers: frame.layers.map(serializeLayer)
  };
};

/**
 * Deserialize a SerializableLayer into a live Layer with HTMLCanvasElement
 */
export const deserializeLayer = async (
  serialized: SerializableLayer,
  width: number,
  height: number
): Promise<Layer> => {
  const canvas = createOffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (serialized.dataUrl && serialized.dataUrl.length > 20 && ctx) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = serialized.dataUrl;
    });
  }

  return {
    id: serialized.id || `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: serialized.name || 'Layer',
    visible: serialized.visible !== false,
    locked: Boolean(serialized.locked),
    opacity: typeof serialized.opacity === 'number' ? serialized.opacity : 100,
    blendMode: serialized.blendMode || 'normal',
    canvas
  };
};

/**
 * Deserialize a SerializableFrame into live AnimationFrame
 */
export const deserializeFrame = async (
  serialized: SerializableFrame,
  width: number,
  height: number
): Promise<AnimationFrame> => {
  const layers = await Promise.all(
    serialized.layers.map(l => deserializeLayer(l, width, height))
  );

  return {
    id: serialized.id || `frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: serialized.name || 'Frame',
    duration: serialized.duration || 100,
    layers: layers.length > 0 ? layers : [createDefaultLayer(width, height, 'Layer 1')]
  };
};

/**
 * Create a fresh default Layer
 */
export const createDefaultLayer = (
  width: number,
  height: number,
  name: string = 'Layer 1'
): Layer => {
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'normal',
    canvas: createOffscreenCanvas(width, height)
  };
};

/**
 * Create a fresh default AnimationFrame
 */
export const createDefaultFrame = (
  width: number,
  height: number,
  name: string = 'Frame 1'
): AnimationFrame => {
  return {
    id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    duration: 100,
    layers: [createDefaultLayer(width, height, 'Layer 1')]
  };
};

/**
 * Flip canvas horizontally or vertically
 */
export const flipCanvas = (
  canvas: HTMLCanvasElement,
  horizontal: boolean,
  vertical: boolean
): void => {
  const copy = cloneCanvas(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(horizontal ? canvas.width : 0, vertical ? canvas.height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(copy, 0, 0);
  ctx.restore();
};

/**
 * Rotate canvas by 90 degrees
 */
export const rotateCanvas90 = (
  canvas: HTMLCanvasElement,
  clockwise: boolean = true
): void => {
  const copy = cloneCanvas(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(clockwise ? Math.PI / 2 : -Math.PI / 2);
  ctx.drawImage(copy, -canvas.width / 2, -canvas.height / 2);
  ctx.restore();
};

/**
 * Invert all colors in active canvas
 */
export const invertColors = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  ctx.putImageData(imgData, 0, 0);
};
