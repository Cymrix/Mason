/**
 * Blob Autotile Bitmask Configuration & Catalog
 * Standard 47-Tile and 16-Tile Blob Autotiling Definitions
 */

export interface BlobTileDefinition {
  id: number;
  index: number;
  name: string;
  category: 'isolated' | 'pipe' | 'corner_outer' | 'corner_inner' | 't_junction' | 'fill' | 'complex';
  // Cardinal and Diagonal neighbor presence mask
  neighbors: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    topLeft?: boolean;
    topRight?: boolean;
    bottomLeft?: boolean;
    bottomRight?: boolean;
  };
  // Grid position in standard 47-tile matrix preview sheet (column 0..7, row 0..5)
  gridCol: number;
  gridRow: number;
}

/**
 * 47-Blob Autotile Catalog containing all topological connectivity states
 */
export const BLOB_47_TILESET: BlobTileDefinition[] = [
  // Row 0: Isolated and 1-neighbor pipes
  {
    id: 0,
    index: 0,
    name: 'Isolated Island (No Neighbors)',
    category: 'isolated',
    neighbors: { top: false, bottom: false, left: false, right: false },
    gridCol: 0,
    gridRow: 0
  },
  {
    id: 1,
    index: 1,
    name: 'North Pipe End',
    category: 'pipe',
    neighbors: { top: true, bottom: false, left: false, right: false },
    gridCol: 1,
    gridRow: 0
  },
  {
    id: 2,
    index: 2,
    name: 'South Pipe End',
    category: 'pipe',
    neighbors: { top: false, bottom: true, left: false, right: false },
    gridCol: 2,
    gridRow: 0
  },
  {
    id: 3,
    index: 3,
    name: 'West Pipe End',
    category: 'pipe',
    neighbors: { top: false, bottom: false, left: true, right: false },
    gridCol: 3,
    gridRow: 0
  },
  {
    id: 4,
    index: 4,
    name: 'East Pipe End',
    category: 'pipe',
    neighbors: { top: false, bottom: false, left: false, right: true },
    gridCol: 4,
    gridRow: 0
  },
  {
    id: 5,
    index: 5,
    name: 'Vertical Corridor (N + S)',
    category: 'pipe',
    neighbors: { top: true, bottom: true, left: false, right: false },
    gridCol: 5,
    gridRow: 0
  },
  {
    id: 6,
    index: 6,
    name: 'Horizontal Corridor (W + E)',
    category: 'pipe',
    neighbors: { top: false, bottom: false, left: true, right: true },
    gridCol: 6,
    gridRow: 0
  },
  {
    id: 7,
    index: 7,
    name: 'Interior Center Fill (All Neighbors)',
    category: 'fill',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: true, bottomLeft: true, bottomRight: true 
    },
    gridCol: 7,
    gridRow: 0
  },

  // Row 1: Outer Corners (2 neighbors at 90 deg)
  {
    id: 8,
    index: 8,
    name: 'Outer Corner: Top-Left (S + E)',
    category: 'corner_outer',
    neighbors: { top: false, bottom: true, left: false, right: true, bottomRight: true },
    gridCol: 0,
    gridRow: 1
  },
  {
    id: 9,
    index: 9,
    name: 'Outer Corner: Top-Right (S + W)',
    category: 'corner_outer',
    neighbors: { top: false, bottom: true, left: true, right: false, bottomLeft: true },
    gridCol: 1,
    gridRow: 1
  },
  {
    id: 10,
    index: 10,
    name: 'Outer Corner: Bottom-Left (N + E)',
    category: 'corner_outer',
    neighbors: { top: true, bottom: false, left: false, right: true, topRight: true },
    gridCol: 2,
    gridRow: 1
  },
  {
    id: 11,
    index: 11,
    name: 'Outer Corner: Bottom-Right (N + W)',
    category: 'corner_outer',
    neighbors: { top: true, bottom: false, left: true, right: false, topLeft: true },
    gridCol: 3,
    gridRow: 1
  },
  {
    id: 12,
    index: 12,
    name: 'Top Edge Wall (S + W + E)',
    category: 'pipe',
    neighbors: { top: false, bottom: true, left: true, right: true, bottomLeft: true, bottomRight: true },
    gridCol: 4,
    gridRow: 1
  },
  {
    id: 13,
    index: 13,
    name: 'Bottom Edge Wall (N + W + E)',
    category: 'pipe',
    neighbors: { top: true, bottom: false, left: true, right: true, topLeft: true, topRight: true },
    gridCol: 5,
    gridRow: 1
  },
  {
    id: 14,
    index: 14,
    name: 'Left Edge Wall (N + S + E)',
    category: 'pipe',
    neighbors: { top: true, bottom: true, left: false, right: true, topRight: true, bottomRight: true },
    gridCol: 6,
    gridRow: 1
  },
  {
    id: 15,
    index: 15,
    name: 'Right Edge Wall (N + S + W)',
    category: 'pipe',
    neighbors: { top: true, bottom: true, left: true, right: false, topLeft: true, bottomLeft: true },
    gridCol: 7,
    gridRow: 1
  },

  // Row 2: T-Junctions & Single Inner Notch Corners
  {
    id: 16,
    index: 16,
    name: 'T-Junction: North-South-East (N+S+E)',
    category: 't_junction',
    neighbors: { top: true, bottom: true, left: false, right: true },
    gridCol: 0,
    gridRow: 2
  },
  {
    id: 17,
    index: 17,
    name: 'T-Junction: North-South-West (N+S+W)',
    category: 't_junction',
    neighbors: { top: true, bottom: true, left: true, right: false },
    gridCol: 1,
    gridRow: 2
  },
  {
    id: 18,
    index: 18,
    name: 'T-Junction: West-East-South (W+E+S)',
    category: 't_junction',
    neighbors: { top: false, bottom: true, left: true, right: true },
    gridCol: 2,
    gridRow: 2
  },
  {
    id: 19,
    index: 19,
    name: 'T-Junction: West-East-North (W+E+N)',
    category: 't_junction',
    neighbors: { top: true, bottom: false, left: true, right: true },
    gridCol: 3,
    gridRow: 2
  },
  {
    id: 20,
    index: 20,
    name: '4-Way Intersection Cross',
    category: 't_junction',
    neighbors: { top: true, bottom: true, left: true, right: true },
    gridCol: 4,
    gridRow: 2
  },
  {
    id: 21,
    index: 21,
    name: 'Inner Notch: Top-Left Missing',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: true, bottomLeft: true, bottomRight: true 
    },
    gridCol: 5,
    gridRow: 2
  },
  {
    id: 22,
    index: 22,
    name: 'Inner Notch: Top-Right Missing',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: false, bottomLeft: true, bottomRight: true 
    },
    gridCol: 6,
    gridRow: 2
  },
  {
    id: 23,
    index: 23,
    name: 'Inner Notch: Bottom-Left Missing',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: true, bottomLeft: false, bottomRight: true 
    },
    gridCol: 7,
    gridRow: 2
  },

  // Row 3: Double Inner Notches & Diagonals
  {
    id: 24,
    index: 24,
    name: 'Inner Notch: Bottom-Right Missing',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: true, bottomLeft: true, bottomRight: false 
    },
    gridCol: 0,
    gridRow: 3
  },
  {
    id: 25,
    index: 25,
    name: 'Dual Inner Notch: Top-Left & Top-Right',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: false, bottomLeft: true, bottomRight: true 
    },
    gridCol: 1,
    gridRow: 3
  },
  {
    id: 26,
    index: 26,
    name: 'Dual Inner Notch: Bottom-Left & Bottom-Right',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: true, bottomLeft: false, bottomRight: false 
    },
    gridCol: 2,
    gridRow: 3
  },
  {
    id: 27,
    index: 27,
    name: 'Dual Inner Notch: Top-Left & Bottom-Left',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: true, bottomLeft: false, bottomRight: true 
    },
    gridCol: 3,
    gridRow: 3
  },
  {
    id: 28,
    index: 28,
    name: 'Dual Inner Notch: Top-Right & Bottom-Right',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: false, bottomLeft: true, bottomRight: false 
    },
    gridCol: 4,
    gridRow: 3
  },
  {
    id: 29,
    index: 29,
    name: 'Diagonal Opposite Notches (TL + BR)',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: true, bottomLeft: true, bottomRight: false 
    },
    gridCol: 5,
    gridRow: 3
  },
  {
    id: 30,
    index: 30,
    name: 'Diagonal Opposite Notches (TR + BL)',
    category: 'corner_inner',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: true, topRight: false, bottomLeft: false, bottomRight: true 
    },
    gridCol: 6,
    gridRow: 3
  },
  {
    id: 31,
    index: 31,
    name: 'Triple Inner Notch: Missing TL, TR, BL',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: false, bottomLeft: false, bottomRight: true 
    },
    gridCol: 7,
    gridRow: 3
  },

  // Row 4: Quad Inner Notch & Wall/Corner combinations
  {
    id: 32,
    index: 32,
    name: 'Quad Inner Notch: 4 Missing Corners',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: true, right: true,
      topLeft: false, topRight: false, bottomLeft: false, bottomRight: false 
    },
    gridCol: 0,
    gridRow: 4
  },
  {
    id: 33,
    index: 33,
    name: 'Top Wall with Bottom-Right Notch',
    category: 'complex',
    neighbors: { 
      top: false, bottom: true, left: true, right: true,
      bottomLeft: true, bottomRight: false 
    },
    gridCol: 1,
    gridRow: 4
  },
  {
    id: 34,
    index: 34,
    name: 'Top Wall with Bottom-Left Notch',
    category: 'complex',
    neighbors: { 
      top: false, bottom: true, left: true, right: true,
      bottomLeft: false, bottomRight: true 
    },
    gridCol: 2,
    gridRow: 4
  },
  {
    id: 35,
    index: 35,
    name: 'Bottom Wall with Top-Right Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: false, left: true, right: true,
      topLeft: true, topRight: false 
    },
    gridCol: 3,
    gridRow: 4
  },
  {
    id: 36,
    index: 36,
    name: 'Bottom Wall with Top-Left Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: false, left: true, right: true,
      topLeft: false, topRight: true 
    },
    gridCol: 4,
    gridRow: 4
  },
  {
    id: 37,
    index: 37,
    name: 'Left Wall with Top-Right Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: false, right: true,
      topRight: false, bottomRight: true 
    },
    gridCol: 5,
    gridRow: 4
  },
  {
    id: 38,
    index: 38,
    name: 'Left Wall with Bottom-Right Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: false, right: true,
      topRight: true, bottomRight: false 
    },
    gridCol: 6,
    gridRow: 4
  },
  {
    id: 39,
    index: 39,
    name: 'Right Wall with Top-Left Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: true, right: false,
      topLeft: false, bottomLeft: true 
    },
    gridCol: 7,
    gridRow: 4
  },

  // Row 5: Remaining combinations
  {
    id: 40,
    index: 40,
    name: 'Right Wall with Bottom-Left Notch',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: true, right: false,
      topLeft: true, bottomLeft: false 
    },
    gridCol: 0,
    gridRow: 5
  },
  {
    id: 41,
    index: 41,
    name: 'Top Wall with Both Bottom Notches',
    category: 'complex',
    neighbors: { 
      top: false, bottom: true, left: true, right: true,
      bottomLeft: false, bottomRight: false 
    },
    gridCol: 1,
    gridRow: 5
  },
  {
    id: 42,
    index: 42,
    name: 'Bottom Wall with Both Top Notches',
    category: 'complex',
    neighbors: { 
      top: true, bottom: false, left: true, right: true,
      topLeft: false, topRight: false 
    },
    gridCol: 2,
    gridRow: 5
  },
  {
    id: 43,
    index: 43,
    name: 'Left Wall with Both Right Notches',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: false, right: true,
      topRight: false, bottomRight: false 
    },
    gridCol: 3,
    gridRow: 5
  },
  {
    id: 44,
    index: 44,
    name: 'Right Wall with Both Left Notches',
    category: 'complex',
    neighbors: { 
      top: true, bottom: true, left: true, right: false,
      topLeft: false, bottomLeft: false 
    },
    gridCol: 4,
    gridRow: 5
  },
  {
    id: 45,
    index: 45,
    name: 'Outer Corner TL with Notch',
    category: 'complex',
    neighbors: { top: false, bottom: true, left: false, right: true, bottomRight: false },
    gridCol: 5,
    gridRow: 5
  },
  {
    id: 46,
    index: 46,
    name: 'Outer Corner TR with Notch',
    category: 'complex',
    neighbors: { top: false, bottom: true, left: true, right: false, bottomLeft: false },
    gridCol: 6,
    gridRow: 5
  }
];
