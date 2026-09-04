/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ParticleSystemData, 
  ParticleBlendMode, 
  ParticleShape, 
  ParticleCurveMode, 
  ParticleFxStyle, 
  ParticleAnimStyle, 
  ParticleSizeCurve, 
  ParticleEmissiveMode, 
  ParticlePhysicsConfig, 
  CustomCompositeShape,
  SubEmitterTriggerMode,
  DEFAULT_PARTICLE_SYSTEMS,
  SUB_EMITTER_PRESETS
} from "./masonProjectSchema";

export interface ParticleInstance {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  lifetime: number;
  maxLifetime: number;
  startSize: number;
  midSize?: number;
  endSize: number;
  sizeCurve: ParticleSizeCurve;
  alphaCurve?: ParticleCurveMode;
  startColor: string;
  startAlpha: number;
  midColor?: string;
  midAlpha?: number;
  endColor: string;
  endAlpha: number;
  shape: ParticleShape;
  customGlyph?: string;
  customSvgPath?: string;
  compositeShape?: CustomCompositeShape;
  glowBlurRadius: number;
  blendMode: ParticleBlendMode;
  drag: number;
  startDrag?: number;
  midDrag?: number;
  endDrag?: number;
  dragCurve?: ParticleCurveMode;
  angularDrag: number;
  gravityScale?: number;
  gravityScaleX?: number;
  gravityX: number;
  gravityY: number;
  windSensitivity?: number;
  windForce: number;
  turbulenceJitter: number;
  emitterPull?: boolean;
  emitterPullRadius?: number;
  emitterPullStrength?: number;
  emitterPullFalloff?: number;
  collides: boolean;
  restitution: number;
  bounces?: number;
  destroyOnCollision: boolean;
  spawnCollisionSparks: boolean;
  spawnOnDeath?: boolean;
  subEmitterId?: string;
  subEmitterTrigger?: SubEmitterTriggerMode;
  subEmitterCount?: number;
  subEmitterInheritVelocity?: number;
  subEmitterProbability?: number;
  subEmitterPositionJitter?: number;
  subEmitterAlphaStartMin?: number;
  subEmitterAlphaStartMax?: number;
  subEmitterAlphaEndMin?: number;
  subEmitterAlphaEndMax?: number;
  isSubParticle?: boolean;
  sparkCount?: number;
  sparkGravity?: number;
  sparkLifetimeMin?: number;
  sparkLifetimeMax?: number;
  sparkStartSizeMin?: number;
  sparkStartSizeMax?: number;
  sparkEndSizeMin?: number;
  sparkEndSizeMax?: number;
  sparkStartColor?: string;
  sparkEndColor?: string;
  sparkColorMode?: 'gradient_lifecycle' | 'gradient_random';
  randomColorRange?: boolean;
  colorRangeStart?: string;
  colorRangeEnd?: string;
  colorRangeStops?: Array<{ position: number; color: string }>;
  isRestingOnFloor?: boolean;
  fxStyle?: ParticleFxStyle;
  isEmissive?: boolean;
  emissiveMode?: ParticleEmissiveMode;
  emissiveStartColor?: string;
  emissiveStartStrength?: number;
  emissiveMidColor?: string;
  emissiveMidStrength?: number;
  emissiveEndColor?: string;
  emissiveEndStrength?: number;
  emissiveCurve?: ParticleCurveMode;
  startRotationDeg?: number;
  midRotationDeg?: number;
  endRotationDeg?: number;
  rotationCurve?: ParticleCurveMode;
  sizeAnimStyle?: ParticleAnimStyle;
  colorAnimStyle?: ParticleAnimStyle;
  emissiveAnimStyle?: ParticleAnimStyle;
  rotationAnimStyle?: ParticleAnimStyle;
  animateSize?: boolean;
  animateColor?: boolean;
  animateAlpha?: boolean;
  animateEmissive?: boolean;
  animateRotation?: boolean;
  faceVelocity?: boolean;
  velocityRotationOffsetDeg?: number;
  lastVelAngle?: number;
  animateMotionBlur?: boolean;
  startMotionBlur?: number;
  midMotionBlur?: number;
  endMotionBlur?: number;
  motionBlurAnimStyle?: ParticleAnimStyle;
  motionBlurCurve?: ParticleCurveMode;
  hasTrails?: boolean;
  trailLength?: number;
  trailWidthScale?: number;
  trailTaper?: boolean;
  trailTaperLength?: number;
  trailHistory?: {x: number, y: number}[];
  trackNodes?: Record<string, any>;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map(c => c + c).join("");
  }
  const num = parseInt(cleanHex, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function quantizeColor(color: string): string {
  if (color.startsWith("#")) {
    const rgb = hexToRgb(color);
    const r = Math.round(rgb.r / 8) * 8;
    const g = Math.round(rgb.g / 8) * 8;
    const b = Math.round(rgb.b / 8) * 8;
    return `rgb(${r},${g},${b})`;
  } else if (color.startsWith("rgb")) {
    const m = color.match(/\d+/g);
    if (m && m.length >= 3) {
      const r = Math.round(parseInt(m[0], 10) / 8) * 8;
      const g = Math.round(parseInt(m[1], 10) / 8) * 8;
      const b = Math.round(parseInt(m[2], 10) / 8) * 8;
      return `rgb(${r},${g},${b})`;
    }
  }
  return color;
}

export function interpolateHexColor(colorA: string, colorB: string, t: number): string {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * clampedT);
  const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * clampedT);
  const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * clampedT);
  return rgbToHex(r, g, b);
}

export function evaluateGradientColor(
  stops: Array<{ position: number; color: string }>,
  t: number
): string {
  if (!stops || stops.length === 0) return "#ffffff";
  if (stops.length === 1) return stops[0].color;
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT <= sorted[0].position) return sorted[0].color;
  if (clampedT >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (clampedT >= a.position && clampedT <= b.position) {
      const range = b.position - a.position;
      const segT = range <= 0.00001 ? 0 : (clampedT - a.position) / range;
      const rgbA = hexToRgb(a.color);
      const rgbB = hexToRgb(b.color);
      const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * segT);
      const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * segT);
      const bColor = Math.round(rgbA.b + (rgbB.b - rgbA.b) * segT);
      return rgbToHex(r, g, bColor);
    }
  }
  return sorted[sorted.length - 1].color;
}

/**
 * Computes a frame-rate independent, visually linear drag damping factor.
 * In earlier iterations, velocity was scaled by (1 - drag) per frame at 60 FPS.
 * Mathematically, (1 - 0.25)^10 ≈ 0.05, which meant that by drag = 0.25 the particle
 * lost 95% of its velocity in under 0.16s, leaving a massive unresponsive dead-zone
 * from 0.25 up to 1.0 where all particles stopped almost immediately.
 *
 * This continuous damping model translates drag ∈ [0.0, 1.0] into a smooth,
 * physically calibrated decay rate where stopping distance and velocity retention
 * decrease progressively and perceptibly across the entire 0.0 to 1.0 slider range.
 */
export function calculateLinearDragFactor(drag: number, dt: number): number {
  if (!drag || drag <= 0) return 1.0;
  const d = Math.max(0, Math.min(1.0, drag));
  // Calibrated exponential decay rate:
  // d = 0.00 -> damping = 0.00 (100% velocity retention)
  // d = 0.15 -> damping ≈ 0.45 (~80% retention / long drift)
  // d = 0.35 -> damping ≈ 1.30 (~50% retention / steady slowing)
  // d = 0.60 -> damping ≈ 3.30 (~20% retention / firm deceleration)
  // d = 0.85 -> damping ≈ 8.80 (~5% retention / strong brake)
  // d = 1.00 -> damping ≈ 21.7 (rapid halt near emitter)
  const damping = (2.6 * d) / Math.max(0.06, 1.0 - 0.88 * d);
  return Math.exp(-damping * dt);
}

export function getTrackNodesForData(visuals: any, track: string): { time: number; value: any }[] {
  if (visuals?.trackNodes?.[track]) {
    return visuals.trackNodes[track];
  }
  if (track === "size") {
    const start = visuals?.startSize ?? 8;
    const end = visuals?.endSize ?? 2;
    if (visuals?.midSize !== undefined && visuals.midSize !== start) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midSize }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "color") {
    const start = visuals?.startColor ?? "#ffa500";
    const end = visuals?.endColor ?? "#ff0000";
    if (visuals?.midColor) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midColor }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "alpha") {
    const start = visuals?.startAlpha ?? 1.0;
    const end = visuals?.endAlpha ?? 0.0;
    if (visuals?.midAlpha !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midAlpha }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "emissive") {
    const start = visuals?.emissiveStartStrength ?? 35;
    const end = visuals?.emissiveEndStrength ?? 0;
    if (visuals?.emissiveMidStrength !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.emissiveMidStrength }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "rotation") {
    const start = visuals?.startRotationDeg ?? 0;
    const end = visuals?.endRotationDeg ?? 360;
    if (visuals?.midRotationDeg !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midRotationDeg }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "speed") {
    return [{ time: 0, value: 100 }, { time: 1, value: 50 }];
  }
  if (track === "drag") {
    return [{ time: 0, value: 0.02 }, { time: 1, value: 0.02 }];
  }
  if (track === "motionBlur") {
    const start = visuals?.startMotionBlur ?? 0;
    const end = visuals?.endMotionBlur ?? 0;
    if (visuals?.midMotionBlur !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midMotionBlur }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }
  if (track === "gravity") {
    return [{ time: 0, value: 180 }, { time: 1, value: 180 }];
  }
  if (track === "wind") {
    return [{ time: 0, value: 30 }, { time: 1, value: 30 }];
  }
  if (track === "angle") {
    return [{ time: 0, value: 270 }, { time: 1, value: 270 }];
  }
  if (track === "turbulence") {
    return [{ time: 0, value: 20 }, { time: 1, value: 20 }];
  }
  if (track === "trails") {
    return [{ time: 0, value: 10 }, { time: 1, value: 10 }];
  }
  // Emitter Tracks
  if (track === "emitter_width") {
    return [{ time: 0, value: 40 }, { time: 1, value: 40 }];
  }
  if (track === "emitter_height") {
    return [{ time: 0, value: 40 }, { time: 1, value: 40 }];
  }
  if (track === "emitter_rotation") {
    return [{ time: 0, value: 0 }, { time: 1, value: 360 }];
  }
  if (track === "emission_rate") {
    return [{ time: 0, value: 25 }, { time: 1, value: 25 }];
  }
  if (track === "burst_count") {
    return [{ time: 0, value: 30 }, { time: 1, value: 30 }];
  }
  if (track === "burst_interval") {
    return [{ time: 0, value: 1.0 }, { time: 1, value: 1.0 }];
  }
  return [{ time: 0, value: 0 }, { time: 1, value: 1 }];
}

export function evaluateTrackValue(
  progress: number,
  track: string,
  visuals: any
): any {
  let animStyle: ParticleAnimStyle = "one_shot";
  let repeatCount = 1;
  let curve: ParticleCurveMode = "linear";
  if (track === "size") {
    animStyle = visuals.sizeAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.size ?? visuals.sizeLoops ?? 1;
    curve = visuals.sizeCurve || "linear";
  } else if (track === "color") {
    animStyle = visuals.colorAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.color ?? visuals.colorLoops ?? 1;
    curve = visuals.colorCurve || "linear";
  } else if (track === "alpha") {
    animStyle = visuals.alphaAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.alpha ?? visuals.alphaLoops ?? 1;
    curve = visuals.alphaCurve || "linear";
  } else if (track === "emissive") {
    animStyle = visuals.emissiveAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.emissive ?? visuals.emissiveLoops ?? 1;
    curve = visuals.emissiveCurve || "linear";
  } else if (track === "rotation") {
    animStyle = visuals.rotationAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.rotation ?? visuals.rotationLoops ?? 1;
    curve = visuals.rotationCurve || "linear";
  } else if (track === "motionBlur") {
    animStyle = visuals.motionBlurAnimStyle || "one_shot";
    repeatCount = visuals.trackRepeats?.motionBlur ?? visuals.motionBlurLoops ?? 1;
    curve = visuals.motionBlurCurve || "linear";
  } else if (visuals.trackRepeats?.[track]) {
    repeatCount = visuals.trackRepeats[track];
  }
  let localProgress = progress;
  if (animStyle === "repeat") {
    const duration = 1 / repeatCount;
    localProgress = (progress % duration) * repeatCount;
  } else if (animStyle === "oscillate") {
    const duration = 1 / repeatCount;
    const pairProgress = (progress % duration) * repeatCount;
    if (pairProgress < 0.5) {
      localProgress = pairProgress * 2;
    } else {
      localProgress = 2 - pairProgress * 2;
    }
  }
  localProgress = Math.max(0, Math.min(1, localProgress));
  const nodes = getTrackNodesForData(visuals, track);
  const sorted = [...nodes].sort((a, b) => a.time - b.time);
  let nodeA = sorted[0];
  let nodeB = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (localProgress >= sorted[i].time && localProgress <= sorted[i + 1].time) {
      nodeA = sorted[i];
      nodeB = sorted[i + 1];
      break;
    }
  }
  let segmentT = 0;
  const timeDelta = nodeB.time - nodeA.time;
  if (timeDelta > 0.0001) {
    segmentT = (localProgress - nodeA.time) / timeDelta;
  }
  segmentT = Math.max(0, Math.min(1, segmentT));
  let easedT = segmentT;
  switch (curve) {
    case "balanced":
      easedT = segmentT * segmentT * (3 - 2 * segmentT);
      break;
    case "bell_arch":
    case "bell":
      easedT = Math.sin(segmentT * Math.PI);
      break;
    case "burst_decay":
    case "quick_in_long_out":
      easedT = 1 - Math.pow(1 - segmentT, 2.2);
      break;
    case "burst_shrink":
    case "long_in_quick_out":
      easedT = Math.pow(segmentT, 2.2);
      break;
    case "constant":
      easedT = 0;
      break;
    case "linear":
    default:
      easedT = segmentT;
      break;
  }
  if (track === "color") {
    const rgbA = hexToRgb(nodeA.value as string);
    const rgbB = hexToRgb(nodeB.value as string);
    const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * easedT);
    const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * easedT);
    const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * easedT);
    return rgbToHex(r, g, b);
  } else {
    const valA = Number(nodeA.value);
    const valB = Number(nodeB.value);
    if (curve === "constant") {
      return valA;
    }
    return valA + (valB - valA) * easedT;
  }
}

export function getAnimProgress(progress: number, animStyle?: ParticleAnimStyle): number {
  if (!animStyle || animStyle === "one_shot") {
    return progress;
  }
  if (animStyle === "repeat") {
    return (progress * 3) % 1.0;
  }
  if (animStyle === "oscillate") {
    const t = progress * 6;
    return 1 - Math.abs((t % 2) - 1);
  }
  return progress;
}

export function evaluateColorAlpha(
  progress: number,
  visuals: any
): { color: string; alpha: number; r: number; g: number; b: number } {
  const colHex = visuals?.animateColor === false ? (visuals?.startColor || "#ffffff") : evaluateTrackValue(progress, "color", visuals);
  const alphaVal = visuals?.animateAlpha === false ? (visuals?.startAlpha !== undefined ? visuals.startAlpha : 1.0) : evaluateTrackValue(progress, "alpha", visuals);
  const rgb = hexToRgb(colHex);
  return { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaVal})`, alpha: alphaVal, r: rgb.r, g: rgb.g, b: rgb.b };
}

export function evaluateSize(
  progress: number,
  visuals: any
): number {
  if (visuals?.animateSize === false) {
    return Math.max(0.1, visuals?.startSize ?? 8);
  }
  return Math.max(0.1, evaluateTrackValue(progress, "size", visuals));
}

export interface ActiveEmitter {
  system: ParticleSystemData;
  originX: number;
  originY: number;
  accumulator: number;
}

export class ParticleEngine {
  public particles: ParticleInstance[] = [];
  public activeEmitters: ActiveEmitter[] = [];
  private spatialGrid: Map<string, ParticleInstance[]> = new Map();
  private CELL_SIZE = 64;
  private compositeSpriteCache: Map<string, HTMLCanvasElement> = new Map();
  private path2dCache: Map<string, Path2D> = new Map();

  public clearSpriteCache() {
    this.compositeSpriteCache.clear();
    this.path2dCache.clear();
  }

  public getOrCreateCompositeSprite(comp: CustomCompositeShape, color: string): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null;
    if (!comp || !comp.layers || comp.layers.length === 0) return null;

    const quantizedColor = quantizeColor(color);
    const layersKey = comp.layers.map(l => 
      `${l.id}:${l.x},${l.y},${l.width},${l.height},${l.rotationDeg},${l.visible},${l.type},${l.isStroke},${l.strokeWidth},${l.glowBlurRadius},${l.glowColor},${l.colorMode},${l.fixedColor},${l.blendMode},${l.alpha}`
    ).join("|");
    const cacheKey = `${comp.id}_${layersKey}_${quantizedColor}`;

    let cached = this.compositeSpriteCache.get(cacheKey);
    if (cached) return cached;

    const baseRef = comp.baseSize || 64;
    // Provide generous 2.5x padding so blurs and layer offsets never clip
    const textureSize = Math.max(128, Math.round(baseRef * 2.5));
    const center = textureSize / 2;

    const offscreen = document.createElement("canvas");
    offscreen.width = textureSize;
    offscreen.height = textureSize;
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return null;

    oCtx.imageSmoothingEnabled = true;

    // Draw all composite shape layers centered at (center, center)
    for (const layer of comp.layers) {
      if (layer.visible === false) continue;
      oCtx.save();
      oCtx.translate(center + (layer.x || 0), center + (layer.y || 0));
      if (layer.rotationDeg) {
        oCtx.rotate((layer.rotationDeg * Math.PI) / 180);
      }
      if (layer.blendMode) {
        oCtx.globalCompositeOperation = layer.blendMode;
      }
      const layerAlpha = layer.alpha !== undefined ? layer.alpha : 1.0;
      oCtx.globalAlpha = layerAlpha;

      const layerColor = layer.colorMode === "fixed" && layer.fixedColor ? layer.fixedColor : quantizedColor;
      oCtx.fillStyle = layerColor;
      oCtx.strokeStyle = layerColor;
      if (layer.strokeWidth) {
        oCtx.lineWidth = layer.strokeWidth;
      }

      if (layer.glowBlurRadius && layer.glowBlurRadius > 0) {
        oCtx.shadowBlur = layer.glowBlurRadius;
        oCtx.shadowColor = layer.glowColor || layerColor;
      } else {
        oCtx.shadowBlur = 0;
      }

      const w = layer.width || 16;
      const h = layer.height || 16;
      const r = layer.radius !== undefined ? layer.radius : w / 2;

      oCtx.beginPath();
      if (layer.type === "circle") {
        oCtx.arc(0, 0, r, 0, Math.PI * 2);
      } else if (layer.type === "rect") {
        if (layer.isStroke) oCtx.strokeRect(-w / 2, -h / 2, w, h);
        else oCtx.fillRect(-w / 2, -h / 2, w, h);
      } else if (layer.type === "rounded_rect") {
        const cr = Math.min(layer.radius || 4, w / 2, h / 2);
        if (typeof (oCtx as any).roundRect === "function") {
          (oCtx as any).roundRect(-w / 2, -h / 2, w, h, cr);
        } else {
          oCtx.rect(-w / 2, -h / 2, w, h);
        }
      } else if (layer.type === "ring") {
        oCtx.lineWidth = layer.strokeWidth || 2;
        oCtx.arc(0, 0, r, 0, Math.PI * 2);
        oCtx.stroke();
      } else if (layer.type === "line") {
        oCtx.lineWidth = layer.strokeWidth || 2;
        oCtx.moveTo(-w / 2, 0);
        oCtx.lineTo(w / 2, 0);
        oCtx.stroke();
      } else if (layer.type === "star") {
        const spikes = 4;
        const outerR = r;
        const innerR = outerR * 0.4;
        for (let s = 0; s < spikes * 2; s++) {
          const rad = (s * Math.PI) / spikes;
          const currentR = s % 2 === 0 ? outerR : innerR;
          const sx = Math.cos(rad) * currentR;
          const sy = Math.sin(rad) * currentR;
          if (s === 0) oCtx.moveTo(sx, sy);
          else oCtx.lineTo(sx, sy);
        }
        oCtx.closePath();
      } else if (layer.type === "diamond") {
        oCtx.moveTo(0, -h / 2);
        oCtx.lineTo(w / 2, 0);
        oCtx.lineTo(0, h / 2);
        oCtx.lineTo(-w / 2, 0);
        oCtx.closePath();
      } else if (layer.type === "ellipse") {
        oCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      }

      if (layer.type !== "rect" && layer.type !== "ring" && layer.type !== "line") {
        if (layer.isStroke) {
          oCtx.stroke();
        } else {
          oCtx.fill();
        }
      }
      oCtx.restore();
    }

    if (this.compositeSpriteCache.size > 128) {
      const oldestKey = this.compositeSpriteCache.keys().next().value;
      if (oldestKey) this.compositeSpriteCache.delete(oldestKey);
    }
    this.compositeSpriteCache.set(cacheKey, offscreen);
    return offscreen;
  }

  public addEmitter(system: ParticleSystemData, originX: number, originY: number) {
    this.activeEmitters.push({ system, originX, originY, accumulator: 0 });
  }

  public clearEmitters() {
    this.activeEmitters = [];
  }

  public clear() {
    this.particles = [];
  }

  private subEmitterResolver?: (id: string) => ParticleSystemData | undefined;
  private projectParticlesCache: Map<string, ParticleSystemData> = new Map();

  public setSubEmitterResolver(resolver: (id: string) => ParticleSystemData | undefined) {
    this.subEmitterResolver = resolver;
  }

  public setProjectParticles(particles: ParticleSystemData[]) {
    this.projectParticlesCache.clear();
    if (Array.isArray(particles)) {
      particles.forEach(p => {
        if (p && p.id) {
          this.projectParticlesCache.set(p.id, p);
        }
      });
    }
  }

  public resolveSubEmitter(id: string): ParticleSystemData | undefined {
    if (!id) return undefined;
    // 1. Check custom resolver
    if (this.subEmitterResolver) {
      const resolved = this.subEmitterResolver(id);
      if (resolved) return resolved;
    }
    // 2. Check project cache
    if (this.projectParticlesCache.has(id)) {
      return this.projectParticlesCache.get(id);
    }
    // 3. Check SUB_EMITTER_PRESETS
    const subPreset = SUB_EMITTER_PRESETS.find(p => p.id === id);
    if (subPreset) return subPreset;
    // 4. Check DEFAULT_PARTICLE_SYSTEMS
    const defaultPreset = DEFAULT_PARTICLE_SYSTEMS.find(p => p.id === id);
    if (defaultPreset) return defaultPreset;
    return undefined;
  }

  public spawnParticles(
    count: number,
    data: ParticleSystemData,
    origin: { x: number; y: number }
  ) {
    const { emitter, kinematics, visuals, physics } = data;
    const getRandVal = (min: number, max?: number) => {
      if (max === undefined || max <= min) return min;
      return min + Math.random() * (max - min);
    };

    const maxPrimary = emitter.maxParticles || 300;
    let currentPrimaryCount = 0;
    for (let j = 0; j < this.particles.length; j++) {
      if (!this.particles[j].isSubParticle) {
        currentPrimaryCount++;
      }
    }

    for (let i = 0; i < count; i++) {
      if (currentPrimaryCount + i >= maxPrimary) break;
      if (this.particles.length >= 1000) break; // Global pool safety cap

      let spawnX = origin.x;
      let spawnY = origin.y;

      let localX = 0;
      let localY = 0;

      const emW = emitter.width ?? (emitter.radius ? emitter.radius * 2 : 40);
      const emH = emitter.height ?? (emitter.radius ? emitter.radius * 2 : (emitter.shape === 'cone' ? 60 : 40));

      if (emitter.shape === "box") {
        localX = (Math.random() - 0.5) * (emitter.width || 32);
        localY = (Math.random() - 0.5) * (emitter.height || 32);
      } else if (emitter.shape === "circle") {
        const rx = emW / 2;
        const ry = emH / 2;
        const sqrtR = Math.sqrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        localX = Math.cos(theta) * rx * sqrtR;
        localY = Math.sin(theta) * ry * sqrtR;
      } else if (emitter.shape === "ring") {
        const rx = emW / 2;
        const ry = emH / 2;
        const theta = Math.random() * Math.PI * 2;
        const innerRatio = 0.6;
        const rFrac = innerRatio + Math.random() * (1.0 - innerRatio);
        localX = Math.cos(theta) * rx * rFrac;
        localY = Math.sin(theta) * ry * rFrac;
      } else if (emitter.shape === "line") {
        localX = (Math.random() - 0.5) * (emitter.width || 48);
        localY = 0;
      } else if (emitter.shape === "cone") {
        const t = Math.random();
        localX = (Math.random() - 0.5) * emW * t;
        localY = -emH * t;
      }

      // Apply Emitter Rotation for non-point shapes
      const emRotDeg = emitter.rotationDeg || 0;
      if (emRotDeg !== 0 && emitter.shape !== "point") {
        const emRotRad = emRotDeg * (Math.PI / 180);
        const cosR = Math.cos(emRotRad);
        const sinR = Math.sin(emRotRad);
        spawnX += localX * cosR - localY * sinR;
        spawnY += localX * sinR + localY * cosR;
      } else {
        spawnX += localX;
        spawnY += localY;
      }

      // Determine launch angle (supports multi-direction ranges e.g. 4 cardinal directions)
      let launchAngle: number;
      const activeRanges = kinematics.directionRanges?.filter(r => r.enabled !== false);
      if (activeRanges && activeRanges.length > 0) {
        let totalWeight = 0;
        for (let rIdx = 0; rIdx < activeRanges.length; rIdx++) {
          totalWeight += Math.max(0.1, activeRanges[rIdx].weight ?? 1);
        }
        let randW = Math.random() * totalWeight;
        let selectedRange = activeRanges[0];
        for (let rIdx = 0; rIdx < activeRanges.length; rIdx++) {
          const w = Math.max(0.1, activeRanges[rIdx].weight ?? 1);
          if (randW <= w) {
            selectedRange = activeRanges[rIdx];
            break;
          }
          randW -= w;
        }
        const aDeg = selectedRange.angleDeg;
        const sDeg = selectedRange.spreadDeg;
        const baseAngleRad = (aDeg + (emitter.shape === "cone" ? emRotDeg : 0)) * (Math.PI / 180);
        const spreadRad = ((Math.random() - 0.5) * sDeg) * (Math.PI / 180);
        launchAngle = baseAngleRad + spreadRad;
      } else {
        const angleDeg = kinematics.angleDeg !== undefined ? kinematics.angleDeg : 270;
        const spreadDeg = kinematics.spreadDeg !== undefined ? kinematics.spreadDeg : 30;
        const baseAngleRad = (angleDeg + (emitter.shape === "cone" ? emRotDeg : 0)) * (Math.PI / 180);
        const spreadRad = ((Math.random() - 0.5) * spreadDeg) * (Math.PI / 180);
        launchAngle = baseAngleRad + spreadRad;
      }

      const rawMinSpd = kinematics.minSpeed !== undefined ? kinematics.minSpeed : 0.3;
      const rawMaxSpd = kinematics.maxSpeed !== undefined ? kinematics.maxSpeed : 0.85;
      const effMinSpd = (rawMinSpd > 15 ? rawMinSpd / 100 : rawMinSpd) * 100;
      const effMaxSpd = (rawMaxSpd > 15 ? rawMaxSpd / 100 : rawMaxSpd) * 100;
      const speed = effMinSpd + Math.random() * Math.max(0, effMaxSpd - effMinSpd);

      const vx = Math.cos(launchAngle) * speed;
      const vy = Math.sin(launchAngle) * speed;

      const lifetime = visuals.minLifetime + Math.random() * Math.max(0.1, visuals.maxLifetime - visuals.minLifetime);
      const vRot = kinematics.minAngularVelocity + Math.random() * Math.max(0, kinematics.maxAngularVelocity - kinematics.minAngularVelocity);

      const instStartSize = getRandVal(visuals.startSize, visuals.startSizeMax);
      const instMidSize = visuals.midSize !== undefined ? getRandVal(visuals.midSize, visuals.midSizeMax) : undefined;
      const instEndSize = getRandVal(visuals.endSize, visuals.endSizeMax);

      const instStartRot = getRandVal(visuals.startRotationDeg ?? 0, visuals.startRotationDegMax);
      const instMidRot = visuals.midRotationDeg !== undefined ? getRandVal(visuals.midRotationDeg, visuals.midRotationDegMax) : undefined;
      const instEndRot = getRandVal(visuals.endRotationDeg ?? 360, visuals.endRotationDegMax);

      const instEmissiveStartStr = getRandVal(visuals.emissiveStartStrength ?? 35, visuals.emissiveStartStrengthMax);
      const instEmissiveMidStr = visuals.emissiveMidStrength !== undefined ? getRandVal(visuals.emissiveMidStrength, visuals.emissiveMidStrengthMax) : undefined;
      const instEmissiveEndStr = getRandVal(visuals.emissiveEndStrength ?? 0, visuals.emissiveEndStrengthMax);

      const instStartDrag = getRandVal(kinematics.startDrag ?? kinematics.drag ?? 0.0, kinematics.startDragMax);
      const instMidDrag = kinematics.midDrag !== undefined ? getRandVal(kinematics.midDrag, kinematics.midDragMax) : undefined;
      const instEndDrag = getRandVal(kinematics.endDrag ?? kinematics.drag ?? 0.0, kinematics.endDragMax);

      let instStartColor = visuals.startColor || "#ffffff";
      let instEndColor = visuals.animateColor === false ? instStartColor : (visuals.endColor || visuals.startColor || "#ffffff");

      if (visuals.randomColorRange) {
        const rangeStart = visuals.colorRangeStart || visuals.startColor || "#ff4500";
        const rangeEnd = visuals.colorRangeEnd || "#ffd700";
        const stops = visuals.colorRangeStops && visuals.colorRangeStops.length >= 2
          ? visuals.colorRangeStops
          : [
              { position: 0, color: rangeStart },
              { position: 1, color: rangeEnd }
            ];
        const t = Math.random();
        instStartColor = evaluateGradientColor(stops, t);
        if (visuals.animateColor === false || !visuals.endColor) {
          instEndColor = instStartColor;
        }
      }

      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        rotation: instStartRot * (Math.PI / 180),
        vRot,
        lifetime: 0,
        maxLifetime: lifetime,
        startSize: instStartSize,
        midSize: instMidSize,
        endSize: instEndSize,
        sizeCurve: visuals.sizeCurve || "linear",
        alphaCurve: visuals.alphaCurve || "linear",
        startColor: instStartColor,
        startAlpha: visuals.startAlpha !== undefined ? visuals.startAlpha : 1,
        midColor: visuals.midColor,
        midAlpha: visuals.midAlpha,
        endColor: instEndColor,
        endAlpha: visuals.endAlpha !== undefined ? visuals.endAlpha : 0,
        randomColorRange: visuals.randomColorRange,
        colorRangeStart: visuals.colorRangeStart,
        colorRangeEnd: visuals.colorRangeEnd,
        colorRangeStops: visuals.colorRangeStops,
        shape: visuals.shape || "glow_circle",
        customGlyph: visuals.customGlyph,
        customSvgPath: visuals.customSvgPath,
        compositeShape: visuals.compositeShape,
        glowBlurRadius: visuals.glowBlurRadius || 0,
        blendMode: visuals.blendMode || "source-over",
        drag: instStartDrag,
        startDrag: instStartDrag,
        midDrag: instMidDrag,
        endDrag: instEndDrag,
        dragCurve: kinematics.dragCurve || "linear",
        angularDrag: kinematics.angularDrag ?? 0.98,
        gravityScale: kinematics.gravityScale !== undefined ? kinematics.gravityScale : (kinematics.gravityY !== undefined ? kinematics.gravityY / 980 : 0),
        gravityScaleX: kinematics.gravityScaleX !== undefined ? kinematics.gravityScaleX : (kinematics.gravityX !== undefined ? kinematics.gravityX / 980 : 0),
        gravityX: kinematics.gravityX ?? 0,
        gravityY: kinematics.gravityY ?? 0,
        windSensitivity: kinematics.windSensitivity !== undefined ? kinematics.windSensitivity : 1.0,
        windForce: kinematics.windForce ?? 0,
        turbulenceJitter: kinematics.turbulenceJitter ?? 0,
        emitterPull: kinematics.emitterPull ?? false,
        emitterPullRadius: kinematics.emitterPullRadius ?? 150,
        emitterPullStrength: kinematics.emitterPullStrength ?? 1.0,
        emitterPullFalloff: kinematics.emitterPullFalloff ?? 1.0,
        collides: physics.collideWithMapSolids ?? false,
        restitution: physics.collisionRestitution ?? 0.3,
        bounces: 0,
        destroyOnCollision: physics.destroyOnCollision ?? false,
        spawnCollisionSparks: physics.spawnCollisionSparks ?? false,
        spawnOnDeath: physics.spawnOnDeath ?? false,
        subEmitterId: physics.subEmitterId,
        subEmitterTrigger: physics.subEmitterTrigger || (
          physics.spawnCollisionSparks && physics.spawnOnDeath ? 'both' :
          physics.spawnCollisionSparks ? 'impact' :
          physics.spawnOnDeath ? 'death' : 'none'
        ),
        subEmitterCount: physics.subEmitterCount ?? physics.sparkCount,
        subEmitterInheritVelocity: physics.subEmitterInheritVelocity ?? 0,
        subEmitterProbability: physics.subEmitterProbability ?? 1.0,
        subEmitterPositionJitter: physics.subEmitterPositionJitter,
        subEmitterAlphaStartMin: physics.subEmitterAlphaStartMin,
        subEmitterAlphaStartMax: physics.subEmitterAlphaStartMax,
        subEmitterAlphaEndMin: physics.subEmitterAlphaEndMin,
        subEmitterAlphaEndMax: physics.subEmitterAlphaEndMax,
        isSubParticle: false,
        sparkCount: physics.sparkCount,
        sparkGravity: physics.sparkGravity,
        sparkLifetimeMin: physics.sparkLifetimeMin,
        sparkLifetimeMax: physics.sparkLifetimeMax,
        sparkStartSizeMin: physics.sparkStartSizeMin,
        sparkStartSizeMax: physics.sparkStartSizeMax,
        sparkEndSizeMin: physics.sparkEndSizeMin,
        sparkEndSizeMax: physics.sparkEndSizeMax,
        sparkStartColor: physics.sparkStartColor,
        sparkEndColor: physics.sparkEndColor,
        sparkColorMode: physics.sparkColorMode,
        fxStyle: visuals.fxStyle || "default",
        isEmissive: visuals.isEmissive ?? false,
        emissiveMode: visuals.emissiveMode || "glow_only",
        emissiveStartColor: visuals.emissiveStartColor || visuals.startColor,
        emissiveStartStrength: instEmissiveStartStr,
        emissiveMidColor: visuals.emissiveMidColor,
        emissiveMidStrength: instEmissiveMidStr,
        emissiveEndColor: visuals.emissiveEndColor || visuals.endColor,
        emissiveEndStrength: instEmissiveEndStr,
        startRotationDeg: instStartRot,
        midRotationDeg: instMidRot,
        endRotationDeg: instEndRot,
        rotationCurve: visuals.rotationCurve || "linear",
        sizeAnimStyle: visuals.sizeAnimStyle || "one_shot",
        colorAnimStyle: visuals.colorAnimStyle || "one_shot",
        emissiveAnimStyle: visuals.emissiveAnimStyle || "one_shot",
        rotationAnimStyle: visuals.rotationAnimStyle || "one_shot",
        animateSize: visuals.animateSize === true,
        animateColor: visuals.animateColor === true,
        animateAlpha: visuals.animateAlpha === true,
        animateEmissive: visuals.animateEmissive ?? false,
        animateRotation: visuals.animateRotation ?? false,
        faceVelocity: visuals.faceVelocity ?? kinematics.faceVelocity ?? false,
        velocityRotationOffsetDeg: visuals.velocityRotationOffsetDeg ?? kinematics.velocityRotationOffsetDeg ?? 0,
        lastVelAngle: Math.atan2(vy, vx),
        animateMotionBlur: visuals.animateMotionBlur ?? true,
        startMotionBlur: visuals.startMotionBlur,
        midMotionBlur: visuals.midMotionBlur,
        endMotionBlur: visuals.endMotionBlur,
        motionBlurAnimStyle: visuals.motionBlurAnimStyle || "one_shot",
        motionBlurCurve: visuals.motionBlurCurve || "linear",
        hasTrails: visuals.hasTrails ?? false,
        trailLength: visuals.trailLength ?? 10,
        trailWidthScale: visuals.trailWidthScale ?? 1.0,
        trailTaper: visuals.trailTaper ?? false,
        trailTaperLength: visuals.trailTaperLength ?? visuals.trailLength ?? 10,
        trailHistory: [],
        trackNodes: visuals.trackNodes
      });
    }
  }

  public update(dt: number, physics: any, floorY: number, globalWind: number = 0, emitterState?: { x: number, y: number, dx: number, dy: number }) {
    try {
      this.spatialGrid.clear();
      const fluidEnabled = physics.fluidSelfCollision ?? false;
      const fluidForce = physics.fluidRepulsionForce ?? 1.0;
      const globalWindForce = globalWind;

      const aliveParticles: ParticleInstance[] = [];
      const newSparks: ParticleInstance[] = [];

      const createSubParticle = (
        source: ParticleInstance,
        vx: number,
        vy: number,
        isImpact: boolean
      ): ParticleInstance => {
        // Lifetime range
        const lifeMin = source.sparkLifetimeMin !== undefined ? source.sparkLifetimeMin : (isImpact ? 0.15 : 0.2);
        const lifeMax = source.sparkLifetimeMax !== undefined ? Math.max(lifeMin, source.sparkLifetimeMax) : (isImpact ? 0.35 : 0.45);
        const sparkMaxLifetime = lifeMin + Math.random() * Math.max(0.01, lifeMax - lifeMin);

        // Standalone sub-particle size range (completely decoupled from parent particle size)
        const startMin = source.sparkStartSizeMin !== undefined ? source.sparkStartSizeMin : (isImpact ? 2.5 : 3.0);
        const startMax = source.sparkStartSizeMax !== undefined ? Math.max(startMin, source.sparkStartSizeMax) : (isImpact ? 4.0 : 4.5);
        const sparkStartSize = Math.max(0.1, startMin + Math.random() * (startMax - startMin));

        // End size range
        const endMin = source.sparkEndSizeMin !== undefined ? source.sparkEndSizeMin : 0.5;
        const endMax = source.sparkEndSizeMax !== undefined ? Math.max(endMin, source.sparkEndSizeMax) : 0.5;
        const sparkEndSize = Math.max(0, endMin + Math.random() * (endMax - endMin));

        // Color gradient
        const mode = source.sparkColorMode || 'gradient_lifecycle';
        const gradStart = source.sparkStartColor || "#ffffff";
        const gradEnd = source.sparkEndColor || (source.startColor || "#ffaa00");

        let instStartColor = gradStart;
        let instEndColor = gradEnd;

        if (mode === 'gradient_random') {
          const randT = Math.random();
          const picked = interpolateHexColor(gradStart, gradEnd, randT);
          instStartColor = picked;
          instEndColor = picked;
        }

        let spawnX = source.x;
        let spawnY = source.y;
        const jitterRadius = source.subEmitterPositionJitter !== undefined ? source.subEmitterPositionJitter : 0;
        if (jitterRadius > 0) {
          const jAngle = Math.random() * Math.PI * 2;
          const jDist = Math.random() * jitterRadius;
          spawnX += Math.cos(jAngle) * jDist;
          spawnY += Math.sin(jAngle) * jDist;
        }

        const effStartAlphaMin = source.subEmitterAlphaStartMin !== undefined ? source.subEmitterAlphaStartMin : 1;
        const effStartAlphaMax = source.subEmitterAlphaStartMax !== undefined ? source.subEmitterAlphaStartMax : effStartAlphaMin;
        const startAlpha = effStartAlphaMin + Math.random() * Math.max(0, effStartAlphaMax - effStartAlphaMin);

        const effEndAlphaMin = source.subEmitterAlphaEndMin !== undefined ? source.subEmitterAlphaEndMin : 0;
        const effEndAlphaMax = source.subEmitterAlphaEndMax !== undefined ? source.subEmitterAlphaEndMax : effEndAlphaMin;
        const endAlpha = effEndAlphaMin + Math.random() * Math.max(0, effEndAlphaMax - effEndAlphaMin);

        return {
          x: spawnX,
          y: spawnY,
          vx,
          vy,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 10,
          lifetime: 0,
          maxLifetime: sparkMaxLifetime,
          startSize: sparkStartSize,
          endSize: sparkEndSize,
          sizeCurve: "linear",
          startColor: instStartColor,
          startAlpha,
          endColor: instEndColor,
          endAlpha,
          shape: source.shape === "bubble" ? "bubble" : "glow_circle",
          glowBlurRadius: Math.max(2, (source.glowBlurRadius || 4) * 0.5),
          blendMode: "screen",
          drag: 0.06,
          angularDrag: 0.94,
          gravityX: 0,
          gravityY: source.sparkGravity !== undefined ? source.sparkGravity : (isImpact ? 980 : (source.gravityY || 0) * 0.5),
          windForce: 0,
          turbulenceJitter: 0,
          collides: false,
          restitution: 0,
          destroyOnCollision: false,
          spawnCollisionSparks: false,
          spawnOnDeath: false,
          subEmitterTrigger: 'none',
          isSubParticle: true,
          fxStyle: "default",
          animateSize: true,
          animateColor: true,
          animateAlpha: true,
          animateEmissive: false,
          animateRotation: true
        };
      };

      const spawnSubParticlesForEvent = (
        source: ParticleInstance,
        isImpact: boolean
      ) => {
        // Prevent recursive cascades: sub-particles never spawn sub-sub-particles
        if (source.isSubParticle) return;

        // Check probability
        if (source.subEmitterProbability !== undefined && source.subEmitterProbability < 1.0) {
          if (Math.random() > source.subEmitterProbability) return;
        }

        // Check trigger condition
        const trigger = source.subEmitterTrigger || (
          source.spawnCollisionSparks && source.spawnOnDeath ? 'both' :
          source.spawnCollisionSparks ? 'impact' :
          source.spawnOnDeath ? 'death' : 'none'
        );

        if (trigger === 'none') return;
        if (isImpact && trigger !== 'impact' && trigger !== 'both') return;
        if (!isImpact && trigger !== 'death' && trigger !== 'both') return;

        // Respect total particle pool budget cap
        if (this.particles.length + newSparks.length >= 1000) return;

        const subData = source.subEmitterId ? this.resolveSubEmitter(source.subEmitterId) : undefined;

        if (subData) {
          const { kinematics, visuals, physics: subPhysics, emitter } = subData;
          const count = emitter?.burstCount !== undefined
            ? Math.max(1, emitter.burstCount)
            : (emitter?.emissionRate !== undefined
                ? Math.max(1, Math.round(emitter.emissionRate))
                : 1);

          for (let s = 0; s < count; s++) {
            if (this.particles.length + newSparks.length >= 1000) break;

            let launchAngle: number;
            const subActiveRanges = kinematics.directionRanges?.filter(r => r.enabled !== false);
            if (subActiveRanges && subActiveRanges.length > 0) {
              let totalWeight = 0;
              for (let rIdx = 0; rIdx < subActiveRanges.length; rIdx++) {
                totalWeight += Math.max(0.1, subActiveRanges[rIdx].weight ?? 1);
              }
              let randW = Math.random() * totalWeight;
              let selectedRange = subActiveRanges[0];
              for (let rIdx = 0; rIdx < subActiveRanges.length; rIdx++) {
                const w = Math.max(0.1, subActiveRanges[rIdx].weight ?? 1);
                if (randW <= w) {
                  selectedRange = subActiveRanges[rIdx];
                  break;
                }
                randW -= w;
              }
              const aDeg = selectedRange.angleDeg;
              const sDeg = selectedRange.spreadDeg;
              const baseAngleRad = aDeg * (Math.PI / 180);
              const spreadRad = ((Math.random() - 0.5) * sDeg) * (Math.PI / 180);
              launchAngle = baseAngleRad + spreadRad;
            } else {
              const angleDeg = kinematics.angleDeg !== undefined ? kinematics.angleDeg : (isImpact ? 270 : 0);
              const spreadDeg = kinematics.spreadDeg !== undefined ? kinematics.spreadDeg : (isImpact ? 140 : 360);
              const baseAngleRad = angleDeg * (Math.PI / 180);
              const spreadRad = ((Math.random() - 0.5) * spreadDeg) * (Math.PI / 180);
              launchAngle = baseAngleRad + spreadRad;
            }

            const rawMinSpd = kinematics.minSpeed !== undefined ? kinematics.minSpeed : 0.4;
            const rawMaxSpd = kinematics.maxSpeed !== undefined ? kinematics.maxSpeed : 1.2;
            const effMinSpd = (rawMinSpd > 15 ? rawMinSpd / 100 : rawMinSpd) * 100;
            const effMaxSpd = (rawMaxSpd > 15 ? rawMaxSpd / 100 : rawMaxSpd) * 100;
            const speed = effMinSpd + Math.random() * Math.max(0, effMaxSpd - effMinSpd);

            let vx = Math.cos(launchAngle) * speed;
            let vy = Math.sin(launchAngle) * speed;

            // If impact with floor and vy is pushing down into floor, bounce upward
            if (isImpact && vy > 0) {
              vy = -Math.abs(vy);
            }

            const lifetime = visuals.minLifetime + Math.random() * Math.max(0.05, visuals.maxLifetime - visuals.minLifetime);
            const vRot = kinematics.minAngularVelocity + Math.random() * Math.max(0, kinematics.maxAngularVelocity - kinematics.minAngularVelocity);

            const startSize = visuals.startSize ?? 4;
            const midSize = visuals.midSize;
            const endSize = visuals.endSize ?? 1;

            const startColor = visuals.startColor || "#ffffff";
            const endColor = visuals.endColor || startColor;

            const startAlpha = visuals.startAlpha !== undefined ? visuals.startAlpha : 1;
            const endAlpha = visuals.endAlpha !== undefined ? visuals.endAlpha : 0;

            newSparks.push({
              x: source.x,
              y: source.y,
              vx,
              vy,
              rotation: (visuals.startRotationDeg ?? 0) * (Math.PI / 180),
              vRot,
              lifetime: 0,
              maxLifetime: lifetime,
              startSize,
              midSize,
              endSize,
              sizeCurve: visuals.sizeCurve || "linear",
              alphaCurve: visuals.alphaCurve || "linear",
              startColor,
              startAlpha,
              midColor: visuals.midColor,
              midAlpha: visuals.midAlpha,
              endColor,
              endAlpha,
              shape: visuals.shape || "glow_circle",
              customGlyph: visuals.customGlyph,
              customSvgPath: visuals.customSvgPath,
              compositeShape: visuals.compositeShape,
              glowBlurRadius: visuals.glowBlurRadius || 0,
              blendMode: visuals.blendMode || "screen",
              drag: kinematics.startDrag ?? kinematics.drag ?? 0.05,
              angularDrag: kinematics.angularDrag ?? 0.96,
              gravityScale: kinematics.gravityScale,
              gravityScaleX: kinematics.gravityScaleX,
              gravityX: kinematics.gravityX ?? 0,
              gravityY: kinematics.gravityY ?? (isImpact ? 400 : 0),
              windSensitivity: kinematics.windSensitivity ?? 1.0,
              windForce: kinematics.windForce ?? 0,
              turbulenceJitter: kinematics.turbulenceJitter ?? 0,
              collides: subPhysics?.collideWithMapSolids ?? false,
              restitution: subPhysics?.collisionRestitution ?? 0.3,
              bounces: 0,
              destroyOnCollision: subPhysics?.destroyOnCollision ?? false,
              spawnCollisionSparks: false,
              spawnOnDeath: false,
              subEmitterTrigger: 'none',
              isSubParticle: true,
              fxStyle: visuals.fxStyle || "default",
              animateSize: visuals.animateSize === true,
              animateColor: visuals.animateColor === true,
              animateAlpha: visuals.animateAlpha === true,
              animateEmissive: visuals.animateEmissive ?? false,
              animateRotation: visuals.animateRotation ?? true,
              isEmissive: visuals.isEmissive,
              emissiveStartStrength: visuals.emissiveStartStrength,
              emissiveStartColor: visuals.emissiveStartColor,
              trackNodes: visuals.trackNodes ? JSON.parse(JSON.stringify(visuals.trackNodes)) : undefined
            });
          }
        } else {
          // Fallback legacy sub-particle generation
          const fallbackCount = source.subEmitterCount ?? source.sparkCount ?? 1;
          for (let s = 0; s < fallbackCount; s++) {
            const vx = isImpact ? (Math.random() - 0.5) * 200 : (Math.random() - 0.5) * 140;
            const vy = isImpact ? -Math.random() * 150 : (Math.random() - 0.5) * 140;
            const sub = createSubParticle(source, vx, vy, isImpact);
            sub.isSubParticle = true;
            newSparks.push(sub);
          }
        }
      };

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.lifetime += dt;
        if (p.lifetime >= p.maxLifetime) {
          spawnSubParticlesForEvent(p, false);
          continue;
        }

        // Apply Drag (0.0 = no drag / 100% velocity retention, 1.0 = full drag / rapid halt)
        let curDrag = p.drag ?? 0;
        if (p.midDrag !== undefined || (p.endDrag !== undefined && p.endDrag !== p.startDrag)) {
          const rawProgress = p.maxLifetime > 0 ? Math.min(1, p.lifetime / p.maxLifetime) : 0;
          if (p.midDrag !== undefined) {
            if (rawProgress < 0.5) {
              const t = rawProgress * 2;
              curDrag = (p.startDrag ?? p.drag ?? 0) * (1 - t) + p.midDrag * t;
            } else {
              const t = (rawProgress - 0.5) * 2;
              curDrag = p.midDrag * (1 - t) + (p.endDrag ?? p.drag ?? 0) * t;
            }
          } else {
            curDrag = (p.startDrag ?? p.drag ?? 0) * (1 - rawProgress) + (p.endDrag ?? p.drag ?? 0) * rawProgress;
          }
        }

        const dragFactor = calculateLinearDragFactor(curDrag, dt);
        p.vx *= dragFactor;
        p.vy *= dragFactor;
        p.rotation *= p.angularDrag;

        // Apply Wind Force
        // Global wind force is scaled so environmental biome winds produce realistic, clearly visible horizontal drift and turbulence
        const sensitivity = (p.windSensitivity !== undefined && p.windSensitivity !== 0) ? p.windSensitivity : 1.0;
        const totalWindAcc = (globalWindForce * 6.0) + ((p.windForce || 0) * 4.0);
        if (totalWindAcc !== 0) {
          p.vx += totalWindAcc * sensitivity * dt;
        }

        // Turbulence Jitter
        if (p.turbulenceJitter > 0) {
          p.vx += (Math.random() - 0.5) * p.turbulenceJitter * dt * 50;
          p.vy += (Math.random() - 0.5) * p.turbulenceJitter * dt * 50;
        }

        if (p.emitterPull && emitterState && (emitterState.dx !== 0 || emitterState.dy !== 0)) {
          const dist = Math.hypot(p.x - emitterState.x, p.y - emitterState.y);
          const pullRadius = p.emitterPullRadius ?? 150;
          if (dist < pullRadius) {
            let factor = 1.0;
            const falloff = p.emitterPullFalloff ?? 1.0;
            if (falloff > 0) {
              factor = Math.pow(Math.max(0, 1.0 - dist / pullRadius), falloff);
            }
            const strength = p.emitterPullStrength ?? 1.0;
            p.x += emitterState.dx * factor * strength;
            p.y += emitterState.dy * factor * strength;
          }
        }

        // Fluid Push / Boids repulsion
        if (fluidEnabled) {
          const cellX = Math.floor(p.x / this.CELL_SIZE);
          const cellY = Math.floor(p.y / this.CELL_SIZE);
          const key = `${cellX},${cellY}`;
          let cellList = this.spatialGrid.get(key);
          if (!cellList) {
            cellList = [];
            this.spatialGrid.set(key, cellList);
          }
          cellList.push(p);
        }

        p.vy += p.gravityY * dt;
        p.vx += p.gravityX * dt;
        
        if (p.hasTrails && p.trailHistory) {
            p.trailHistory.push({ x: p.x, y: p.y });
            if (p.trailHistory.length > (p.trailLength || 10)) {
                p.trailHistory.shift();
            }
        }
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const spdSq = p.vx * p.vx + p.vy * p.vy;
        if (spdSq > 0.001) {
          p.lastVelAngle = Math.atan2(p.vy, p.vx);
        }

        if (p.animateRotation) {
          p.rotation += p.vRot * dt;
        }

        if (p.collides && p.y >= floorY) {
          p.y = floorY;
          p.vy = -p.vy * p.restitution;
          p.vx *= 0.8;

          if (p.bounces === undefined) p.bounces = 0;
          p.bounces++;

          spawnSubParticlesForEvent(p, true);

          if (p.destroyOnCollision) {
            p.lifetime = p.maxLifetime;
            continue;
          }

          if (Math.abs(p.vy) < 5) {
            p.vy = 0;
            p.isRestingOnFloor = true;
          }
        }

        aliveParticles.push(p);
      }

      this.particles = [...aliveParticles, ...newSparks];
    } catch (e) {
      console.error("Particle update error:", e);
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    panOffset: { x: number; y: number },
    zoom: number,
    particleData: any,
    showWireframe: boolean = false,
    emitterPos?: { x: number; y: number }
  ) {
    try {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      // Render active particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const rawProgress = p.lifetime / p.maxLifetime;
        const visuals = {
          startSize: p.startSize,
          endSize: p.endSize,
          midSize: p.midSize,
          sizeCurve: p.sizeCurve,
          startColor: p.startColor,
          startAlpha: p.startAlpha,
          midColor: p.midColor,
          midAlpha: p.midAlpha,
          endColor: p.endColor,
          endAlpha: p.endAlpha,
          alphaCurve: p.alphaCurve,
          emissiveStartColor: p.emissiveStartColor,
          emissiveMidColor: p.emissiveMidColor,
          emissiveEndColor: p.emissiveEndColor,
          emissiveStartStrength: p.emissiveStartStrength,
          emissiveMidStrength: p.emissiveMidStrength,
          emissiveEndStrength: p.emissiveEndStrength,
          emissiveCurve: p.emissiveCurve,
          startRotationDeg: p.startRotationDeg,
          midRotationDeg: p.midRotationDeg,
          endRotationDeg: p.endRotationDeg,
          rotationCurve: p.rotationCurve,
          sizeAnimStyle: p.sizeAnimStyle,
          colorAnimStyle: p.colorAnimStyle,
          emissiveAnimStyle: p.emissiveAnimStyle,
          rotationAnimStyle: p.rotationAnimStyle,
          animateMotionBlur: p.animateMotionBlur,
          startMotionBlur: p.startMotionBlur,
          midMotionBlur: p.midMotionBlur,
          endMotionBlur: p.endMotionBlur,
          motionBlurAnimStyle: p.motionBlurAnimStyle,
          motionBlurCurve: p.motionBlurCurve,
          trackNodes: p.trackNodes,
          animateColor: p.animateColor,
          animateSize: p.animateSize,
          animateAlpha: p.animateAlpha,
          animateEmissive: p.animateEmissive,
          animateRotation: p.animateRotation,
        };

        const sizeProgress = p.animateSize ? getAnimProgress(rawProgress, p.sizeAnimStyle) : rawProgress;
        const colorProgress = p.animateColor ? getAnimProgress(rawProgress, p.colorAnimStyle) : rawProgress;
        const emissiveProgress = p.animateEmissive ? getAnimProgress(rawProgress, p.emissiveAnimStyle) : rawProgress;
        const rotationProgress = p.animateRotation ? getAnimProgress(rawProgress, p.rotationAnimStyle) : rawProgress;
        const motionBlurProgress = p.animateMotionBlur !== false ? getAnimProgress(rawProgress, p.motionBlurAnimStyle) : rawProgress;

        const currentSize = evaluateSize(sizeProgress, visuals);
        const { color, alpha } = evaluateColorAlpha(colorProgress, visuals);
        let currentRotation = p.rotation;
        if (p.animateRotation && visuals.startRotationDeg !== undefined) {
          currentRotation += evaluateTrackValue(rotationProgress, "rotation", visuals) * (Math.PI / 180);
        }

        const isFaceVelocity = p.faceVelocity ?? particleData?.visuals?.faceVelocity ?? particleData?.kinematics?.faceVelocity ?? false;
        if (isFaceVelocity) {
          const spdSq = p.vx * p.vx + p.vy * p.vy;
          const heading = spdSq > 0.001 ? Math.atan2(p.vy, p.vx) : (p.lastVelAngle ?? 0);
          const offsetDeg = p.velocityRotationOffsetDeg ?? particleData?.visuals?.velocityRotationOffsetDeg ?? particleData?.kinematics?.velocityRotationOffsetDeg ?? 0;
          const offsetRad = (offsetDeg * Math.PI) / 180;
          currentRotation = heading + offsetRad + currentRotation;
        }
        
        if (p.hasTrails && p.trailHistory && p.trailHistory.length > 1) {
          ctx.save();
          ctx.globalCompositeOperation = p.blendMode as any;
          
          const pts = [...p.trailHistory, {x: p.x, y: p.y}];
          const N = pts.length;
          const baseWidth = currentSize * (p.trailWidthScale ?? 1.0);
          
          const effectiveGlowRadius = (particleData?.visuals?.glowBlurRadius !== undefined
            ? particleData.visuals.glowBlurRadius
            : p.glowBlurRadius) ?? 0;
          
          if (effectiveGlowRadius > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = effectiveGlowRadius;
          }
          ctx.globalAlpha = alpha * 0.7;

          if (p.trailTaper) {
             const taperFrames = p.trailTaperLength ?? p.trailLength ?? 10;
             const leftPts = [];
             const rightPts = [];
             
             for (let j = 0; j < N; j++) {
               let dx = 0, dy = 0;
               if (j === 0) {
                 dx = pts[1].x - pts[0].x; dy = pts[1].y - pts[0].y;
               } else if (j === N - 1) {
                 dx = pts[N-1].x - pts[N-2].x; dy = pts[N-1].y - pts[N-2].y;
               } else {
                 dx = pts[j+1].x - pts[j-1].x; dy = pts[j+1].y - pts[j-1].y;
               }
               const len = Math.sqrt(dx*dx + dy*dy);
               if (len > 0.0001) { dx /= len; dy /= len; } else { dx = 1; dy = 0; }
               const nx = -dy; const ny = dx;
               
               const age = (N - 1) - j;
               let w = baseWidth;
               if (age >= taperFrames) w = 0;
               else w = baseWidth * (1.0 - (age / taperFrames));
               
               const halfW = w / 2;
               leftPts.push({ x: pts[j].x + nx * halfW, y: pts[j].y + ny * halfW });
               rightPts.push({ x: pts[j].x - nx * halfW, y: pts[j].y - ny * halfW });
             }
             
             ctx.beginPath();
             ctx.moveTo(leftPts[0].x, leftPts[0].y);
             for (let j = 1; j < N; j++) ctx.lineTo(leftPts[j].x, leftPts[j].y);
             for (let j = N - 1; j >= 0; j--) ctx.lineTo(rightPts[j].x, rightPts[j].y);
             ctx.closePath();
             
             ctx.fillStyle = color;
             ctx.fill();
          } else {
             ctx.beginPath();
             ctx.moveTo(pts[0].x, pts[0].y);
             for (let j = 1; j < N; j++) {
               ctx.lineTo(pts[j].x, pts[j].y);
             }
             
             ctx.strokeStyle = color;
             ctx.lineWidth = baseWidth;
             ctx.lineCap = "round";
             ctx.lineJoin = "round";
             ctx.stroke();
          }
          ctx.restore();
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        
        const motionBlurVal = evaluateTrackValue(motionBlurProgress, "motionBlur", visuals) || 0;
        if (motionBlurVal > 0) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 0.1) {
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);
                ctx.scale(1 + speed * motionBlurVal * 0.05, 1);
                ctx.rotate(-angle);
            }
        }
        
        ctx.rotate(currentRotation);
        ctx.globalCompositeOperation = p.blendMode as any;

        const effectiveGlowRadius = (particleData?.visuals?.glowBlurRadius !== undefined
          ? particleData.visuals.glowBlurRadius
          : p.glowBlurRadius) ?? 0;

        if (p.isEmissive) {
          const emStr = evaluateTrackValue(emissiveProgress, "emissive", visuals);
          const emColHex = evaluateTrackValue(colorProgress, "color", { ...visuals, trackNodes: { color: getTrackNodesForData({ startColor: p.emissiveStartColor || p.startColor, midColor: p.emissiveMidColor, endColor: p.emissiveEndColor || p.endColor }, "color") } });
          const emRgb = hexToRgb(emColHex);

          if (p.emissiveMode === "glow_only" || p.emissiveMode === "light_up_area") {
            ctx.shadowColor = `rgba(${emRgb.r}, ${emRgb.g}, ${emRgb.b}, ${alpha})`;
            let blurRadius = effectiveGlowRadius;
            if (p.animateEmissive && effectiveGlowRadius > 0) {
              const maxStrength = Math.max(1, p.emissiveStartStrength || 35);
              blurRadius = effectiveGlowRadius * (emStr / maxStrength);
            } else if (effectiveGlowRadius === 0 && emStr > 0) {
              blurRadius = emStr;
            }
            ctx.shadowBlur = blurRadius;
            if (p.emissiveMode === "light_up_area") {
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            } else {
              ctx.fillStyle = color;
            }
          } else {
            ctx.fillStyle = color;
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
          }
        } else {
          ctx.fillStyle = color;
          if (effectiveGlowRadius > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = effectiveGlowRadius;
          } else {
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
          }
        }

        // Comprehensive Shape Renderers matching ParticleShape union
        const shape = p.shape || "glow_circle";
        if (shape === "glow_circle" || shape === "bubble") {
          ctx.beginPath();
          ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
          ctx.fill();
          if (shape === "bubble") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(-currentSize * 0.3, -currentSize * 0.3, currentSize * 0.3, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (shape === "square" || shape === "pixel_square") {
          ctx.fillRect(-currentSize, -currentSize, currentSize * 2, currentSize * 2);
        } else if (shape === "spark_line") {
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = Math.max(1, currentSize);
          ctx.beginPath();
          ctx.moveTo(-currentSize * 2, 0);
          ctx.lineTo(currentSize * 2, 0);
          ctx.stroke();
        } else if (shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -currentSize);
          ctx.lineTo(currentSize, 0);
          ctx.lineTo(0, currentSize);
          ctx.lineTo(-currentSize, 0);
          ctx.closePath();
          ctx.fill();
        } else if (shape === "star") {
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = currentSize;
          const innerRadius = currentSize * 0.5;
          let rot = (Math.PI / 2) * 3;
          let x = 0;
          let y = 0;
          const step = Math.PI / spikes;
          ctx.moveTo(0, -outerRadius);
          for (let s = 0; s < spikes; s++) {
            x = Math.cos(rot) * outerRadius;
            y = Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(0, -outerRadius);
          ctx.closePath();
          ctx.fill();
        } else if (shape === "ring") {
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = Math.max(1, currentSize * 0.35);
          ctx.beginPath();
          ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape === "ember") {
          ctx.beginPath();
          ctx.arc(0, 0, currentSize * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "smoke_puff") {
          ctx.globalAlpha *= 0.6;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize * 1.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "custom_glyph" && p.customGlyph) {
          ctx.font = `${Math.max(8, currentSize * 2)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.customGlyph, 0, 0);
        } else if (shape === "svg_path" && p.customSvgPath && typeof Path2D !== "undefined") {
          try {
            let path2d = this.path2dCache.get(p.customSvgPath);
            if (!path2d) {
              path2d = new Path2D(p.customSvgPath);
              if (this.path2dCache.size > 64) {
                const firstKey = this.path2dCache.keys().next().value;
                if (firstKey) this.path2dCache.delete(firstKey);
              }
              this.path2dCache.set(p.customSvgPath, path2d);
            }
            ctx.save();
            const scale = currentSize / 16;
            ctx.scale(scale, scale);
            ctx.fill(path2d);
            ctx.restore();
          } catch {
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (shape === "composite") {
          const comp = p.compositeShape || particleData?.visuals?.compositeShape;
          if (comp && comp.layers && comp.layers.length > 0) {
            const sprite = this.getOrCreateCompositeSprite(comp, color);
            if (sprite) {
              const baseRef = comp.baseSize || 64;
              // quadSize scales sprite so the nominal core dimension (baseRef) matches 2 * currentSize
              const quadSize = sprite.width * (currentSize / (baseRef / 2));
              // Clear shadowBlur on main context to prevent double-blurring on pre-baked sprite
              const prevShadow = ctx.shadowBlur;
              if (prevShadow > 0) ctx.shadowBlur = 0;
              ctx.drawImage(sprite, -quadSize / 2, -quadSize / 2, quadSize, quadSize);
              if (prevShadow > 0) ctx.shadowBlur = prevShadow;
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Default fallback to circle
          ctx.beginPath();
          ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Render Wireframe Hulls / Debug Outlines if enabled
      if (showWireframe && emitterPos && particleData?.emitter) {
        const em = particleData.emitter;
        ctx.strokeStyle = "#06b6d4";
        ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);

        ctx.save();
        ctx.translate(emitterPos.x, emitterPos.y);

        const emRotDeg = em.rotationDeg || 0;
        if (emRotDeg !== 0 && em.shape !== "point") {
          ctx.rotate(emRotDeg * (Math.PI / 180));
        }

        const emW = em.width ?? (em.radius ? em.radius * 2 : 40);
        const emH = em.height ?? (em.radius ? em.radius * 2 : (em.shape === "cone" ? 60 : 40));

        if (em.shape === "box") {
          ctx.fillRect(-emW / 2, -emH / 2, emW, emH);
          ctx.strokeRect(-emW / 2, -emH / 2, emW, emH);
        } else if (em.shape === "circle" || em.shape === "ring") {
          const rx = emW / 2;
          const ry = emH / 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (em.shape === "ring") {
            const innerRatio = 0.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * innerRatio, ry * innerRatio, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (em.shape === "line") {
          ctx.beginPath();
          ctx.moveTo(-emW / 2, 0);
          ctx.lineTo(emW / 2, 0);
          ctx.stroke();
        } else if (em.shape === "cone") {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-emW / 2, -emH);
          ctx.lineTo(emW / 2, -emH);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Point emitter bounds
          ctx.beginPath();
          ctx.arc(0, 0, 16 / zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
        ctx.setLineDash([]);
      }

      ctx.restore();
    } catch (e) {
      console.error("Particle render error:", e);
    }
  }
}
