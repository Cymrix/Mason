import { CombatEntity, DamageInstance, DamageType } from './schema';

// RPS Modality Dominance Wheel (8-point)
// Keys do 2x damage against their values, and 0.5x damage against what they are weak to.
const MODALITY_WHEEL: Record<DamageType, DamageType[]> = {
  kinetic: ['cryo'],
  cryo: ['thermal'],
  thermal: ['toxic'],
  toxic: ['radiant'],
  radiant: ['void'],
  void: ['psionic'],
  psionic: ['galvanic'],
  galvanic: ['kinetic'],
};

export const getRpsMultiplier = (attackType: DamageType, targetResistances: DamageType[] = []): number => {
  let multiplier = 1.0;
  
  // Base wheel logic (simplified for demonstration)
  if (targetResistances.some(res => MODALITY_WHEEL[attackType].includes(res))) {
    multiplier *= 2.0;
  }
  if (targetResistances.some(res => MODALITY_WHEEL[res]?.includes(attackType))) {
    multiplier *= 0.5;
  }

  return multiplier;
};

export const resolveDamage = (
  attack: DamageInstance, 
  defender: CombatEntity, 
  defenderResistances: DamageType[] = []
): number => {
  // 1. Is Vulnerable?
  const isVulnerable = defender.conditions.some(c => c.condition === 'vulnerable');
  let baseAmount = attack.amount;
  if (isVulnerable) {
    baseAmount *= 1.5; // All-critical window
  }

  // 2. Stance Check
  if (!attack.isIndefensible && defender.state.stance === 'blocking') {
    // Blocking logic could mitigate damage or negate entirely based on Foci
    baseAmount *= 0.2; 
  }

  if (defender.state.stance === 'dodging') {
    return 0; // I-frames
  }

  // 3. RPS Multiplier
  const rpsMult = getRpsMultiplier(attack.type, defenderResistances);
  let damageAfterRps = baseAmount * rpsMult;

  // 4. Armor Deduction
  // Simple flat deduction, can be modified by specific damage types later
  let finalDamage = Math.max(0, damageAfterRps - defender.armor);

  return finalDamage;
};

export const applyDamage = (entity: CombatEntity, damage: number): CombatEntity => {
  return {
    ...entity,
    health: Math.max(0, entity.health - damage)
  };
};
