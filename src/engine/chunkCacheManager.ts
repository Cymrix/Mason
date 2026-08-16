/**
 * Lazy Per-Chunk Cache Manager
 * 
 * Implements:
 * 1. Two-phase world rendering: cheap CPU layout data vs. deferred GPU/Canvas composite caching.
 * 2. Per-chunk (16×16 tiles = 1024×1024px) offscreen baked textures.
 * 3. Dirty-cell surgical invalidation with cross-chunk boundary consistency.
 * 4. LRU cache eviction for predictable VRAM/RAM budgeting.
 */

import { RefinedMapData, RefinedCellState } from '../types';
import { BiomeTileType, RefinedBiome, TILE_SIZE } from './refinedBiomeSchema';
import { renderRefinedTileCell } from './tileMaterialRenderer';
import { TileShape } from './tileShape';
import { drawThresholdCrackMask } from './heightBlendShader';

export const CHUNK_SIZE = 32; // 32x32 tiles (at 16px = 512x512px per chunk)
export const MAX_CACHED_CHUNKS = 128; // Retain up to 128 loaded chunk textures (~64MB-128MB max texture footprint)

export interface ChunkKey {
  chunkX: number;
  chunkY: number;
}

export interface CachedChunk {
  chunkX: number;
  chunkY: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isDirty: boolean;
  dirtySubRect?: { minX: number; minY: number; maxX: number; maxY: number } | null;
  version: number;
  lastAccessTime: number;
}

export class ChunkCacheManager {
  private cache: Map<string, CachedChunk> = new Map();
  private mapVersion: number = 0;

  public static getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  public static worldTileToChunk(tileX: number, tileY: number): { chunkX: number; chunkY: number; localX: number; localY: number } {
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const localX = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { chunkX, chunkY, localX, localY };
  }

  /**
   * Invalidate a single world cell and all neighboring chunks if on the border
   */
  public invalidateCell(worldTileX: number, worldTileY: number): void {
    const { chunkX, chunkY, localX, localY } = ChunkCacheManager.worldTileToChunk(worldTileX, worldTileY);

    this.markChunkDirty(chunkX, chunkY, localX, localY);

    // Cross-chunk boundary consistency checks (1-cell neighbor kernel)
    if (localX === 0) {
      this.markChunkDirty(chunkX - 1, chunkY, CHUNK_SIZE - 1, localY);
    } else if (localX === CHUNK_SIZE - 1) {
      this.markChunkDirty(chunkX + 1, chunkY, 0, localY);
    }

    if (localY === 0) {
      this.markChunkDirty(chunkX, chunkY - 1, localX, CHUNK_SIZE - 1);
    } else if (localY === CHUNK_SIZE - 1) {
      this.markChunkDirty(chunkX, chunkY + 1, localX, 0);
    }

    // Diagonal corners
    if (localX === 0 && localY === 0) {
      this.markChunkDirty(chunkX - 1, chunkY - 1, CHUNK_SIZE - 1, CHUNK_SIZE - 1);
    }
    if (localX === CHUNK_SIZE - 1 && localY === 0) {
      this.markChunkDirty(chunkX + 1, chunkY - 1, 0, CHUNK_SIZE - 1);
    }
    if (localX === 0 && localY === CHUNK_SIZE - 1) {
      this.markChunkDirty(chunkX - 1, chunkY + 1, CHUNK_SIZE - 1, 0);
    }
    if (localX === CHUNK_SIZE - 1 && localY === CHUNK_SIZE - 1) {
      this.markChunkDirty(chunkX + 1, chunkY + 1, 0, 0);
    }
  }

  private markChunkDirty(chunkX: number, chunkY: number, localX: number, localY: number): void {
    const key = ChunkCacheManager.getChunkKey(chunkX, chunkY);
    const cached = this.cache.get(key);
    if (!cached) return;

    cached.isDirty = true;
    if (!cached.dirtySubRect) {
      cached.dirtySubRect = {
        minX: Math.max(0, localX - 1),
        minY: Math.max(0, localY - 1),
        maxX: Math.min(CHUNK_SIZE - 1, localX + 1),
        maxY: Math.min(CHUNK_SIZE - 1, localY + 1),
      };
    } else {
      cached.dirtySubRect.minX = Math.min(cached.dirtySubRect.minX, Math.max(0, localX - 1));
      cached.dirtySubRect.minY = Math.min(cached.dirtySubRect.minY, Math.max(0, localY - 1));
      cached.dirtySubRect.maxX = Math.max(cached.dirtySubRect.maxX, Math.min(CHUNK_SIZE - 1, localX + 1));
      cached.dirtySubRect.maxY = Math.max(cached.dirtySubRect.maxY, Math.min(CHUNK_SIZE - 1, localY + 1));
    }
  }

  /**
   * Invalidate entire cache (e.g. on new map load or global biome edit)
   */
  public clear(): void {
    this.cache.clear();
    this.mapVersion++;
  }

  /**
   * Gets or lazily computes a baked chunk texture
   */
  public getOrBakeChunk(
    chunkX: number,
    chunkY: number,
    mapData: RefinedMapData,
    tileTypeMap: Record<string, { tileType: BiomeTileType; biome: RefinedBiome }>,
    showDamageMasks: boolean = true,
    onAsyncImageLoaded?: () => void
  ): HTMLCanvasElement | null {
    // Check bounds
    const maxChunkX = Math.ceil(mapData.width / CHUNK_SIZE);
    const maxChunkY = Math.ceil(mapData.height / CHUNK_SIZE);
    if (chunkX < 0 || chunkY < 0 || chunkX >= maxChunkX || chunkY >= maxChunkY) {
      return null;
    }

    const key = ChunkCacheManager.getChunkKey(chunkX, chunkY);
    let cached = this.cache.get(key);

    const now = Date.now();

    if (!cached) {
      // LRU Eviction check
      if (this.cache.size >= MAX_CACHED_CHUNKS) {
        this.evictOldestChunk();
      }

      const canvas = document.createElement('canvas');
      canvas.width = CHUNK_SIZE * TILE_SIZE;
      canvas.height = CHUNK_SIZE * TILE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = false;

      cached = {
        chunkX,
        chunkY,
        canvas,
        ctx,
        isDirty: true,
        dirtySubRect: null, // Full chunk bake
        version: this.mapVersion,
        lastAccessTime: now
      };

      this.cache.set(key, cached);
    } else {
      cached.lastAccessTime = now;
    }

    if (cached.isDirty) {
      this.bakeChunkContent(cached, mapData, tileTypeMap, showDamageMasks, onAsyncImageLoaded);
      cached.isDirty = false;
      cached.dirtySubRect = null;
    }

    return cached.canvas;
  }

  /**
   * Bakes cell materials, shapes, slopes, dual-noise blends, and damage overlays into the offscreen chunk canvas.
   */
  private bakeChunkContent(
    cached: CachedChunk,
    mapData: RefinedMapData,
    tileTypeMap: Record<string, { tileType: BiomeTileType; biome: RefinedBiome }>,
    showDamageMasks: boolean,
    onAsyncImageLoaded?: () => void
  ): void {
    const { ctx, chunkX, chunkY, dirtySubRect } = cached;
    ctx.imageSmoothingEnabled = false;

    const startLocalX = dirtySubRect ? dirtySubRect.minX : 0;
    const endLocalX = dirtySubRect ? dirtySubRect.maxX : CHUNK_SIZE - 1;
    const startLocalY = dirtySubRect ? dirtySubRect.minY : 0;
    const endLocalY = dirtySubRect ? dirtySubRect.maxY : CHUNK_SIZE - 1;

    // Clear targeted dirty area
    if (dirtySubRect) {
      const clearX = startLocalX * TILE_SIZE;
      const clearY = startLocalY * TILE_SIZE;
      const clearW = (endLocalX - startLocalX + 1) * TILE_SIZE;
      const clearH = (endLocalY - startLocalY + 1) * TILE_SIZE;
      ctx.clearRect(clearX, clearY, clearW, clearH);
    } else {
      ctx.clearRect(0, 0, cached.canvas.width, cached.canvas.height);
    }

    for (let ly = startLocalY; ly <= endLocalY; ly++) {
      const worldY = chunkY * CHUNK_SIZE + ly;
      if (worldY >= mapData.height) continue;

      for (let lx = startLocalX; lx <= endLocalX; lx++) {
        const worldX = chunkX * CHUNK_SIZE + lx;
        if (worldX >= mapData.width) continue;

        const cell: RefinedCellState = mapData.cells[worldY][worldX];
        const tileTypeId = cell.tile_type_id;
        if (!tileTypeId) continue;

        const record = tileTypeMap[tileTypeId];
        if (!record) continue;

        const screenX = lx * TILE_SIZE;
        const screenY = ly * TILE_SIZE;

        // Neighbor check for auto-tiling composite edges
        const hasTop = worldY > 0 && mapData.cells[worldY - 1][worldX].tile_type_id === tileTypeId;
        const hasBottom = worldY < mapData.height - 1 && mapData.cells[worldY + 1][worldX].tile_type_id === tileTypeId;
        const hasLeft = worldX > 0 && mapData.cells[worldY][worldX - 1].tile_type_id === tileTypeId;
        const hasRight = worldX < mapData.width - 1 && mapData.cells[worldY][worldX + 1].tile_type_id === tileTypeId;

        const shape: TileShape = (cell as any).shape || 'full';
        const fullness: number = (cell as any).fullness !== undefined ? (cell as any).fullness : 1.0;

        renderRefinedTileCell(
          ctx,
          worldX,
          worldY,
          screenX,
          screenY,
          TILE_SIZE,
          record.tileType,
          { hasTop, hasBottom, hasLeft, hasRight },
          onAsyncImageLoaded,
          shape,
          fullness
        );

        // Cracking overlay if damaged
        if (showDamageMasks && cell.damage_threshold_index > 0) {
          drawThresholdCrackMask(
            ctx,
            screenX,
            screenY,
            TILE_SIZE,
            cell.damage_threshold_index,
            record.tileType.shares_damage_overlay,
            42
          );
        }
      }
    }
  }

  private evictOldestChunk(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, chunk] of this.cache.entries()) {
      if (chunk.lastAccessTime < oldestTime) {
        oldestTime = chunk.lastAccessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Global Singleton Instance
export const globalChunkCache = new ChunkCacheManager();
