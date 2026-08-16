const fs = require('fs');

let file = fs.readFileSync('src/engine/tileMaterialRenderer.ts', 'utf8');

// Find the start of drawSlopedEdgeTrim and the end
const startIdx = file.indexOf('export function drawSlopedEdgeTrim');
// Find the next export function after that to bound it
const endIdx = file.indexOf('export function renderRefinedTileCell', startIdx);

const newFunction = `export function drawSlopedEdgeTrim(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSizePx: number,
  shape: TileShape,
  tileType: BiomeTileType,
  tileX: number,
  tileY: number,
  fullness: number = 1.0
) {
  const slopeDetails = (tileType.tileDetails as any).slope;
  const details = slopeDetails?.overlayTextureUrl ? slopeDetails : tileType.tileDetails.top;
  
  if (!details || !details.overlayTextureUrl) return;

  const def = TILE_SHAPE_DEFINITIONS[shape];
  if (!def || !def.trimEdge) return;

  const img = getCachedImage(details.overlayTextureUrl);
  if (!img) return;

  ctx.save();
  ctx.translate(screenX + tileSizePx / 2, screenY + tileSizePx / 2);

  // Rotate slope based on its shape so the user only has to upload one 45-degree Up-Right slope (◢)
  // ◢ slope_up_right_45 (0 deg)
  // ◣ slope_up_left_45 (270 deg / -90 deg)
  // ◥ slope_down_right_45 (90 deg)
  // ◤ slope_down_left_45 (180 deg)
  
  if (shape === 'slope_up_left_45') {
    ctx.rotate(-Math.PI / 2); // -90 deg
  } else if (shape === 'slope_down_right_45') {
    ctx.rotate(Math.PI / 2); // 90 deg
  } else if (shape === 'slope_down_left_45') {
    ctx.rotate(Math.PI); // 180 deg
  }

  // Draw the sprite, offset back to top-left
  drawRandomSpriteFromGrid(ctx, img, -tileSizePx / 2, -tileSizePx / 2, tileSizePx, tileSizePx, tileX, tileY);
  
  ctx.restore();
}

`;

file = file.substring(0, startIdx) + newFunction + file.substring(endIdx);
fs.writeFileSync('src/engine/tileMaterialRenderer.ts', file);
