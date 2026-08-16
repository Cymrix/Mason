import { BiomeTileType, DualNoiseBlendMapConfig } from './refinedBiomeSchema';
import { TileShape, buildTileShapePath, TILE_SHAPE_DEFINITIONS } from './tileShape';

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

  // Micro-step adapts to resolution (1px for 16px tiles for razor-sharp pixel art)
  const pixelStep = tileSizePx <= 24 ? 1 : (tileSizePx <= 48 ? 2 : 4);

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
 * Helper to render sloped diagonal and trimmed edge fringes along shape boundaries
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
  // Try to use the dedicated slope overlay; if missing/disabled, fallback to the top overlay
  const slopeDetails = (tileType.tileDetails as any).slope;
  const details = (slopeDetails && (slopeDetails.overlayTextureUrl || slopeDetails.color)) ? slopeDetails : tileType.tileDetails.top;
    
  if (!details || (!details.overlayTextureUrl && !details.color)) return;

  const def = TILE_SHAPE_DEFINITIONS[shape];
  if (!def || !def.trimEdge) return;

  const f = Math.max(0.05, Math.min(1.0, fullness));
  const color = details.color || 'rgba(255, 255, 255, 0.35)';
  const thickness = details.thicknessPx || 4;

  const [nx0, ny0, nx1, ny1] = def.trimEdge;
  const isCeil = shape.includes('top') || shape.includes('ceil') || shape.includes('down');

  // Compute scaled Y positions based on fullness
  let py0 = ny0;
  let py1 = ny1;
  if (f < 0.999) {
    if (isCeil) {
      py0 = ny0 * f;
      py1 = ny1 * f;
    } else {
      py0 = 1.0 - (1.0 - ny0) * f;
      py1 = 1.0 - (1.0 - ny1) * f;
    }
  }

  const startX = screenX + nx0 * tileSizePx;
  const startY = screenY + py0 * tileSizePx;
  const endX = screenX + nx1 * tileSizePx;
  const endY = screenY + py1 * tileSizePx;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Noise tufts / sand grains along the trim line
  if (details.noiseEdge || tileType.materialType === 'soft') {
    ctx.fillStyle = color;
    const steps = 4;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tx = startX + (endX - startX) * t;
      const ty = startY + (endY - startY) * t;
      ctx.fillRect(tx - 2, ty - 2, 4, 3);
    }
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

  // Micro-step adapts to resolution (1px for 16px tiles for razor-sharp pixel art)
  const pixelStep = tileSizePx <= 24 ? 1 : (tileSizePx <= 48 ? 2 : 4);

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
  const scaleRatio = tileSizePx / 64;

  // 3a. LEFT Edge Overlay
  if ((details.leftSide.overlayTextureUrl || details.leftSide.color) && !neighborMask.hasLeft && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_down_left_45')) {
    const leftImg = getCachedImage(details.leftSide.overlayTextureUrl, onImageLoaded);
    const w = Math.max(1, Math.round(details.leftSide.thicknessPx * scaleRatio));
    if (leftImg) {
      ctx.drawImage(leftImg, 0, 0, leftImg.width, leftImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.leftSide.color || 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(screenX, screenY, w, tileSizePx);
    }
  }

  // 3b. RIGHT Edge Overlay
  if ((details.rightSide.overlayTextureUrl || details.rightSide.color) && !neighborMask.hasRight && (shape === 'full' || shape === 'slope_up_right_45' || shape === 'slope_down_right_45')) {
    const rightImg = getCachedImage(details.rightSide.overlayTextureUrl, onImageLoaded);
    const w = Math.max(1, Math.round(details.rightSide.thicknessPx * scaleRatio));
    if (rightImg) {
      ctx.drawImage(rightImg, 0, 0, rightImg.width, rightImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.rightSide.color || 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(screenX + tileSizePx - w, screenY, w, tileSizePx);
    }
  }

  // 3c. BOTTOM Edge Overlay
  if ((details.bottom.overlayTextureUrl || details.bottom.color) && !neighborMask.hasBottom && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_up_right_45')) {
    const botImg = getCachedImage(details.bottom.overlayTextureUrl, onImageLoaded);
    const h = Math.max(1, Math.round(details.bottom.thicknessPx * scaleRatio));
    if (botImg) {
      ctx.drawImage(botImg, 0, 0, botImg.width, botImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(screenX, screenY + tileSizePx - h, tileSizePx, h);
    }
  }

  // 3d. TOP Edge Overlay (for non-slope blocks)
  if ((shape === 'full' || shape === 'slope_down_left_45' || shape === 'slope_down_right_45') && (details.top.overlayTextureUrl || details.top.color) && !neighborMask.hasTop) {
    const topImg = getCachedImage(details.top.overlayTextureUrl, onImageLoaded);
    const h = Math.max(1, Math.round(details.top.thicknessPx * scaleRatio));
    if (topImg) {
      ctx.drawImage(topImg, 0, 0, topImg.width, topImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(screenX, screenY, tileSizePx, h);
      if (details.top.noiseEdge) {
        const p1 = Math.max(1, Math.round(2 * scaleRatio));
        const p2 = Math.max(1, Math.round(3 * scaleRatio));
        ctx.fillRect(screenX + Math.round(4 * scaleRatio), screenY + h, Math.round(8 * scaleRatio), p1);
        ctx.fillRect(screenX + Math.round(18 * scaleRatio), screenY + h, Math.round(12 * scaleRatio), p2);
        ctx.fillRect(screenX + Math.round(38 * scaleRatio), screenY + h, Math.round(10 * scaleRatio), p1);
        ctx.fillRect(screenX + Math.round(54 * scaleRatio), screenY + h, Math.round(6 * scaleRatio), p2);
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
  const innerDetails = (tileType.tileDetails as any).innerCorner;
  
  if (shape === 'full') {
    const drawInnerCorner = (cx: number, cy: number, w: number, h: number, defaultColor: string, rotationDeg: number) => {
      // First try to use the dedicated inner corner overlay image
      if (innerDetails && (innerDetails.overlayTextureUrl || innerDetails.color)) {
        const icImg = getCachedImage(innerDetails.overlayTextureUrl, onImageLoaded);
        if (icImg) {
          ctx.save();
          ctx.translate(screenX + tileSizePx / 2, screenY + tileSizePx / 2);
          ctx.rotate((rotationDeg * Math.PI) / 180);
          ctx.drawImage(icImg, 0, 0, icImg.width, icImg.height, -tileSizePx / 2, -tileSizePx / 2, tileSizePx, tileSizePx);
          ctx.restore();
          return;
        }
      }
      // Fallback to a simple colored notch box
      ctx.fillStyle = (innerDetails && innerDetails.color) || defaultColor;
      ctx.fillRect(cx, cy, w, h);
    };

    const notch = Math.max(1, Math.round(6 * scaleRatio));
    if (neighborMask.hasTop && neighborMask.hasLeft && neighborMask.hasTopLeft === false && (details.top.overlayTextureUrl || details.top.color)) {
      // Top-Left inner corner (0 degrees rotation assumed for the source image)
      drawInnerCorner(screenX, screenY, notch, notch, details.top.color || 'rgba(255, 255, 255, 0.25)', 0);
    }
    if (neighborMask.hasTop && neighborMask.hasRight && neighborMask.hasTopRight === false && (details.top.overlayTextureUrl || details.top.color)) {
      // Top-Right inner corner (90 degrees)
      drawInnerCorner(screenX + tileSizePx - notch, screenY, notch, notch, details.top.color || 'rgba(255, 255, 255, 0.25)', 90);
    }
    if (neighborMask.hasBottom && neighborMask.hasLeft && neighborMask.hasBottomLeft === false && (details.bottom.overlayTextureUrl || details.bottom.color)) {
      // Bottom-Left inner corner (270 degrees)
      drawInnerCorner(screenX, screenY + tileSizePx - notch, notch, notch, details.bottom.color || 'rgba(0, 0, 0, 0.3)', 270);
    }
    if (neighborMask.hasBottom && neighborMask.hasRight && neighborMask.hasBottomRight === false && (details.bottom.overlayTextureUrl || details.bottom.color)) {
      // Bottom-Right inner corner (180 degrees)
      drawInnerCorner(screenX + tileSizePx - notch, screenY + tileSizePx - notch, notch, notch, details.bottom.color || 'rgba(0, 0, 0, 0.3)', 180);
    }
  }
}
