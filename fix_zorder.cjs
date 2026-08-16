const fs = require('fs');

let file = fs.readFileSync('src/engine/tileMaterialRenderer.ts', 'utf8');

// We will extract all the blocks, and replace the whole section from 
// "// 3. Composite Autotiling Overlays" to the end of the function.

const startIdx = file.indexOf('// 3. Composite Autotiling Overlays');
const endIdx = file.indexOf('}', file.indexOf('// 4. Inner Corner Trims'));

const newRenderLogic = `// 3. Composite Autotiling Overlays
  const details = tileType.tileDetails;
  const scaleRatio = tileSizePx / 64;

  // -- 1. RIGHT Edge Overlay (Lowest Z)
  if (details.rightSide.overlayTextureUrl && !neighborMask.hasRight && (shape === 'full' || shape === 'slope_up_right_45' || shape === 'slope_down_right_45')) {
    const rightImg = getCachedImage(details.rightSide.overlayTextureUrl, onImageLoaded);
    if (rightImg) {
      drawRandomSpriteFromGrid(ctx, rightImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  // -- 2. LEFT Edge Overlay
  if (details.leftSide.overlayTextureUrl && !neighborMask.hasLeft && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_down_left_45')) {
    const leftImg = getCachedImage(details.leftSide.overlayTextureUrl, onImageLoaded);
    if (leftImg) {
      drawRandomSpriteFromGrid(ctx, leftImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  // -- 3. Inner Corner Trims
  const innerDetails = (tileType.tileDetails as any).innerCorner;
  if (shape === 'full') {
    const drawInnerCorner = (rotationDeg: number) => {
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
    };

    if (neighborMask.hasTop && neighborMask.hasLeft && neighborMask.hasTopLeft === false && details.top.overlayTextureUrl) {
      drawInnerCorner(0);
    }
    if (neighborMask.hasTop && neighborMask.hasRight && neighborMask.hasTopRight === false && details.top.overlayTextureUrl) {
      drawInnerCorner(90);
    }
    if (neighborMask.hasBottom && neighborMask.hasLeft && neighborMask.hasBottomLeft === false && details.bottom.overlayTextureUrl) {
      drawInnerCorner(270);
    }
    if (neighborMask.hasBottom && neighborMask.hasRight && neighborMask.hasBottomRight === false && details.bottom.overlayTextureUrl) {
      drawInnerCorner(180);
    }
  }

  // If clipped by geometry, we MUST restore BEFORE drawing Slopes, Bottom, and Top overlays 
  // so they can spill over the edge if needed (or in the case of slope trim, sit exactly on the hypotenuse)
  if (isClipped) {
    ctx.restore();
    isClipped = false; // Prevent double restore
  }

  // -- 4. Slope Overlay
  if (shape !== 'full') {
    drawSlopedEdgeTrim(ctx, screenX, screenY, tileSizePx, shape, tileType, tileX, tileY, fullness);
  }

  // -- 5. BOTTOM Edge Overlay
  if (details.bottom.overlayTextureUrl && !neighborMask.hasBottom && (shape === 'full' || shape === 'slope_up_left_45' || shape === 'slope_up_right_45')) {
    const botImg = getCachedImage(details.bottom.overlayTextureUrl, onImageLoaded);
    if (botImg) {
      drawRandomSpriteFromGrid(ctx, botImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }

  // -- 6. TOP Edge Overlay (Highest Z)
  if ((shape === 'full' || shape === 'slope_down_left_45' || shape === 'slope_down_right_45') && details.top.overlayTextureUrl && !neighborMask.hasTop) {
    const topImg = getCachedImage(details.top.overlayTextureUrl, onImageLoaded);
    if (topImg) {
      drawRandomSpriteFromGrid(ctx, topImg, screenX, screenY, tileSizePx, tileSizePx, tileX, tileY);
    }
  }
`;

file = file.substring(0, startIdx) + newRenderLogic + file.substring(endIdx + 1);
fs.writeFileSync('src/engine/tileMaterialRenderer.ts', file);

