/**
 * Tile Shape Geometry Engine (16px Uniform Grid)
 * 
 * Clean, focused shape definitions for the 16px micro-grid:
 * - Full Square Solid Block (16x16px)
 * - 45° Corner Diagonal Cuts (Up-Right, Up-Left, Ceiling Down-Right, Ceiling Down-Left)
 * 
 * Exact polygon paths and collision surface height calculation.
 */

export type TileShape =
  | 'auto'
  | 'full'
  | 'slope_up_right_45'
  | 'slope_up_left_45'
  | 'slope_down_right_45'
  | 'slope_down_left_45';

export type ShapeCategory = 'auto' | 'block' | 'slope_45';

export interface TileShapeDefinition {
  id: TileShape;
  name: string;
  shortLabel: string;
  category: ShapeCategory;
  isSlope: boolean;
  slopeAngleDeg?: number;
  // Normalized 2D Polygon Vertices [x: 0..1, y: 0..1]
  normalizedPolygon: [number, number][];
  // Linear hypotenuse segment for sloped edge trim rendering [x0, y0, x1, y1]
  trimEdge?: [number, number, number, number];
}

function transformPoints(
  pts: [number, number][],
  flipX: boolean = false,
  flipY: boolean = false
): [number, number][] {
  return pts.map(([x, y]) => [
    flipX ? 1.0 - x : x,
    flipY ? 1.0 - y : y
  ]);
}

// Canonical Polygons
const FULL_POLYGON: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const SLOPE_45_R_BASE: [number, number][] = [[0, 1], [1, 0], [1, 1]];

export const TILE_SHAPE_DEFINITIONS: Record<TileShape, TileShapeDefinition> = {
  auto: {
    id: 'auto',
    name: 'Autotile (Smart)',
    shortLabel: '✨ Autotile',
    category: 'auto',
    isSlope: false,
    normalizedPolygon: FULL_POLYGON
  },
  full: {
    id: 'full',
    name: 'Solid Block (16x16)',
    shortLabel: '■ Solid Block',
    category: 'block',
    isSlope: false,
    normalizedPolygon: FULL_POLYGON
  },
  slope_up_right_45: {
    id: 'slope_up_right_45',
    name: '45° Ramp Up-Right (◢)',
    shortLabel: '◢ Ramp Up-R',
    category: 'slope_45',
    isSlope: true,
    slopeAngleDeg: 45,
    normalizedPolygon: SLOPE_45_R_BASE,
    trimEdge: [0, 1, 1, 0]
  },
  slope_up_left_45: {
    id: 'slope_up_left_45',
    name: '45° Ramp Up-Left (◣)',
    shortLabel: '◣ Ramp Up-L',
    category: 'slope_45',
    isSlope: true,
    slopeAngleDeg: 45,
    normalizedPolygon: transformPoints(SLOPE_45_R_BASE, true, false),
    trimEdge: [1, 1, 0, 0]
  },
  slope_down_right_45: {
    id: 'slope_down_right_45',
    name: '45° Ceil Down-Right (◥)',
    shortLabel: '◥ Ceil Down-R',
    category: 'slope_45',
    isSlope: true,
    slopeAngleDeg: 45,
    normalizedPolygon: transformPoints(SLOPE_45_R_BASE, false, true),
    trimEdge: [0, 0, 1, 1]
  },
  slope_down_left_45: {
    id: 'slope_down_left_45',
    name: '45° Ceil Down-Left (◤)',
    shortLabel: '◤ Ceil Down-L',
    category: 'slope_45',
    isSlope: true,
    slopeAngleDeg: 45,
    normalizedPolygon: transformPoints(SLOPE_45_R_BASE, true, true),
    trimEdge: [1, 0, 0, 1]
  }
};

/**
 * Builds a Canvas 2D path matching the geometric shape of the tile cell.
 */
export function buildTileShapePath(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileSize: number,
  shape: TileShape = 'full',
  _fullness: number = 1.0
): void {
  const def = TILE_SHAPE_DEFINITIONS[shape] || TILE_SHAPE_DEFINITIONS.full;

  ctx.beginPath();
  const points = def.normalizedPolygon;
  if (!points || points.length === 0) {
    ctx.rect(screenX, screenY, tileSize, tileSize);
    ctx.closePath();
    return;
  }

  for (let i = 0; i < points.length; i++) {
    const [nx, ny] = points[i];
    const px = screenX + nx * tileSize;
    const posY = screenY + ny * tileSize;

    if (i === 0) {
      ctx.moveTo(px, posY);
    } else {
      ctx.lineTo(px, posY);
    }
  }

  ctx.closePath();
}

/**
 * Calculates the surface floor Y position (in world pixels) at a given worldX
 * for collision query against the player entity.
 */
export function getTileSurfaceHeightAt(
  tileX: number,
  tileY: number,
  worldX: number,
  shape: TileShape = 'full',
  tileSize: number = 16,
  _fullness: number = 1.0
): number | null {
  const localX = Math.max(0, Math.min(tileSize, worldX - tileX * tileSize));
  const normX = localX / tileSize;

  const tileTop = tileY * tileSize;
  const tileBottom = (tileY + 1) * tileSize;

  if (shape === 'full') {
    return tileTop;
  }

  if (shape === 'slope_up_right_45') {
    // 0 -> 1 rise (floor height is tileBottom - normX * tileSize)
    return tileBottom - normX * tileSize;
  }

  if (shape === 'slope_up_left_45') {
    // 1 -> 0 rise (floor height is tileTop + normX * tileSize)
    return tileTop + normX * tileSize;
  }

  if (shape === 'slope_down_right_45' || shape === 'slope_down_left_45') {
    return null; // Ceiling slopes do not provide a walkable floor surface
  }

  return tileTop;
}
