export type ToolType = 'brush' | 'eraser' | 'bucket';
export type LayerType = 'procedural' | 'manual';
export type ModeType = 'paint' | 'play';

export interface TileType {
  id: string;
  name: string;
  color: string;
  type: 'terrain' | 'object' | 'biome';
  isWalkable: boolean;
}

export interface MapData {
  width: number;
  height: number;
  layers: {
    procedural: string[][];
    manual: (string | null)[][];
  };
}
