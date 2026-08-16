import { TileType, BlendStyle } from './schema';
import { STANDARD_TILE_TYPES } from './tileTypes';

export interface BlendPixelSample {
  color: string;
  alpha: number;
  height: number;
  thresholdIndex: number;
}

/**
 * Continuous smoothstep implementation
 */
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Dither Bayer 4x4 matrix for Dither blend style
 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

/**
 * Calculates continuous height-blend between two adjacent materials at a coordinate.
 * Deliberately implements:
 * 1. continuous smoothstep math (never hard boolean pick)
 * 2. softness (larger = softer/more permissive bleed)
 * 3. blend_style presets (Fade, Line, Dither) + fade_amount
 */
export function computeHeightBlend(
  worldX: number,
  worldY: number,
  baseTile: TileType,
  neighborTile: TileType,
  distanceFromBorder: number // -1.0 to 1.0 (0 is exact border)
): { primaryWeight: number; blendAlpha: number } {
  // Base softness combines neighbor's permeability
  const effectiveSoftness = Math.max(0.01, (baseTile.softness + neighborTile.softness) * 0.5);
  const fadeCurve = (baseTile.fade_amount + neighborTile.fade_amount) * 0.5;

  // Height differential
  const heightDelta = baseTile.height_map_scale - neighborTile.height_map_scale;

  // Transition band width modulated by softness
  const transitionWidth = 0.2 + (effectiveSoftness * 0.6) + (fadeCurve * 0.2);

  // Height-biased border evaluation
  const borderPos = distanceFromBorder + (heightDelta * 0.35);

  let rawBlend = smoothstep(-transitionWidth, transitionWidth, borderPos);

  // Apply blend style
  const activeStyle: BlendStyle = baseTile.blend_style;

  if (activeStyle === 'line') {
    // Sharp transition line with slight softness falloff
    const lineEdge = smoothstep(-0.08 - effectiveSoftness * 0.1, 0.08 + effectiveSoftness * 0.1, borderPos);
    rawBlend = lineEdge * (1 - fadeCurve) + rawBlend * fadeCurve;
  } else if (activeStyle === 'dither') {
    // Dithered threshold using 4x4 matrix
    const matrixX = Math.abs(Math.floor(worldX)) % 4;
    const matrixY = Math.abs(Math.floor(worldY)) % 4;
    const ditherThreshold = (BAYER_4X4[matrixY]?.[matrixX] ?? 0) / 16.0;

    const dithered = rawBlend >= ditherThreshold ? 1.0 : 0.0;
    rawBlend = dithered * (1 - fadeCurve) + rawBlend * fadeCurve;
  }

  return {
    primaryWeight: rawBlend,
    blendAlpha: 1.0 - rawBlend
  };
}

/**
 * Universal Destruction Threshold Crack Shader / Mask overlay generator
 * 3 contiguous threshold stages shared across neighbor cells.
 */
export function drawThresholdCrackMask(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSize: number,
  thresholdIndex: number,
  sharesOverlay: boolean,
  worldSeed: number
) {
  if (thresholdIndex <= 0) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.lineWidth = thresholdIndex >= 2 ? 2 : 1;

  // Continuous jagged cracks based on world seed & threshold
  ctx.beginPath();
  const midX = screenX + tileSize / 2;
  const midY = screenY + tileSize / 2;

  const scale = tileSize / 64;
  const off1 = Math.max(1, Math.round(3 * scale));
  const off2 = Math.max(1, Math.round(4 * scale));

  if (thresholdIndex >= 1) {
    // Stage 1: Minor stress hairline fracture
    ctx.moveTo(screenX + off1, screenY + off2);
    ctx.lineTo(midX - Math.max(1, Math.round(2 * scale)), midY + Math.max(1, Math.round(1 * scale)));
    ctx.lineTo(screenX + tileSize - off1, screenY + tileSize - Math.max(1, Math.round(2 * scale)));
  }

  if (thresholdIndex >= 2) {
    // Stage 2: Heavy fracture branching to edges (contiguous bleed)
    ctx.moveTo(midX - Math.max(1, Math.round(2 * scale)), midY + Math.max(1, Math.round(1 * scale)));
    ctx.lineTo(screenX + tileSize - Math.max(1, Math.round(2 * scale)), screenY + off1);
    ctx.moveTo(midX, midY);
    ctx.lineTo(screenX + off2, screenY + tileSize - off1);
  }

  if (thresholdIndex >= 3) {
    // Stage 3: Critical shatter & void fissure
    ctx.moveTo(screenX, screenY + tileSize / 2);
    ctx.lineTo(screenX + tileSize, screenY + tileSize / 2);
    ctx.moveTo(screenX + tileSize / 2, screenY);
    ctx.lineTo(screenX + tileSize / 2, screenY + tileSize);
  }

  ctx.stroke();

  // Subtle chipped debris highlight along cracks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
