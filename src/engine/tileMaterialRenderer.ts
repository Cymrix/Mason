import { BiomeTileType, DualNoiseBlendMapConfig } from './refinedBiomeSchema';
import { TileShape, buildTileShapePath } from './tileShape';

// Global texture cache for uploaded images (data URLs or URLs)
const imageCache: Map<string, HTMLImageElement> = new Map();
const pendingLoads: Set<string> = new Set();

/**
 * Gets or creates a cached HTMLImageElement for canvas rendering.
 * If image is still loading, returns null and triggers re-render callback if provided.
 */
export function getCachedImage(url: string | undefined, onLoaded?: () => void): HTMLImageElement | null {
  if (!url) return null;
  
  const existing = imageCache.get(url);
  if (existing) {
    if (existing.complete && existing.naturalWidth > 0) {
      return existing;
    }
    return null;
  }

  if (pendingLoads.has(url)) return null;

  pendingLoads.add(url);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageCache.set(url, img);
    pendingLoads.delete(url);
    if (onLoaded) {
      onLoaded();
    }
  };
  img.onerror = () => {
    pendingLoads.delete(url);
  };
  img.src = url;
  return null;
}

/**
 * 2D Seeded Value Noise function with quintic smoothstep interpolation (6t^5 - 15t^4 + 10t^3)
 */
function seededValueNoise2D(x: number, y: number, seed: number = 0): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  // Quintic smoothstep interpolation curve for C2 continuity across cell boundaries
  const u = fX * fX * fX * (fX * (fX * 6 - 15) + 10);
  const v = fY * fY * fY * (fY * (fY * 6 - 15) + 10);

  const hash = (nx: number, ny: number) => {
    const s = ((seed % 1000) + 1000) * 137.5;
    const sin = Math.sin((nx + s) * 127.1 + (ny + s) * 311.7) * 43758.5453123;
    return sin - Math.floor(sin);
  };

  const a = hash(iX, iY);
  const b = hash(iX + 1, iY);
  const c = hash(iX, iY + 1);
  const d = hash(iX + 1, iY + 1);

  return a * (1 - u) * (1 - v) +
         b * u * (1 - v) +
         c * (1 - u) * v +
         d * u * v;
}

/**
 * Fractal Brownian Motion (fBm) for octave-based noise with seed support
 */
export function sampleFractalNoise(
  worldX: number,
  worldY: number,
  scale: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  offsetX: number,
  offsetY: number,
  seed: number = 0
): number {
  let total = 0;
  let frequency = 1.0 / Math.max(1, scale);
  let amplitude = 1.0;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const nx = (worldX + offsetX) * frequency;
    const ny = (worldY + offsetY) * frequency;
    total += seededValueNoise2D(nx, ny, seed + i * 101) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / Math.max(0.0001, maxValue);
}

/**
 * Evaluates the Dual Overlapping Noise Blend Map at a world coordinate.
 * Produces a continuous weight between Material A (0.0) and Material B (1.0).
 * Breaking up repeating tiling patterns across infinite world space.
 */
export function evaluateDualNoiseBlend(
  worldX: number,
  worldY: number,
  config: DualNoiseBlendMapConfig
): number {
  const seedA = config.noiseA.seed !== undefined ? config.noiseA.seed : 1337;
  const seedB = config.noiseB.seed !== undefined ? config.noiseB.seed : 4242;

  // Sample primary Noise A
  const nA = sampleFractalNoise(
    worldX,
    worldY,
    config.noiseA.scale,
    config.noiseA.octaves,
    config.noiseA.persistence,
    config.noiseA.lacunarity,
    config.noiseA.offset.x,
    config.noiseA.offset.y,
    seedA
  );

  // Sample secondary Noise B
  const nB = sampleFractalNoise(
    worldX,
    worldY,
    config.noiseB.scale,
    config.noiseB.octaves,
    config.noiseB.persistence,
    config.noiseB.lacunarity,
    config.noiseB.offset.x,
    config.noiseB.offset.y,
    seedB
  );

  // Weighted combination
  const wA = Math.max(0, config.noiseA.weight ?? 0.5);
  const wB = Math.max(0, config.noiseB.weight ?? 0.5);
  const totalWeight = wA + wB;
  const rawNoise = totalWeight > 0.0001 ? (nA * wA + nB * wB) / totalWeight : nA;

  // Remap raw fractal noise (which naturally clusters in [0.25, 0.75]) to fill full [0.0, 1.0] range
  const normalizedNoise = (rawNoise - 0.5) * 2.2 + 0.5;

  // Threshold & Contrast parameters
  const threshold = config.blendThreshold !== undefined ? config.blendThreshold : 0.5;
  const contrast = config.blendContrast !== undefined ? config.blendContrast : 1.0;

  // Shift by threshold & adjust contrast slope around 0.5 pivot
  const centered = (normalizedNoise - threshold) * contrast + 0.5;

  // Clamp to [0, 1]
  const clamped = Math.max(0, Math.min(1, centered));

  // Smoothstep curve for natural gradient transition without edge clipping
  const smoothWeight = clamped * clamped * (3.0 - 2.0 * clamped);

  // Invert mask if enabled (Base A ↔ Base B swap)
  return config.invert ? 1.0 - smoothWeight : smoothWeight;
}

/**
 * Color Interpolator for RGB Hex values
 */
export function interpolateHexColor(colorA: string | undefined, colorB: string | undefined, factor: number): string {
  const fallbackA = colorA || '#334155';
  const fallbackB = colorB || '#64748b';

  const parse = (hex: string) => {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  try {
    const [r1, g1, b1] = parse(fallbackA);
    const [r2, g2, b2] = parse(fallbackB);

    const t = Math.max(0, Math.min(1, factor));
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return fallbackA;
  }
}

/**
 * Neighbor Mask structure for 8-way and 4-way autotiling
 */
export interface AutotileNeighborMask {
  hasTop: boolean;
  hasBottom: boolean;
  hasLeft: boolean;
  hasRight: boolean;
  hasTopLeft?: boolean;
  hasTopRight?: boolean;
  hasBottomLeft?: boolean;
  hasBottomRight?: boolean;
}

/**
 * Helper to draw a texture repeating seamlessly in world space matching its native pixel dimensions
 */
export function drawWorldAlignedTexture(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  tileSizePx: number
) {
  if (!img || !img.width || !img.height) return;

  const worldX = tileX * tileSizePx;
  const worldY = tileY * tileSizePx;

  const sx = ((worldX % img.width) + img.width) % img.width;
  const sy = ((worldY % img.height) + img.height) % img.height;

  const sliceW = Math.min(tileSizePx, img.width - sx);
  const sliceH = Math.min(tileSizePx, img.height - sy);

  // Main slice
  ctx.drawImage(img, sx, sy, sliceW, sliceH, screenX, screenY, sliceW, sliceH);

  // Horizontal wrap
  if (sliceW < tileSizePx) {
    const remW = tileSizePx - sliceW;
    ctx.drawImage(img, 0, sy, remW, sliceH, screenX + sliceW, screenY, remW, sliceH);
  }

  // Vertical wrap
  if (sliceH < tileSizePx) {
    const remH = tileSizePx - sliceH;
    ctx.drawImage(img, sx, 0, sliceW, remH, screenX, screenY + sliceH, sliceW, remH);

    if (sliceW < tileSizePx) {
      const remW = tileSizePx - sliceW;
      ctx.drawImage(img, 0, 0, remW, remH, screenX + sliceW, screenY + sliceH, remW, remH);
    }
  }
}

/**
 * Safe helper to draw a wrapped pixel block from an image onto canvas without boundary clipping or transparent border artifacts
 */
export function drawWrappedImageBlock(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  worldX: number,
  worldY: number,
  blockSize: number,
  destX: number,
  destY: number
) {
  const w = img.width;
  const h = img.height;
  if (w <= 0 || h <= 0) return;

  const sx = ((worldX % w) + w) % w;
  const sy = ((worldY % h) + h) % h;

  const sw = Math.min(blockSize, w - sx);
  const sh = Math.min(blockSize, h - sy);

  // Main block
  ctx.drawImage(img, sx, sy, sw, sh, destX, destY, sw, sh);

  // Horizontal wrap if block overflows right edge
  if (sw < blockSize) {
    const remW = blockSize - sw;
    ctx.drawImage(img, 0, sy, remW, sh, destX + sw, destY, remW, sh);
  }

  // Vertical wrap if block overflows bottom edge
  if (sh < blockSize) {
    const remH = blockSize - sh;
    ctx.drawImage(img, sx, 0, sw, remH, destX, destY + sh, sw, remH);

    if (sw < blockSize) {
      const remW = blockSize - sw;
      ctx.drawImage(img, 0, 0, remW, remH, destX + sw, destY + sh, remW, remH);
    }
  }
}

/**
 * Render a pure base albedo tile cell (Base Material A + Base Material B via Dual-Noise Blend Map)
 * without autotiling edge overlays, clipped to the specified geometric shape.
 */
export function renderPureAlbedoCell(
  ctx: CanvasRenderingContext2D,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  tileSizePx: number,
  tileType: BiomeTileType,
  onImageLoaded?: () => void,
  shape: TileShape = 'full',
  fullness: number = 1.0
) {
  // Nearest neighbor pixel art smoothing
  ctx.imageSmoothingEnabled = false;

  const isClipped = shape !== 'full' || fullness < 1.0;
  if (isClipped) {
    ctx.save();
    buildTileShapePath(ctx, screenX, screenY, tileSizePx, shape, fullness);
    ctx.clip();
  }

  const pixelStep = 4; // 4px micro-blocks for smooth noise blending performance

  // Check if uploaded custom base textures exist
  const imgA = getCachedImage(tileType.baseMaterialA.albedoTextureUrl, onImageLoaded);
  const imgB = getCachedImage(tileType.baseMaterialBTextureUrl, onImageLoaded);
  const heightImg = getCachedImage(tileType.heightMapTextureUrl, onImageLoaded);
  const roughnessImg = getCachedImage(tileType.roughnessMapTextureUrl, onImageLoaded);
  const surfaceOverlayImg = getCachedImage((tileType as any).overlayTextureUrl || (tileType as any).surfaceOverlayUrl, onImageLoaded);

  const fallbackColorA = tileType.baseMaterialA.albedoColor || tileType.mapColor || '#334155';
  const fallbackColorB = tileType.baseMaterialBAlbedoColor || '#64748b';

  // 1. Render World-Aligned Base Material A across the entire tile
  ctx.save();
  if (imgA) {
    drawWorldAlignedTexture(ctx, imgA, tileX, tileY, screenX, screenY, tileSizePx);
  } else {
    ctx.fillStyle = fallbackColorA;
    ctx.fillRect(screenX, screenY, tileSizePx, tileSizePx);
  }

  // 1a. Alpha-blend Base Material B over Material A using Dual-Noise Map
  const hasMaterialB = !!imgB || !!tileType.baseMaterialBTextureUrl || !!tileType.baseMaterialBAlbedoColor;

  if (hasMaterialB) {
    for (let py = 0; py < tileSizePx; py += pixelStep) {
      for (let px = 0; px < tileSizePx; px += pixelStep) {
        const worldPixelX = tileX * tileSizePx + px;
        const worldPixelY = tileY * tileSizePx + py;

        const blendWeightB = evaluateDualNoiseBlend(worldPixelX, worldPixelY, tileType.blendMap);

        if (blendWeightB > 0.001) {
          ctx.globalAlpha = blendWeightB;
          if (imgB) {
            drawWrappedImageBlock(ctx, imgB, worldPixelX, worldPixelY, pixelStep, screenX + px, screenY + py);
          } else {
            ctx.fillStyle = fallbackColorB;
            ctx.fillRect(screenX + px, screenY + py, pixelStep, pixelStep);
          }
        }
      }
    }
  }
  ctx.restore();

  // 1b. Render full surface tile overlay if uploaded
  if (surfaceOverlayImg) {
    ctx.save();
    ctx.drawImage(surfaceOverlayImg, 0, 0, surfaceOverlayImg.width, surfaceOverlayImg.height, screenX, screenY, tileSizePx, tileSizePx);
    ctx.restore();
  }

  // 2. Heightmap and Roughness Shading (World-Aligned Repeating matching Albedo Map)
  if (heightImg) {
    ctx.save();
    ctx.globalAlpha = tileType.baseMaterialA.heightMapScale * 0.25;
    drawWorldAlignedTexture(ctx, heightImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else {
    const heightFactor = tileType.baseMaterialA.heightMapScale;
    if (heightFactor > 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(screenX, screenY, tileSizePx, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(screenX, screenY + tileSizePx - 2, tileSizePx, 2);
    }
  }

  if (roughnessImg) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    drawWorldAlignedTexture(ctx, roughnessImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else if (tileType.baseMaterialA.roughness < 0.4) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(screenX, screenY, tileSizePx, tileSizePx * 0.25);
  }

  if (isClipped) {
    ctx.restore();
  }
}

/**
 * Helper to render sloped diagonal trim fringes along ramp hypotenuse
 */
export function drawSlopedEdgeTrim(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSizePx: number,
  shape: TileShape,
  tileType: BiomeTileType,
  fullness: number = 1.0
) {
  const details = tileType.tileDetails.top;
  if (!details.enabled) return;

  const f = Math.max(0.05, Math.min(1.0, fullness));
  const topYOffset = tileSizePx * (1.0 - f);
  const color = details.color || 'rgba(255, 255, 255, 0.35)';
  const thickness = details.thicknessPx || 4;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();

  if (shape === 'slope_up_right_45') {
    // Diag: (0, S) to (S, topYOffset)
    ctx.moveTo(screenX, screenY + tileSizePx);
    ctx.lineTo(screenX + tileSizePx, screenY + topYOffset);
    ctx.stroke();

    if (details.noiseEdge || tileType.isSoft) {
      // Soft sand grains / grass tufts along slope
      ctx.fillStyle = color;
      ctx.fillRect(screenX + tileSizePx * 0.25 - 2, screenY + tileSizePx * 0.75 - 3, 4, 3);
      ctx.fillRect(screenX + tileSizePx * 0.55 - 2, screenY + tileSizePx * 0.45 - 4, 5, 4);
      ctx.fillRect(screenX + tileSizePx * 0.85 - 2, screenY + tileSizePx * 0.15 - 3, 4, 3);
    }
  } else if (shape === 'slope_up_left_45') {
    // Diag: (S, S) to (0, topYOffset)
    ctx.moveTo(screenX + tileSizePx, screenY + tileSizePx);
    ctx.lineTo(screenX, screenY + topYOffset);
    ctx.stroke();

    if (details.noiseEdge || tileType.isSoft) {
      ctx.fillStyle = color;
      ctx.fillRect(screenX + tileSizePx * 0.75 - 2, screenY + tileSizePx * 0.75 - 3, 4, 3);
      ctx.fillRect(screenX + tileSizePx * 0.45 - 2, screenY + tileSizePx * 0.45 - 4, 5, 4);
      ctx.fillRect(screenX + tileSizePx * 0.15 - 2, screenY + tileSizePx * 0.15 - 3, 4, 3);
    }
  } else if (shape === 'gentle_up_right_1') {
    const halfRise = (tileSizePx * 0.5) * f;
    ctx.moveTo(screenX, screenY + tileSizePx);
    ctx.lineTo(screenX + tileSizePx, screenY + tileSizePx - halfRise);
    ctx.stroke();
  } else if (shape === 'gentle_up_right_2') {
    const midRise = (tileSizePx * 0.5) * f;
    ctx.moveTo(screenX, screenY + tileSizePx - midRise);
    ctx.lineTo(screenX + tileSizePx, screenY + topYOffset);
    ctx.stroke();
  } else if (shape === 'gentle_up_left_1') {
    const halfRise = (tileSizePx * 0.5) * f;
    ctx.moveTo(screenX + tileSizePx, screenY + tileSizePx);
    ctx.lineTo(screenX, screenY + tileSizePx - halfRise);
    ctx.stroke();
  } else if (shape === 'gentle_up_left_2') {
    const midRise = (tileSizePx * 0.5) * f;
    ctx.moveTo(screenX + tileSizePx, screenY + tileSizePx - midRise);
    ctx.lineTo(screenX, screenY + topYOffset);
    ctx.stroke();
  } else if (shape === 'half_bottom') {
    const slabH = (tileSizePx * 0.5) * f;
    ctx.fillStyle = color;
    ctx.fillRect(screenX, screenY + tileSizePx - slabH, tileSizePx, thickness);
  }

  ctx.restore();
}

/**
 * Render a full tile cell with world-aligned repeating dual base materials,
 * dual-noise blend map, uploaded textures / procedural fallbacks, geometric shape clipping,
 * and composite autotiling edge overlays.
 */
export function renderRefinedTileCell(
  ctx: CanvasRenderingContext2D,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  tileSizePx: number,
  tileType: BiomeTileType,
  neighborMask: AutotileNeighborMask,
  onImageLoaded?: () => void,
  shape: TileShape = 'full',
  fullness: number = 1.0
) {
  // Nearest neighbor pixel art smoothing
  ctx.imageSmoothingEnabled = false;

  const isClipped = shape !== 'full' || fullness < 1.0;
  if (isClipped) {
    ctx.save();
    buildTileShapePath(ctx, screenX, screenY, tileSizePx, shape, fullness);
    ctx.clip();
  }

  const pixelStep = 4; // 4px micro-blocks for smooth noise blending performance

  // Check if uploaded custom base textures exist
  const imgA = getCachedImage(tileType.baseMaterialA.albedoTextureUrl, onImageLoaded);
  const imgB = getCachedImage(tileType.baseMaterialBTextureUrl, onImageLoaded);
  const heightImg = getCachedImage(tileType.heightMapTextureUrl, onImageLoaded);
  const roughnessImg = getCachedImage(tileType.roughnessMapTextureUrl, onImageLoaded);
  const surfaceOverlayImg = getCachedImage((tileType as any).overlayTextureUrl || (tileType as any).surfaceOverlayUrl, onImageLoaded);

  const fallbackColorA = tileType.baseMaterialA.albedoColor || tileType.mapColor || '#334155';
  const fallbackColorB = tileType.baseMaterialBAlbedoColor || '#64748b';

  // 1. Render World-Aligned Base Material A across the entire tile
  ctx.save();
  if (imgA) {
    drawWorldAlignedTexture(ctx, imgA, tileX, tileY, screenX, screenY, tileSizePx);
  } else {
    ctx.fillStyle = fallbackColorA;
    ctx.fillRect(screenX, screenY, tileSizePx, tileSizePx);
  }

  // 1a. Alpha-blend Base Material B over Material A using Dual-Noise Map
  const hasMaterialB = !!imgB || !!tileType.baseMaterialBTextureUrl || !!tileType.baseMaterialBAlbedoColor;

  if (hasMaterialB) {
    for (let py = 0; py < tileSizePx; py += pixelStep) {
      for (let px = 0; px < tileSizePx; px += pixelStep) {
        const worldPixelX = tileX * tileSizePx + px;
        const worldPixelY = tileY * tileSizePx + py;

        const blendWeightB = evaluateDualNoiseBlend(worldPixelX, worldPixelY, tileType.blendMap);

        if (blendWeightB > 0.001) {
          ctx.globalAlpha = blendWeightB;
          if (imgB) {
            drawWrappedImageBlock(ctx, imgB, worldPixelX, worldPixelY, pixelStep, screenX + px, screenY + py);
          } else {
            ctx.fillStyle = fallbackColorB;
            ctx.fillRect(screenX + px, screenY + py, pixelStep, pixelStep);
          }
        }
      }
    }
  }
  ctx.restore();

  // 1b. Render full surface tile overlay if uploaded
  if (surfaceOverlayImg) {
    ctx.save();
    ctx.drawImage(surfaceOverlayImg, 0, 0, surfaceOverlayImg.width, surfaceOverlayImg.height, screenX, screenY, tileSizePx, tileSizePx);
    ctx.restore();
  }

  // 2. Heightmap and Roughness Shading (World-Aligned Repeating matching Albedo Map)
  if (heightImg) {
    ctx.save();
    ctx.globalAlpha = tileType.baseMaterialA.heightMapScale * 0.25;
    drawWorldAlignedTexture(ctx, heightImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else {
    const heightFactor = tileType.baseMaterialA.heightMapScale;
    if (heightFactor > 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(screenX, screenY, tileSizePx, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(screenX, screenY + tileSizePx - 2, tileSizePx, 2);
    }
  }

  if (roughnessImg) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    drawWorldAlignedTexture(ctx, roughnessImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else if (tileType.baseMaterialA.roughness < 0.4) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(screenX, screenY, tileSizePx, tileSizePx * 0.25);
  }

  // 3. Composite Autotiling Overlays (Order: Sides -> Bottom -> Top)
  const details = tileType.tileDetails;

  // 3a. LEFT Edge Overlay
  if (details.leftSide.enabled && !neighborMask.hasLeft && (shape === 'full' || shape === 'half_bottom' || shape === 'half_top' || shape === 'slope_up_left_45')) {
    const leftImg = getCachedImage(details.leftSide.overlayTextureUrl, onImageLoaded);
    const w = details.leftSide.thicknessPx;
    if (leftImg) {
      ctx.drawImage(leftImg, 0, 0, leftImg.width, leftImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.leftSide.color || 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(screenX, screenY, w, tileSizePx);
    }
  }

  // 3b. RIGHT Edge Overlay
  if (details.rightSide.enabled && !neighborMask.hasRight && (shape === 'full' || shape === 'half_bottom' || shape === 'half_top' || shape === 'slope_up_right_45')) {
    const rightImg = getCachedImage(details.rightSide.overlayTextureUrl, onImageLoaded);
    const w = details.rightSide.thicknessPx;
    if (rightImg) {
      ctx.drawImage(rightImg, 0, 0, rightImg.width, rightImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.rightSide.color || 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(screenX + tileSizePx - w, screenY, w, tileSizePx);
    }
  }

  // 3c. BOTTOM Edge Overlay
  if (details.bottom.enabled && !neighborMask.hasBottom && shape !== 'slope_down_left_45' && shape !== 'slope_down_right_45' && shape !== 'half_top') {
    const botImg = getCachedImage(details.bottom.overlayTextureUrl, onImageLoaded);
    const h = details.bottom.thicknessPx;
    if (botImg) {
      ctx.drawImage(botImg, 0, 0, botImg.width, botImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(screenX, screenY + tileSizePx - h, tileSizePx, h);
    }
  }

  // 3d. TOP Edge Overlay (for non-slope blocks)
  if (shape === 'full' && details.top.enabled && !neighborMask.hasTop) {
    const topImg = getCachedImage(details.top.overlayTextureUrl, onImageLoaded);
    const h = details.top.thicknessPx;
    if (topImg) {
      ctx.drawImage(topImg, 0, 0, topImg.width, topImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(screenX, screenY, tileSizePx, h);
      if (details.top.noiseEdge) {
        ctx.fillRect(screenX + 4, screenY + h, 8, 2);
        ctx.fillRect(screenX + 18, screenY + h, 12, 3);
        ctx.fillRect(screenX + 38, screenY + h, 10, 2);
        ctx.fillRect(screenX + 54, screenY + h, 6, 3);
      }
    }
  }

  // If clipped, restore before drawing sloped hypotenuse edge trim
  if (isClipped) {
    ctx.restore();
  }

  // If this is a slope or half slab, draw the custom sloped surface trim along its edge!
  if (shape !== 'full') {
    drawSlopedEdgeTrim(ctx, screenX, screenY, tileSizePx, shape, tileType, fullness);
  }

  // 4. Inner Corner Trims
  if (shape === 'full' && neighborMask.hasTop && neighborMask.hasLeft && neighborMask.hasTopLeft === false && details.top.enabled) {
    ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(screenX, screenY, 6, 6);
  }
  if (shape === 'full' && neighborMask.hasTop && neighborMask.hasRight && neighborMask.hasTopRight === false && details.top.enabled) {
    ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(screenX + tileSizePx - 6, screenY, 6, 6);
  }
  if (shape === 'full' && neighborMask.hasBottom && neighborMask.hasLeft && neighborMask.hasBottomLeft === false && details.bottom.enabled) {
    ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX, screenY + tileSizePx - 6, 6, 6);
  }
  if (shape === 'full' && neighborMask.hasBottom && neighborMask.hasRight && neighborMask.hasBottomRight === false && details.bottom.enabled) {
    ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX + tileSizePx - 6, screenY + tileSizePx - 6, 6, 6);
  }
}
