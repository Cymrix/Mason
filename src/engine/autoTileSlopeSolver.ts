import { TileShape } from './tileShape';

export interface NeighborPresence {
  hasTop: boolean;
  hasBottom: boolean;
  hasLeft: boolean;
  hasRight: boolean;
  hasTopLeft?: boolean;
  hasTopRight?: boolean;
  hasBottomLeft?: boolean;
  hasBottomRight?: boolean;
}

/**
 * Determines the autotiled slope shape for a cell based on its neighborhood.
 * For soft materials (or when auto-beveling is enabled), isolated outer corners
 * automatically resolve into 45° diagonal ramps.
 */
export function resolveAutoTileShape(
  bevelProbability: number,
  cellX: number,
  cellY: number,
  neighbors: NeighborPresence,
  manualShape?: TileShape
): TileShape {
  // If user specified an explicit non-full shape manually, honor it
  if (manualShape && manualShape !== 'full') {
    return manualShape;
  }

  // Only materials that allow slopes auto-bevel by default (unless otherwise specified)
  if (bevelProbability <= 0) {
    return 'full';
  }

  // Probabilistic bevel evaluation based on world/cell coordinates
  if (bevelProbability < 1) {
    // Simple pseudo-random hash based on coordinates
    const prng = Math.abs(Math.sin(cellX * 12.9898 + cellY * 78.233) * 43758.5453) % 1;
    if (prng > bevelProbability) {
      return 'full'; // Failed probability check, stay square
    }
  }

  const { hasTop, hasBottom, hasLeft, hasRight } = neighbors;

  // 1. Convex Outer Corners (Exposed corner of terrain)
  // Top-Left convex outer corner (needs bottom & right neighbors, open top & left)
  // Slope rises up to the right: ◤ (slope_up_right_45)
  if (!hasTop && !hasLeft && hasRight && hasBottom) {
    return 'slope_up_right_45';
  }

  // Top-Right convex outer corner (needs bottom & left neighbors, open top & right)
  // Slope rises up to the left: ◥ (slope_up_left_45)
  if (!hasTop && !hasRight && hasLeft && hasBottom) {
    return 'slope_up_left_45';
  }

  // Bottom-Left convex outer corner (needs top & right neighbors, open bottom & left)
  // Slope rises down to the right (ceiling slope): ◣ (slope_down_right_45)
  if (!hasBottom && !hasLeft && hasRight && hasTop) {
    return 'slope_down_right_45';
  }

  // Bottom-Right convex outer corner (needs top & left neighbors, open bottom & right)
  // Slope rises down to the left (ceiling slope): ◢ (slope_down_left_45)
  if (!hasBottom && !hasRight && hasLeft && hasTop) {
    return 'slope_down_left_45';
  }

  // 2. Diagonal Ridge / Isolated step slopes
  if (!hasTop && !hasRight && !hasLeft && hasBottom) {
    if (neighbors.hasBottomLeft && !neighbors.hasBottomRight) {
      // Staircase rising to the right, this is the top-right tip.
      return 'slope_up_left_45'; // ◣
    }
    if (neighbors.hasBottomRight && !neighbors.hasBottomLeft) {
      // Staircase rising to the left, this is the top-left tip.
      return 'slope_up_right_45'; // ◢
    }
    // Symmetrical 1x1 peak or column
    return 'full';
  }

  // 3. Overhang Ledges (No support below, supported horizontally)
  // Overhang pointing right (support on left, air below, air top, air right)
  if (!hasTop && !hasBottom && !hasRight && hasLeft) {
    return 'slope_down_left_45';
  }

  // Overhang pointing left (support on right, air below, air top, air left)
  if (!hasTop && !hasBottom && !hasLeft && hasRight) {
    return 'slope_down_right_45';
  }

  // 4. Diagonal Ceiling Ridge / Isolated downward steps
  if (hasTop && !hasBottom && !hasLeft && !hasRight) {
    if (neighbors.hasTopLeft && !neighbors.hasTopRight) {
      return 'slope_down_left_45'; // ◤
    }
    if (neighbors.hasTopRight && !neighbors.hasTopLeft) {
      return 'slope_down_right_45'; // ◥
    }
    return 'full';
  }

  return 'full';
}
