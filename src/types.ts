import { BiomeTileType, DamageType, TraversalModifierTag } from './engine/refinedBiomeSchema';

export interface RefinedCellState {
  biome_id: string; // The biome this cell belongs to (for biome background, ambient light & parallax)
  tile_type_id: string; // If empty string '', this is Open Air / Traversable space without a physical solid tile
  current_health: number;
  damage_threshold_index: number;
  environmental_detail_id?: string | null;
  interactive_detail_id?: string | null;
  wildlife_id?: string | null;
}

export interface RefinedMapData {
  width: number;
  height: number;
  cells: RefinedCellState[][];
}

export type ToolType = 'brush' | 'bucket' | 'eraser';
export type ModeType = 'paint' | 'play';
export type PaintCategory = 'tile_type' | 'environmental' | 'interactive' | 'wildlife';

// Legacy compatibility types
export interface TileType {
  id: string;
  name: string;
  color?: string;
  base_color?: string;
  type?: string;
  isWalkable?: boolean;
  blend_style?: string;
  softness?: number;
  fade_amount?: number;
  health?: number;
  armor_deduction?: number;
  defense_type?: DamageType;
  traversal_tags?: TraversalModifierTag[];
  speed_modifier?: number;
  shares_damage_overlay?: boolean;
}

export interface MapCell {
  tile_type_id: string;
  current_health: number;
  damage_threshold_index: number;
  [key: string]: any;
}

export interface MapData {
  width: number;
  height: number;
  cells?: MapCell[][];
  layers?: Record<string, any>;
  [key: string]: any;
}

export type LayerType = 'terrain' | 'flora' | 'interactive' | 'wildlife';
