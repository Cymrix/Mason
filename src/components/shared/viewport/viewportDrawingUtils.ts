import { WorldPoint } from './useMasonViewport';

export interface ViewportGridOptions {
  width: number;
  height: number;
  pan: WorldPoint;
  scale: number;
  gridSize?: number;
  majorGridMultiple?: number;
  gridColor?: string;
  majorGridColor?: string;
  backgroundColor?: string;
  originMode?: 'topleft' | 'center';
}

export function drawViewportGrid(
  ctx: CanvasRenderingContext2D,
  options: ViewportGridOptions
) {
  const {
    width,
    height,
    pan,
    scale,
    gridSize = 16,
    majorGridMultiple = 4,
    gridColor = 'rgba(255, 255, 255, 0.05)',
    majorGridColor = 'rgba(255, 255, 255, 0.12)',
    backgroundColor = '#0a0a0f',
    originMode = 'topleft'
  } = options;

  if (width <= 0 || height <= 0) return;

  // Draw background fill
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  const originX = originMode === 'center' ? width / 2 + pan.x : pan.x;
  const originY = originMode === 'center' ? height / 2 + pan.y : pan.y;

  const step = gridSize * scale;
  if (step < 4) {
    ctx.restore();
    return; // Avoid drawing too dense lines
  }

  const startX = (originX % step + step) % step;
  const startY = (originY % step + step) % step;

  // Minor Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.beginPath();

  for (let x = startX; x <= width; x += step) {
    ctx.moveTo(Math.floor(x) + 0.5, 0);
    ctx.lineTo(Math.floor(x) + 0.5, height);
  }

  for (let y = startY; y <= height; y += step) {
    ctx.moveTo(0, Math.floor(y) + 0.5);
    ctx.lineTo(width, Math.floor(y) + 0.5);
  }
  ctx.stroke();

  // Major Grid Lines
  const majorStep = step * majorGridMultiple;
  if (majorStep >= 16) {
    const majorStartX = (originX % majorStep + majorStep) % majorStep;
    const majorStartY = (originY % majorStep + majorStep) % majorStep;

    ctx.strokeStyle = majorGridColor;
    ctx.beginPath();
    for (let x = majorStartX; x <= width; x += majorStep) {
      ctx.moveTo(Math.floor(x) + 0.5, 0);
      ctx.lineTo(Math.floor(x) + 0.5, height);
    }
    for (let y = majorStartY; y <= height; y += majorStep) {
      ctx.moveTo(0, Math.floor(y) + 0.5);
      ctx.lineTo(width, Math.floor(y) + 0.5);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export interface OriginCrosshairOptions {
  width: number;
  height: number;
  pan: WorldPoint;
  scale: number;
  length?: number;
  originMode?: 'topleft' | 'center';
  axisColors?: { x: string; y: string };
  showLabels?: boolean;
}

export function drawOriginCrosshair(
  ctx: CanvasRenderingContext2D,
  options: OriginCrosshairOptions
) {
  const {
    width,
    height,
    pan,
    originMode = 'topleft',
    length = 24,
    axisColors = { x: '#ef4444', y: '#22c55e' },
    showLabels = true
  } = options;

  const originX = originMode === 'center' ? width / 2 + pan.x : pan.x;
  const originY = originMode === 'center' ? height / 2 + pan.y : pan.y;

  ctx.save();
  ctx.lineWidth = 1.5;

  // X Axis (Red)
  ctx.strokeStyle = axisColors.x;
  ctx.beginPath();
  ctx.moveTo(originX - length, originY);
  ctx.lineTo(originX + length, originY);
  ctx.stroke();

  // Y Axis (Green)
  ctx.strokeStyle = axisColors.y;
  ctx.beginPath();
  ctx.moveTo(originX, originY - length);
  ctx.lineTo(originX, originY + length);
  ctx.stroke();

  // Center Marker Circle
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(originX, originY, 3, 0, Math.PI * 2);
  ctx.fill();

  if (showLabels) {
    ctx.font = '9px monospace';
    ctx.fillStyle = axisColors.x;
    ctx.fillText('+X', originX + length + 2, originY + 3);
    ctx.fillStyle = axisColors.y;
    ctx.fillText('+Y', originX - 5, originY + length + 10);
  }

  ctx.restore();
}
