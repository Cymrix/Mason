import { BiomeTileType, DualNoiseBlendMapConfig } from './refinedBiomeSchema';

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
 * 2D Value Noise function with sinusoidal interpolation
 */
function valueNoise2D(x: number, y: number): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  // Smoothstep interpolation curve
  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fY * fY * (3.0 - 2.0 * fY);

  const hash = (nx: number, ny: number) => {
    const sin = Math.sin(nx * 127.1 + ny * 311.7) * 43758.5453123;
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
 * Fractal Brownian Motion (fBm) for octave-based noise
 */
export function sampleFractalNoise(
  worldX: number,
  worldY: number,
  scale: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  offsetX: number,
  offsetY: number
): number {
  let total = 0;
  let frequency = 1.0 / Math.max(1, scale);
  let amplitude = 1.0;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const nx = (worldX + offsetX) * frequency;
    const ny = (worldY + offsetY) * frequency;
    total += valueNoise2D(nx, ny) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
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
  // Sample primary Noise A
  const nA = sampleFractalNoise(
    worldX,
    worldY,
    config.noiseA.scale,
    config.noiseA.octaves,
    config.noiseA.persistence,
    config.noiseA.lacunarity,
    config.noiseA.offset.x,
    config.noiseA.offset.y
  );

  // Sample secondary Noise B (differing scale/frequency)
  const nB = sampleFractalNoise(
    worldX,
    worldY,
    config.noiseB.scale,
    config.noiseB.octaves,
    config.noiseB.persistence,
    config.noiseB.lacunarity,
    config.noiseB.offset.x,
    config.noiseB.offset.y
  );

  // Weighted combination
  const combined = (nA * config.noiseA.weight + nB * config.noiseB.weight) /
                   Math.max(0.001, config.noiseA.weight + config.noiseB.weight);

  // Shift by threshold & adjust contrast
  let centered = (combined - config.blendThreshold) * config.blendContrast + 0.5;
  centered = Math.max(0, Math.min(1, centered));

  return config.invert ? 1.0 - centered : centered;
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
 * Render a full tile cell with world-aligned repeating dual base materials,
 * dual-noise blend map, uploaded textures / procedural fallbacks, and composite autotiling edge overlays.
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
  onImageLoaded?: () => void
) {
  // Nearest neighbor pixel art smoothing
  ctx.imageSmoothingEnabled = false;

  const pixelStep = 4; // 4px micro-blocks for smooth noise blending performance

  // Check if uploaded custom base textures exist
  const imgA = getCachedImage(tileType.baseMaterialA.albedoTextureUrl, onImageLoaded);
  const imgB = getCachedImage(tileType.baseMaterialBTextureUrl, onImageLoaded);
  const heightImg = getCachedImage(tileType.heightMapTextureUrl, onImageLoaded);
  const roughnessImg = getCachedImage(tileType.roughnessMapTextureUrl, onImageLoaded);
  const surfaceOverlayImg = getCachedImage((tileType as any).overlayTextureUrl || (tileType as any).surfaceOverlayUrl, onImageLoaded);

  const fallbackColorA = tileType.baseMaterialA.albedoColor || tileType.mapColor || '#334155';
  const fallbackColorB = tileType.baseMaterialBAlbedoColor || '#64748b';

  // 1. Render World-Aligned Repeating Base Material Blend (Base A vs Base B)
  if (imgA && imgB) {
    // Draw Base A first with world-aligned texture repeating
    ctx.save();
    drawWorldAlignedTexture(ctx, imgA, tileX, tileY, screenX, screenY, tileSizePx);

    // Alpha mask blend Base B with dual noise
    for (let py = 0; py < tileSizePx; py += pixelStep) {
      for (let px = 0; px < tileSizePx; px += pixelStep) {
        const worldPixelX = tileX * tileSizePx + px;
        const worldPixelY = tileY * tileSizePx + py;
        const blendWeightB = evaluateDualNoiseBlend(worldPixelX, worldPixelY, tileType.blendMap);
        if (blendWeightB > 0.1) {
          ctx.globalAlpha = blendWeightB;
          const sbx = ((worldPixelX % imgB.width) + imgB.width) % imgB.width;
          const sby = ((worldPixelY % imgB.height) + imgB.height) % imgB.height;
          ctx.drawImage(imgB, sbx, sby, pixelStep, pixelStep, screenX + px, screenY + py, pixelStep, pixelStep);
        }
      }
    }
    ctx.restore();
  } else if (imgA) {
    // If only image A is uploaded, draw with world-aligned texture repeating
    ctx.save();
    drawWorldAlignedTexture(ctx, imgA, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else {
    // Procedural Dual-Noise Color Blend
    for (let py = 0; py < tileSizePx; py += pixelStep) {
      for (let px = 0; px < tileSizePx; px += pixelStep) {
        const worldPixelX = tileX * tileSizePx + px;
        const worldPixelY = tileY * tileSizePx + py;

        const blendWeightB = evaluateDualNoiseBlend(worldPixelX, worldPixelY, tileType.blendMap);
        const blendedColor = interpolateHexColor(fallbackColorA, fallbackColorB, blendWeightB);

        ctx.fillStyle = blendedColor;
        ctx.fillRect(screenX + px, screenY + py, pixelStep, pixelStep);
      }
    }
  }

  // 1b. Render full surface tile overlay if uploaded
  if (surfaceOverlayImg) {
    ctx.save();
    ctx.drawImage(surfaceOverlayImg, 0, 0, surfaceOverlayImg.width, surfaceOverlayImg.height, screenX, screenY, tileSizePx, tileSizePx);
    ctx.restore();
  }

  // 2. Heightmap and Roughness Shading (World-Aligned Repeating matching Albedo Map)
  if (heightImg) {
    // Render heightmap overlay matching world-aligned albedo repeating
    ctx.save();
    ctx.globalAlpha = tileType.baseMaterialA.heightMapScale * 0.25;
    drawWorldAlignedTexture(ctx, heightImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else {
    // Procedural height specular relief
    const heightFactor = tileType.baseMaterialA.heightMapScale;
    if (heightFactor > 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(screenX, screenY, tileSizePx, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(screenX, screenY + tileSizePx - 2, tileSizePx, 2);
    }
  }

  if (roughnessImg) {
    // Render roughness map overlay matching world-aligned albedo repeating
    ctx.save();
    ctx.globalAlpha = 0.15;
    drawWorldAlignedTexture(ctx, roughnessImg, tileX, tileY, screenX, screenY, tileSizePx);
    ctx.restore();
  } else if (tileType.baseMaterialA.roughness < 0.4) {
    // Glassy / polished sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(screenX, screenY, tileSizePx, tileSizePx * 0.25);
  }

  // 3. Composite Autotiling Overlays (Order: Sides -> Bottom -> Top)
  // Ensures top overlay renders over sides, and bottom overlay renders over sides but under top.
  const details = tileType.tileDetails;

  // 3a. LEFT Edge Overlay
  if (details.leftSide.enabled && !neighborMask.hasLeft) {
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
  if (details.rightSide.enabled && !neighborMask.hasRight) {
    const rightImg = getCachedImage(details.rightSide.overlayTextureUrl, onImageLoaded);
    const w = details.rightSide.thicknessPx;
    if (rightImg) {
      ctx.drawImage(rightImg, 0, 0, rightImg.width, rightImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.rightSide.color || 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(screenX + tileSizePx - w, screenY, w, tileSizePx);
    }
  }

  // 3c. BOTTOM Edge Overlay (shows over sides, but under top)
  if (details.bottom.enabled && !neighborMask.hasBottom) {
    const botImg = getCachedImage(details.bottom.overlayTextureUrl, onImageLoaded);
    const h = details.bottom.thicknessPx;
    if (botImg) {
      ctx.drawImage(botImg, 0, 0, botImg.width, botImg.height, screenX, screenY, tileSizePx, tileSizePx);
    } else {
      ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(screenX, screenY + tileSizePx - h, tileSizePx, h);
    }
  }

  // 3d. TOP Edge Overlay (shows over sides AND over bottom)
  if (details.top.enabled && !neighborMask.hasTop) {
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

  // 4. Inner Corner Trims (if orthos are present but diagonal is missing)
  if (neighborMask.hasTop && neighborMask.hasLeft && neighborMask.hasTopLeft === false && details.top.enabled) {
    // Top-Left inner corner notch
    ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(screenX, screenY, 6, 6);
  }
  if (neighborMask.hasTop && neighborMask.hasRight && neighborMask.hasTopRight === false && details.top.enabled) {
    // Top-Right inner corner notch
    ctx.fillStyle = details.top.color || 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(screenX + tileSizePx - 6, screenY, 6, 6);
  }
  if (neighborMask.hasBottom && neighborMask.hasLeft && neighborMask.hasBottomLeft === false && details.bottom.enabled) {
    // Bottom-Left inner corner notch
    ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX, screenY + tileSizePx - 6, 6, 6);
  }
  if (neighborMask.hasBottom && neighborMask.hasRight && neighborMask.hasBottomRight === false && details.bottom.enabled) {
    // Bottom-Right inner corner notch
    ctx.fillStyle = details.bottom.color || 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX + tileSizePx - 6, screenY + tileSizePx - 6, 6, 6);
  }
}
