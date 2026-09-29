/**
 * Collision Tags & Matrix Engine Schema
 * Defines the 2D collision tag matrix for physics, hitboxes, character capsule colliders,
 * map solids, environmental weather FX, projectiles, and particle systems.
 */

export interface CollisionMatrixConfig {
  tags: string[];
  matrix: Record<string, Record<string, boolean>>;
  tagColors?: Record<string, string>;
}

export const DEFAULT_COLLISION_TAGS: string[] = [
  'solids',
  'player',
  'enemy',
  'player_attack',
  'enemy_attack',
  'hazard',
  'pickup',
  'npc',
  'weather',
  'particles',
  'trigger'
];

export const DEFAULT_TAG_COLORS: Record<string, string> = {
  solids: '#eab308',      // Amber / Gold for terrain solids
  player: '#38bdf8',      // Sky Blue for player character
  enemy: '#f43f5e',       // Rose / Crimson for enemy mobs
  player_attack: '#818cf8', // Indigo for player attacks / spells
  enemy_attack: '#fb7185',  // Coral for enemy attacks / projectiles
  hazard: '#ef4444',      // Red for spikes, lava, acid
  pickup: '#22c55e',      // Green for loot, coins, pickups
  npc: '#a855f7',         // Purple for friendly NPCs
  weather: '#06b6d4',     // Cyan for rain, snow, atmospheric FX
  particles: '#94a3b8',   // Slate for general visual particle FX
  trigger: '#f59e0b'      // Orange for interactive zones / doors
};

/**
 * Default Metroidvania Collision Rules:
 * - Weather & particles do NOT collide with player, enemy, npc, or attacks.
 * - Player collides with solids, enemy, enemy_attack, hazard, pickup, npc, trigger.
 * - Enemy collides with solids, player, player_attack, hazard.
 * - Solids block physical entities (player, enemy, attacks, pickups).
 */
export const DEFAULT_COLLISION_MATRIX: Record<string, Record<string, boolean>> = {
  solids: {
    solids: false,
    player: true,
    enemy: true,
    player_attack: true,
    enemy_attack: true,
    hazard: false,
    pickup: true,
    npc: true,
    weather: true, // Solids block rain & atmospheric weather particles that have collision enabled
    particles: true, // Solids block general particles that have collision enabled
    trigger: false
  },
  player: {
    solids: true,
    player: false,
    enemy: true,
    player_attack: false,
    enemy_attack: true,
    hazard: true,
    pickup: true,
    npc: true,
    weather: false, // Weather/rain passes through player without blocking movement
    particles: false,
    trigger: true
  },
  enemy: {
    solids: true,
    player: true,
    enemy: true,
    player_attack: true,
    enemy_attack: false,
    hazard: true,
    pickup: false,
    npc: false,
    weather: false, // Weather/rain passes through enemy mobs
    particles: false,
    trigger: false
  },
  player_attack: {
    solids: true,
    player: false,
    enemy: true,
    player_attack: false,
    enemy_attack: false,
    hazard: true,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: true
  },
  enemy_attack: {
    solids: true,
    player: true,
    enemy: false,
    player_attack: false,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: true,
    weather: false,
    particles: false,
    trigger: false
  },
  hazard: {
    solids: false,
    player: true,
    enemy: true,
    player_attack: true,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: true,
    weather: false,
    particles: false,
    trigger: false
  },
  pickup: {
    solids: true,
    player: true,
    enemy: false,
    player_attack: false,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: false
  },
  npc: {
    solids: true,
    player: true,
    enemy: false,
    player_attack: false,
    enemy_attack: true,
    hazard: true,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: false
  },
  weather: {
    solids: true,
    player: false,
    enemy: false,
    player_attack: false,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: false
  },
  particles: {
    solids: true,
    player: false,
    enemy: false,
    player_attack: false,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: false
  },
  trigger: {
    solids: false,
    player: true,
    enemy: false,
    player_attack: true,
    enemy_attack: false,
    hazard: false,
    pickup: false,
    npc: false,
    weather: false,
    particles: false,
    trigger: false
  }
};

export const createDefaultCollisionMatrixConfig = (): CollisionMatrixConfig => {
  return {
    tags: [...DEFAULT_COLLISION_TAGS],
    matrix: JSON.parse(JSON.stringify(DEFAULT_COLLISION_MATRIX)),
    tagColors: { ...DEFAULT_TAG_COLORS }
  };
};

/**
 * Checks if two collision tags should collide according to the matrix config
 */
export function canCollide(
  matrixConfig: CollisionMatrixConfig | undefined | null,
  tagA?: string | null,
  tagB?: string | null
): boolean {
  if (!tagA || !tagB) return true;
  const a = tagA.toLowerCase().trim();
  const b = tagB.toLowerCase().trim();

  // If no matrix provided, use default sensible rules
  if (!matrixConfig || !matrixConfig.matrix) {
    if ((a === 'weather' && b === 'solids') || (b === 'weather' && a === 'solids')) {
      return true; // Weather / rain collides with map solid tiles
    }
    if ((a === 'particles' && b === 'solids') || (b === 'particles' && a === 'solids')) {
      return true; // Particles collide with map solid tiles
    }
    if (a === 'weather' || b === 'weather') {
      return false; // Weather never collides with characters/attacks by default
    }
    if (a === 'particles' || b === 'particles') {
      return false;
    }
    if ((a === 'player' && b === 'player_attack') || (b === 'player' && a === 'player_attack')) {
      return false;
    }
    if ((a === 'enemy' && b === 'enemy_attack') || (b === 'enemy' && a === 'enemy_attack')) {
      return false;
    }
    return true;
  }

  // Check symmetric matrix lookup
  if (matrixConfig.matrix[a] && matrixConfig.matrix[a][b] !== undefined) {
    return matrixConfig.matrix[a][b];
  }
  if (matrixConfig.matrix[b] && matrixConfig.matrix[b][a] !== undefined) {
    return matrixConfig.matrix[b][a];
  }

  // Default fallback if tag pair is unlisted
  if ((a === 'weather' && b === 'solids') || (b === 'weather' && a === 'solids')) {
    return true;
  }
  if ((a === 'particles' && b === 'solids') || (b === 'particles' && a === 'solids')) {
    return true;
  }
  if (a === 'weather' || b === 'weather' || a === 'particles' || b === 'particles') {
    return false;
  }
  return true;
}

/**
 * Symmetrically sets collision state between two tags
 */
export function setCollisionPair(
  config: CollisionMatrixConfig,
  tagA: string,
  tagB: string,
  value: boolean
): CollisionMatrixConfig {
  const nextMatrix: Record<string, Record<string, boolean>> = {};

  for (const t of config.tags) {
    nextMatrix[t] = { ...(config.matrix[t] || {}) };
  }

  if (!nextMatrix[tagA]) nextMatrix[tagA] = {};
  if (!nextMatrix[tagB]) nextMatrix[tagB] = {};

  nextMatrix[tagA][tagB] = value;
  nextMatrix[tagB][tagA] = value;

  return {
    ...config,
    matrix: nextMatrix
  };
}

/**
 * Adds a new tag to the collision matrix
 */
export function addCollisionTag(
  config: CollisionMatrixConfig,
  rawTag: string,
  color: string = '#38bdf8'
): CollisionMatrixConfig {
  const tag = rawTag.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  if (!tag || config.tags.includes(tag)) return config;

  const nextTags = [...config.tags, tag];
  const nextColors = { ...(config.tagColors || DEFAULT_TAG_COLORS), [tag]: color };
  const nextMatrix: Record<string, Record<string, boolean>> = {};

  for (const t of nextTags) {
    nextMatrix[t] = { ...(config.matrix[t] || {}) };
    if (nextMatrix[t][tag] === undefined) {
      nextMatrix[t][tag] = t === 'solids'; // Default new tags to collide with solids
    }
  }

  nextMatrix[tag] = {};
  for (const t of nextTags) {
    nextMatrix[tag][t] = t === 'solids';
  }

  return {
    tags: nextTags,
    matrix: nextMatrix,
    tagColors: nextColors
  };
}

/**
 * Removes a custom tag from the collision matrix
 */
export function removeCollisionTag(
  config: CollisionMatrixConfig,
  tagToRemove: string
): CollisionMatrixConfig {
  const tag = tagToRemove.toLowerCase().trim();
  const nextTags = config.tags.filter(t => t !== tag);
  const nextColors = { ...(config.tagColors || DEFAULT_TAG_COLORS) };
  delete nextColors[tag];

  const nextMatrix: Record<string, Record<string, boolean>> = {};
  for (const t of nextTags) {
    nextMatrix[t] = {};
    for (const other of nextTags) {
      nextMatrix[t][other] = config.matrix[t]?.[other] ?? false;
    }
  }

  return {
    tags: nextTags,
    matrix: nextMatrix,
    tagColors: nextColors
  };
}
