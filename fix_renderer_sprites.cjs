const fs = require('fs');

let file = fs.readFileSync('src/engine/tileMaterialRenderer.ts', 'utf8');

// 1. Add drawRandomSpriteFromGrid helper
const helperCode = `
/**
 * Draws a deterministic frame from a 16px-grid spritesheet overlay.
 */
function drawRandomSpriteFromGrid(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  tileX: number,
  tileY: number
) {
  const GRID_SIZE = 16;
  const cols = Math.max(1, Math.floor(img.width / GRID_SIZE));
  const rows = Math.max(1, Math.floor(img.height / GRID_SIZE));
  const totalFrames = cols * rows;

  const hash = Math.abs(Math.imul(Math.floor(tileX), 73856093) ^ Math.imul(Math.floor(tileY), 19349663));
  const frameIndex = hash % totalFrames;

  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  const sx = col * GRID_SIZE;
  const sy = row * GRID_SIZE;
  
  const drawW = Math.min(GRID_SIZE, img.width - sx);
  const drawH = Math.min(GRID_SIZE, img.height - sy);

  ctx.drawImage(img, sx, sy, drawW, drawH, x, y, w, h);
}
`;

if (!file.includes('drawRandomSpriteFromGrid')) {
  file = file.replace(/function seededValueNoise2D/, helperCode + '\nfunction seededValueNoise2D');
}

// 2. Fix drawSlopedEdgeTrim definition
file = file.replace(
  /export function drawSlopedEdgeTrim\([\s\S]*?fullness: number = 1\.0\n\) \{/,
  `export function drawSlopedEdgeTrim(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSizePx: number,
  shape: TileShape,
  tileType: RefinedBiomeTileType,
  tileX: number,
  tileY: number,
  fullness: number = 1.0
) {`
);

// 3. Fix drawSlopedEdgeTrim usage inside renderRefinedTileCell
file = file.replace(
  /drawSlopedEdgeTrim\(ctx, screenX, screenY, tileSizePx, shape, tileType, fullness\);/g,
  `drawSlopedEdgeTrim(ctx, screenX, screenY, tileSizePx, shape, tileType, tileX, tileY, fullness);`
);

// 4. Update the logic inside drawSlopedEdgeTrim to remove fallbacks and use spritesheets
const oldSlopeRegex = /const details = \(slopeDetails && \(slopeDetails\.overlayTextureUrl \|\| slopeDetails\.color\)\) \? slopeDetails : tileType\.tileDetails\.top;\s*if \(!details \|\| \(!details\.overlayTextureUrl && !details\.color\)\) return;\s*const def = TILE_SHAPE_DEFINITIONS\[shape\];\s*if \(!def \|\| !def\.trimEdge\) return;\s*const img = getCachedImage\(details\.overlayTextureUrl, \(\) => \{\}\);\s*if \(img\) \{\s*ctx\.save\(\);\s*ctx\.beginPath\(\);\s*ctx\.moveTo\(screenX \+ def\.trimEdge\.start\[0\] \* tileSizePx, screenY \+ def\.trimEdge\.start\[1\] \* tileSizePx\);\s*ctx\.lineTo\(screenX \+ def\.trimEdge\.end\[0\] \* tileSizePx, screenY \+ def\.trimEdge\.end\[1\] \* tileSizePx\);\s*ctx\.lineTo\(screenX \+ def\.trimEdge\.control\[0\] \* tileSizePx, screenY \+ def\.trimEdge\.control\[1\] \* tileSizePx\);\s*ctx\.closePath\(\);\s*ctx\.clip\(\);\s*ctx\.drawImage\(img, 0, 0, img\.width, img\.height, screenX, screenY, tileSizePx, tileSizePx\);\s*ctx\.restore\(\);\s*\} else \{\s*ctx\.beginPath\(\);\s*ctx\.moveTo\(screenX \+ def\.trimEdge\.start\[0\] \* tileSizePx, screenY \+ def\.trimEdge\.start\[1\] \* tileSizePx\);\s*ctx\.lineTo\(screenX \+ def\.trimEdge\.end\[0\] \* tileSizePx, screenY \+ def\.trimEdge\.end\[1\] \* tileSizePx\);\s*ctx\.strokeStyle = details\.color \|\| 'rgba\(255, 255, 255, 0\.35\)';\s*ctx\.lineWidth = Math\.max\(1, Math\.round\(details\.thicknessPx \* \(tileSizePx \/ 16\)\)\);\s*ctx\.stroke\(\);\s*\}/;

const newSlopeLogic = `const details = slopeDetails?.overlayTextureUrl ? slopeDetails : tileType.tileDetails.top;
  if (!details || !details.overlayTextureUrl) return;

  const def = TILE_SHAPE_DEFINITIONS[shape];
  if (!def || !def.trimEdge) return;

  const img = getCachedImage(details.overlayTextureUrl, () => {});
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(screenX + def.trimEdge.start[0] * tileSizePx, screenY + def.trimEdge.start[1] * tileSizePx);
    ctx.lineTo(screenX + def.trimEdge.end[0] * tileSizePx, screenY + def.trimEdge.end[1] * tileSizePx);
    ctx.lineTo(screenX + def.trimEdge.control[0] * tileSizePx, screenY + def.trimEdge.control[1] * tileSizePx);
    ctx.closePath();
    ctx.clip();
    
    drawRandomSpriteFromGrid(ctx, img, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    ctx.restore();
  }`;

file = file.replace(oldSlopeRegex, newSlopeLogic);

// 5. Replace Left, Right, Bottom, Top edge overlays in renderRefinedTileCell
// LEFT
const leftRegex = /\/\/ 3a\. LEFT Edge Overlay[\s\S]*?(?=\/\/ 3b\. RIGHT)/;
const leftNew = `// 3a. LEFT Edge Overlay
  if (details.leftSide.overlayTextureUrl && !neighborMask.hasLeft && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_down_left_45')) {
    const leftImg = getCachedImage(details.leftSide.overlayTextureUrl, onImageLoaded);
    if (leftImg) {
      drawRandomSpriteFromGrid(ctx, leftImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  `;
file = file.replace(leftRegex, leftNew);

// RIGHT
const rightRegex = /\/\/ 3b\. RIGHT Edge Overlay[\s\S]*?(?=\/\/ 3c\. BOTTOM)/;
const rightNew = `// 3b. RIGHT Edge Overlay
  if (details.rightSide.overlayTextureUrl && !neighborMask.hasRight && (shape === 'full' || shape === 'slope_up_right_45' || shape === 'slope_down_right_45')) {
    const rightImg = getCachedImage(details.rightSide.overlayTextureUrl, onImageLoaded);
    if (rightImg) {
      drawRandomSpriteFromGrid(ctx, rightImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  `;
file = file.replace(rightRegex, rightNew);

// BOTTOM
const botRegex = /\/\/ 3c\. BOTTOM Edge Overlay[\s\S]*?(?=\/\/ 3d\. TOP)/;
const botNew = `// 3c. BOTTOM Edge Overlay
  if (details.bottom.overlayTextureUrl && !neighborMask.hasBottom && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_up_right_45')) {
    const botImg = getCachedImage(details.bottom.overlayTextureUrl, onImageLoaded);
    if (botImg) {
      drawRandomSpriteFromGrid(ctx, botImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  `;
file = file.replace(botRegex, botNew);

// TOP
const topRegex = /\/\/ 3d\. TOP Edge Overlay \(for non-slope blocks\)[\s\S]*?(?=\/\/ If clipped, restore)/;
const topNew = `// 3d. TOP Edge Overlay (for non-slope blocks)
  if ((shape === 'full' || shape === 'slope_down_left_45' || shape === 'slope_down_right_45') && details.top.overlayTextureUrl && !neighborMask.hasTop) {
    const topImg = getCachedImage(details.top.overlayTextureUrl, onImageLoaded);
    if (topImg) {
      drawRandomSpriteFromGrid(ctx, topImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  `;
file = file.replace(topRegex, topNew);


// 6. Inner Corners
const innerRegex = /const drawInnerCorner = \([\s\S]*?rotationDeg: number\) => \{[\s\S]*?ctx\.fillRect.*?\n\s*\};/;
const innerNew = `const drawInnerCorner = (rotationDeg: number) => {
      if (innerDetails && innerDetails.overlayTextureUrl) {
        const icImg = getCachedImage(innerDetails.overlayTextureUrl, onImageLoaded);
        if (icImg) {
          ctx.save();
          ctx.translate(screenX + tileSizePx / 2, screenY + tileSizePx / 2);
          ctx.rotate((rotationDeg * Math.PI) / 180);
          drawRandomSpriteFromGrid(ctx, icImg, -tileSizePx / 2, -tileSizePx / 2, tileSizePx, tileSizePx, tileX, tileY);
          ctx.restore();
        }
      }
    };`;
file = file.replace(innerRegex, innerNew);

// Replace inner corner usages
file = file.replace(/drawInnerCorner\(screenX, screenY, notch, notch, .*?, 0\);/g, 'drawInnerCorner(0);');
file = file.replace(/drawInnerCorner\(screenX \+ tileSizePx - notch, screenY, notch, notch, .*?, 90\);/g, 'drawInnerCorner(90);');
file = file.replace(/drawInnerCorner\(screenX, screenY \+ tileSizePx - notch, notch, notch, .*?, 270\);/g, 'drawInnerCorner(270);');
file = file.replace(/drawInnerCorner\(screenX \+ tileSizePx - notch, screenY \+ tileSizePx - notch, notch, notch, .*?, 180\);/g, 'drawInnerCorner(180);');


fs.writeFileSync('src/engine/tileMaterialRenderer.ts', file);
