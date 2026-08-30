import { RefinedMapData } from '../types';
import { TileShape, TILE_SHAPE_DEFINITIONS } from '../engine/tileShape';
import { BiomeTileType, TILE_SIZE } from '../engine/refinedBiomeSchema';
import { getCell } from '../engine/mapChunkHelper';
import { resolveAutoTileShape } from '../engine/autoTileSlopeSolver';

export interface Point {
  x: number;
  y: number;
}

// Map-scoped cache of computed merged polygons
interface CacheEntry {
  mapId: string;
  version: number;
  width: number;
  height: number;
  polygons: Point[][];
}

const mergedPolygonsCache = new Map<string, CacheEntry>();
let globalVersionCounter = 0;

/**
 * Triggers a full invalidation of the merged collider cache.
 * Call this when painting, erasing, or clearing the map.
 */
export function invalidateMergedColliders() {
  globalVersionCounter++;
}

/**
 * Checks if two points are collinear (lie on the same straight line).
 */
function isCollinear(p1: Point, p2: Point, p3: Point): boolean {
  // Cross product of (p2 - p1) and (p3 - p2)
  const area = p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y);
  return Math.abs(area) < 0.01;
}

/**
 * Simplifies a polygon by removing consecutive collinear points.
 */
export function simplifyPolygon(pts: Point[]): Point[] {
  if (pts.length <= 2) return pts;
  
  const result: Point[] = [];
  
  // Clean duplicates first
  const uniquePts: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const prev = uniquePts[uniquePts.length - 1];
    if (!prev || prev.x !== curr.x || prev.y !== curr.y) {
      uniquePts.push(curr);
    }
  }
  
  if (uniquePts.length <= 2) return uniquePts;
  
  // Close the loop temporarily to simplify ends
  if (uniquePts[0].x !== uniquePts[uniquePts.length - 1].x || uniquePts[0].y !== uniquePts[uniquePts.length - 1].y) {
    uniquePts.push({ ...uniquePts[0] });
  }

  for (let i = 0; i < uniquePts.length; i++) {
    const prev = result[result.length - 1];
    const curr = uniquePts[i];
    const next = uniquePts[i + 1];

    if (prev && next) {
      if (isCollinear(prev, curr, next)) {
        // Skip curr since it is collinear
        continue;
      }
    }
    result.push(curr);
  }

  // If first and last are same, keep it closed
  if (result.length > 2 && result[0].x === result[result.length - 1].x && result[0].y === result[result.length - 1].y) {
    result.pop();
  }

  return result;
}

/**
 * Forces a polygon to have clockwise winding.
 */
function forceClockwise(pts: Point[]): Point[] {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  if (sum < 0) {
    return [...pts].reverse();
  }
  return pts;
}

/**
 * Computes, caches, and returns merged polygon boundary paths for all solid blocks.
 * Uses a highly efficient 2D edge-cancellation algorithm to extract clean, minimal outer contours.
 */
export function getMergedPolygonColliders(
  mapData: RefinedMapData,
  tileTypeMap: Record<string, { tileType: BiomeTileType; biome: any }>
): Point[][] {
  const mapId = mapData.id || mapData.name || 'default_map';
  const cached = mergedPolygonsCache.get(mapId);
  
  if (cached && cached.version === globalVersionCounter && cached.width === mapData.width && cached.height === mapData.height) {
    return cached.polygons;
  }

  // 1. Identify all solid cells and generate all directed segments
  const edgeCounts = new Map<string, { p1: Point; p2: Point }>();

  // Helper key for edges to detect opposite directions
  const getEdgeKey = (x1: number, y1: number, x2: number, y2: number) => {
    return `${x1},${y1}->${x2},${y2}`;
  };

  const isNeighborSolid = (ny: number, nx: number) => {
    const neighbor = getCell(mapData, nx, ny);
    if (!neighbor || !neighbor.tile_type_id) return false;
    const rec = tileTypeMap[neighbor.tile_type_id];
    if (!rec) return false;
    return rec.tileType.generatesCollider !== false;
  };

  // Loop through all map grid cells
  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = getCell(mapData, x, y);
      if (!cell || !cell.tile_type_id) continue;

      const record = tileTypeMap[cell.tile_type_id];
      if (!record || record.tileType.generatesCollider === false) continue;

      // 8-Directional Neighbor check for full autotiling (edges, corners, and slope transitions)
      const hasTop = isNeighborSolid(y - 1, x);
      const hasBottom = isNeighborSolid(y + 1, x);
      const hasLeft = isNeighborSolid(y, x - 1);
      const hasRight = isNeighborSolid(y, x + 1);
      const hasTopLeft = isNeighborSolid(y - 1, x - 1);
      const hasTopRight = isNeighborSolid(y - 1, x + 1);
      const hasBottomLeft = isNeighborSolid(y + 1, x - 1);
      const hasBottomRight = isNeighborSolid(y + 1, x + 1);

      const manualShape: TileShape = cell.shape || 'full';
      const shape: TileShape = resolveAutoTileShape(
        record.tileType.bevelProbability ?? 0,
        x,
        y,
        {
          hasTop,
          hasBottom,
          hasLeft,
          hasRight,
          hasTopLeft,
          hasTopRight,
          hasBottomLeft,
          hasBottomRight
        },
        manualShape
      );

      // Determine shape vertices
      const def = TILE_SHAPE_DEFINITIONS[shape] || TILE_SHAPE_DEFINITIONS.full;
      const poly = def.normalizedPolygon;

      // Transform normalized polygon vertices to absolute pixel coordinates
      let worldPts: Point[] = poly.map(([nx, ny]) => ({
        x: Math.round((x + nx) * TILE_SIZE),
        y: Math.round((y + ny) * TILE_SIZE),
      }));

      // Force strictly clockwise winding to ensure shared edges always run in opposite directions
      worldPts = forceClockwise(worldPts);

      // Add all directed segments for this cell's polygon
      for (let i = 0; i < worldPts.length; i++) {
        const p1 = worldPts[i];
        const p2 = worldPts[(i + 1) % worldPts.length];

        // Skip zero-length segments
        if (p1.x === p2.x && p1.y === p2.y) continue;

        const forwardKey = getEdgeKey(p1.x, p1.y, p2.x, p2.y);
        const reverseKey = getEdgeKey(p2.x, p2.y, p1.x, p1.y);

        // If reverse segment already exists, they cancel each other out (internal boundary)
        if (edgeCounts.has(reverseKey)) {
          edgeCounts.delete(reverseKey);
        } else {
          edgeCounts.set(forwardKey, { p1, p2 });
        }
      }
    }
  }

  // 2. Build adjacency list of remaining un-canceled directed boundary edges
  const adj = new Map<string, { p2: Point; key: string }[]>();
  const vertexKey = (p: Point) => `${p.x},${p.y}`;

  for (const [key, edge] of edgeCounts.entries()) {
    const k1 = vertexKey(edge.p1);
    if (!adj.has(k1)) adj.set(k1, []);
    adj.get(k1)!.push({ p2: edge.p2, key });
  }

  // 3. Trace directed edges to build closed boundary loops using Planar Right-Hand Rule
  const polygons: Point[][] = [];
  const visitedEdges = new Set<string>();

  for (const edge of edgeCounts.values()) {
    const startKey = getEdgeKey(edge.p1.x, edge.p1.y, edge.p2.x, edge.p2.y);
    if (visitedEdges.has(startKey)) continue;

    const currentPoly: Point[] = [edge.p1];
    let curr = edge.p2;
    let prev = edge.p1;
    visitedEdges.add(startKey);

    let watchdog = 0;
    const maxPathLen = edgeCounts.size + 10;

    while (watchdog < maxPathLen) {
      currentPoly.push(curr);
      const currKey = vertexKey(curr);
      const candidates = adj.get(currKey) || [];

      // Find all unvisited candidates
      const unvisited = candidates.filter(cand => !visitedEdges.has(cand.key));
      if (unvisited.length === 0) {
        break;
      }

      let nextChoice = unvisited[0];

      if (unvisited.length > 1) {
        // Apply Right-Hand Rule: select candidate with largest clockwise angle change
        const inAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        let maxDiff = -Infinity;

        for (const cand of unvisited) {
          const outAngle = Math.atan2(cand.p2.y - curr.y, cand.p2.x - curr.x);
          let diff = outAngle - inAngle;
          while (diff <= -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;

          if (diff > maxDiff) {
            maxDiff = diff;
            nextChoice = cand;
          }
        }
      }

      visitedEdges.add(nextChoice.key);

      // If we've looped back to our starting point, close the loop
      if (nextChoice.p2.x === currentPoly[0].x && nextChoice.p2.y === currentPoly[0].y) {
        break;
      }

      prev = curr;
      curr = nextChoice.p2;
      watchdog++;
    }

    if (currentPoly.length >= 3) {
      polygons.push(simplifyPolygon(currentPoly));
    }
  }

  // 4. Update the Cache entry
  mergedPolygonsCache.set(mapId, {
    mapId,
    version: globalVersionCounter,
    width: mapData.width,
    height: mapData.height,
    polygons,
  });

  return polygons;
}
