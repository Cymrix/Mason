import { ParallaxLayerConfig, ParallaxLayerIndex, RefinedBiome } from './refinedBiomeSchema';

// Image cache for user-uploaded custom parallax layer textures
const imageCache = new Map<string, HTMLImageElement>();

export function getOrLoadParallaxImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  if (imageCache.has(url)) {
    const img = imageCache.get(url)!;
    return img.complete ? img : null;
  }
  const img = new Image();
  img.src = url;
  img.onload = () => {
    imageCache.set(url, img);
  };
  imageCache.set(url, img);
  return null;
}

/**
 * Render a procedural or custom Parallax Background Layer
 */
export function renderParallaxLayer(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  viewportWidth: number,
  viewportHeight: number,
  cameraPanX: number,
  cameraPanY: number,
  scale: number,
  biome: RefinedBiome
) {
  if (layer.opacity <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  // Calculate parallax offset based on camera pan and layer speed factors
  const offsetX = cameraPanX * layer.speedFactorX;
  const offsetY = cameraPanY * layer.speedFactorY + (layer.offsetY || 0);

  // If custom image exists and is loaded
  if (layer.textureUrl) {
    const img = getOrLoadParallaxImage(layer.textureUrl);
    if (img && img.naturalWidth > 0) {
      renderImageLayer(ctx, img, layer, viewportWidth, viewportHeight, offsetX, offsetY, scale);
      ctx.restore();
      return;
    }
  }

  // Otherwise render procedural theme
  switch (layer.proceduralTheme) {
    case 'celestial_sky':
      renderSkyLayer(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    case 'distant_mountain_range':
      renderMountainRange(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    case 'ruined_megastructures':
      renderMegastructures(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    case 'cavern_pillars':
      renderCavernPillars(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    case 'interior_masonry_backwall':
      renderBackwall(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    case 'foreground_overgrowth':
      renderForeground(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
      break;
    default:
      renderSkyLayer(ctx, layer, viewportWidth, viewportHeight, offsetX, offsetY, biome);
  }

  ctx.restore();
}

/**
 * -5 Layer: Celestial Sky / Deep Horizon
 */
function renderSkyLayer(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  biome: RefinedBiome
) {
  const topColor = layer.gradientTop || biome.ambientBackgroundColor || '#090a0f';
  const bottomColor = layer.gradientBottom || layer.tintColor || '#1f1a24';

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle celestial body (moon/sun/nebula)
  const moonX = ((width * 0.7 + offsetX * 0.3) % (width + 200)) - 100;
  const moonY = Math.max(40, height * 0.2 + offsetY * 0.1);

  const radGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 120);
  radGrad.addColorStop(0, `${layer.tintColor}44`);
  radGrad.addColorStop(0.5, `${layer.tintColor}11`);
  radGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
  ctx.fill();

  // Subtle celestial ring / orb
  ctx.fillStyle = `${layer.tintColor}33`;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
  ctx.fill();

  // Distant stars / spore embers
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  const starCount = 35;
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 137.5 + offsetX * 0.2) % width + width) % width;
    const sy = ((i * 93.1 + i * 27) % (height * 0.6));
    const size = (i % 3 === 0) ? 1.5 : 1;
    ctx.fillRect(sx, sy, size, size);
  }
}

/**
 * -4 Layer: Far Skyline & Distant Mountain Ranges
 */
function renderMountainRange(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  biome: RefinedBiome
) {
  ctx.fillStyle = layer.tintColor || biome.regionColor || '#2c2230';

  const baseline = height * 0.65 + offsetY * 0.3;
  const peakWidth = 140;
  const totalPeaks = Math.ceil(width / peakWidth) + 3;
  const startX = (offsetX % peakWidth) - peakWidth;

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, baseline);

  for (let i = 0; i < totalPeaks; i++) {
    const x = startX + i * peakWidth;
    const peakHeight = ((i * 73) % 90) + 70;
    const midX = x + peakWidth * 0.5;
    ctx.lineTo(midX, baseline - peakHeight);
    ctx.lineTo(x + peakWidth, baseline);
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Highlight ridge line
  ctx.strokeStyle = `${layer.tintColor}88`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * -3 Layer: Midground Megastructures / Colossal Ruins / Titan Trees
 */
function renderMegastructures(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  _biome: RefinedBiome
) {
  ctx.fillStyle = layer.tintColor || '#382635';

  const baseline = height * 0.75 + offsetY * 0.5;
  const structSpacing = 220;
  const totalStructs = Math.ceil(width / structSpacing) + 3;
  const startX = (offsetX % structSpacing) - structSpacing;

  for (let i = 0; i < totalStructs; i++) {
    const x = startX + i * structSpacing;
    const structType = i % 3;

    if (structType === 0) {
      // Colossal Ruin Tower / Monolith
      const h = 180 + (i % 5) * 20;
      const w = 45;
      ctx.fillRect(x, baseline - h, w, h + 100);

      // Arch connector
      ctx.beginPath();
      ctx.arc(x + w + 30, baseline - h + 40, 30, Math.PI, 0);
      ctx.lineWidth = 14;
      ctx.strokeStyle = layer.tintColor;
      ctx.stroke();
    } else if (structType === 1) {
      // Giant Tree / Fungal Spire
      const h = 150;
      ctx.fillRect(x + 20, baseline - h, 28, h + 100);
      ctx.beginPath();
      ctx.arc(x + 34, baseline - h, 50, Math.PI, 0);
      ctx.fill();
    } else {
      // Ancient Broken Aqueduct / Buttress
      const h = 120;
      ctx.fillRect(x, baseline - h, 70, 24);
      ctx.fillRect(x + 10, baseline - h + 24, 18, h - 24 + 100);
      ctx.fillRect(x + 42, baseline - h + 24, 18, h - 24 + 100);
    }
  }
}

/**
 * -2 Layer: Nearer Cavern Spikes / Arches / Dungeon Pillars
 */
function renderCavernPillars(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  _biome: RefinedBiome
) {
  ctx.fillStyle = layer.tintColor || '#452c3c';

  const pillarSpacing = 160;
  const total = Math.ceil(width / pillarSpacing) + 3;
  const startX = (offsetX % pillarSpacing) - pillarSpacing;

  for (let i = 0; i < total; i++) {
    const x = startX + i * pillarSpacing;

    // Hanging stalactite from ceiling
    const topH = 70 + ((i * 47) % 60);
    ctx.beginPath();
    ctx.moveTo(x - 20, 0);
    ctx.lineTo(x + 20, 0);
    ctx.lineTo(x, topH);
    ctx.closePath();
    ctx.fill();

    // Rising pillar / stalagmite from bottom
    const botH = 90 + ((i * 83) % 80);
    const botY = height * 0.82 + offsetY * 0.7;
    ctx.beginPath();
    ctx.moveTo(x + 30, botY + 100);
    ctx.lineTo(x + 70, botY + 100);
    ctx.lineTo(x + 50, botY - botH);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * -1 Layer: Immediate Masonry / Brick / Wall Backdrop
 */
function renderBackwall(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  _biome: RefinedBiome
) {
  ctx.fillStyle = layer.tintColor || '#1e1b24';
  ctx.fillRect(0, 0, width, height);

  // Brick / stone tile seams
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1.5;

  const brickW = 64;
  const brickH = 32;
  const startX = (offsetX % (brickW * 2)) - brickW * 2;
  const startY = (offsetY % brickH) - brickH;

  ctx.beginPath();
  for (let y = startY; y <= height + brickH; y += brickH) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);

    const rowIdx = Math.floor(y / brickH);
    const rowOffset = (rowIdx % 2 === 0) ? 0 : brickW / 2;

    for (let x = startX + rowOffset; x <= width + brickW; x += brickW) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickH);
    }
  }
  ctx.stroke();

  // Ambient vertical support beams
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  const beamSpacing = 192;
  const beamStartX = (offsetX % beamSpacing) - beamSpacing;
  for (let x = beamStartX; x <= width + beamSpacing; x += beamSpacing) {
    ctx.fillRect(x, 0, 16, height);
  }
}

/**
 * +1 Layer: Foreground Foliage / Overgrowth / Chains / Snow Passing Camera
 */
function renderForeground(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  _biome: RefinedBiome
) {
  ctx.fillStyle = layer.tintColor || '#f97316';

  const spacing = 180;
  const total = Math.ceil(width / spacing) + 3;
  const startX = (offsetX % spacing) - spacing;

  for (let i = 0; i < total; i++) {
    const x = startX + i * spacing;

    // Hanging foreground vines / chains
    const vineLength = 110 + ((i * 39) % 70);
    ctx.lineWidth = 6;
    ctx.strokeStyle = layer.tintColor;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 15, vineLength * 0.4, x - 15, vineLength * 0.7, x + 5, vineLength);
    ctx.stroke();

    // Leaf / bulb at the tip
    ctx.beginPath();
    ctx.arc(x + 5, vineLength + 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Floating foreground ambient motes / spores
    const moteX = ((x * 1.7 + offsetX * 1.5) % width + width) % width;
    const moteY = (i * 97 + offsetY * 1.2) % height;
    ctx.beginPath();
    ctx.arc(moteX, moteY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Custom uploaded image pattern/tiling
 */
function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  layer: ParallaxLayerConfig,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  _scale: number
) {
  const imgW = img.naturalWidth * (layer.scale || 1.0);
  const imgH = img.naturalHeight * (layer.scale || 1.0);
  if (imgW <= 0 || imgH <= 0) return;

  if (layer.repeatX) {
    const startX = (offsetX % imgW) - imgW;
    const endX = width + imgW;
    const yPos = layer.repeatY ? (offsetY % imgH) - imgH : offsetY;

    for (let x = startX; x < endX; x += imgW) {
      if (layer.repeatY) {
        for (let y = yPos; y < height + imgH; y += imgH) {
          ctx.drawImage(img, x, y, imgW, imgH);
        }
      } else {
        ctx.drawImage(img, x, yPos, imgW, imgH);
      }
    }
  } else {
    ctx.drawImage(img, offsetX, offsetY, imgW, imgH);
  }
}
