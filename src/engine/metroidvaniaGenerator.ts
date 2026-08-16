import { RefinedBiome } from './refinedBiomeSchema';
import { RefinedMapData, RefinedCellState } from '../types';

export interface BiomeAllocationMatrix {
  width: number;
  height: number;
  biomeIds: string[][]; // [y][x] -> biomeId (1 pixel per tile)
}

/**
 * Initialize a 1px:1tile Biome Allocation Matrix
 */
export function createBiomeAllocationMatrix(
  width: number,
  height: number,
  defaultBiomeId: string
): BiomeAllocationMatrix {
  const biomeIds: string[][] = Array(height).fill(null).map(() => 
    Array(width).fill(defaultBiomeId)
  );
  return { width, height, biomeIds };
}

/**
 * Convert Hex Color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return { r: 128, g: 128, b: 128 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Find the closest Biome for a given RGB pixel color
 */
export function findClosestBiome(
  r: number,
  g: number,
  b: number,
  biomes: RefinedBiome[]
): RefinedBiome {
  if (biomes.length === 0) throw new Error('No biomes provided');
  
  let closestBiome = biomes[0];
  let minDistance = Number.MAX_VALUE;

  for (const biome of biomes) {
    const target = hexToRgb(biome.regionColor || '#475569');
    const dr = r - target.r;
    const dg = g - target.g;
    const db = b - target.b;
    // Euclidean color distance
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDistance) {
      minDistance = dist;
      closestBiome = biome;
    }
  }

  return closestBiome;
}

/**
 * Procedurally generate a 1px:1tile Biome Allocation Map using Voronoi & Perlin zones
 */
export function generateProceduralBiomeMatrix(
  width: number,
  height: number,
  biomes: RefinedBiome[],
  seed = 42
): BiomeAllocationMatrix {
  if (biomes.length <= 1) {
    return createBiomeAllocationMatrix(width, height, biomes[0]?.id || 'mourne_ashen_steppes');
  }

  // Generate 4 to 8 Voronoi seed centroids across the 1px-per-tile matrix
  const numCentroids = Math.max(biomes.length, Math.min(8, Math.floor((width * height) / 180)));
  const centroids: { x: number; y: number; biomeId: string }[] = [];

  for (let i = 0; i < numCentroids; i++) {
    // Distribute centroids with pseudo-random seed
    const pseudoX = ((Math.sin(seed * 91.3 + i * 47.9) * 0.5 + 0.5) * width);
    const pseudoY = ((Math.cos(seed * 63.7 + i * 31.1) * 0.5 + 0.5) * height);
    const biome = biomes[i % biomes.length];
    centroids.push({
      x: pseudoX,
      y: pseudoY,
      biomeId: biome.id
    });
  }

  const biomeIds: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      // Add subtle harmonic noise to distort the voronoi cell borders naturally
      const warpX = Math.sin(y * 0.25 + seed) * 2.5;
      const warpY = Math.cos(x * 0.25 + seed * 1.5) * 2.5;

      let nearestBiomeId = biomes[0].id;
      let nearestDist = Number.MAX_VALUE;

      for (const c of centroids) {
        const dx = (x + warpX) - c.x;
        const dy = (y + warpY) - c.y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestBiomeId = c.biomeId;
        }
      }

      row.push(nearestBiomeId);
    }
    biomeIds.push(row);
  }

  return { width, height, biomeIds };
}

/**
 * Sample an uploaded 1px:1tile Image and map each pixel to the nearest biome
 */
export function sampleImageToBiomeMatrix(
  imgElement: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  biomes: RefinedBiome[]
): BiomeAllocationMatrix {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return createBiomeAllocationMatrix(targetWidth, targetHeight, biomes[0].id);
  }

  ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  const biomeIds: string[][] = [];

  for (let y = 0; y < targetHeight; y++) {
    const row: string[] = [];
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 50) {
        // Transparent pixel defaults to first biome
        row.push(biomes[0].id);
      } else {
        const matched = findClosestBiome(r, g, b, biomes);
        row.push(matched.id);
      }
    }
    biomeIds.push(row);
  }

  return { width: targetWidth, height: targetHeight, biomeIds };
}

export type MetroidvaniaLayoutStyle = 
  | 'blank_air' // Pure blank tiles for each biome (open player traversable space with biome background)
  | 'sidescroller_platforms' // Metroidvania shafts, floating jump ledges, cavern floors, ceilings
  | 'cavern_labyrinth' // Cellular cave network with open air pockets
  | 'solid_rooms'; // Solid block rooms with hollow interiors

/**
 * Build the active RefinedMapData from the 1px:1tile Biome Allocation Matrix
 */
export function buildMapFromBiomeMatrix(
  matrix: BiomeAllocationMatrix,
  biomes: RefinedBiome[],
  layoutStyle: MetroidvaniaLayoutStyle = 'blank_air',
  seed = 1337
): RefinedMapData {
  const { width, height, biomeIds } = matrix;
  const biomeMap = new Map<string, RefinedBiome>();
  biomes.forEach(b => biomeMap.set(b.id, b));

  const cells: RefinedCellState[][] = [];

  for (let y = 0; y < height; y++) {
    const row: RefinedCellState[] = [];
    for (let x = 0; x < width; x++) {
      const cellBiomeId = biomeIds[y]?.[x] || biomes[0].id;
      const currentBiome = biomeMap.get(cellBiomeId) || biomes[0];
      const primaryTile = currentBiome.primaryTileTypeId || currentBiome.tileTypes[0]?.id || '';

      let tileTypeId = ''; // Default to blank / open air tile!
      let envDetail: string | null = null;
      let interactiveDetail: string | null = null;
      let wildlifeDetail: string | null = null;

      if (layoutStyle === 'blank_air') {
        // As requested: all cells are blank tiles for each biome, retaining the biome background without physical tiles
        tileTypeId = '';
      } else if (layoutStyle === 'sidescroller_platforms') {
        // Sidescroller 2D Metroidvania architecture:
        // 1. Solid bottom floor
        const isFloor = y === height - 1 || y === height - 2;
        // 2. Solid ceiling top
        const isCeiling = y === 0;
        // 3. Side boundaries
        const isWall = x === 0 || x === width - 1;
        // 4. Horizontal floating jump platforms every 4-6 tiles with gaps
        const isPlatformLevel = (y % 6 === 0) && (x % 7 < 5);
        // 5. Vertical climbing shaft ledges
        const isShaftLedge = (x % 12 === 3 || x % 12 === 8) && (y % 3 === 0);

        if (isFloor || isCeiling || isWall || isPlatformLevel || isShaftLedge) {
          tileTypeId = primaryTile;

          // Scatter Environmental details on solid top surfaces
          if (Math.random() < 0.2 && currentBiome.environmentalDetails.length > 0) {
            envDetail = currentBiome.environmentalDetails[Math.floor(Math.random() * currentBiome.environmentalDetails.length)].id;
          }
        } else {
          // Open air traversable space!
          tileTypeId = '';

          // Flying wildlife in air
          if (Math.random() < 0.05 && currentBiome.wildlife.length > 0) {
            const flyingFauna = currentBiome.wildlife.find(w => w.behavior === 'ambient_flying');
            if (flyingFauna) wildlifeDetail = flyingFauna.id;
          }
        }
      } else if (layoutStyle === 'cavern_labyrinth') {
        // Organic cave noise
        const n = Math.sin(x * 0.35 + seed) * Math.cos(y * 0.35 + seed * 2) + Math.sin((x + y) * 0.2);
        if (n > 0.15 || y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          tileTypeId = primaryTile;
        } else {
          tileTypeId = ''; // Blank cavern air
        }
      } else if (layoutStyle === 'solid_rooms') {
        // Boundary room walls with open hollow center
        const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
        tileTypeId = isEdge ? primaryTile : '';
      }

      row.push({
        biome_id: cellBiomeId,
        tile_type_id: tileTypeId,
        current_health: 100,
        damage_threshold_index: 0,
        environmental_detail_id: envDetail,
        interactive_detail_id: interactiveDetail,
        wildlife_id: wildlifeDetail
      });
    }
    cells.push(row);
  }

  // Ensure 1 Save Checkpoint / Binding Stone in the first open air tile near bottom-left
  for (let y = height - 3; y >= 2; y--) {
    for (let x = 2; x < width - 2; x++) {
      if (cells[y][x].tile_type_id === '' && cells[y + 1]?.[x]?.tile_type_id !== '') {
        const b = biomeMap.get(cells[y][x].biome_id) || biomes[0];
        if (b.interactiveDetails.length > 0) {
          cells[y][x].interactive_detail_id = b.interactiveDetails[0].id;
          return { width, height, cells };
        }
      }
    }
  }

  return { width, height, cells };
}
