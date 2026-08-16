/**
 * Tile Shape & Slope Geometry Engine
 * Supports 45° Slopes, 22.5° Gentle Slopes, Half-Slabs, and Fractional Fullness for Soft Materials.
 */

export type TileShape =
  | 'full'                 // █ Standard 64x64 solid block
  | 'slope_up_right_45'   // ◢ 45° floor ramp rising to the right (0 -> 64)
  | 'slope_up_left_45'    // ◣ 45° floor ramp rising to the left (64 -> 0)
  | 'slope_down_right_45' // ◥ 45° ceiling ramp sloping down to the right
  | 'slope_down_left_45'  // ◤ 45° ceiling ramp sloping down to the left
  | 'gentle_up_right_1'   // Lower half of 22.5° slope rising right (height 0 -> 32px)
  | 'gentle_up_right_2'   // Upper half of 22.5° slope rising right (height 32 -> 64px)
  | 'gentle_up_left_1'    // Lower half of 22.5° slope rising left (height 32 -> 0px)
  | 'gentle_up_left_2'    // Upper half of 22.5° slope rising left (height 64 -> 32px)
  | 'half_bottom'         // ▄ Lower 32px half-slab
  | 'half_top';           // ▀ Upper 32px half-slab

export interface TileShapeDefinition {
  id: TileShape;
  name: string;
  shortLabel: string;
  category: 'block' | 'floor_slope' | 'ceiling_slope' | 'slab';
  iconSvgPath?: string;
  isSlope: boolean;
  slopeAngleDeg?: number; // 45, 22.5, etc.
}

export const TILE_SHAPE_DEFINITIONS: Record<TileShape, TileShapeDefinition> = {
  full: {
    id: 'full',
    name: 'Solid Block (64×64)',
    shortLabel: 'Full Block',
    category: 'block',
    isSlope: false
  },
  slope_up_right_45: {
    id: 'slope_up_right_45',
    name: '45° Slope Up-Right',
    shortLabel: '◢ 45° Up-R',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 45
  },
  slope_up_left_45: {
    id: 'slope_up_left_45',
    name: '45° Slope Up-Left',
    shortLabel: '◣ 45° Up-L',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 45
  },
  slope_down_right_45: {
    id: 'slope_down_right_45',
    name: '45° Ceiling Down-Right',
    shortLabel: '◥ 45° Ceil-R',
    category: 'ceiling_slope',
    isSlope: true,
    slopeAngleDeg: 45
  },
  slope_down_left_45: {
    id: 'slope_down_left_45',
    name: '45° Ceiling Down-Left',
    shortLabel: '◤ 45° Ceil-L',
    category: 'ceiling_slope',
    isSlope: true,
    slopeAngleDeg: 45
  },
  gentle_up_right_1: {
    id: 'gentle_up_right_1',
    name: 'Gentle Slope Up-Right (Lower 0–32px)',
    shortLabel: '◢ 22° Lower-R',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 22.5
  },
  gentle_up_right_2: {
    id: 'gentle_up_right_2',
    name: 'Gentle Slope Up-Right (Upper 32–64px)',
    shortLabel: '◢ 22° Upper-R',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 22.5
  },
  gentle_up_left_1: {
    id: 'gentle_up_left_1',
    name: 'Gentle Slope Up-Left (Lower 32–0px)',
    shortLabel: '◣ 22° Lower-L',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 22.5
  },
  gentle_up_left_2: {
    id: 'gentle_up_left_2',
    name: 'Gentle Slope Up-Left (Upper 64–32px)',
    shortLabel: '◣ 22° Upper-L',
    category: 'floor_slope',
    isSlope: true,
    slopeAngleDeg: 22.5
  },
  half_bottom: {
    id: 'half_bottom',
    name: 'Half Slab (Bottom 32px)',
    shortLabel: '▄ Half Bottom',
    category: 'slab',
    isSlope: false
  },
  half_top: {
    id: 'half_top',
    name: 'Half Slab (Top 32px)',
    shortLabel: '▀ Half Top',
    category: 'slab',
    isSlope: false
  }
};

/**
 * Builds a Canvas 2D path matching the geometric shape of the tile cell,
 * accounting for fractional fullness (e.g. for soft sands / dirt settlement).
 */
export function buildTileShapePath(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSize: number,
  shape: TileShape = 'full',
  fullness: number = 1.0
): void {
  const f = Math.max(0.05, Math.min(1.0, fullness));
  const effectiveHeight = tileSize * f;
  const topYOffset = tileSize * (1.0 - f);

  ctx.beginPath();

  switch (shape) {
    case 'full': {
      // Standard rectangle with vertical fullness
      ctx.rect(screenX, screenY + topYOffset, tileSize, effectiveHeight);
      break;
    }

    case 'slope_up_right_45': {
      // Triangle rising to the right: bottom-left (0, S) -> bottom-right (S, S) -> top-right (S, topYOffset)
      ctx.moveTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + topYOffset);
      break;
    }

    case 'slope_up_left_45': {
      // Triangle rising to the left: bottom-right (S, S) -> bottom-left (0, S) -> top-left (0, topYOffset)
      ctx.moveTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX, screenY + topYOffset);
      break;
    }

    case 'slope_down_right_45': {
      // Ceiling slope down-right: top-left (0, 0) -> top-right (S, 0) -> bottom-right (S, tileSize * f)
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + tileSize, screenY);
      ctx.lineTo(screenX + tileSize, screenY + effectiveHeight);
      break;
    }

    case 'slope_down_left_45': {
      // Ceiling slope down-left: top-right (S, 0) -> top-left (0, 0) -> bottom-left (0, tileSize * f)
      ctx.moveTo(screenX + tileSize, screenY);
      ctx.lineTo(screenX, screenY);
      ctx.lineTo(screenX, screenY + effectiveHeight);
      break;
    }

    case 'gentle_up_right_1': {
      // Lower ramp: (0, S) -> (S, S) -> (S, S - S/2 * f)
      const halfRise = (tileSize * 0.5) * f;
      ctx.moveTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + tileSize - halfRise);
      break;
    }

    case 'gentle_up_right_2': {
      // Upper ramp: (0, S) -> (S, S) -> (S, topYOffset) -> (0, S - S/2)
      const midRise = (tileSize * 0.5);
      ctx.moveTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX + tileSize, screenY + topYOffset);
      ctx.lineTo(screenX, screenY + tileSize - midRise * f);
      break;
    }

    case 'gentle_up_left_1': {
      // Lower ramp left: (S, S) -> (0, S) -> (0, S - S/2 * f)
      const halfRise = (tileSize * 0.5) * f;
      ctx.moveTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX, screenY + tileSize - halfRise);
      break;
    }

    case 'gentle_up_left_2': {
      // Upper ramp left: (S, S) -> (0, S) -> (0, topYOffset) -> (S, S - S/2)
      const midRise = (tileSize * 0.5);
      ctx.moveTo(screenX + tileSize, screenY + tileSize);
      ctx.lineTo(screenX, screenY + tileSize);
      ctx.lineTo(screenX, screenY + topYOffset);
      ctx.lineTo(screenX + tileSize, screenY + tileSize - midRise * f);
      break;
    }

    case 'half_bottom': {
      const slabH = (tileSize * 0.5) * f;
      ctx.rect(screenX, screenY + tileSize - slabH, tileSize, slabH);
      break;
    }

    case 'half_top': {
      const slabH = (tileSize * 0.5) * f;
      ctx.rect(screenX, screenY, tileSize, slabH);
      break;
    }

    default:
      ctx.rect(screenX, screenY, tileSize, tileSize);
  }

  ctx.closePath();
}

/**
 * Calculates the exact mathematical surface floor Y position (in world pixels)
 * at a given worldX for collision query against the 128px player character.
 * Returns null if the tile has no solid floor at this position.
 */
export function getTileSurfaceHeightAt(
  tileX: number,
  tileY: number,
  worldX: number,
  shape: TileShape = 'full',
  tileSize: number = 64,
  fullness: number = 1.0
): number | null {
  const localX = Math.max(0, Math.min(tileSize, worldX - tileX * tileSize));
  const f = Math.max(0.01, Math.min(1.0, fullness));
  const tileBottom = (tileY + 1) * tileSize;
  const tileTop = tileY * tileSize + tileSize * (1.0 - f);

  switch (shape) {
    case 'full':
      return tileTop;

    case 'slope_up_right_45': {
      // Rises from left (0) to right (tileSize)
      const slopeRise = (localX / tileSize) * (tileSize * f);
      return tileBottom - slopeRise;
    }

    case 'slope_up_left_45': {
      // Rises from right (0) to left (tileSize)
      const slopeRise = ((tileSize - localX) / tileSize) * (tileSize * f);
      return tileBottom - slopeRise;
    }

    case 'gentle_up_right_1': {
      // Rises from 0 to 32px
      const slopeRise = (localX / tileSize) * (tileSize * 0.5 * f);
      return tileBottom - slopeRise;
    }

    case 'gentle_up_right_2': {
      // Rises from 32px to 64px
      const slopeRise = (tileSize * 0.5 * f) + (localX / tileSize) * (tileSize * 0.5 * f);
      return tileBottom - slopeRise;
    }

    case 'gentle_up_left_1': {
      // Rises from right (0 to 32px)
      const slopeRise = ((tileSize - localX) / tileSize) * (tileSize * 0.5 * f);
      return tileBottom - slopeRise;
    }

    case 'gentle_up_left_2': {
      // Rises from right (32px to 64px)
      const slopeRise = (tileSize * 0.5 * f) + ((tileSize - localX) / tileSize) * (tileSize * 0.5 * f);
      return tileBottom - slopeRise;
    }

    case 'half_bottom':
      return tileBottom - (tileSize * 0.5 * f);

    case 'half_top':
      return tileTop;

    default:
      return tileTop;
  }
}
