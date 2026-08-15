export type DamageType = 'kinetic' | 'thermal' | 'cryo' | 'galvanic' | 'toxic' | 'radiant' | 'void' | 'psionic';

export type ConditionType = 'vulnerable' | 'stunned' | 'burning' | 'frozen' | 'shocked';

export interface DamageInstance {
  amount: number;
  type: DamageType;
  isIndefensible?: boolean;
  isUninterruptible?: boolean;
}

export interface Effect {
  id: string;
  condition: ConditionType;
  durationMs: number;
  value?: number;
}

export interface FociVariant {
  id: string;
  name: string;
  description: string;
  damageModifiers?: Record<DamageType, number>;
  effects?: Effect[];
}

export interface Foci {
  id: string;
  name: string;
  type: 'action' | 'ability' | 'armor' | 'defensive';
  baseDamage?: DamageInstance[];
  passiveDefense?: number;
  variants: [FociVariant, ...FociVariant[]]; // Base + up to 8 deviations
}

export type TraversalTag = 'double_jump' | 'wall_climb' | 'dash' | 'glide';

export interface Archetype {
  id: string;
  name: string;
  backstory: string;
  traversalTags: TraversalTag[];
  foci: {
    action: [string, string, string]; // IDs of up to 3 action foci
    ability: [string, string, string, string]; // IDs of up to 4 ability foci
    armor: string;
    defensive: string;
  };
  baseStats: {
    health: number;
    energy: number;
  };
}

export interface CombatEntity {
  id: string;
  archetypeId: string | null;
  health: number;
  maxHealth: number;
  armor: number;
  conditions: Effect[];
  state: {
    movement: 'idle' | 'moving' | 'airborne';
    action: 'none' | 'attacking' | 'recovering' | 'stunned';
    stance: 'normal' | 'blocking' | 'dodging';
  };
}
