import { TileType } from './types';

export const TILE_SIZE = 32;

export const PALETTE: TileType[] = [
  // Terrain / Biomes
  { id: 'water', name: 'Water', color: '#3b82f6', type: 'terrain', isWalkable: false },
  { id: 'grass', name: 'Grass', color: '#22c55e', type: 'terrain', isWalkable: true },
  { id: 'dirt', name: 'Dirt', color: '#a16207', type: 'terrain', isWalkable: true },
  { id: 'stone', name: 'Stone', color: '#78716c', type: 'terrain', isWalkable: true },
  { id: 'sand', name: 'Sand', color: '#fde047', type: 'terrain', isWalkable: true },
  
  // Objects / Manual Layer
  { id: 'wall', name: 'Brick Wall', color: '#991b1b', type: 'object', isWalkable: false },
  { id: 'tree', name: 'Tree', color: '#166534', type: 'object', isWalkable: false },
  { id: 'rock', name: 'Boulder', color: '#44403c', type: 'object', isWalkable: false },
];

export const TILE_MAP = PALETTE.reduce((acc, tile) => {
  acc[tile.id] = tile;
  return acc;
}, {} as Record<string, TileType>);
