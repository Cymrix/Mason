import { RefinedMapData, RefinedCellState } from '../types';

export const CHUNK_SIZE = 16;

export function getChunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function getChunkCoords(x: number, y: number): { cx: number, cy: number, lx: number, ly: number } {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cy = Math.floor(y / CHUNK_SIZE);
  // Using modulo arithmetic that handles negative numbers correctly
  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return { cx, cy, lx, ly };
}

export function getCell(mapData: RefinedMapData, x: number, y: number): RefinedCellState | null {
  if (mapData.cells) {
    // Legacy 2D array fallback (for intermediate compatibility, though we'll migrate it away)
    if (y >= 0 && y < mapData.height && x >= 0 && x < mapData.width) {
      return mapData.cells[y]?.[x] || null;
    }
    return null;
  }
  
  if (!mapData.chunks) return null;
  const { cx, cy, lx, ly } = getChunkCoords(x, y);
  const chunk = mapData.chunks[getChunkKey(cx, cy)];
  if (!chunk) return null;
  return chunk[ly * CHUNK_SIZE + lx];
}

export function setCell(mapData: RefinedMapData, x: number, y: number, state: RefinedCellState, createChunkIfMissing: boolean = true): void {
  if (!mapData.chunks) {
    mapData.chunks = {};
  }
  const { cx, cy, lx, ly } = getChunkCoords(x, y);
  const key = getChunkKey(cx, cy);
  let chunk = mapData.chunks[key];
  if (!chunk) {
    if (!createChunkIfMissing) return;
    chunk = new Array(CHUNK_SIZE * CHUNK_SIZE).fill(null).map(() => ({
      biome_id: 'mourne_ashen_steppes', // default fallback, will be overwritten
      tile_type_id: '',
      current_health: 100,
      damage_threshold_index: 0
    }));
    mapData.chunks[key] = chunk;
  }
  chunk[ly * CHUNK_SIZE + lx] = state;
}

export function calculateMapBounds(mapData: RefinedMapData): { minX: number, maxX: number, minY: number, maxY: number } {
  if (mapData.cells && (!mapData.chunks || Object.keys(mapData.chunks).length === 0)) {
    return { minX: 0, maxX: mapData.width - 1, minY: 0, maxY: mapData.height - 1 };
  }
  
  if (!mapData.chunks || Object.keys(mapData.chunks).length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const key of Object.keys(mapData.chunks)) {
    const [cxStr, cyStr] = key.split(',');
    const cx = parseInt(cxStr, 10);
    const cy = parseInt(cyStr, 10);
    const chunkMinX = cx * CHUNK_SIZE;
    const chunkMaxX = chunkMinX + CHUNK_SIZE - 1;
    const chunkMinY = cy * CHUNK_SIZE;
    const chunkMaxY = chunkMinY + CHUNK_SIZE - 1;
    
    if (chunkMinX < minX) minX = chunkMinX;
    if (chunkMaxX > maxX) maxX = chunkMaxX;
    if (chunkMinY < minY) minY = chunkMinY;
    if (chunkMaxY > maxY) maxY = chunkMaxY;
  }
  return { minX, maxX, minY, maxY };
}
