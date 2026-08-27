import { SpraySettings, SprayMode, DabShape, SelectionState } from '../types';
import { hexToRgb } from '../utils/palettes';
import { createOffscreenCanvas } from '../utils/canvasUtils';

export interface SprayEngineOptions {
  width: number;
  height: number;
  getLayers: () => { canvas: HTMLCanvasElement; visible: boolean; locked: boolean; opacity: number }[];
  getActiveLayerIndex: () => number;
  getSpraySettings: () => SpraySettings;
  getActiveColors: () => string[]; // all selected colors or gradient stops
  getFgColor: () => string;
  onCanvasModified: () => void;
}

export class SprayPhysicsEngine {
  private width: number;
  private height: number;
  private getLayers: () => { canvas: HTMLCanvasElement; visible: boolean; locked: boolean; opacity: number }[];
  private getActiveLayerIndex: () => number;
  private getSpraySettings: () => SpraySettings;
  private getActiveColors: () => string[];
  private getFgColor: () => string;
  private onCanvasModified: () => void;

  // Scratchpad canvases for non-blend, colorize, eraser dabs
  private scratchCanvas: HTMLCanvasElement;
  private scratchCtx: CanvasRenderingContext2D;

  // Stroke tracking
  private isPainting = false;
  private strokeDistance = 0;
  private sprayAnchorX: number | null = null;
  private sprayAnchorY: number | null = null;
  private lastCursorX = 0;
  private lastCursorY = 0;
  private lastBurstTime = 0;
  private rafHandle: number | null = null;
  private dabCounter = 0;

  constructor(options: SprayEngineOptions) {
    this.width = options.width;
    this.height = options.height;
    this.getLayers = options.getLayers;
    this.getActiveLayerIndex = options.getActiveLayerIndex;
    this.getSpraySettings = options.getSpraySettings;
    this.getActiveColors = options.getActiveColors;
    this.getFgColor = options.getFgColor;
    this.onCanvasModified = options.onCanvasModified;

    this.scratchCanvas = createOffscreenCanvas(256, 256);
    this.scratchCtx = this.scratchCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private ensureScratchSize(w: number, h: number) {
    const nw = Math.max(this.scratchCanvas.width, Math.ceil(w) + 16);
    const nh = Math.max(this.scratchCanvas.height, Math.ceil(h) + 16);
    if (nw > this.scratchCanvas.width || nh > this.scratchCanvas.height) {
      this.scratchCanvas.width = nw;
      this.scratchCanvas.height = nh;
      this.scratchCtx = this.scratchCanvas.getContext('2d', { willReadFrequently: true })!;
    }
  }

  /**
   * Authentic Dabs per tick calculation from Palette Spray Studio:
   * Math.min(500, Math.max(4, Math.round((effSize*effSize)/12))) * (density/100)^2.2
   */
  public calculateDabsPerTick(brushSize: number, density: number, sprayMode: SprayMode): number {
    const maxDabs = Math.min(500, Math.max(4, Math.round((brushSize * brushSize) / 12)));
    const cappedMax = sprayMode === 'blur' ? Math.min(maxDabs, 16) : maxDabs;
    const densityFactor = Math.pow(density / 100, 2.2);
    const rawDabs = cappedMax * densityFactor;
    const intPart = Math.floor(rawDabs);
    const fracPart = rawDabs - intPart;
    const count = intPart + (Math.random() < fracPart ? 1 : 0);
    return Math.max(1, count);
  }

  /**
   * Flow interval in milliseconds:
   * Math.max(4, Math.round(150 - (135 * (flow / 100))))
   */
  public calculateFlowIntervalMs(flow: number): number {
    return Math.max(4, Math.round(150 - 135 * (flow / 100)));
  }

  public startStroke(x: number, y: number) {
    const layers = this.getLayers();
    const activeIdx = this.getActiveLayerIndex();
    const activeLayer = layers[activeIdx];
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    this.isPainting = true;
    this.strokeDistance = 0;
    this.sprayAnchorX = x;
    this.sprayAnchorY = y;
    this.lastCursorX = x;
    this.lastCursorY = y;
    this.lastBurstTime = performance.now();
    this.dabCounter = 0;

    const settings = this.getSpraySettings();
    if (settings.mode === 'flow') {
      this.sprayDabs(x, y);
      this.startFlowTimer();
    } else {
      this.sprayDabs(x, y);
    }
    this.onCanvasModified();
  }

  public moveStroke(x: number, y: number) {
    if (!this.isPainting) return;
    this.lastCursorX = x;
    this.lastCursorY = y;

    const settings = this.getSpraySettings();
    if (settings.interpolate) {
      this.sprayInterpolated(x, y);
    } else {
      const dx = x - (this.sprayAnchorX ?? x);
      const dy = y - (this.sprayAnchorY ?? y);
      this.strokeDistance += Math.sqrt(dx * dx + dy * dy);
      this.sprayDabs(x, y);
      this.sprayAnchorX = x;
      this.sprayAnchorY = y;
    }
    this.onCanvasModified();
  }

  public endStroke() {
    this.isPainting = false;
    this.sprayAnchorX = null;
    this.sprayAnchorY = null;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private startFlowTimer() {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
    }

    const loop = (now: number) => {
      if (!this.isPainting) {
        this.rafHandle = null;
        return;
      }
      const settings = this.getSpraySettings();
      if (settings.mode !== 'flow') {
        this.rafHandle = null;
        return;
      }

      const targetInterval = this.calculateFlowIntervalMs(settings.flow);
      let elapsed = now - this.lastBurstTime;
      let bursts = 0;
      let fired = false;

      while (elapsed >= targetInterval && bursts < 12) {
        this.sprayInterpolated(this.lastCursorX, this.lastCursorY);
        this.lastBurstTime += targetInterval;
        elapsed -= targetInterval;
        bursts++;
        fired = true;
      }

      if (bursts >= 12) {
        this.lastBurstTime = now;
      }

      if (fired) {
        this.onCanvasModified();
      }

      this.rafHandle = requestAnimationFrame(loop);
    };

    this.rafHandle = requestAnimationFrame(loop);
  }

  private sprayInterpolated(x: number, y: number) {
    if (this.sprayAnchorX === null || this.sprayAnchorY === null) {
      this.sprayDabs(x, y);
      this.sprayAnchorX = x;
      this.sprayAnchorY = y;
      return;
    }

    const dx = x - this.sprayAnchorX;
    const dy = y - this.sprayAnchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0) {
      this.sprayDabs(x, y);
      return;
    }

    const settings = this.getSpraySettings();
    const spacing = Math.max(1, settings.brushSize * 0.3);
    const steps = Math.max(1, Math.round(dist / spacing));
    const startDist = this.strokeDistance;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const subDist = startDist + dist * t;
      let progressVal: number | null = null;
      if (settings.sourceKind === 'gradient' && settings.gradientOrdered && settings.gradientStepMode === 'distance') {
        const cycleL = Math.max(10, settings.gradientCycleLength);
        progressVal = (subDist % cycleL) / cycleL;
      }
      this.sprayDabs(this.sprayAnchorX + dx * t, this.sprayAnchorY + dy * t, null, null, 1.0, progressVal);
    }

    this.strokeDistance += dist;
    this.sprayAnchorX = x;
    this.sprayAnchorY = y;
  }

  /**
   * Executes a spray cluster of individual dabs with mathematical power-law radial jitter,
   * aspect ratios, opacity jitter, dab shapes, and seamless 3x3 wrapping
   */
  public sprayDabs(
    cx: number,
    cy: number,
    overrideSize: number | null = null,
    overrideSpread: number | null = null,
    overrideOpacityMul = 1.0,
    progress: number | null = null
  ) {
    const layers = this.getLayers();
    const activeIdx = this.getActiveLayerIndex();
    const activeLayer = layers[activeIdx];
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    const ctx = activeLayer.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const s = this.getSpraySettings();
    let taperFactor = 1;
    if (s.taperEnabled && overrideSize === null) {
      const estimatedDabs = this.strokeDistance / Math.max(1, s.brushSize * 0.3);
      taperFactor = Math.min(1, estimatedDabs / s.taperLength);
    }

    const sizeTaper = s.taperEnabled && overrideSize === null
      ? (s.taperSizePct / 100) + (1 - s.taperSizePct / 100) * taperFactor
      : 1.0;

    const spreadTaper = s.taperEnabled && overrideSize === null
      ? (s.taperSpreadPct / 100) + (1 - s.taperSpreadPct / 100) * taperFactor
      : 1.0;

    const opacityTaper = (s.taperEnabled && overrideSize === null && s.taperOpacityFade) ? taperFactor : 1.0;

    const effBrushSize = overrideSize !== null ? overrideSize : s.brushSize * sizeTaper;
    const effSpread = overrideSpread !== null ? overrideSpread : s.brushSize * spreadTaper;

    const radius = effSpread / 2;
    const f = s.falloff / 100;
    // Power law distribution: higher falloff values bunch dabs toward the center
    const power = 0.5 + f * 6;
    const n = this.calculateDabsPerTick(effBrushSize, s.density, s.mode);
    const TWO_PI = Math.PI * 2;

    const availableColors = this.getActiveColors();
    const colorsList = availableColors.length > 0 ? availableColors : [this.getFgColor()];

    for (let i = 0; i < n; i++) {
      this.dabCounter++;
      const ang = Math.random() * TWO_PI;
      const dist = Math.pow(Math.random(), power) * radius;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;

      // Color selection (Single, Multi-Palette random, or Gradient stop progression)
      let dabColor = colorsList[0];
      if (s.sourceKind === 'gradient' && s.gradientOrdered) {
        if (progress !== null) {
          const stopIdx = Math.min(colorsList.length - 1, Math.floor(progress * colorsList.length));
          dabColor = colorsList[stopIdx];
        } else if (s.gradientStepMode === 'dab') {
          const step = Math.max(1, s.gradientDabsPerStep);
          const stopIdx = Math.floor(this.dabCounter / step) % colorsList.length;
          dabColor = colorsList[stopIdx];
        }
      } else {
        dabColor = colorsList[Math.floor(Math.random() * colorsList.length)];
      }

      // Jitter calculations
      const sizeJitter = (s.sizeJitterMin + Math.random() * (s.sizeJitterMax - s.sizeJitterMin)) / 100;
      const wJitter = (s.dabWidthJitterMin + Math.random() * (s.dabWidthJitterMax - s.dabWidthJitterMin)) / 100;
      const hJitter = (s.dabHeightJitterMin + Math.random() * (s.dabHeightJitterMax - s.dabHeightJitterMin)) / 100;
      const opJitter = (s.opacityJitterMin + Math.random() * (s.opacityJitterMax - s.opacityJitterMin)) / 100;
      const angJitterDeg = s.angleJitterMin + Math.random() * (s.angleJitterMax - s.angleJitterMin);

      let dabW = Math.max(1, s.dabWidth * sizeJitter * wJitter);
      let dabH = Math.max(1, s.dabHeight * sizeJitter * hJitter);
      if (s.dabLockAspect) {
        dabH = dabW;
      }

      let rotAngle = (s.manualAngle * Math.PI) / 180 + (angJitterDeg * Math.PI) / 180;
      if (s.angleMode === 'follow_cursor' && this.sprayAnchorX !== null && this.sprayAnchorY !== null) {
        const dx = cx - this.sprayAnchorX;
        const dy = cy - this.sprayAnchorY;
        if (Math.hypot(dx, dy) > 0.01) {
          rotAngle = Math.atan2(dy, dx) + (angJitterDeg * Math.PI) / 180;
        }
      }

      const totalOpacity = (s.opacity / 100) * opJitter * opacityTaper * overrideOpacityMul;

      // Render across 3x3 tiling planes if seamless mode is active
      const offsets = s.seamlessMode
        ? [
            [0, 0],
            [-this.width, 0],
            [this.width, 0],
            [0, -this.height],
            [-this.width, -this.height],
            [this.width, -this.height],
            [0, this.height],
            [-this.width, this.height],
            [this.width, this.height]
          ]
        : [[0, 0]];

      for (const [ox, oy] of offsets) {
        this.renderSingleDab(ctx, px + ox, py + oy, dabW, dabH, dabColor, rotAngle, totalOpacity, s);
      }
    }
  }

  private renderSingleDab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    rot: number,
    alpha: number,
    s: SpraySettings
  ) {
    const rx = s.pixelPerfect ? Math.round(x) : x;
    const ry = s.pixelPerfect ? Math.round(y) : y;
    const rw = s.pixelPerfect ? Math.max(1, Math.round(w)) : w;
    const rh = s.pixelPerfect ? Math.max(1, Math.round(h)) : h;

    if (rx + rw < 0 || ry + rh < 0 || rx - rw > this.width || ry - rh > this.height) {
      return;
    }

    if (s.mode === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(rx, ry);
      if (Math.abs(rot) > 0.001) ctx.rotate(rot);
      if (s.dabShape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(0, 0, rw / 2, rh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;
    ctx.translate(rx, ry);
    if (Math.abs(rot) > 0.001) ctx.rotate(rot);

    if (s.dabShape === 'circle') {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(0.5, rw / 2), Math.max(0.5, rh / 2), 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
    }
    ctx.restore();
  }
}
