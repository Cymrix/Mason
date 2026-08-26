import { 
  PrefabBone, 
  PrefabIKTarget, 
  PrefabSkeleton, 
  PrefabBoneKeyframe, 
  PrefabPart 
} from './masonProjectSchema';

export interface BoneWorldTransform {
  boneId: string;
  parentBoneId?: string | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  worldAngleDeg: number;
  localAngleDeg: number;
  length: number;
}

// Normalize angle between -180 and 180 degrees
export function normalizeAngleDeg(deg: number): number {
  let angle = deg % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

// Convert degrees to radians
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Shortest angle difference in degrees (b - a)
export function angleDiffDeg(a: number, b: number): number {
  let diff = (b - a) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// Interpolate angles along shortest arc
export function lerpAngleDeg(a: number, b: number, t: number): number {
  const diff = angleDiffDeg(a, b);
  return normalizeAngleDeg(a + diff * t);
}

/**
 * Computes forward kinematics world transforms for all bones in the skeleton
 */
export function computeBoneWorldTransforms(
  bones: PrefabBone[],
  rootX: number = 0,
  rootY: number = 0,
  boneRotationOverrides?: Record<string, number>
): Map<string, BoneWorldTransform> {
  const transforms = new Map<string, BoneWorldTransform>();
  const boneMap = new Map<string, PrefabBone>();
  bones.forEach(b => boneMap.set(b.id, b));

  // Find root bones and resolve depth-first
  const visited = new Set<string>();

  function resolveBone(bone: PrefabBone, parentTransform?: BoneWorldTransform) {
    if (visited.has(bone.id)) return;
    visited.add(bone.id);

    const localAngle = boneRotationOverrides && boneRotationOverrides[bone.id] !== undefined
      ? boneRotationOverrides[bone.id]
      : bone.localAngleDeg;

    let startX = rootX;
    let startY = rootY;
    let worldAngle = localAngle;

    if (parentTransform) {
      startX = parentTransform.endX;
      startY = parentTransform.endY;
      worldAngle = normalizeAngleDeg(parentTransform.worldAngleDeg + localAngle);
    }

    const rad = degToRad(worldAngle);
    const endX = startX + Math.cos(rad) * bone.length;
    const endY = startY + Math.sin(rad) * bone.length;

    const transform: BoneWorldTransform = {
      boneId: bone.id,
      parentBoneId: bone.parentBoneId,
      startX,
      startY,
      endX,
      endY,
      worldAngleDeg: worldAngle,
      localAngleDeg: localAngle,
      length: bone.length
    };

    transforms.set(bone.id, transform);

    // Resolve children
    bones
      .filter(b => b.parentBoneId === bone.id)
      .forEach(child => resolveBone(child, transform));
  }

  // First resolve root bones (no parent or invalid parent)
  bones
    .filter(b => !b.parentBoneId || !boneMap.has(b.parentBoneId))
    .forEach(root => resolveBone(root));

  // Resolve any lingering bones (e.g. disconnected or out-of-order)
  bones.forEach(b => {
    if (!visited.has(b.id)) {
      const parent = b.parentBoneId ? transforms.get(b.parentBoneId) : undefined;
      resolveBone(b, parent);
    }
  });

  return transforms;
}

/**
 * Analytical 2-Bone Inverse Kinematics solver using Trigonometric Law of Cosines
 */
export function solveTwoBoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  length1: number,
  length2: number,
  flipBend: boolean = false,
  parentWorldAngleDeg: number = 0
): {
  bone1LocalAngleDeg: number;
  bone2LocalAngleDeg: number;
  bone1WorldAngleDeg: number;
  bone2WorldAngleDeg: number;
  reached: boolean;
} {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const dist = Math.hypot(dx, dy);
  const targetAngleDeg = radToDeg(Math.atan2(dy, dx));

  const maxReach = length1 + length2;
  const minReach = Math.abs(length1 - length2);

  // Target out of reach (too far) -> stretch straight towards target
  if (dist >= maxReach - 0.001) {
    const world1 = targetAngleDeg;
    const world2 = targetAngleDeg;
    return {
      bone1WorldAngleDeg: world1,
      bone2WorldAngleDeg: world2,
      bone1LocalAngleDeg: normalizeAngleDeg(world1 - parentWorldAngleDeg),
      bone2LocalAngleDeg: 0,
      reached: false
    };
  }

  // Target too close (collapsed)
  if (dist <= minReach + 0.001) {
    const world1 = targetAngleDeg;
    const world2 = normalizeAngleDeg(targetAngleDeg + 180);
    return {
      bone1WorldAngleDeg: world1,
      bone2WorldAngleDeg: world2,
      bone1LocalAngleDeg: normalizeAngleDeg(world1 - parentWorldAngleDeg),
      bone2LocalAngleDeg: 180,
      reached: false
    };
  }

  // Law of cosines:
  // c^2 = a^2 + b^2 - 2ab * cos(C)
  // cos(alpha) = (L1^2 + D^2 - L2^2) / (2 * L1 * D)
  const cosAlpha = Math.max(-1, Math.min(1, (length1 * length1 + dist * dist - length2 * length2) / (2 * length1 * dist)));
  const alphaDeg = radToDeg(Math.acos(cosAlpha));

  // cos(beta) = (L1^2 + L2^2 - D^2) / (2 * L1 * L2)
  const cosBeta = Math.max(-1, Math.min(1, (length1 * length1 + length2 * length2 - dist * dist) / (2 * length1 * length2)));
  const betaDeg = radToDeg(Math.acos(cosBeta));

  let world1: number;
  let local2: number;

  if (!flipBend) {
    world1 = normalizeAngleDeg(targetAngleDeg - alphaDeg);
    local2 = normalizeAngleDeg(180 - betaDeg);
  } else {
    world1 = normalizeAngleDeg(targetAngleDeg + alphaDeg);
    local2 = normalizeAngleDeg(-(180 - betaDeg));
  }

  const world2 = normalizeAngleDeg(world1 + local2);

  return {
    bone1WorldAngleDeg: world1,
    bone2WorldAngleDeg: world2,
    bone1LocalAngleDeg: normalizeAngleDeg(world1 - parentWorldAngleDeg),
    bone2LocalAngleDeg: local2,
    reached: true
  };
}

/**
 * Multi-Bone CCD (Cyclic Coordinate Descent) Inverse Kinematics Solver
 * Solves N-bone chains with joint constraints (minAngleDeg / maxAngleDeg).
 */
export function solveCCDIK(
  chainBones: PrefabBone[],
  allBones: PrefabBone[],
  targetX: number,
  targetY: number,
  rootX: number,
  rootY: number,
  currentRotations: Record<string, number>,
  maxIterations: number = 15,
  tolerance: number = 0.5
): Record<string, number> {
  const resultRotations = { ...currentRotations };
  if (chainBones.length === 0) return resultRotations;

  const tipBone = chainBones[chainBones.length - 1];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Traverse from tip towards root
    for (let i = chainBones.length - 1; i >= 0; i--) {
      const bone = chainBones[i];
      const transforms = computeBoneWorldTransforms(allBones, rootX, rootY, resultRotations);
      const tipTransform = transforms.get(tipBone.id);
      const boneTransform = transforms.get(bone.id);

      if (!tipTransform || !boneTransform) continue;

      const currentTipX = tipTransform.endX;
      const currentTipY = tipTransform.endY;

      // Distance to target
      const dist = Math.hypot(targetX - currentTipX, targetY - currentTipY);
      if (dist < tolerance) {
        return resultRotations;
      }

      // Vector from joint to current tip
      const toTipX = currentTipX - boneTransform.startX;
      const toTipY = currentTipY - boneTransform.startY;
      const angleToTip = Math.atan2(toTipY, toTipX);

      // Vector from joint to target
      const toTargetX = targetX - boneTransform.startX;
      const toTargetY = targetY - boneTransform.startY;
      const angleToTarget = Math.atan2(toTargetY, toTargetX);

      // Angle difference to rotate joint
      const deltaAngle = radToDeg(angleToTarget - angleToTip);
      let newLocal = normalizeAngleDeg((resultRotations[bone.id] ?? bone.localAngleDeg) + deltaAngle);

      // Apply joint limits if configured
      if (bone.minAngleDeg !== undefined) {
        newLocal = Math.max(bone.minAngleDeg, newLocal);
      }
      if (bone.maxAngleDeg !== undefined) {
        newLocal = Math.min(bone.maxAngleDeg, newLocal);
      }

      resultRotations[bone.id] = newLocal;
    }
  }

  return resultRotations;
}

/**
 * Solves all active IK targets for a full skeleton
 */
export function solveSkeletonIK(
  skeleton: PrefabSkeleton,
  ikOverrides?: Record<string, { targetX?: number; targetY?: number; x?: number; y?: number; flipBend?: boolean }>,
  boneRotationOverrides?: Record<string, number>
): {
  boneRotations: Record<string, number>;
  transforms: Map<string, BoneWorldTransform>;
} {
  const bones = skeleton.bones || [];
  const ikTargets = skeleton.ikTargets || [];
  const rootX = skeleton.rootX || 0;
  const rootY = skeleton.rootY || 0;

  const boneMap = new Map<string, PrefabBone>();
  bones.forEach(b => boneMap.set(b.id, b));

  const currentRotations: Record<string, number> = {};
  bones.forEach(b => {
    currentRotations[b.id] = boneRotationOverrides && boneRotationOverrides[b.id] !== undefined
      ? boneRotationOverrides[b.id]
      : b.localAngleDeg;
  });

  // Solve each enabled IK target
  for (const ik of ikTargets) {
    if (!ik.enabled && !ikOverrides?.[ik.id]) continue;

    const override = ikOverrides?.[ik.id];
    const targetX = override?.targetX ?? override?.x ?? ik.targetX;
    const targetY = override?.targetY ?? override?.y ?? ik.targetY;
    const flipBend = override?.flipBend ?? ik.flipBend ?? false;

    // Collect chain from chainRootBoneId to endEffectorBoneId
    const chain: PrefabBone[] = [];
    let cur: PrefabBone | undefined = boneMap.get(ik.endEffectorBoneId);

    while (cur) {
      chain.unshift(cur);
      if (cur.id === ik.chainRootBoneId) break;
      cur = cur.parentBoneId ? boneMap.get(cur.parentBoneId) : undefined;
    }

    if (chain.length === 0 || chain[0].id !== ik.chainRootBoneId) {
      continue; // Invalid chain
    }

    // 2-Bone Analytical IK
    if (chain.length === 2) {
      const bone1 = chain[0];
      const bone2 = chain[1];
      const initialTransforms = computeBoneWorldTransforms(bones, rootX, rootY, currentRotations);
      const b1Trans = initialTransforms.get(bone1.id);
      if (!b1Trans) continue;

      const parentTransform = bone1.parentBoneId ? initialTransforms.get(bone1.parentBoneId) : undefined;
      const parentAngle = parentTransform ? parentTransform.worldAngleDeg : 0;

      const sol = solveTwoBoneIK(
        b1Trans.startX,
        b1Trans.startY,
        targetX,
        targetY,
        bone1.length,
        bone2.length,
        flipBend,
        parentAngle
      );

      let b1Angle = sol.bone1LocalAngleDeg;
      let b2Angle = sol.bone2LocalAngleDeg;

      if (bone1.minAngleDeg !== undefined) b1Angle = Math.max(bone1.minAngleDeg, b1Angle);
      if (bone1.maxAngleDeg !== undefined) b1Angle = Math.min(bone1.maxAngleDeg, b1Angle);
      if (bone2.minAngleDeg !== undefined) b2Angle = Math.max(bone2.minAngleDeg, b2Angle);
      if (bone2.maxAngleDeg !== undefined) b2Angle = Math.min(bone2.maxAngleDeg, b2Angle);

      currentRotations[bone1.id] = b1Angle;
      currentRotations[bone2.id] = b2Angle;
    } else {
      // Multi-Bone CCD IK (for 3+ bone chains)
      const solved = solveCCDIK(
        chain,
        bones,
        targetX,
        targetY,
        rootX,
        rootY,
        currentRotations,
        ik.maxIterations || 15
      );
      Object.assign(currentRotations, solved);
    }
  }

  const finalTransforms = computeBoneWorldTransforms(bones, rootX, rootY, currentRotations);

  return {
    boneRotations: currentRotations,
    transforms: finalTransforms
  };
}

/**
 * Interpolates smoothly between two bone keyframes
 */
export function interpolateBoneKeyframes(
  kfA: PrefabBoneKeyframe,
  kfB: PrefabBoneKeyframe,
  t: number,
  easing: 'linear' | 'ease-in-out' | 'smooth' = 'ease-in-out'
): {
  boneRotations: Record<string, number>;
  ikPositions: Record<string, { x: number; y: number; flipBend?: boolean }>;
} {
  // Compute ease factor
  let factor = Math.max(0, Math.min(1, t));
  if (easing === 'ease-in-out') {
    factor = factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
  } else if (easing === 'smooth') {
    factor = factor * factor * (3 - 2 * factor);
  }

  const interpolatedRotations: Record<string, number> = {};
  const allBoneIds = new Set([
    ...Object.keys(kfA.boneRotations || {}),
    ...Object.keys(kfB.boneRotations || {})
  ]);

  allBoneIds.forEach(id => {
    const rotA = kfA.boneRotations[id] ?? 0;
    const rotB = kfB.boneRotations[id] ?? rotA;
    interpolatedRotations[id] = lerpAngleDeg(rotA, rotB, factor);
  });

  const interpolatedIK: Record<string, { x: number; y: number; flipBend?: boolean }> = {};
  const allIKIds = new Set([
    ...Object.keys(kfA.ikPositions || {}),
    ...Object.keys(kfB.ikPositions || {})
  ]);

  allIKIds.forEach(id => {
    const posA = kfA.ikPositions?.[id];
    const posB = kfB.ikPositions?.[id];
    if (posA && posB) {
      interpolatedIK[id] = {
        x: posA.x + (posB.x - posA.x) * factor,
        y: posA.y + (posB.y - posA.y) * factor,
        flipBend: factor < 0.5 ? posA.flipBend : posB.flipBend
      };
    } else if (posA) {
      interpolatedIK[id] = { ...posA };
    } else if (posB) {
      interpolatedIK[id] = { ...posB };
    }
  });

  return {
    boneRotations: interpolatedRotations,
    ikPositions: interpolatedIK
  };
}

/**
 * Updates composite part positions and rotations based on bound bones
 */
export function applySkeletonPoseToParts(
  skeleton: PrefabSkeleton,
  transforms: Map<string, BoneWorldTransform>,
  parts: PrefabPart[]
): PrefabPart[] {
  const bones = skeleton.bones || [];
  const partMap = new Map<string, PrefabPart>();
  parts.forEach(p => partMap.set(p.id, { ...p }));

  bones.forEach(bone => {
    if (!bone.attachedPartId) return;
    const part = partMap.get(bone.attachedPartId);
    const trans = transforms.get(bone.id);
    if (!part || !trans) return;

    // Center part at bone center or start
    const midX = (trans.startX + trans.endX) / 2;
    const midY = (trans.startY + trans.endY) / 2;

    const offsetPx = bone.partOffsetPx || { x: 0, y: 0 };
    const rotOffset = bone.partRotationOffsetDeg || 0;

    part.offsetX = Math.round(midX + offsetPx.x);
    part.offsetY = Math.round(midY + offsetPx.y);
    part.rotationDeg = Math.round(normalizeAngleDeg(trans.worldAngleDeg + rotOffset));
  });

  return Array.from(partMap.values());
}

/**
 * Built-in Preset Skeleton Archetype Generators
 */
export type SkeletonPresetType = 
  | 'two_bone_limb'
  | 'tentacle_tail'
  | 'dragon_neck_head'
  | 'creature_wing'
  | 'biped_humanoid'
  | 'quadruped_beast';

export function generateSkeletonPreset(type: SkeletonPresetType): PrefabSkeleton {
  switch (type) {
    case 'two_bone_limb':
      return {
        rootX: 0,
        rootY: -16,
        bones: [
          {
            id: 'bone_upper_limb',
            name: 'Upper Limb',
            length: 28,
            localAngleDeg: 45,
            color: '#38bdf8',
            width: 7,
            minAngleDeg: -120,
            maxAngleDeg: 120
          },
          {
            id: 'bone_lower_limb',
            name: 'Lower Limb / Foot',
            parentBoneId: 'bone_upper_limb',
            length: 26,
            localAngleDeg: 45,
            color: '#0ea5e9',
            width: 6,
            minAngleDeg: -150,
            maxAngleDeg: 150
          }
        ],
        ikTargets: [
          {
            id: 'ik_limb_target',
            name: 'Limb IK Target',
            chainRootBoneId: 'bone_upper_limb',
            endEffectorBoneId: 'bone_lower_limb',
            targetX: 18,
            targetY: 28,
            flipBend: false,
            enabled: true,
            color: '#f59e0b'
          }
        ],
        animationTracks: [
          {
            id: 'track_idle',
            name: 'Idle Stance',
            durationFrames: 4,
            frameRateFps: 6,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_upper_limb: 45, bone_lower_limb: 45 },
                ikPositions: { ik_limb_target: { x: 18, y: 28, flipBend: false } }
              },
              {
                frameIndex: 2,
                boneRotations: { bone_upper_limb: 35, bone_lower_limb: 55 },
                ikPositions: { ik_limb_target: { x: 22, y: 24, flipBend: false } }
              }
            ]
          }
        ],
        activeTrackId: 'track_idle'
      };

    case 'tentacle_tail':
      return {
        rootX: -12,
        rootY: 10,
        bones: [
          {
            id: 'bone_tail_1',
            name: 'Tail Root',
            length: 20,
            localAngleDeg: 170,
            color: '#a855f7',
            width: 8
          },
          {
            id: 'bone_tail_2',
            name: 'Tail Mid 1',
            parentBoneId: 'bone_tail_1',
            length: 18,
            localAngleDeg: -20,
            color: '#c084fc',
            width: 7
          },
          {
            id: 'bone_tail_3',
            name: 'Tail Mid 2',
            parentBoneId: 'bone_tail_2',
            length: 16,
            localAngleDeg: -25,
            color: '#d8b4fe',
            width: 5
          },
          {
            id: 'bone_tail_4',
            name: 'Tail Tip',
            parentBoneId: 'bone_tail_3',
            length: 14,
            localAngleDeg: -30,
            color: '#f472b6',
            width: 4
          }
        ],
        ikTargets: [
          {
            id: 'ik_tail_tip',
            name: 'Tail Tip IK Target',
            chainRootBoneId: 'bone_tail_1',
            endEffectorBoneId: 'bone_tail_4',
            targetX: -54,
            targetY: -12,
            maxIterations: 20,
            enabled: true,
            color: '#ec4899'
          }
        ],
        animationTracks: [
          {
            id: 'track_tail_sway',
            name: 'Tail Whip & Sway',
            durationFrames: 6,
            frameRateFps: 8,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_tail_1: 170, bone_tail_2: -20, bone_tail_3: -25, bone_tail_4: -30 },
                ikPositions: { ik_tail_tip: { x: -54, y: -12 } }
              },
              {
                frameIndex: 3,
                boneRotations: { bone_tail_1: 190, bone_tail_2: 25, bone_tail_3: 30, bone_tail_4: 25 },
                ikPositions: { ik_tail_tip: { x: -48, y: 16 } }
              }
            ]
          }
        ],
        activeTrackId: 'track_tail_sway'
      };

    case 'dragon_neck_head':
      return {
        rootX: -10,
        rootY: 0,
        bones: [
          { id: 'bone_torso', name: 'Chest / Thorax', length: 24, localAngleDeg: -30, color: '#ef4444', width: 9 },
          { id: 'bone_neck_1', name: 'Neck Base', parentBoneId: 'bone_torso', length: 18, localAngleDeg: -40, color: '#f97316', width: 7 },
          { id: 'bone_neck_2', name: 'Neck Upper', parentBoneId: 'bone_neck_1', length: 16, localAngleDeg: 20, color: '#fb923c', width: 6 },
          { id: 'bone_head', name: 'Head / Horns', parentBoneId: 'bone_neck_2', length: 22, localAngleDeg: 35, color: '#facc15', width: 8 },
          { id: 'bone_jaw', name: 'Lower Jaw', parentBoneId: 'bone_head', length: 14, localAngleDeg: 25, color: '#eab308', width: 5 }
        ],
        ikTargets: [
          {
            id: 'ik_dragon_head',
            name: 'Head Aim IK Target',
            chainRootBoneId: 'bone_neck_1',
            endEffectorBoneId: 'bone_head',
            targetX: 32,
            targetY: -32,
            enabled: true,
            color: '#eab308'
          }
        ],
        animationTracks: [
          {
            id: 'track_dragon_roar',
            name: 'Dragon Roar & Breath',
            durationFrames: 6,
            frameRateFps: 8,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_torso: -30, bone_neck_1: -40, bone_neck_2: 20, bone_head: 35, bone_jaw: 10 },
                ikPositions: { ik_dragon_head: { x: 32, y: -32 } }
              },
              {
                frameIndex: 3,
                boneRotations: { bone_torso: -15, bone_neck_1: -70, bone_neck_2: 45, bone_head: 60, bone_jaw: 45 },
                ikPositions: { ik_dragon_head: { x: 42, y: -48 } }
              }
            ]
          }
        ],
        activeTrackId: 'track_dragon_roar'
      };

    case 'creature_wing':
      return {
        rootX: -4,
        rootY: -12,
        bones: [
          { id: 'bone_wing_shoulder', name: 'Wing Shoulder', length: 22, localAngleDeg: -70, color: '#6366f1', width: 8 },
          { id: 'bone_wing_elbow', name: 'Wing Elbow Joint', parentBoneId: 'bone_wing_shoulder', length: 26, localAngleDeg: 120, color: '#818cf8', width: 7 },
          { id: 'bone_wing_tip', name: 'Wing Tip & Talon', parentBoneId: 'bone_wing_elbow', length: 24, localAngleDeg: -35, color: '#a5b4fc', width: 5 },
          { id: 'bone_wing_membrane', name: 'Membrane Strut', parentBoneId: 'bone_wing_elbow', length: 20, localAngleDeg: 40, color: '#c7d2fe', width: 4 }
        ],
        ikTargets: [
          {
            id: 'ik_wing_tip',
            name: 'Wing Tip IK Target',
            chainRootBoneId: 'bone_wing_shoulder',
            endEffectorBoneId: 'bone_wing_tip',
            targetX: 36,
            targetY: -40,
            enabled: true,
            color: '#818cf8'
          }
        ],
        animationTracks: [
          {
            id: 'track_wing_flap',
            name: 'Wing Flap Cycle',
            durationFrames: 6,
            frameRateFps: 10,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_wing_shoulder: -70, bone_wing_elbow: 120, bone_wing_tip: -35, bone_wing_membrane: 40 },
                ikPositions: { ik_wing_tip: { x: 36, y: -40 } }
              },
              {
                frameIndex: 3,
                boneRotations: { bone_wing_shoulder: 20, bone_wing_elbow: 40, bone_wing_tip: 15, bone_wing_membrane: 20 },
                ikPositions: { ik_wing_tip: { x: 28, y: 15 } }
              }
            ]
          }
        ],
        activeTrackId: 'track_wing_flap'
      };

    case 'biped_humanoid':
      return {
        rootX: 0,
        rootY: 0,
        bones: [
          // Spine & Head
          { id: 'bone_hip', name: 'Pelvis / Hips', length: 14, localAngleDeg: -90, color: '#10b981', width: 8 },
          { id: 'bone_chest', name: 'Torso / Chest', parentBoneId: 'bone_hip', length: 18, localAngleDeg: 0, color: '#059669', width: 8 },
          { id: 'bone_head', name: 'Head', parentBoneId: 'bone_chest', length: 14, localAngleDeg: 0, color: '#34d399', width: 7 },
          // Left Leg
          { id: 'bone_l_thigh', name: 'L. Thigh', parentBoneId: 'bone_hip', length: 18, localAngleDeg: 160, color: '#3b82f6', width: 6 },
          { id: 'bone_l_shin', name: 'L. Shin & Foot', parentBoneId: 'bone_l_thigh', length: 18, localAngleDeg: -20, color: '#60a5fa', width: 5 },
          // Right Leg
          { id: 'bone_r_thigh', name: 'R. Thigh', parentBoneId: 'bone_hip', length: 18, localAngleDeg: 200, color: '#1d4ed8', width: 6 },
          { id: 'bone_r_shin', name: 'R. Shin & Foot', parentBoneId: 'bone_r_thigh', length: 18, localAngleDeg: 20, color: '#3b82f6', width: 5 },
          // Left Arm
          { id: 'bone_l_arm', name: 'L. Upper Arm', parentBoneId: 'bone_chest', length: 16, localAngleDeg: 120, color: '#f59e0b', width: 5 },
          { id: 'bone_l_forearm', name: 'L. Forearm & Hand', parentBoneId: 'bone_l_arm', length: 16, localAngleDeg: 40, color: '#fbbf24', width: 4 },
          // Right Arm
          { id: 'bone_r_arm', name: 'R. Upper Arm', parentBoneId: 'bone_chest', length: 16, localAngleDeg: -120, color: '#d97706', width: 5 },
          { id: 'bone_r_forearm', name: 'R. Forearm & Hand', parentBoneId: 'bone_r_arm', length: 16, localAngleDeg: -40, color: '#f59e0b', width: 4 }
        ],
        ikTargets: [
          {
            id: 'ik_l_foot',
            name: 'Left Foot IK',
            chainRootBoneId: 'bone_l_thigh',
            endEffectorBoneId: 'bone_l_shin',
            targetX: -10,
            targetY: 32,
            flipBend: true,
            enabled: true,
            color: '#60a5fa'
          },
          {
            id: 'ik_r_foot',
            name: 'Right Foot IK',
            chainRootBoneId: 'bone_r_thigh',
            endEffectorBoneId: 'bone_r_shin',
            targetX: 10,
            targetY: 32,
            flipBend: false,
            enabled: true,
            color: '#3b82f6'
          },
          {
            id: 'ik_l_hand',
            name: 'Left Hand IK',
            chainRootBoneId: 'bone_l_arm',
            endEffectorBoneId: 'bone_l_forearm',
            targetX: -18,
            targetY: 0,
            flipBend: false,
            enabled: true,
            color: '#fbbf24'
          },
          {
            id: 'ik_r_hand',
            name: 'Right Hand IK',
            chainRootBoneId: 'bone_r_arm',
            endEffectorBoneId: 'bone_r_forearm',
            targetX: 18,
            targetY: 0,
            flipBend: true,
            enabled: true,
            color: '#f59e0b'
          }
        ],
        animationTracks: [
          {
            id: 'track_walk',
            name: 'Biped Walk Cycle',
            durationFrames: 6,
            frameRateFps: 8,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_hip: -90, bone_chest: 0, bone_head: 0, bone_l_thigh: 150, bone_l_shin: 20, bone_r_thigh: 210, bone_r_shin: -20, bone_l_arm: 140, bone_l_forearm: 30, bone_r_arm: -100, bone_r_forearm: -30 },
                ikPositions: { ik_l_foot: { x: -14, y: 30 }, ik_r_foot: { x: 12, y: 28 }, ik_l_hand: { x: -16, y: 4 }, ik_r_hand: { x: 16, y: -4 } }
              },
              {
                frameIndex: 3,
                boneRotations: { bone_hip: -90, bone_chest: 0, bone_head: 0, bone_l_thigh: 210, bone_l_shin: -20, bone_r_thigh: 150, bone_r_shin: 20, bone_l_arm: 100, bone_l_forearm: 30, bone_r_arm: -140, bone_r_forearm: -30 },
                ikPositions: { ik_l_foot: { x: 12, y: 28 }, ik_r_foot: { x: -14, y: 30 }, ik_l_hand: { x: 16, y: -4 }, ik_r_hand: { x: -16, y: 4 } }
              }
            ]
          }
        ],
        activeTrackId: 'track_walk'
      };

    case 'quadruped_beast':
    default:
      return {
        rootX: 0,
        rootY: 0,
        bones: [
          { id: 'bone_spine_mid', name: 'Mid Torso', length: 24, localAngleDeg: 0, color: '#f97316', width: 9 },
          { id: 'bone_chest', name: 'Forequarters', parentBoneId: 'bone_spine_mid', length: 18, localAngleDeg: -20, color: '#ea580c', width: 8 },
          { id: 'bone_neck', name: 'Neck & Head', parentBoneId: 'bone_chest', length: 18, localAngleDeg: -50, color: '#fb923c', width: 7 },
          // Front Legs
          { id: 'bone_front_leg_1', name: 'Front Leg Upper', parentBoneId: 'bone_chest', length: 18, localAngleDeg: 110, color: '#f59e0b', width: 6 },
          { id: 'bone_front_leg_2', name: 'Front Leg Paw', parentBoneId: 'bone_front_leg_1', length: 18, localAngleDeg: -30, color: '#fbbf24', width: 5 },
          // Hind Legs
          { id: 'bone_hind_leg_1', name: 'Hind Leg Upper', parentBoneId: 'bone_spine_mid', length: 20, localAngleDeg: 140, color: '#d97706', width: 6 },
          { id: 'bone_hind_leg_2', name: 'Hind Leg Paw', parentBoneId: 'bone_hind_leg_1', length: 18, localAngleDeg: -40, color: '#f59e0b', width: 5 },
          // Tail
          { id: 'bone_tail', name: 'Beast Tail', parentBoneId: 'bone_spine_mid', length: 22, localAngleDeg: -150, color: '#ef4444', width: 5 }
        ],
        ikTargets: [
          {
            id: 'ik_front_paw',
            name: 'Front Paw IK',
            chainRootBoneId: 'bone_front_leg_1',
            endEffectorBoneId: 'bone_front_leg_2',
            targetX: 24,
            targetY: 30,
            flipBend: false,
            enabled: true,
            color: '#fbbf24'
          },
          {
            id: 'ik_hind_paw',
            name: 'Hind Paw IK',
            chainRootBoneId: 'bone_hind_leg_1',
            endEffectorBoneId: 'bone_hind_leg_2',
            targetX: -18,
            targetY: 30,
            flipBend: true,
            enabled: true,
            color: '#f59e0b'
          }
        ],
        animationTracks: [
          {
            id: 'track_trot',
            name: 'Quadruped Trot & Prowl',
            durationFrames: 6,
            frameRateFps: 8,
            loop: true,
            keyframes: [
              {
                frameIndex: 0,
                boneRotations: { bone_spine_mid: 0, bone_chest: -20, bone_neck: -50, bone_front_leg_1: 100, bone_front_leg_2: -20, bone_hind_leg_1: 150, bone_hind_leg_2: -40, bone_tail: -150 },
                ikPositions: { ik_front_paw: { x: 28, y: 28 }, ik_hind_paw: { x: -22, y: 30 } }
              },
              {
                frameIndex: 3,
                boneRotations: { bone_spine_mid: 0, bone_chest: -15, bone_neck: -40, bone_front_leg_1: 130, bone_front_leg_2: -40, bone_hind_leg_1: 120, bone_hind_leg_2: -20, bone_tail: -140 },
                ikPositions: { ik_front_paw: { x: 18, y: 32 }, ik_hind_paw: { x: -12, y: 26 } }
              }
            ]
          }
        ],
        activeTrackId: 'track_trot'
      };
  }
}
