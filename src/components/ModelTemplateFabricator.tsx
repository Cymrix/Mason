/**
 * Mason Parametric 3D Model Template Fabricator
 * 
 * Features:
 * 1. Parametric Creature & Character Synthesis:
 *    - Archetypes: Humanoid Biped, Multi-Armed Asura, Beast Quadruped, Insectoid/Arachnid, Serpentine/Naga, Eldritch Abomination, Winged Demon/Seraph.
 *    - Customizable Anatomy:
 *      * Head count (1 to 4 heads) with neck spread and angle
 *      * Arm count (0, 2, 4, 6, 8 arms) with staggered height and spread
 *      * Leg count (0, 2, 4, 6, 8 legs) with synchronized stance
 *      * Eye count (1 to 8 eyes per head) with cluster/cyclops/compound arrangement
 *      * Breast count (0, 2, 4, 6) with customizable projection and radius
 *      * Horn count (0, 2, 4, 6) with curved horns and demon spikes
 *      * Wing count (0, 2, 4 wings) with adjustable wingspan
 *      * Tail count (0, 1, 2, 3 tails) with multi-segment curvature
 *      * Body proportions: Torso height/width/depth, limb length, muscularity/bulk
 *      * Dynamic color palette & PBR material properties
 * 2. Real-time Three.js 3D Viewport with Orbit Controls & Live Regenerative Mesh Synthesis
 * 3. Automatic Rigging & Bone Hierarchy Generation matching chosen anatomy
 * 4. Automatic Animation Clip Synthesis (Idle breathing, gait-synchronized Walk, Attack)
 * 5. Direct Export to 3D Studio (.model3d file), 2D Spritesheet Strips (.png), Animated GIFs (.gif), and Frame Sequences (.zip)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import JSZip from 'jszip';
import { 
  Model3DFile, 
  Model3DData, 
  Model3DPart, 
  Model3DBone, 
  Model3DAnimationClip, 
  Model3DKeyframe,
  createDefaultModel3DFile,
  MasonProject
} from '../engine/masonProjectSchema';
import { GifEncoder } from '../utils/gifEncoder';
import { 
  Box, 
  Sparkles, 
  Dices, 
  Download, 
  Check, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Layers, 
  Palette, 
  Play, 
  Pause, 
  Share2, 
  ChevronRight, 
  RefreshCw,
  Zap,
  ArrowRight,
  Shield,
  Heart
} from 'lucide-react';

export type CreatureArchetype = 
  | 'biped' 
  | 'asura' 
  | 'quadruped' 
  | 'insectoid' 
  | 'serpentine' 
  | 'eldritch' 
  | 'winged';

export interface CreatureParameters {
  name: string;
  archetype: CreatureArchetype;
  headCount: number;        // 1 - 4
  neckSpread: number;       // 0 - 20
  armCount: number;         // 0, 2, 4, 6, 8
  legCount: number;         // 0, 2, 4, 6, 8
  eyeCount: number;         // 1 - 8
  breastCount: number;      // 0, 2, 4, 6
  hornCount: number;        // 0, 2, 4, 6
  wingCount: number;        // 0, 2, 4
  tailCount: number;        // 0, 1, 2, 3
  
  // Proportions
  torsoScaleX: number;      // 0.6 - 2.0 (width)
  torsoScaleY: number;      // 0.6 - 2.0 (height)
  torsoScaleZ: number;      // 0.6 - 2.0 (depth)
  limbLength: number;       // 0.6 - 1.8
  limbThickness: number;    // 0.6 - 2.0 (bulk)
  headSize: number;         // 0.6 - 1.8
  
  // Colors & Materials
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  hornColor: string;
  accentColor: string;
  roughness: number;
  metalness: number;
}

const DEFAULT_PARAMS: CreatureParameters = {
  name: 'Bipedal Paragon',
  archetype: 'biped',
  headCount: 1,
  neckSpread: 0,
  armCount: 2,
  legCount: 2,
  eyeCount: 2,
  breastCount: 2,
  hornCount: 0,
  wingCount: 0,
  tailCount: 0,
  torsoScaleX: 1.0,
  torsoScaleY: 1.0,
  torsoScaleZ: 1.0,
  limbLength: 1.0,
  limbThickness: 1.0,
  headSize: 1.0,
  primaryColor: '#0284c7',
  secondaryColor: '#0f172a',
  eyeColor: '#38bdf8',
  hornColor: '#f59e0b',
  accentColor: '#f43f5e',
  roughness: 0.5,
  metalness: 0.1
};

export interface ModelTemplateFabricatorProps {
  project: MasonProject;
  onSaveToProject?: (modelFile: Model3DFile) => void;
  onOpenInStudio?: (fileName: string) => void;
  onBack?: () => void;
}

export const ModelTemplateFabricator: React.FC<ModelTemplateFabricatorProps> = ({
  project,
  onSaveToProject,
  onOpenInStudio,
  onBack
}) => {
  const [params, setParams] = useState<CreatureParameters>(DEFAULT_PARAMS);
  const [activeCategory, setActiveCategory] = useState<'archetype' | 'anatomy' | 'proportions' | 'colors' | 'export'>('anatomy');
  const [previewAnim, setPreviewAnim] = useState<'idle' | 'walk' | 't-pose'>('idle');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Viewport DOM refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const creatureGroupRef = useRef<THREE.Group>(new THREE.Group());
  const boneHelpersGroupRef = useRef<THREE.Group>(new THREE.Group());
  const [showBones, setShowBones] = useState<boolean>(false);

  // Orbit state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 95,
    target: new THREE.Vector3(0, 22, 0)
  });

  // Archetype Presets
  const applyArchetype = (type: CreatureArchetype) => {
    switch (type) {
      case 'biped':
        setParams(prev => ({
          ...prev,
          name: 'Hero Biped',
          archetype: 'biped',
          headCount: 1,
          neckSpread: 0,
          armCount: 2,
          legCount: 2,
          eyeCount: 2,
          breastCount: 2,
          hornCount: 0,
          wingCount: 0,
          tailCount: 0,
          torsoScaleX: 1.0,
          torsoScaleY: 1.0,
          torsoScaleZ: 1.0,
          limbLength: 1.0,
          limbThickness: 1.0,
          primaryColor: '#0284c7',
          secondaryColor: '#1e293b',
          eyeColor: '#38bdf8'
        }));
        break;

      case 'asura':
        setParams(prev => ({
          ...prev,
          name: 'Six-Armed Asura Deity',
          archetype: 'asura',
          headCount: 3,
          neckSpread: 8,
          armCount: 6,
          legCount: 2,
          eyeCount: 3,
          breastCount: 4,
          hornCount: 2,
          wingCount: 0,
          tailCount: 0,
          torsoScaleX: 1.25,
          torsoScaleY: 1.2,
          torsoScaleZ: 1.1,
          limbLength: 1.1,
          limbThickness: 1.1,
          primaryColor: '#d97706',
          secondaryColor: '#451a03',
          eyeColor: '#fef08a',
          hornColor: '#fbbf24'
        }));
        break;

      case 'quadruped':
        setParams(prev => ({
          ...prev,
          name: 'Feral Chimera Beast',
          archetype: 'quadruped',
          headCount: 1,
          neckSpread: 0,
          armCount: 0,
          legCount: 4,
          eyeCount: 2,
          breastCount: 0,
          hornCount: 2,
          wingCount: 0,
          tailCount: 1,
          torsoScaleX: 1.1,
          torsoScaleY: 0.8,
          torsoScaleZ: 1.8,
          limbLength: 0.9,
          limbThickness: 1.2,
          primaryColor: '#059669',
          secondaryColor: '#064e3b',
          eyeColor: '#fbbf24',
          hornColor: '#1e293b'
        }));
        break;

      case 'insectoid':
        setParams(prev => ({
          ...prev,
          name: 'Chitinous Mantis Spider',
          archetype: 'insectoid',
          headCount: 1,
          neckSpread: 0,
          armCount: 2,
          legCount: 6,
          eyeCount: 6,
          breastCount: 0,
          hornCount: 4,
          wingCount: 2,
          tailCount: 0,
          torsoScaleX: 1.3,
          torsoScaleY: 0.9,
          torsoScaleZ: 1.4,
          limbLength: 1.3,
          limbThickness: 0.7,
          primaryColor: '#7c3aed',
          secondaryColor: '#2e1065',
          eyeColor: '#a855f7',
          hornColor: '#c084fc'
        }));
        break;

      case 'serpentine':
        setParams(prev => ({
          ...prev,
          name: 'Hydra Naga Gorgon',
          archetype: 'serpentine',
          headCount: 3,
          neckSpread: 12,
          armCount: 4,
          legCount: 0,
          eyeCount: 2,
          breastCount: 2,
          hornCount: 2,
          wingCount: 0,
          tailCount: 1,
          torsoScaleX: 1.0,
          torsoScaleY: 1.3,
          torsoScaleZ: 0.9,
          limbLength: 1.1,
          limbThickness: 0.9,
          primaryColor: '#0d9488',
          secondaryColor: '#134e4a',
          eyeColor: '#5eead4',
          hornColor: '#99f6e4'
        }));
        break;

      case 'eldritch':
        setParams(prev => ({
          ...prev,
          name: 'Eldritch Void Spawn',
          archetype: 'eldritch',
          headCount: 4,
          neckSpread: 14,
          armCount: 8,
          legCount: 4,
          eyeCount: 8,
          breastCount: 6,
          hornCount: 6,
          wingCount: 4,
          tailCount: 3,
          torsoScaleX: 1.4,
          torsoScaleY: 1.2,
          torsoScaleZ: 1.4,
          limbLength: 1.2,
          limbThickness: 1.1,
          primaryColor: '#475569',
          secondaryColor: '#0f172a',
          eyeColor: '#f43f5e',
          hornColor: '#94a3b8'
        }));
        break;

      case 'winged':
        setParams(prev => ({
          ...prev,
          name: 'Winged Seraph Demon',
          archetype: 'winged',
          headCount: 1,
          neckSpread: 0,
          armCount: 2,
          legCount: 2,
          eyeCount: 3,
          breastCount: 2,
          hornCount: 2,
          wingCount: 4,
          tailCount: 1,
          torsoScaleX: 1.0,
          torsoScaleY: 1.1,
          torsoScaleZ: 0.9,
          limbLength: 1.2,
          limbThickness: 0.9,
          primaryColor: '#e11d48',
          secondaryColor: '#4c0519',
          eyeColor: '#fecdd3',
          hornColor: '#18181b'
        }));
        break;
    }
  };

  const randomizeParams = () => {
    const archetypes: CreatureArchetype[] = ['biped', 'asura', 'quadruped', 'insectoid', 'serpentine', 'eldritch', 'winged'];
    const chosenArch = archetypes[Math.floor(Math.random() * archetypes.length)];
    applyArchetype(chosenArch);

    setParams(prev => ({
      ...prev,
      name: `Synthesized ${chosenArch.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      headCount: Math.floor(Math.random() * 3) + 1,
      neckSpread: Math.floor(Math.random() * 12),
      armCount: [0, 2, 4, 6][Math.floor(Math.random() * 4)],
      legCount: [0, 2, 4, 6][Math.floor(Math.random() * 4)],
      eyeCount: [1, 2, 3, 4, 6][Math.floor(Math.random() * 5)],
      breastCount: [0, 2, 4][Math.floor(Math.random() * 3)],
      hornCount: [0, 2, 4][Math.floor(Math.random() * 3)],
      wingCount: [0, 2, 4][Math.floor(Math.random() * 3)],
      tailCount: [0, 1, 2][Math.floor(Math.random() * 3)],
      torsoScaleX: +(0.8 + Math.random() * 0.6).toFixed(2),
      torsoScaleY: +(0.8 + Math.random() * 0.6).toFixed(2),
      limbLength: +(0.8 + Math.random() * 0.5).toFixed(2),
      limbThickness: +(0.7 + Math.random() * 0.6).toFixed(2),
      primaryColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`,
      secondaryColor: `hsl(${Math.floor(Math.random() * 360)}, 60%, 20%)`,
      eyeColor: `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`
    }));
  };

  // ==========================================
  // PROCEDURAL MESH & RIG FABRICATOR SYNTHESIS
  // ==========================================
  const synthesizedModelData = useMemo<Model3DData>(() => {
    const parts: Model3DPart[] = [];
    const bones: Model3DBone[] = [];
    const keyframesIdle: Model3DKeyframe[] = [];
    const keyframesWalk: Model3DKeyframe[] = [];
    const keyframesAttack: Model3DKeyframe[] = [];

    const {
      headCount,
      neckSpread,
      armCount,
      legCount,
      eyeCount,
      breastCount,
      hornCount,
      wingCount,
      tailCount,
      torsoScaleX,
      torsoScaleY,
      torsoScaleZ,
      limbLength,
      limbThickness,
      headSize,
      primaryColor,
      secondaryColor,
      eyeColor,
      hornColor,
      accentColor
    } = params;

    // 1. Root & Spine Bones
    const rootY = legCount === 0 ? 12 : 18;
    bones.push({ id: 'bone_root', name: 'Root', parentId: null, position: [0, 0, 0], rotation: [0, 0, 0], length: 16 });
    bones.push({ id: 'bone_spine', name: 'Spine', parentId: 'bone_root', position: [0, rootY, 0], rotation: [0, 0, 0], length: 18 * torsoScaleY });
    bones.push({ id: 'bone_chest', name: 'Chest', parentId: 'bone_spine', position: [0, rootY + 12 * torsoScaleY, 0], rotation: [0, 0, 0], length: 14 * torsoScaleY });

    // 2. Torso Meshes
    // Lower Torso / Pelvis
    parts.push({
      id: 'part_pelvis',
      name: 'Pelvis',
      primitiveType: 'cube',
      position: [0, rootY, 0],
      rotation: [0, 0, 0],
      scale: [14 * torsoScaleX, 10 * torsoScaleY, 10 * torsoScaleZ],
      color: secondaryColor,
      parentBoneId: 'bone_spine'
    });

    // Upper Torso / Chest
    parts.push({
      id: 'part_chest',
      name: 'Chest',
      primitiveType: 'cube',
      position: [0, rootY + 14 * torsoScaleY, 0],
      rotation: [0, 0, 0],
      scale: [18 * torsoScaleX, 16 * torsoScaleY, 12 * torsoScaleZ],
      color: primaryColor,
      parentBoneId: 'bone_chest'
    });

    // 3. Breasts (if breastCount > 0)
    if (breastCount > 0) {
      const breastRows = Math.ceil(breastCount / 2);
      const bRadius = 4.2 * Math.min(torsoScaleX, torsoScaleZ);
      for (let r = 0; r < breastRows; r++) {
        const yOff = rootY + (14 - r * 6.5) * torsoScaleY;
        const zOff = 6.2 * torsoScaleZ;
        const xOff = 4.8 * torsoScaleX;

        // Left Breast
        parts.push({
          id: `part_breast_l_${r}`,
          name: `Breast.L.${r + 1}`,
          primitiveType: 'sphere',
          position: [-xOff, yOff, zOff],
          rotation: [0, 0, 0],
          scale: [bRadius, bRadius * 0.95, bRadius * 1.2],
          color: primaryColor,
          parentBoneId: 'bone_chest'
        });

        // Right Breast
        parts.push({
          id: `part_breast_r_${r}`,
          name: `Breast.R.${r + 1}`,
          primitiveType: 'sphere',
          position: [xOff, yOff, zOff],
          rotation: [0, 0, 0],
          scale: [bRadius, bRadius * 0.95, bRadius * 1.2],
          color: primaryColor,
          parentBoneId: 'bone_chest'
        });
      }
    }

    // 4. Heads & Eyes
    const chestTopY = rootY + (14 + 8) * torsoScaleY;
    const hSpacing = headCount > 1 ? (neckSpread * 2) / (headCount - 1) : 0;
    const hStart = headCount > 1 ? -neckSpread : 0;

    for (let h = 0; h < headCount; h++) {
      const hX = hStart + h * hSpacing;
      const hBoneId = `bone_head_${h}`;
      const hRotY = headCount > 1 ? ((h - (headCount - 1) / 2) * 12) : 0;
      const hHeadY = chestTopY + 12 * headSize;

      // Head Bone
      bones.push({
        id: hBoneId,
        name: `Head ${h + 1}`,
        parentId: 'bone_chest',
        position: [hX, chestTopY, 0],
        rotation: [0, hRotY, 0],
        length: 12 * headSize
      });

      // Head Mesh (Cube or Sphere based on archetype)
      parts.push({
        id: `part_head_${h}`,
        name: `Head.${h + 1}`,
        primitiveType: params.archetype === 'insectoid' ? 'wedge' : 'cube',
        position: [hX, hHeadY, 0],
        rotation: [0, hRotY, 0],
        scale: [12 * headSize, 12 * headSize, 12 * headSize],
        color: secondaryColor,
        parentBoneId: hBoneId
      });

      // Eyes per Head
      const eyeZ = 6.2 * headSize;
      if (eyeCount === 1) {
        // Cyclops central eye
        parts.push({
          id: `part_eye_${h}_0`,
          name: `Cyclops Eye.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX, hHeadY + 1, eyeZ],
          rotation: [0, hRotY, 0],
          scale: [4.5 * headSize, 4.5 * headSize, 2],
          color: eyeColor,
          parentBoneId: hBoneId
        });
      } else if (eyeCount === 2) {
        // Standard stereo pair
        parts.push({
          id: `part_eye_${h}_l`,
          name: `Eye.L.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX - 3.5 * headSize, hHeadY + 1, eyeZ],
          rotation: [0, hRotY, 0],
          scale: [2.5 * headSize, 2.5 * headSize, 1.5],
          color: eyeColor,
          parentBoneId: hBoneId
        });
        parts.push({
          id: `part_eye_${h}_r`,
          name: `Eye.R.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX + 3.5 * headSize, hHeadY + 1, eyeZ],
          rotation: [0, hRotY, 0],
          scale: [2.5 * headSize, 2.5 * headSize, 1.5],
          color: eyeColor,
          parentBoneId: hBoneId
        });
      } else if (eyeCount === 3) {
        // Third eye mystic triangle
        parts.push({
          id: `part_eye_${h}_l`,
          name: `Eye.L.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX - 3.5 * headSize, hHeadY, eyeZ],
          rotation: [0, hRotY, 0],
          scale: [2.5 * headSize, 2.5 * headSize, 1.5],
          color: eyeColor,
          parentBoneId: hBoneId
        });
        parts.push({
          id: `part_eye_${h}_r`,
          name: `Eye.R.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX + 3.5 * headSize, hHeadY, eyeZ],
          rotation: [0, hRotY, 0],
          scale: [2.5 * headSize, 2.5 * headSize, 1.5],
          color: eyeColor,
          parentBoneId: hBoneId
        });
        parts.push({
          id: `part_eye_${h}_third`,
          name: `ThirdEye.${h + 1}`,
          primitiveType: 'sphere',
          position: [hX, hHeadY + 3.8 * headSize, eyeZ * 0.95],
          rotation: [0, hRotY, 0],
          scale: [2.8 * headSize, 2.8 * headSize, 1.5],
          color: accentColor,
          parentBoneId: hBoneId
        });
      } else {
        // Multi-eye spider / insectoid cluster
        for (let e = 0; e < eyeCount; e++) {
          const col = (e % 2 === 0 ? -1 : 1) * (2 + Math.floor(e / 2) * 2.2) * headSize;
          const row = (hHeadY + 2 - Math.floor(e / 2) * 2.4);
          parts.push({
            id: `part_eye_${h}_cluster_${e}`,
            name: `EyeCluster.${h + 1}.${e}`,
            primitiveType: 'sphere',
            position: [hX + col, row, eyeZ],
            rotation: [0, hRotY, 0],
            scale: [1.8 * headSize, 1.8 * headSize, 1.2],
            color: eyeColor,
            parentBoneId: hBoneId
          });
        }
      }

      // Horns per Head (if hornCount > 0)
      if (hornCount > 0) {
        const hornPairs = Math.ceil(hornCount / 2);
        for (let pIdx = 0; pIdx < hornPairs; pIdx++) {
          const hOffset = (5 + pIdx * 3.5) * headSize;
          const hLength = (12 - pIdx * 2) * headSize;
          // Left Horn
          parts.push({
            id: `part_horn_${h}_l_${pIdx}`,
            name: `Horn.L.${h + 1}.${pIdx + 1}`,
            primitiveType: 'cone',
            position: [hX - hOffset, hHeadY + 8 * headSize, 0],
            rotation: [15, 0, 30 + pIdx * 10],
            scale: [3.5 * headSize, hLength, 3.5 * headSize],
            color: hornColor,
            parentBoneId: hBoneId
          });
          // Right Horn
          parts.push({
            id: `part_horn_${h}_r_${pIdx}`,
            name: `Horn.R.${h + 1}.${pIdx + 1}`,
            primitiveType: 'cone',
            position: [hX + hOffset, hHeadY + 8 * headSize, 0],
            rotation: [15, 0, -(30 + pIdx * 10)],
            scale: [3.5 * headSize, hLength, 3.5 * headSize],
            color: hornColor,
            parentBoneId: hBoneId
          });
        }
      }
    }

    // 5. Arms (Pairs)
    const armPairs = Math.floor(armCount / 2);
    for (let a = 0; a < armPairs; a++) {
      const aY = rootY + (16 - a * 7) * torsoScaleY;
      const xSpan = (12 + a * 3) * torsoScaleX;
      const lLength = 18 * limbLength;
      const lThickness = 5.5 * limbThickness;

      // Left Arm Bone & Part
      const boneArmL = `bone_arm_l_${a}`;
      bones.push({
        id: boneArmL,
        name: `Arm.L.${a + 1}`,
        parentId: 'bone_chest',
        position: [-xSpan, aY, 0],
        rotation: [0, 0, 10 + a * 8],
        length: lLength
      });
      parts.push({
        id: `part_arm_l_${a}`,
        name: `Arm.L.${a + 1}`,
        primitiveType: 'cylinder',
        position: [-xSpan - 3, aY - lLength / 2, 0],
        rotation: [0, 0, 8 + a * 8],
        scale: [lThickness, lLength, lThickness],
        color: a % 2 === 0 ? primaryColor : secondaryColor,
        parentBoneId: boneArmL
      });

      // Right Arm Bone & Part
      const boneArmR = `bone_arm_r_${a}`;
      bones.push({
        id: boneArmR,
        name: `Arm.R.${a + 1}`,
        parentId: 'bone_chest',
        position: [xSpan, aY, 0],
        rotation: [0, 0, -(10 + a * 8)],
        length: lLength
      });
      parts.push({
        id: `part_arm_r_${a}`,
        name: `Arm.R.${a + 1}`,
        primitiveType: 'cylinder',
        position: [xSpan + 3, aY - lLength / 2, 0],
        rotation: [0, 0, -(8 + a * 8)],
        scale: [lThickness, lLength, lThickness],
        color: a % 2 === 0 ? primaryColor : secondaryColor,
        parentBoneId: boneArmR
      });
    }

    // 6. Legs / Lower Body
    if (legCount === 0) {
      // Serpentine Slither Tail (Segmented Spine)
      const segments = 5;
      for (let s = 0; s < segments; s++) {
        const segBone = `bone_slither_${s}`;
        const prevBone = s === 0 ? 'bone_root' : `bone_slither_${s - 1}`;
        const sY = Math.max(1, rootY - s * 3.5);
        const sZ = -s * 6 * torsoScaleZ;
        const sRadius = (8 - s * 1.2) * torsoScaleX;

        bones.push({
          id: segBone,
          name: `Slither.${s + 1}`,
          parentId: prevBone,
          position: [0, sY, sZ],
          rotation: [s * 8, 0, 0],
          length: 8
        });

        parts.push({
          id: `part_slither_${s}`,
          name: `Slither.${s + 1}`,
          primitiveType: 'sphere',
          position: [0, sY, sZ],
          rotation: [s * 8, 0, 0],
          scale: [sRadius, sRadius * 0.8, sRadius * 1.3],
          color: s % 2 === 0 ? primaryColor : secondaryColor,
          parentBoneId: segBone
        });
      }
    } else {
      // 2, 4, 6, or 8 Legs
      const legPairs = Math.floor(legCount / 2);
      const lLength = 16 * limbLength;
      const lThickness = 6 * limbThickness;

      for (let l = 0; l < legPairs; l++) {
        const zOff = legPairs > 1 ? ((l - (legPairs - 1) / 2) * 12 * torsoScaleZ) : 0;
        const xSpan = (6 + (legPairs > 1 ? l * 2.5 : 0)) * torsoScaleX;
        const legY = rootY;

        // Left Leg
        const boneLegL = `bone_leg_l_${l}`;
        bones.push({
          id: boneLegL,
          name: `Leg.L.${l + 1}`,
          parentId: 'bone_root',
          position: [-xSpan, legY, zOff],
          rotation: [0, 0, 0],
          length: lLength
        });
        parts.push({
          id: `part_leg_l_${l}`,
          name: `Leg.L.${l + 1}`,
          primitiveType: 'cylinder',
          position: [-xSpan, legY - lLength / 2, zOff],
          rotation: [0, 0, 0],
          scale: [lThickness, lLength, lThickness],
          color: secondaryColor,
          parentBoneId: boneLegL
        });

        // Right Leg
        const boneLegR = `bone_leg_r_${l}`;
        bones.push({
          id: boneLegR,
          name: `Leg.R.${l + 1}`,
          parentId: 'bone_root',
          position: [xSpan, legY, zOff],
          rotation: [0, 0, 0],
          length: lLength
        });
        parts.push({
          id: `part_leg_r_${l}`,
          name: `Leg.R.${l + 1}`,
          primitiveType: 'cylinder',
          position: [xSpan, legY - lLength / 2, zOff],
          rotation: [0, 0, 0],
          scale: [lThickness, lLength, lThickness],
          color: secondaryColor,
          parentBoneId: boneLegR
        });
      }
    }

    // 7. Wings (if wingCount > 0)
    if (wingCount > 0) {
      const wingPairs = Math.floor(wingCount / 2);
      for (let w = 0; w < wingPairs; w++) {
        const wY = rootY + (16 - w * 6) * torsoScaleY;
        const wZ = -6 * torsoScaleZ;
        const wBoneL = `bone_wing_l_${w}`;
        const wBoneR = `bone_wing_r_${w}`;

        bones.push({ id: wBoneL, name: `Wing.L.${w + 1}`, parentId: 'bone_chest', position: [-8, wY, wZ], rotation: [0, -35, 15], length: 28 });
        bones.push({ id: wBoneR, name: `Wing.R.${w + 1}`, parentId: 'bone_chest', position: [8, wY, wZ], rotation: [0, 35, -15], length: 28 });

        // Left Wing Blade/Membrane
        parts.push({
          id: `part_wing_l_${w}`,
          name: `Wing.L.${w + 1}`,
          primitiveType: 'wedge',
          position: [-22, wY + 6, wZ - 8],
          rotation: [0, -30, 25],
          scale: [28, 18, 1.5],
          color: accentColor,
          parentBoneId: wBoneL
        });

        // Right Wing Blade/Membrane
        parts.push({
          id: `part_wing_r_${w}`,
          name: `Wing.R.${w + 1}`,
          primitiveType: 'wedge',
          position: [22, wY + 6, wZ - 8],
          rotation: [0, 30, -25],
          scale: [28, 18, 1.5],
          color: accentColor,
          parentBoneId: wBoneR
        });
      }
    }

    // 8. Tails (if tailCount > 0)
    if (tailCount > 0 && legCount > 0) {
      for (let t = 0; t < tailCount; t++) {
        const xSpread = tailCount > 1 ? (t - (tailCount - 1) / 2) * 5 : 0;
        const tBone = `bone_tail_${t}`;
        bones.push({
          id: tBone,
          name: `Tail.${t + 1}`,
          parentId: 'bone_root',
          position: [xSpread, rootY + 2, -6 * torsoScaleZ],
          rotation: [-35, xSpread * 2, 0],
          length: 22
        });

        parts.push({
          id: `part_tail_${t}`,
          name: `Tail.${t + 1}`,
          primitiveType: 'cone',
          position: [xSpread, rootY - 4, -16 * torsoScaleZ],
          rotation: [65, xSpread * 2, 0],
          scale: [4.5 * limbThickness, 24 * limbLength, 4.5 * limbThickness],
          color: secondaryColor,
          parentBoneId: tBone
        });
      }
    }

    // 9. Synthesize Dynamic Animation Keyframes
    // Idle Keyframes
    keyframesIdle.push(
      { frame: 0, boneId: 'bone_chest', position: [0, rootY + 12 * torsoScaleY, 0], rotation: [0, 0, 0] },
      { frame: 12, boneId: 'bone_chest', position: [0, rootY + 13 * torsoScaleY, 0], rotation: [2, 0, 0] },
      { frame: 24, boneId: 'bone_chest', position: [0, rootY + 12 * torsoScaleY, 0], rotation: [0, 0, 0] }
    );

    // Idle Arm Keyframes
    for (let a = 0; a < armPairs; a++) {
      keyframesIdle.push(
        { frame: 0, boneId: `bone_arm_l_${a}`, rotation: [0, 0, 10 + a * 8] },
        { frame: 12, boneId: `bone_arm_l_${a}`, rotation: [0, 0, 16 + a * 8] },
        { frame: 24, boneId: `bone_arm_l_${a}`, rotation: [0, 0, 10 + a * 8] },
        { frame: 0, boneId: `bone_arm_r_${a}`, rotation: [0, 0, -(10 + a * 8)] },
        { frame: 12, boneId: `bone_arm_r_${a}`, rotation: [0, 0, -(16 + a * 8)] },
        { frame: 24, boneId: `bone_arm_r_${a}`, rotation: [0, 0, -(10 + a * 8)] }
      );
    }

    // Idle Tail Sway
    if (tailCount > 0 && legCount > 0) {
      for (let t = 0; t < tailCount; t++) {
        keyframesIdle.push(
          { frame: 0, boneId: `bone_tail_${t}`, rotation: [-35, -15, 0] },
          { frame: 12, boneId: `bone_tail_${t}`, rotation: [-35, 15, 0] },
          { frame: 24, boneId: `bone_tail_${t}`, rotation: [-35, -15, 0] }
        );
      }
    }

    // Walk Keyframes (Gait calibrated to leg count)
    if (legCount === 2) {
      // Standard Biped Alternate
      keyframesWalk.push(
        { frame: 0, boneId: 'bone_leg_l_0', rotation: [25, 0, 0] },
        { frame: 10, boneId: 'bone_leg_l_0', rotation: [-25, 0, 0] },
        { frame: 20, boneId: 'bone_leg_l_0', rotation: [25, 0, 0] },
        { frame: 0, boneId: 'bone_leg_r_0', rotation: [-25, 0, 0] },
        { frame: 10, boneId: 'bone_leg_r_0', rotation: [25, 0, 0] },
        { frame: 20, boneId: 'bone_leg_r_0', rotation: [-25, 0, 0] }
      );
    } else if (legCount >= 4) {
      // Quadruped / Hexapod alternating gait
      const legPairs = Math.floor(legCount / 2);
      for (let l = 0; l < legPairs; l++) {
        const phase = l % 2 === 0 ? 1 : -1;
        keyframesWalk.push(
          { frame: 0, boneId: `bone_leg_l_${l}`, rotation: [22 * phase, 0, 0] },
          { frame: 10, boneId: `bone_leg_l_${l}`, rotation: [-22 * phase, 0, 0] },
          { frame: 20, boneId: `bone_leg_l_${l}`, rotation: [22 * phase, 0, 0] },
          { frame: 0, boneId: `bone_leg_r_${l}`, rotation: [-22 * phase, 0, 0] },
          { frame: 10, boneId: `bone_leg_r_${l}`, rotation: [22 * phase, 0, 0] },
          { frame: 20, boneId: `bone_leg_r_${l}`, rotation: [-22 * phase, 0, 0] }
        );
      }
    }

    // Attack Keyframes
    for (let a = 0; a < armPairs; a++) {
      keyframesAttack.push(
        { frame: 0, boneId: `bone_arm_r_${a}`, rotation: [-20, 0, -10] },
        { frame: 6, boneId: `bone_arm_r_${a}`, rotation: [-85, -20, 15] },
        { frame: 12, boneId: `bone_arm_r_${a}`, rotation: [45, 30, -20] },
        { frame: 18, boneId: `bone_arm_r_${a}`, rotation: [0, 0, -10] }
      );
    }

    const animations: Model3DAnimationClip[] = [
      { id: 'anim_idle', name: 'Idle Stance', fps: 12, totalFrames: 24, isLooping: true, keyframes: keyframesIdle },
      { id: 'anim_walk', name: 'Walk / Locomotion', fps: 12, totalFrames: 20, isLooping: true, keyframes: keyframesWalk },
      { id: 'anim_attack', name: 'Flurry Attack', fps: 16, totalFrames: 18, isLooping: false, keyframes: keyframesAttack }
    ];

    return {
      id: `model_${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: params.name,
      parts,
      bones,
      animations,
      activeAnimationId: 'anim_idle'
    };
  }, [params]);

  // ==========================================
  // THREE.JS VIEWPORT SETUP & PROCEDURAL RENDER
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080d19');
    sceneRef.current = scene;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.1);
    sunLight.position.set(70, 120, 90);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rimLight.position.set(-60, 20, -70);
    scene.add(rimLight);

    // Floor Grid
    const grid = new THREE.GridHelper(100, 20, 0x8b5cf6, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Groups
    scene.add(creatureGroupRef.current);
    scene.add(boneHelpersGroupRef.current);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const updateCameraPos = () => {
      const { theta, phi, radius, target } = cameraAngleRef.current;
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);
      camera.lookAt(target);
    };
    updateCameraPos();

    // Render loop
    let animId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const t = clock.getElapsedTime();

      // Subtle breath animation on creature if playing idle
      if (previewAnim === 'idle' && creatureGroupRef.current) {
        creatureGroupRef.current.position.y = Math.sin(t * 2.5) * 0.8;
      } else if (previewAnim === 'walk' && creatureGroupRef.current) {
        creatureGroupRef.current.position.y = Math.abs(Math.sin(t * 6)) * 1.5;
        creatureGroupRef.current.rotation.y = Math.sin(t * 3) * 0.1;
      } else {
        creatureGroupRef.current.position.y = 0;
        creatureGroupRef.current.rotation.y = 0;
      }

      renderer.render(scene, camera);
    };
    render();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [previewAnim]);

  // Rebuild 3D Meshes in Scene when Synthesized Data Changes
  useEffect(() => {
    const group = creatureGroupRef.current;
    const boneGroup = boneHelpersGroupRef.current;
    if (!group || !sceneRef.current) return;

    // Clear previous meshes
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    while (boneGroup.children.length > 0) {
      boneGroup.remove(boneGroup.children[0]);
    }

    // Build Meshes
    synthesizedModelData.parts.forEach(part => {
      let geo: THREE.BufferGeometry;
      const [sx, sy, sz] = part.scale;

      switch (part.primitiveType) {
        case 'cube':
          geo = new THREE.BoxGeometry(sx, sy, sz);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 16);
          break;
        case 'sphere':
          geo = new THREE.SphereGeometry(sx / 2, 16, 16);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(sx / 2, sy, 16);
          break;
        case 'wedge': {
          geo = new THREE.ConeGeometry(sx / 2, sy, 4);
          geo.rotateY(Math.PI / 4);
          break;
        }
        default:
          geo = new THREE.BoxGeometry(sx, sy, sz);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(part.color),
        roughness: params.roughness,
        metalness: params.metalness,
        flatShading: true
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...part.position);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(part.rotation[0]),
        THREE.MathUtils.degToRad(part.rotation[1]),
        THREE.MathUtils.degToRad(part.rotation[2])
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    // Bone Gizmos (optional)
    if (showBones) {
      synthesizedModelData.bones.forEach(b => {
        const boneSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.8, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
        );
        boneSphere.position.set(...b.position);
        boneGroup.add(boneSphere);
      });
    }
  }, [synthesizedModelData, params.roughness, params.metalness, showBones]);

  // Orbit Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !cameraRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.buttons === 1) {
      // Left click orbit
      cameraAngleRef.current.theta -= dx * 0.01;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - dy * 0.01));
    } else if (e.buttons === 2) {
      // Right click pan
      cameraAngleRef.current.target.y += dy * 0.1;
    }

    const { theta, phi, radius, target } = cameraAngleRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    cameraAngleRef.current.radius = Math.max(30, Math.min(250, cameraAngleRef.current.radius + e.deltaY * 0.1));
    const { theta, phi, radius, target } = cameraAngleRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // ==========================================
  // EXPORT PIPELINES
  // ==========================================
  // 1. Bake to Project & Open in 3D Studio
  const handleBakeAndOpen = () => {
    const safeName = params.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${safeName}.model3d`;
    const newFile: Model3DFile = {
      id: `model_${Date.now().toString(36)}`,
      name: params.name,
      fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modelData: synthesizedModelData
    };

    onSaveToProject?.(newFile);
    setExportSuccessMsg(`Fabricated "${params.name}" and saved to project as ${fileName}!`);
    setTimeout(() => {
      onOpenInStudio?.(fileName);
    }, 400);
  };

  // 2. Export Spritesheet Strip (.png)
  const handleExportStrip = async () => {
    if (!rendererRef.current || !sceneRef.current) return;
    setIsExporting(true);

    const res = 64;
    const frames = 16;
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = res * frames;
    stripCanvas.height = res;
    const sCtx = stripCanvas.getContext('2d');

    const offCanvas = document.createElement('canvas');
    offCanvas.width = res;
    offCanvas.height = res;
    const exportRenderer = new THREE.WebGLRenderer({ canvas: offCanvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
    exportRenderer.setSize(res, res);

    const cam = new THREE.OrthographicCamera(-res / 3.5, res / 3.5, res / 3.5, -res / 3.5, 1, 1000);
    cam.position.set(0, 22, 100);
    cam.lookAt(0, 22, 0);

    for (let f = 0; f < frames; f++) {
      const angle = (f / frames) * Math.PI * 2;
      if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = angle;
      exportRenderer.render(sceneRef.current, cam);
      if (sCtx) sCtx.drawImage(offCanvas, f * res, 0);
      await new Promise(r => setTimeout(r, 10));
    }

    if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = 0;
    exportRenderer.dispose();

    const dataUrl = stripCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_strip.png`;
    a.click();
    setIsExporting(false);
  };

  // 3. Export Animated GIF (.gif)
  const handleExportGif = async () => {
    if (!rendererRef.current || !sceneRef.current) return;
    setIsExporting(true);

    const res = 64;
    const frames = 18;
    const gif = new GifEncoder(res, res, 0);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = res;
    offCanvas.height = res;
    const exportRenderer = new THREE.WebGLRenderer({ canvas: offCanvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
    exportRenderer.setSize(res, res);

    const cam = new THREE.OrthographicCamera(-res / 3.5, res / 3.5, res / 3.5, -res / 3.5, 1, 1000);
    cam.position.set(0, 22, 100);
    cam.lookAt(0, 22, 0);

    for (let f = 0; f < frames; f++) {
      const angle = (f / frames) * Math.PI * 2;
      if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = angle;
      exportRenderer.render(sceneRef.current, cam);

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = res;
      frameCanvas.height = res;
      const ctx = frameCanvas.getContext('2d');
      if (ctx) ctx.drawImage(offCanvas, 0, 0);
      gif.addFrame(frameCanvas, { delayMs: 80, transparentColor: [0, 0, 0] });
      await new Promise(r => setTimeout(r, 10));
    }

    if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = 0;
    exportRenderer.dispose();

    const blob = gif.encode();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
    a.click();
    setIsExporting(false);
  };

  // 4. Export Individual Frame Sequence (.zip)
  const handleExportFrameZip = async () => {
    if (!rendererRef.current || !sceneRef.current) return;
    setIsExporting(true);

    const zip = new JSZip();
    const res = 64;
    const frames = 16;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = res;
    offCanvas.height = res;
    const exportRenderer = new THREE.WebGLRenderer({ canvas: offCanvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
    exportRenderer.setSize(res, res);

    const cam = new THREE.OrthographicCamera(-res / 3.5, res / 3.5, res / 3.5, -res / 3.5, 1, 1000);
    cam.position.set(0, 22, 100);
    cam.lookAt(0, 22, 0);

    for (let f = 0; f < frames; f++) {
      const angle = (f / frames) * Math.PI * 2;
      if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = angle;
      exportRenderer.render(sceneRef.current, cam);

      const dataUrl = offCanvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const pad = String(f).padStart(3, '0');
      zip.file(`frame_${pad}.png`, base64Data, { base64: true });
      await new Promise(r => setTimeout(r, 10));
    }

    if (creatureGroupRef.current) creatureGroupRef.current.rotation.y = 0;
    exportRenderer.dispose();

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_frames.zip`;
    a.click();
    setIsExporting(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 select-none overflow-hidden font-sans">
      {/* ==========================================
          HEADER & TOP CONTROLS
          ========================================== */}
      <header className="h-14 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/60">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide text-white">3D Creature Fabricator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                Parametric Synthesis
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {synthesizedModelData.parts.length} Parts • {synthesizedModelData.bones.length} Bones • {synthesizedModelData.animations.length} Clips
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
          {(['archetype', 'anatomy', 'proportions', 'colors', 'export'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveCategory(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize ${
                activeCategory === tab
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={randomizeParams}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700 active:scale-95"
            title="Randomize Anatomical Creature Parameters"
          >
            <Dices size={14} className="text-pink-400" />
            <span>Randomize</span>
          </button>

          <button
            type="button"
            onClick={handleBakeAndOpen}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black transition shadow-lg shadow-purple-950/50 active:scale-95"
            title="Bake creature mesh, bones, and animations and open in 3D Studio"
          >
            <Zap size={14} />
            <span>Bake to 3D Studio</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition border border-neutral-700"
            >
              Back
            </button>
          )}
        </div>
      </header>

      {/* ==========================================
          MAIN TWO-COLUMN WORKSPACE
          ========================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: PARAMETRIC SLIDERS */}
        <aside className="w-84 bg-neutral-900/80 border-r border-neutral-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          {/* CATEGORY 1: ARCHETYPES */}
          {activeCategory === 'archetype' && (
            <div className="p-4 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                Creature Archetype Templates
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'biped', label: 'Humanoid Biped', desc: 'Warrior, Rogue, Elf (2 arms, 2 legs, 1 head)', icon: '🛡️' },
                  { id: 'asura', label: 'Multi-Armed Asura Deity', desc: 'Six-armed celestial warrior with 3 heads & crown', icon: '⚔️' },
                  { id: 'quadruped', label: 'Feral Beast Quadruped', desc: 'Canine/Feline predator with 4 legs and tail', icon: '🐺' },
                  { id: 'insectoid', label: 'Chitinous Insectoid / Arachnid', desc: '6 legs, compound eyes, mandibles & wings', icon: '🕷️' },
                  { id: 'serpentine', label: 'Serpentine Naga Gorgon', desc: 'Slithering tail body with multi-head hydra necks', icon: '🐍' },
                  { id: 'winged', label: 'Winged Seraph / Demon', desc: 'Twin winged humanoid with horns & claws', icon: '🪽' },
                  { id: 'eldritch', label: 'Eldritch Void Abomination', desc: 'Multi-eyed, multi-limbed chaotic horror', icon: '👁️' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyArchetype(item.id as CreatureArchetype)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
                      params.archetype === item.id
                        ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-950/40'
                        : 'bg-neutral-800/60 border-neutral-700/60 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY 2: ANATOMY SLIDERS */}
          {activeCategory === 'anatomy' && (
            <div className="p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                Anatomical Structure
              </span>

              {/* Creature Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Creature Name</label>
                <input
                  type="text"
                  value={params.name}
                  onChange={e => setParams(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Head Count */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Heads</span>
                    <span className="text-purple-400 font-mono">({params.headCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map(hc => (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, headCount: hc, neckSpread: hc > 1 ? Math.max(prev.neckSpread, 6) : 0 }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.headCount === hc
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {hc} {hc === 1 ? 'Head' : 'Heads'}
                    </button>
                  ))}
                </div>
                {params.headCount > 1 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Neck Spread</span>
                      <span>{params.neckSpread}</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={20}
                      step={1}
                      value={params.neckSpread}
                      onChange={e => setParams(prev => ({ ...prev, neckSpread: +e.target.value }))}
                      className="accent-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Arm Count */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Arms</span>
                    <span className="text-purple-400 font-mono">({params.armCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 2, 4, 6, 8].map(ac => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, armCount: ac }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.armCount === ac
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {ac}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leg Count */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Legs / Locomotion</span>
                    <span className="text-purple-400 font-mono">({params.legCount === 0 ? 'Slither' : `${params.legCount} Legs`})</span>
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 2, 4, 6, 8].map(lc => (
                    <button
                      key={lc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, legCount: lc }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.legCount === lc
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {lc === 0 ? 'Snake' : lc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breast Count */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Heart size={13} className="text-pink-400" />
                    <span>Breasts</span>
                    <span className="text-pink-400 font-mono">({params.breastCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 2, 4, 6].map(bc => (
                    <button
                      key={bc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, breastCount: bc }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.breastCount === bc
                          ? 'bg-pink-600 text-white border-pink-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {bc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Count per Head */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Eye size={13} className="text-cyan-400" />
                    <span>Eyes per Head</span>
                    <span className="text-cyan-400 font-mono">({params.eyeCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 6, 8].map(ec => (
                    <button
                      key={ec}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, eyeCount: ec }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.eyeCount === ec
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {ec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horns & Spikes */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Horns / Spikes</span>
                    <span className="text-amber-400 font-mono">({params.hornCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 2, 4, 6].map(hc => (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, hornCount: hc }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.hornCount === hc
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {hc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wings */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Wings</span>
                    <span className="text-rose-400 font-mono">({params.wingCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 2, 4].map(wc => (
                    <button
                      key={wc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, wingCount: wc }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.wingCount === wc
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {wc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tails */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Tails</span>
                    <span className="text-indigo-400 font-mono">({params.tailCount})</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(tc => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, tailCount: tc }))}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        params.tailCount === tc
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {tc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 3: PROPORTIONS */}
          {activeCategory === 'proportions' && (
            <div className="p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                Body Proportions & Scale
              </span>

              {/* Torso Width */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Torso Width</span>
                  <span className="font-mono text-purple-400">{params.torsoScaleX.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={2.0}
                  step={0.05}
                  value={params.torsoScaleX}
                  onChange={e => setParams(prev => ({ ...prev, torsoScaleX: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>

              {/* Torso Height */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Torso Height</span>
                  <span className="font-mono text-purple-400">{params.torsoScaleY.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={2.0}
                  step={0.05}
                  value={params.torsoScaleY}
                  onChange={e => setParams(prev => ({ ...prev, torsoScaleY: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>

              {/* Limb Length */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Limb Length</span>
                  <span className="font-mono text-purple-400">{params.limbLength.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={params.limbLength}
                  onChange={e => setParams(prev => ({ ...prev, limbLength: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>

              {/* Muscularity / Bulk */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Muscle Mass / Bulk</span>
                  <span className="font-mono text-purple-400">{params.limbThickness.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={2.2}
                  step={0.05}
                  value={params.limbThickness}
                  onChange={e => setParams(prev => ({ ...prev, limbThickness: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>

              {/* Head Size */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Head Size</span>
                  <span className="font-mono text-purple-400">{params.headSize.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={params.headSize}
                  onChange={e => setParams(prev => ({ ...prev, headSize: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>
            </div>
          )}

          {/* CATEGORY 4: COLORS & MATERIALS */}
          {activeCategory === 'colors' && (
            <div className="p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                Color Palette & Surface Material
              </span>

              {/* Color Inputs */}
              {[
                { label: 'Primary Skin / Body', key: 'primaryColor' as const },
                { label: 'Secondary Armor / Clothes', key: 'secondaryColor' as const },
                { label: 'Eyes Glow Color', key: 'eyeColor' as const },
                { label: 'Horns / Claws Accent', key: 'hornColor' as const },
                { label: 'Wings / Spikes Glow', key: 'accentColor' as const }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-xs text-neutral-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={params[item.key]}
                      onChange={e => setParams(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className="w-7 h-7 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">{params[item.key]}</span>
                  </div>
                </div>
              ))}

              {/* Roughness */}
              <div className="flex flex-col gap-1 pt-2">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Roughness</span>
                  <span className="font-mono text-purple-400">{params.roughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={params.roughness}
                  onChange={e => setParams(prev => ({ ...prev, roughness: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>

              {/* Metalness */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Metallic Luster</span>
                  <span className="font-mono text-purple-400">{params.metalness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={params.metalness}
                  onChange={e => setParams(prev => ({ ...prev, metalness: +e.target.value }))}
                  className="accent-purple-500"
                />
              </div>
            </div>
          )}

          {/* CATEGORY 5: EXPORTS */}
          {activeCategory === 'export' && (
            <div className="p-4 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                Quick Export & Project Integration
              </span>

              <button
                type="button"
                onClick={handleBakeAndOpen}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs transition shadow-lg shadow-purple-950/50"
              >
                <Zap size={14} />
                <span>Bake & Open in 3D Studio (.model3d)</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportStrip}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export 2D Spritesheet Strip (.png)'}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportGif}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-950/50 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export Animated GIF (.gif)'}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportFrameZip}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-lg shadow-amber-950/50 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export Frame Sequence (.zip)'}</span>
              </button>

              {exportSuccessMsg && (
                <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER 3D VIEWPORT */}
        <div 
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
          className="flex-1 relative overflow-hidden bg-neutral-950 cursor-grab active:cursor-grabbing select-none"
        >
          <canvas ref={canvasRef} className="block w-full h-full outline-none" />

          {/* Top-Left Viewport Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800 shadow-xl pointer-events-auto">
            {/* Animation preview buttons */}
            <div className="flex items-center gap-1 bg-neutral-950/60 p-0.5 rounded-xl border border-neutral-800">
              {(['idle', 'walk', 't-pose'] as const).map(anim => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => setPreviewAnim(anim)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition capitalize ${
                    previewAnim === anim
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {anim}
                </button>
              ))}
            </div>

            {/* Toggle Bones */}
            <button
              type="button"
              onClick={() => setShowBones(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                showBones
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              Skeleton Rig
            </button>
          </div>

          {/* Bottom Viewport Hint */}
          <div className="absolute bottom-3 left-3 text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-900">
            Left-Click: Orbit • Right-Click: Pan • Scroll: Zoom
          </div>
        </div>
      </div>
    </div>
  );
};
