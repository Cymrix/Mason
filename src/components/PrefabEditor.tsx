import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createOrLinkImageAndSpriteProject } from '../utils/spriteUtils';
import { 
  MasonProject, 
  SpriteFile,
  PrefabFile, 
  PrefabData, 
  PrefabSpritesheet,
  PrefabNamedPoint,
  PrefabNamedPolygon,
  PrefabAnimationConfig,
  PrefabCapsuleConfig,
  PolygonHitboxVertex,
  BehaviorVariable,
  BehaviorRule,
  BehaviorTrigger,
  BehaviorAction,
  TriggerType,
  ActionType,
  InputMapping,
  MovementControllerConfig,
  EnemyAIConfig,
  PrefabStateNode,
  PrefabStateTransition,
  PrefabStateMachine,
  ensureUIConfigDefaults,
  UNIFIED_INPUT_TEMPLATE
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { SpritesheetSliceModal, SpritesheetSliceResult } from './shared/spritesheet';
import { ViewportHUD } from './shared/viewport';
import { PrefabCompositionStudio } from './shared/PrefabCompositionStudio';
import { PrefabBoneIKStudio } from './shared/PrefabBoneIKStudio';
import { PrefabBehaviorsTab } from './shared/PrefabBehaviorsTab';
import { SpriteEditorModal, SpriteSaveResult } from './SpriteEditorModal';
import { getSavedModuleTab, saveModuleTab } from '../utils/moduleTabStore';
import { 
  performFileCheckout, 
  performFileCheckIn, 
  performFileForceUnlock,
  performFileSaveAs 
} from '../utils/fileCheckoutStore';
import { 
  Paintbrush,
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Circle, 
  Pentagon, 
  Grid, 
  Brain, 
  Layers, 
  Check, 
  CheckCircle2,
  X, 
  Key, 
  Shield, 
  Sword, 
  Target,
  Maximize2,
  Sparkles,
  Upload,
  Cloud,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Mountain,
  HelpCircle,
  Minimize2,
  Heart,
  AlertTriangle,
  Database,
  Lock,
  Unlock,
  Sliders,
  ExternalLink,
  Copy,
  Zap,
  Volume2,
  Crosshair,
  Radio,
  Gamepad2,
  Camera,
  Activity,
  MessageSquare,
  Flame,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  GitMerge,
  ArrowRight,
  ArrowLeftRight,
  Star,
  ChevronsUpDown,
  CornerDownRight,
  Share2,
  StepBack,
  StepForward,
  SkipBack,
  SkipForward,
  GripHorizontal,
  GripVertical,
  Table
} from 'lucide-react';

import { addToastLog } from '../utils/toastLogStore';

// Helper to generate var_xxxxxxxx IDs
const generateVariableId = () => {
  const hex = Math.random().toString(16).substring(2, 10).padEnd(8, '0');
  return `var_${hex}`;
};

// Helper to create properly typed triggers
const createDefaultTrigger = (type: TriggerType, availableVars?: BehaviorVariable[]): BehaviorTrigger => {
  switch (type) {
    case 'possession':
      return { type: 'possession', event: 'on_possess' };
    case 'mapped_input':
      return { type: 'mapped_input', inputId: 'inp_jump', inputName: 'jump' };
    case 'sight':
      return { type: 'sight', sensoryTag: 'head_eyes', visionRadiusPx: 200, visionAngleDeg: 120, requireLineOfSight: true, targetFilter: 'player' };
    case 'sound':
      return { type: 'sound', sensoryTag: 'head_ears', hearingRadiusPx: 250, minNoiseLevel: 20 };
    case 'proximity':
      return { type: 'proximity', sensoryTag: 'torso_center', distancePx: 100, comparator: 'less_than' };
    case 'health':
      return { type: 'health', healthPercentThreshold: 30, comparator: 'less_than' };
    case 'state':
      return { type: 'state', stateMode: 'is_state', requiredState: 'Idle' };
    case 'variable_condition': {
      const firstVar = availableVars?.[0];
      const isBool = firstVar?.type === 'boolean';
      return {
        type: 'variable_condition',
        variableId: firstVar?.id || 'var_custom',
        comparator: 'equals',
        value: isBool ? true : (firstVar?.defaultValue ?? (firstVar?.type === 'number' ? 100 : ''))
      };
    }
    case 'timer':
      return { type: 'timer', intervalMs: 2000, randomJitterMs: 0 };
    case 'dialogue_trigger':
      return { type: 'dialogue_trigger', triggerMode: 'on_interact' };
    case 'collision':
      return { type: 'collision', contactType: 'wall_impact' };
    case 'input_press':
      return { type: 'input_press', button: 'jump' };
    case 'player_condition':
      return { type: 'player_condition', condition: 'is_grounded' };
    case 'keyboard_key':
    case 'raw_keyboard':
      return { type: 'raw_keyboard', key: 'KeyE', triggerMode: 'press' };
    case 'raw_mouse':
      return { type: 'raw_mouse', button: 'left', action: 'press', targetArea: 'anywhere' };
    case 'raw_gamepad':
      return { type: 'raw_gamepad', gamepadIndex: 'any', inputType: 'button', button: 'button_a', buttonMode: 'press' };
    case 'listener':
      return { type: 'listener', channelTag: 'global_event' };
    case 'solid_detection':
      return { type: 'solid_detection', direction: 'below', detectionDistancePx: 4, checkMode: 'touching' };
    case 'slope_detection':
    case 'slope':
      return { type: 'slope_detection', slopeCondition: 'on_any_slope', contactLocation: 'feet', detectionDistancePx: 4 };
    case 'physics_state':
      return { type: 'physics_state', stateKind: 'jump_peak', velocityThreshold: 0.5 };
    case 'on_spawn':
    case 'spawn':
      return { type: 'on_spawn', spawnDelayMs: 0, triggerOnce: true };
    default:
      return { type: 'sight', sensoryTag: 'head_eyes', visionRadiusPx: 200, visionAngleDeg: 120, requireLineOfSight: true, targetFilter: 'player' };
  }
};

// Helper to calculate exact edge boundary intersection for FSM node cards (w: 192px, h: 92px)
const getNodeEdgePoint = (
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  hw = 98,
  hh = 46
): { x: number; y: number } => {
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: cx, y: cy - hh };
  }
  const scaleX = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    x: Math.round(cx + dx * scale),
    y: Math.round(cy + dy * scale)
  };
};

interface ArrowHeadInfo {
  x: number;
  y: number;
  angleDeg: number;
}

const getQuadBezierArrowHeads = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  tValues = [0.22, 0.40, 0.60, 0.78]
): ArrowHeadInfo[] => {
  return tValues.map(t => {
    const omt = 1 - t;
    const x = omt * omt * p0.x + 2 * omt * t * p1.x + t * t * p2.x;
    const y = omt * omt * p0.y + 2 * omt * t * p1.y + t * t * p2.y;
    const dx = 2 * omt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * omt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { x, y, angleDeg };
  });
};

const getCubicBezierArrowHeads = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  tValues = [0.20, 0.40, 0.60, 0.80]
): ArrowHeadInfo[] => {
  return tValues.map(t => {
    const omt = 1 - t;
    const x = omt * omt * omt * p0.x + 3 * omt * omt * t * p1.x + 3 * omt * t * t * p2.x + t * t * t * p3.x;
    const y = omt * omt * omt * p0.y + 3 * omt * omt * t * p1.y + 3 * omt * t * t * p2.y + t * t * t * p3.y;
    const dx = 3 * omt * omt * (p1.x - p0.x) + 6 * omt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * omt * omt * (p1.y - p0.y) + 6 * omt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { x, y, angleDeg };
  });
};

// Prefab Data Normalizers & Safe Fallback Constructors
export const ensurePrefabData = (data: any, fallbackName: string = 'Korrath Steelhand'): PrefabData => {
  if (!data || typeof data !== 'object') {
    return {
      id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: fallbackName,
      prefabType: 'player_hero',
      avatarIcon: '🛡️',
      spriteWidth: 64,
      spriteHeight: 64,
      tintColor: '#06b6d4',
      baseScale: 1.0,
      states: ['idle', 'running', 'airborne', 'attacking', 'hurt'],
      variables: [
        { id: generateVariableId(), name: 'Max Health', category: 'attribute', type: 'number', isStatic: true, defaultValue: 100 },
        { id: generateVariableId(), name: 'Sprint Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 5.5 }
      ],
      behaviorVariables: {},
      rules: [],
      capsule: { radius: 16, height: 44, offsetX: 0, offsetY: 2 },
      spritesheets: [{ id: 'sheet_default', name: 'Default Hero Sheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }],
      points: [
        { id: 'pt_eyes', name: 'Eyes (Sight Locus)', color: '#38bdf8', defaultOffsetX: 10, defaultOffsetY: -18 },
        { id: 'pt_ears', name: 'Ears (Acoustic Hearing)', color: '#a855f7', defaultOffsetX: 0, defaultOffsetY: -20 },
        { id: 'pt_torso', name: 'Torso Center (Hurtbox)', color: '#22c55e', defaultOffsetX: 0, defaultOffsetY: 0 },
        { id: 'pt_feet', name: 'Feet (Footstep Sound)', color: '#f59e0b', defaultOffsetX: 0, defaultOffsetY: 26 },
        { id: 'pt_weapon', name: 'Right Hand (Weapon Origin)', color: '#ef4444', defaultOffsetX: 18, defaultOffsetY: 2 }
      ],
      polygons: [
        {
          id: 'poly_body',
          name: 'Main Body Hurtbox',
          type: 'hurtbox',
          color: '#22c55e',
          defaultVertices: [
            { x: -14, y: -24 },
            { x: 14, y: -24 },
            { x: 14, y: 24 },
            { x: -14, y: 24 }
          ]
        }
      ],
      sockets: [
        { tagId: 'head_eyes', label: 'Eyes (Sight Locus)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
        { tagId: 'head_ears', label: 'Ears (Hearing Locus)', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
        { tagId: 'torso_center', label: 'Torso Center (Hurtbox)', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
        { tagId: 'feet_ground', label: 'Feet (Footstep Sound)', offsetX: 0, offsetY: 26, visualMarkerColor: '#f59e0b' },
        { tagId: 'hand_weapon', label: 'Right Hand (Weapon Origin)', offsetX: 18, offsetY: 2, visualMarkerColor: '#ef4444' }
      ],
      animations: [
        { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_default', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
      ]
    };
  }

  // If input is wrapped in prefabData property or passed as direct object
  const raw = data.prefabData && typeof data.prefabData === 'object' ? data.prefabData : data;

  return {
    ...raw,
    id: raw.id || `char_${Date.now()}`,
    name: raw.name || data.name || fallbackName,
    prefabType: raw.prefabType || 'player_hero',
    avatarIcon: raw.avatarIcon || '🛡️',
    spriteWidth: raw.spriteWidth || 64,
    spriteHeight: raw.spriteHeight || 64,
    tintColor: raw.tintColor || '#06b6d4',
    baseScale: raw.baseScale ?? 1.0,
    states: Array.isArray(raw.states) && raw.states.length > 0 ? raw.states.filter(Boolean) : ['idle', 'running', 'airborne', 'attacking', 'hurt'],
    movement: raw.movement,
    ai: raw.ai,
    variables: Array.isArray(raw.variables) ? raw.variables.map((v: any, vIdx: number) => ({
      ...v,
      id: v?.id || `var_${vIdx}_${Date.now()}`,
      name: v?.name || v?.id || `Variable ${vIdx + 1}`,
      category: v?.category || 'attribute',
      type: v?.type || 'number',
      isStatic: v?.isStatic ?? true,
      defaultValue: v?.defaultValue ?? 0
    })) : [],
    behaviorVariables: raw.behaviorVariables && typeof raw.behaviorVariables === 'object' ? raw.behaviorVariables : {},
    rules: Array.isArray(raw.rules) ? raw.rules : [],
    capsule: raw.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 },
    spritesheets: Array.isArray(raw.spritesheets) && raw.spritesheets.length > 0
      ? raw.spritesheets.map((s: any, sIdx: number) => ({
          ...s,
          id: s?.id || `sheet_${sIdx + 1}`,
          name: s?.name || `Spritesheet #${sIdx + 1}`,
          tileWidth: s?.tileWidth || 64,
          tileHeight: s?.tileHeight || 64,
          cols: s?.cols || 8,
          rows: s?.rows || 4,
          totalFrames: s?.totalFrames || 32
        }))
      : [{ id: 'sheet_default', name: 'Default Hero Sheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }],
    points: Array.isArray(raw.points) ? raw.points.map((p: any, pIdx: number) => ({
      ...p,
      id: p?.id || `pt_${pIdx}`,
      name: p?.name || `Point #${pIdx + 1}`,
      color: p?.color || '#38bdf8',
      defaultOffsetX: p?.defaultOffsetX || 0,
      defaultOffsetY: p?.defaultOffsetY || 0
    })) : [],
    polygons: Array.isArray(raw.polygons) ? raw.polygons.map((poly: any, polyIdx: number) => ({
      ...poly,
      id: poly?.id || `poly_${polyIdx}`,
      name: poly?.name || `Polygon #${polyIdx + 1}`,
      type: poly?.type || 'hurtbox',
      color: poly?.color || '#22c55e',
      defaultVertices: poly?.defaultVertices || [{ x: -14, y: -24 }, { x: 14, y: -24 }, { x: 14, y: 24 }, { x: -14, y: 24 }]
    })) : [],
    sockets: Array.isArray(raw.sockets) ? raw.sockets : [],
    animations: Array.isArray(raw.animations) ? raw.animations : [
      { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_default', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
    ],
    stateMachine: raw.stateMachine ? {
      initialStateId: raw.stateMachine.initialStateId || 'st_idle',
      states: Array.isArray(raw.stateMachine.states) ? raw.stateMachine.states.map((st: any, stIdx: number) => ({
        ...st,
        id: st?.id || `st_${stIdx}`,
        name: st?.name || st?.id || `State ${stIdx + 1}`,
        color: st?.color || '#38bdf8',
        x: st?.x ?? 320,
        y: st?.y ?? 220,
        isInitial: st?.isInitial ?? (stIdx === 0),
        description: st?.description || ''
      })) : [],
      transitions: Array.isArray(raw.stateMachine.transitions) ? raw.stateMachine.transitions.map((tr: any, trIdx: number) => ({
        ...tr,
        id: tr?.id || `tr_${trIdx}`,
        fromStateId: tr?.fromStateId || '',
        toStateId: tr?.toStateId || '',
        triggerLabel: tr?.triggerLabel || '',
        isBidirectional: tr?.isBidirectional ?? false
      })) : []
    } : undefined
  };
};

export const ensurePrefabFile = (file: any, index: number = 0): PrefabFile => {
  if (!file || typeof file !== 'object') {
    const data = ensurePrefabData(null, 'Korrath Steelhand');
    return {
      id: `char_file_${index + 1}`,
      name: data.name,
      fileName: 'korrath.prefab',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prefabData: data
    };
  }

  const name = file.name || file.prefabData?.name || `Prefab ${index + 1}`;
  const fileName = file.fileName || `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.prefab`;
  const prefabData = ensurePrefabData(file.prefabData || file, name);

  return {
    id: file.id || prefabData.id || `char_file_${index + 1}`,
    name: name,
    fileName: fileName,
    createdAt: file.createdAt || new Date().toISOString(),
    updatedAt: file.updatedAt || new Date().toISOString(),
    prefabData: prefabData
  };
};

interface CharacterEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject, options?: any) => void;
  onOpenFiles?: () => void;
  onBackToDashboard?: () => void;
  onNavigateToModule?: (moduleId: string, options?: { behaviorFileName?: string; prefabFileName?: string; spriteFileName?: string }) => void;
  onRefreshFromLinked?: () => void;
  isSyncingLinked?: boolean;
  isOutOfSync?: boolean;
}

export const PrefabEditor: React.FC<CharacterEditorProps> = ({
  project,
  onUpdateProject,
  onOpenFiles,
  onBackToDashboard,
  onNavigateToModule,
  onRefreshFromLinked,
  isSyncingLinked = false,
  isOutOfSync = false
}) => {
  // Toast notification state for Prefab Module
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Palette Spray Studio Modal State
  const [isSpriteStudioOpen, setIsSpriteStudioOpen] = useState<boolean>(false);
  const [editingSheetIdForStudio, setEditingSheetIdForStudio] = useState<string | null>(null);

  // Helper to switch to Image Editor module with relative sprite sheet & sliced animation frames
  const handleEditSpriteSheetInStudio = async (sheet: PrefabSpritesheet) => {
    const cleanName = (sheet.name || `Spritesheet #${sheet.id}`).trim();
    const imageSrc = sheet.imageUrl || sheet.dataUrl || '';

    const { updatedProject, spriteFile } = await createOrLinkImageAndSpriteProject(project, {
      name: cleanName,
      imageSrc,
      cols: sheet.cols || 1,
      rows: sheet.rows || 1,
      tileWidth: sheet.tileWidth || 32,
      tileHeight: sheet.tileHeight || 32
    });

    onUpdateProject(() => updatedProject);

    if (onNavigateToModule) {
      onNavigateToModule('sprites', { spriteFileName: spriteFile.fileName });
    } else if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    addToastLog(text, type);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Primary Studio View Tabs: 'composition' | 'bones_ik' | 'animation_studio' | 'spritesheet_manager' | 'variables' | 'states' | 'behaviors'
  const [activeTab, setActiveTabState] = useState<'composition' | 'bones_ik' | 'animation_studio' | 'spritesheet_manager' | 'variables' | 'states' | 'behaviors'>(
    () => getSavedModuleTab('prefabs', 'composition') as any
  );
  const setActiveTab = (tab: 'composition' | 'bones_ik' | 'animation_studio' | 'spritesheet_manager' | 'variables' | 'states' | 'behaviors') => {
    setActiveTabState(tab);
    saveModuleTab('prefabs', tab);
  };

  // Behavior Rules Accordion State (Collapsed by default!)
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());

  // State Machine Node & Transition Selection / Editing State
  const [selectedStateNodeId, setSelectedStateNodeId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [isStateModalOpen, setIsStateModalOpen] = useState<boolean>(false);
  const [stateForm, setStateForm] = useState<{
    id: string;
    name: string;
    color: string;
    isInitial: boolean;
    description: string;
    isEditing: boolean;
  }>({
    id: 'st_idle',
    name: '',
    color: '#38bdf8',
    isInitial: false,
    description: '',
    isEditing: false
  });

  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState<boolean>(false);
  const [transitionForm, setTransitionForm] = useState<{
    id: string;
    fromStateId: string;
    toStateId: string;
    triggerLabel: string;
    behaviorRuleId?: string;
    conditionType?: 'none' | 'behavior' | 'custom';
    isEditing: boolean;
  }>({
    id: 'tr_1',
    fromStateId: '',
    toStateId: '',
    triggerLabel: '',
    behaviorRuleId: undefined,
    conditionType: 'none',
    isEditing: false
  });

  // Helper to check if a transition condition is unset or 'none'
  const isTransitionConditionUnset = (tr: PrefabStateTransition | { triggerLabel?: string; behaviorRuleId?: string; conditionType?: string }): boolean => {
    if (!tr.behaviorRuleId || tr.behaviorRuleId === 'none') return true;
    if (tr.conditionType === 'none') return true;
    if (!tr.triggerLabel) return true;
    const t = tr.triggerLabel.trim().toLowerCase();
    return t === '' || t === 'none' || t === 'unset' || t === 'no condition';
  };

  // State graph node dragging & connection wire
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectingFromStateId, setConnectingFromStateId] = useState<string | null>(null);
  const [graphZoom, setGraphZoom] = useState<number>(1.0);
  const [graphPanX, setGraphPanX] = useState<number>(0);
  const [graphPanY, setGraphPanY] = useState<number>(0);
  const [isGraphPanning, setIsGraphPanning] = useState<boolean>(false);
  const graphPanStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);
  const graphCanvasRef = useRef<HTMLDivElement | null>(null);

  // Animation Playback & State
  const [selectedAnimStateId, setSelectedAnimStateId] = useState<string>('idle');
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const [currentFrameOffset, setCurrentFrameOffset] = useState<number>(0);

  // Viewport Pan & Zoom Controls
  const [zoom, setZoom] = useState<number>(2.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport Layer Toggles (Everything except sprite turned off by default)
  const [showCapsule, setShowCapsule] = useState<boolean>(false);
  const [showPoints, setShowPoints] = useState<boolean>(false);
  const [showPolygons, setShowPolygons] = useState<boolean>(false);
  const [showSprite, setShowSprite] = useState<boolean>(true);

  // Per-item individual visibility toggles
  const [hiddenPointIds, setHiddenPointIds] = useState<Set<string>>(new Set());
  const [hiddenPolygonIds, setHiddenPolygonIds] = useState<Set<string>>(new Set());

  // Resizable Sockets and Hitboxes Panel Heights
  const [socketsHeight, setSocketsHeight] = useState<number>(220);
  const [hitboxesHeight, setHitboxesHeight] = useState<number>(180);

  // Resizable Studio Column Layout Widths & Heights
  const [animLeftColWidth, setAnimLeftColWidth] = useState<number>(310);
  const [animMatrixHeight, setAnimMatrixHeight] = useState<number>(360);

  const isDraggingLeftColWidthRef = useRef<boolean>(false);
  const startDragLeftColXRef = useRef<number>(0);
  const startLeftColWRef = useRef<number>(310);

  const handleLeftColResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftColWidthRef.current = true;
    startDragLeftColXRef.current = e.clientX;
    startLeftColWRef.current = animLeftColWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingLeftColWidthRef.current) return;
      const dx = ev.clientX - startDragLeftColXRef.current;
      const newW = Math.max(220, Math.min(520, startLeftColWRef.current + dx));
      setAnimLeftColWidth(newW);
    };

    const handleMouseUp = () => {
      isDraggingLeftColWidthRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isDraggingMatrixHeightRef = useRef<boolean>(false);
  const startDragMatrixYRef = useRef<number>(0);
  const startMatrixHRef = useRef<number>(360);

  const handleMatrixResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingMatrixHeightRef.current = true;
    startDragMatrixYRef.current = e.clientY;
    startMatrixHRef.current = animMatrixHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingMatrixHeightRef.current) return;
      const dy = ev.clientY - startDragMatrixYRef.current;
      const newH = Math.max(160, Math.min(700, startMatrixHRef.current + dy));
      setAnimMatrixHeight(newH);
    };

    const handleMouseUp = () => {
      isDraggingMatrixHeightRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const dragOverrideRef = useRef<{ id: string; vertexIndex?: number; x: number; y: number } | null>(null);
  const [dragOverride, _setDragOverride] = useState<{ id: string; vertexIndex?: number; x: number; y: number } | null>(null);
  const setDragOverride = (val: typeof dragOverride) => {
    dragOverrideRef.current = val;
    _setDragOverride(val);
  };

  // Active Selections & Dragging
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [selectedPolygonId, setSelectedPolygonId] = useState<string>('');
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

  const [dragTarget, setDragTarget] = useState<{
    type: 'point' | 'poly_vertex';
    id: string;
    vertexIndex?: number;
  } | null>(null);

  // Item Edit Modal State (Points & Polygons)
  const [editingItem, setEditingItem] = useState<{
    type: 'point' | 'polygon';
    id: string;
    name: string;
    color: string;
    polyType?: 'hurtbox' | 'hitbox' | 'shield' | 'trigger';
    tagId?: string;
  } | null>(null);

  // Variable Creation / Edit Modal State
  const [isVarModalOpen, setIsVarModalOpen] = useState<boolean>(false);
  const [varForm, setVarForm] = useState<{
    id: string;
    name: string;
    category: 'attribute' | 'proficiency' | 'setting';
    type: 'number' | 'string' | 'boolean';
    defaultValue: any;
    isStatic: boolean;
    isEditing: boolean;
  }>({
    id: generateVariableId(),
    name: '',
    category: 'attribute',
    type: 'number',
    defaultValue: 100,
    isStatic: false,
    isEditing: false
  });

  // Copy Behavior Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [sourceCharIdToCopy, setSourceCharIdToCopy] = useState<string>('');

  // Spritesheet Slicer & Pre-Configuration Modal State
  const [sliceModalConfig, setSliceModalConfig] = useState<{
    isOpen: boolean;
    sheetId: string;
    initialImage?: {
      url: string;
      name?: string;
      tileWidth?: number;
      tileHeight?: number;
      cols?: number;
      rows?: number;
      splitMode?: 'pixels' | 'columns';
      marginX?: number;
      marginY?: number;
      spacingX?: number;
      spacingY?: number;
    };
    sheetLabel?: string;
  }>({ isOpen: false, sheetId: '' });

  const handleSliceModalConfirm = (res: SpritesheetSliceResult) => {
    if (!sliceModalConfig.sheetId) return;
    updateCharacter(c => ({
      ...c,
      spritesheets: (c.spritesheets || []).map(s => s.id === sliceModalConfig.sheetId ? {
        ...s,
        name: res.name || s.name,
        imageUrl: res.imageUrl,
        dataUrl: res.dataUrl || res.imageUrl,
        imageWidth: res.imageWidth,
        imageHeight: res.imageHeight,
        tileWidth: res.tileWidth,
        tileHeight: res.tileHeight,
        cols: res.cols,
        rows: res.rows,
        totalFrames: res.totalFrames,
        splitMode: res.splitMode
      } : s)
    }));
    showToast('Spritesheet sliced and configured successfully!');
  };

  const handleSpriteStudioSave = (result: SpriteSaveResult) => {
    const imageUrl = result.spritesheetUrl || result.dataUrl;

    if (editingSheetIdForStudio) {
      updateCharacter(c => ({
        ...c,
        spritesheets: (c.spritesheets || []).map(s => {
          if (s.id === editingSheetIdForStudio) {
            return {
              ...s,
              imageUrl: imageUrl,
              tileWidth: result.width,
              tileHeight: result.height,
              totalFrames: result.frameCount,
              cols: result.frameCount,
              rows: 1
            };
          }
          return s;
        })
      }));
      showToast(`Updated spritesheet from Palette Spray Studio!`, 'success');
    } else {
      const newSheet: PrefabSpritesheet = {
        id: `sheet_${Date.now().toString().slice(-4)}`,
        name: result.projectName || `Painted Sprite #${(currentFile?.prefabData?.spritesheets?.length || 0) + 1}`,
        imageUrl: imageUrl,
        tileWidth: result.width,
        tileHeight: result.height,
        cols: result.frameCount,
        rows: 1,
        totalFrames: result.frameCount
      };
      updateCharacter(c => ({
        ...c,
        spritesheets: [...(c.spritesheets || []), newSheet]
      }));
      setSelectedSheetId(newSheet.id);
      showToast(`Added new sprite from Palette Spray Studio!`, 'success');
    }
    setEditingSheetIdForStudio(null);
  };

  // Spritesheet Viewer & Image Cache States
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [inspectedFrameIdx, setInspectedFrameIdx] = useState<number | null>(null);
  const [sheetViewerZoom, setSheetViewerZoom] = useState<number>(1.0);
  const [forceCanvasRedraw, setForceCanvasRedraw] = useState<number>(0);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // FSM Drag Pointer & RAF Animation Throttling
  const dragNodeStartRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const currentDragPosRef = useRef<{ x: number; y: number } | null>(null);

  // Prefab Files & Active Selection (normalized with robust schema fallbacks)
  const charFiles: PrefabFile[] = useMemo(() => {
    const rawList = project?.fileSystem?.prefabs;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((c, idx) => ensurePrefabFile(c, idx));
    }
    return [ensurePrefabFile(null, 0)];
  }, [project?.fileSystem?.prefabs]);

  const activeFileName = project?.activeFiles?.prefabFileName || charFiles[0]?.fileName || '';
  const currentFile: PrefabFile = useMemo(() => {
    const found = charFiles.find(c => c.fileName === activeFileName) || charFiles[0];
    return ensurePrefabFile(found, 0);
  }, [charFiles, activeFileName]);

  const char: PrefabData = useMemo(() => {
    return ensurePrefabData(currentFile.prefabData || currentFile, currentFile.name || 'Unnamed Prefab');
  }, [currentFile]);

  // Available UI Input Mappings for Player Controls (read from active/all UI files in project with full fallback)
  const activeUiFile = project?.fileSystem?.ui?.find(u => u.fileName === project?.activeFiles?.uiFileName) || project?.fileSystem?.ui?.[0];
  const activeUiConfig = activeUiFile?.uiConfig ? ensureUIConfigDefaults(activeUiFile.uiConfig) : null;
  const availableInputMappings: InputMapping[] = useMemo(() => {
    if (activeUiConfig?.inputMappings && activeUiConfig.inputMappings.length > 0) {
      return activeUiConfig.inputMappings;
    }
    for (const u of (project?.fileSystem?.ui || [])) {
      if (u?.uiConfig?.inputMappings && u.uiConfig.inputMappings.length > 0) {
        return u.uiConfig.inputMappings;
      }
    }
    return UNIFIED_INPUT_TEMPLATE;
  }, [activeUiConfig, project?.fileSystem?.ui]);

  // Helper to safely update current prefab
  const updateCharacter = (updater: (prev: PrefabData) => PrefabData) => {
    onUpdateProject(p => {
      const chars = p?.fileSystem?.prefabs || [];
      const exists = chars.some(c => c.fileName === currentFile.fileName || c.id === currentFile.id);
      let updatedChars;
      if (exists) {
        updatedChars = chars.map(c => {
          if (c.fileName === currentFile.fileName || c.id === currentFile.id) {
            const currentData = ensurePrefabData(c.prefabData || c, c.name || currentFile.name);
            const nextData = updater(currentData);
            return {
              ...c,
              name: nextData.name || c.name,
              updatedAt: new Date().toISOString(),
              prefabData: nextData
            };
          }
          return c;
        });
      } else {
        const nextData = updater(char);
        const newFile: PrefabFile = {
          id: currentFile.id || `char_file_${Date.now()}`,
          name: nextData.name || currentFile.name || 'Korrath Steelhand',
          fileName: currentFile.fileName || 'korrath.prefab',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          prefabData: nextData
        };
        updatedChars = [...chars, newFile];
      }
      return {
        ...p,
        fileSystem: {
          ...p.fileSystem,
          prefabs: updatedChars
        }
      };
    });
  };

  // Helper to get combined prefab variables and rule-scoped local variables
  const getRuleVariablesList = (targetRule?: BehaviorRule) => {
    const pVars = (char?.variables || []).map(v => ({
      id: v.id,
      name: v.name || v.id || 'Variable',
      isLocal: false,
      value: char?.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue ?? 0,
      scope: 'prefab' as const
    }));

    const lVars: Array<{ id: string; name: string; isLocal: boolean; value: any; scope: 'local' }> = [];
    
    if (targetRule?.localVariables) {
      for (const lv of targetRule.localVariables) {
        if (!lVars.some(x => x.id === lv.id)) {
          lVars.push({
            id: lv.id,
            name: lv.name || lv.id,
            isLocal: true,
            value: lv.defaultValue ?? 0,
            scope: 'local'
          });
        }
      }
    }

    // Also collect local variable names declared in any math / variable actions of this rule
    if (targetRule?.actions) {
      for (const a of targetRule.actions) {
        if (a.variableScope === 'local' || a.localVariableName || a.variableId?.startsWith('local_') || a.variableId?.startsWith('local.')) {
          const id = a.localVariableName || a.variableId || 'local_var';
          if (!lVars.some(x => x.id === id)) {
            lVars.push({
              id,
              name: a.localVariableName || id,
              isLocal: true,
              value: a.variableValue ?? 0,
              scope: 'local'
            });
          }
        }
      }
    }

    return { prefabVars: pVars, localVars: lVars, allVars: [...pVars, ...lVars] };
  };

  // Helper to render variable select options grouped into Local and Prefab categories
  const renderVariableSelectOptions = (targetRule?: BehaviorRule) => {
    const { prefabVars, localVars } = getRuleVariablesList(targetRule);
    return (
      <>
        {localVars.length > 0 && (
          <optgroup label="[Local] Local Variables (Rule Scope)">
            {localVars.map(v => (
              <option key={v.id} value={v.id}>
                [Local] {v.name} ({v.id}) = {String(v.value)}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="[Var] Prefab Variables (Persistent)">
          {prefabVars.length === 0 ? (
            <option value="" disabled>No Prefab Variables Defined</option>
          ) : (
            prefabVars.map(v => (
              <option key={v.id} value={v.id}>
                [Var] {v.name} ({v.id}) = {String(v.value)}
              </option>
            ))
          )}
        </optgroup>
      </>
    );
  };

  // Fast duplicate prefab
  const handleDuplicateCharacter = () => {
    const baseName = `${char?.name || currentFile.name || 'Prefab'} (Copy)`;
    const safeFileName = `${(char?.name || 'prefab').toLowerCase().replace(/[^a-z0-9]/g, '_')}_copy_${Date.now().toString().slice(-4)}.prefab`;
    const newCharData: PrefabData = JSON.parse(JSON.stringify(char));
    newCharData.id = `char_${Date.now()}`;
    newCharData.name = baseName;

    const newCharFile: PrefabFile = {
      id: `char_file_${Date.now()}`,
      name: baseName,
      fileName: safeFileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prefabData: newCharData
    };

    onUpdateProject(p => ({
      ...p,
      activeFiles: { ...p.activeFiles, prefabFileName: safeFileName },
      fileSystem: {
        ...p.fileSystem,
        prefabs: [...(p.fileSystem.prefabs || []), newCharFile]
      }
    }));
  };

  // Copy Behavior & Variables from another prefab
  const handleCopyBehaviorFromCharacter = () => {
    if (!sourceCharIdToCopy) return;
    const sourceCharFile = charFiles.find(c => c.prefabData?.id === sourceCharIdToCopy || c.id === sourceCharIdToCopy);
    if (!sourceCharFile) return;

    const sourceData = sourceCharFile.prefabData;
    updateCharacter(c => ({
      ...c,
      variables: sourceData.variables ? JSON.parse(JSON.stringify(sourceData.variables)) : c.variables,
      behaviorVariables: sourceData.behaviorVariables ? JSON.parse(JSON.stringify(sourceData.behaviorVariables)) : c.behaviorVariables,
      rules: sourceData.rules ? JSON.parse(JSON.stringify(sourceData.rules)) : c.rules,
      states: sourceData.states ? JSON.parse(JSON.stringify(sourceData.states)) : c.states,
      movement: sourceData.movement ? JSON.parse(JSON.stringify(sourceData.movement)) : c.movement,
      ai: sourceData.ai ? JSON.parse(JSON.stringify(sourceData.ai)) : c.ai
    }));

    setIsCopyModalOpen(false);
  };

  // Ensure arrays exist
  const spritesheetsList: PrefabSpritesheet[] = char?.spritesheets || [
    { id: 'sheet_default', name: 'Primary Spritesheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }
  ];
  const animationsList: PrefabAnimationConfig[] = char?.animations || [];
  const pointsList: PrefabNamedPoint[] = char?.points || [];
  const polygonsList: PrefabNamedPolygon[] = char?.polygons || [];
  const capsuleConfig: PrefabCapsuleConfig = char?.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 };
  const variablesList: BehaviorVariable[] = char?.variables || [];
  const rulesList: BehaviorRule[] = char?.rules || [];
  const fsmStates: string[] = char?.states || ['idle', 'patrol', 'alerted', 'combat', 'hurt'];

  // State Machine Nodes & Transitions
  const defaultColors = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#6366f1'];
  const rawStatesList: string[] = char?.states && char.states.length > 0 ? char.states : ['idle', 'patrol', 'alerted', 'combat', 'hurt'];

  const stateNodes: PrefabStateNode[] = (char?.stateMachine?.states && char.stateMachine.states.length > 0)
    ? char.stateMachine.states.map((st, idx) => ({
        ...st,
        id: st?.id || `st_${idx}`,
        name: st?.name || st?.id || `State ${idx + 1}`,
        color: st?.color || defaultColors[idx % defaultColors.length]
      }))
    : rawStatesList.map((st, idx) => {
        const safeSt = st ? String(st) : `state_${idx + 1}`;
        const angle = (idx / rawStatesList.length) * 2 * Math.PI - Math.PI / 2;
        return {
          id: `st_${safeSt.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: safeSt.charAt(0).toUpperCase() + safeSt.slice(1),
          color: defaultColors[idx % defaultColors.length],
          x: Math.round(320 + Math.cos(angle) * 190),
          y: Math.round(220 + Math.sin(angle) * 130),
          isInitial: idx === 0,
          description: `Prefab in ${safeSt} state`
        };
      });

  const stateTransitions: PrefabStateTransition[] = (char?.stateMachine?.transitions && char.stateMachine.transitions.length > 0)
    ? char.stateMachine.transitions
    : stateNodes.length >= 2 ? [
        { id: 'tr_1', fromStateId: stateNodes[0].id, toStateId: stateNodes[1].id, isBidirectional: false, triggerLabel: 'Movement' },
        { id: 'tr_1_ret', fromStateId: stateNodes[1].id, toStateId: stateNodes[0].id, isBidirectional: false, triggerLabel: 'Stop Movement' },
        ...(stateNodes.length >= 3 ? [{ id: 'tr_2', fromStateId: stateNodes[1].id, toStateId: stateNodes[2].id, isBidirectional: false, triggerLabel: 'Sight: Target Seen' }] : []),
        ...(stateNodes.length >= 4 ? [{ id: 'tr_3', fromStateId: stateNodes[2].id, toStateId: stateNodes[3].id, isBidirectional: false, triggerLabel: 'Combat Range' }] : [])
      ] : [];

  const updateStateMachine = (updater: (prev: PrefabStateMachine) => PrefabStateMachine) => {
    updateCharacter(c => {
      const currentSM: PrefabStateMachine = c.stateMachine || {
        initialStateId: stateNodes.find(s => s.isInitial)?.id || stateNodes[0]?.id || 'st_idle',
        states: stateNodes,
        transitions: stateTransitions
      };
      const updatedSM = updater(currentSM);
      return {
        ...c,
        stateMachine: updatedSM,
        states: (updatedSM.states || []).map(s => (s?.name || s?.id || 'state').toLowerCase())
      };
    });
  };

  const handleSaveStateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateForm.name.trim()) return;

    updateStateMachine(sm => {
      const safeId = stateForm.isEditing ? stateForm.id : `st_${stateForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
      const isFirst = sm.states.length === 0;
      const willBeInitial = stateForm.isInitial || isFirst;

      let newStates: PrefabStateNode[];
      if (stateForm.isEditing) {
        newStates = sm.states.map(s => {
          if (s.id === stateForm.id) {
            return {
              ...s,
              name: stateForm.name.trim(),
              color: stateForm.color,
              description: stateForm.description,
              isInitial: willBeInitial
            };
          }
          return willBeInitial ? { ...s, isInitial: false } : s;
        });
      } else {
        const newNode: PrefabStateNode = {
          id: safeId,
          name: stateForm.name.trim(),
          color: stateForm.color,
          x: 280 + Math.floor(Math.random() * 100),
          y: 180 + Math.floor(Math.random() * 100),
          isInitial: willBeInitial,
          description: stateForm.description
        };
        newStates = willBeInitial 
          ? [...sm.states.map(s => ({ ...s, isInitial: false })), newNode]
          : [...sm.states, newNode];
      }

      return {
        ...sm,
        initialStateId: willBeInitial ? safeId : (sm.initialStateId || safeId),
        states: newStates
      };
    });

    setIsStateModalOpen(false);
  };

  const handleDeleteStateNode = (stateId: string) => {
    updateStateMachine(sm => {
      const remaining = sm.states.filter(s => s.id !== stateId);
      const remainingTr = sm.transitions.filter(t => t.fromStateId !== stateId && t.toStateId !== stateId);
      let newInitial = sm.initialStateId;
      if (newInitial === stateId) {
        newInitial = remaining[0]?.id || '';
        if (remaining.length > 0) {
          remaining[0].isInitial = true;
        }
      }
      return {
        initialStateId: newInitial,
        states: remaining,
        transitions: remainingTr
      };
    });
    if (selectedStateNodeId === stateId) setSelectedStateNodeId(null);
  };

  const handleAddReturnTransition = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const exists = stateTransitions.some(t => t.fromStateId === toId && t.toStateId === fromId);
    if (exists) {
      const existing = stateTransitions.find(t => t.fromStateId === toId && t.toStateId === fromId);
      if (existing) setSelectedTransitionId(existing.id);
      return;
    }
    const newTr: PrefabStateTransition = {
      id: `tr_${Date.now().toString().slice(-4)}`,
      fromStateId: toId,
      toStateId: fromId,
      isBidirectional: false,
      triggerLabel: ''
    };
    updateStateMachine(sm => ({
      ...sm,
      transitions: [...sm.transitions, newTr]
    }));
    setSelectedTransitionId(newTr.id);
  };

  const handleSaveTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionForm.fromStateId || !transitionForm.toStateId) return;
    if (transitionForm.fromStateId === transitionForm.toStateId) return;

    updateStateMachine(sm => {
      if (transitionForm.isEditing) {
        return {
          ...sm,
          transitions: sm.transitions.map(t => t.id === transitionForm.id ? {
            ...t,
            fromStateId: transitionForm.fromStateId,
            toStateId: transitionForm.toStateId,
            isBidirectional: false,
            triggerLabel: transitionForm.triggerLabel,
            behaviorRuleId: transitionForm.behaviorRuleId,
            conditionType: transitionForm.conditionType
          } : t)
        };
      } else {
        const newTr: PrefabStateTransition = {
          id: `tr_${Date.now().toString().slice(-4)}`,
          fromStateId: transitionForm.fromStateId,
          toStateId: transitionForm.toStateId,
          isBidirectional: false,
          triggerLabel: transitionForm.triggerLabel,
          behaviorRuleId: transitionForm.behaviorRuleId,
          conditionType: transitionForm.conditionType
        };
        return {
          ...sm,
          transitions: [...sm.transitions, newTr]
        };
      }
    });

    setIsTransitionModalOpen(false);
  };

  const handleDeleteTransition = (trId: string) => {
    updateStateMachine(sm => ({
      ...sm,
      transitions: sm.transitions.filter(t => t.id !== trId)
    }));
    if (selectedTransitionId === trId) setSelectedTransitionId(null);
  };

  const handleAutoLayoutStates = () => {
    updateStateMachine(sm => {
      const count = sm.states.length;
      if (count === 0) return sm;
      const centerX = 360;
      const centerY = 240;
      const radiusX = Math.min(260, 120 + count * 22);
      const radiusY = Math.min(180, 80 + count * 18);

      const rearranged = sm.states.map((st, idx) => {
        const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
        return {
          ...st,
          x: Math.round(centerX + Math.cos(angle) * radiusX),
          y: Math.round(centerY + Math.sin(angle) * radiusY)
        };
      });

      return {
        ...sm,
        states: rearranged
      };
    });
  };

  // Global Pointer Listener for Ultra-Smooth FSM Node Dragging (RAF Throttled)
  useEffect(() => {
    if (!draggingNodeId) return;

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (!dragNodeStartRef.current) return;
      const dx = (e.clientX - dragNodeStartRef.current.mouseX) / (graphZoom || 1);
      const dy = (e.clientY - dragNodeStartRef.current.mouseY) / (graphZoom || 1);
      const nextX = Math.round(dragNodeStartRef.current.nodeX + dx);
      const nextY = Math.round(dragNodeStartRef.current.nodeY + dy);

      currentDragPosRef.current = { x: nextX, y: nextY };

      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (currentDragPosRef.current && draggingNodeId) {
            const { x, y } = currentDragPosRef.current;
            updateStateMachine(sm => ({
              ...sm,
              states: sm.states.map(s => s.id === draggingNodeId ? { ...s, x, y } : s)
            }));
          }
        });
      }
    };

    const handlePointerUp = () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (currentDragPosRef.current && draggingNodeId) {
        const { x, y } = currentDragPosRef.current;
        updateStateMachine(sm => ({
          ...sm,
          states: sm.states.map(s => s.id === draggingNodeId ? { ...s, x, y } : s)
        }));
      }
      setDraggingNodeId(null);
      dragNodeStartRef.current = null;
      currentDragPosRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
    };
  }, [draggingNodeId, graphZoom]);

  // Current animation
  const currentAnimation = animationsList.find(a => a.stateId === selectedAnimStateId) || animationsList[0] || {
    stateId: 'idle',
    label: 'Idle Stance',
    spritesheetId: spritesheetsList[0]?.id || 'sheet_default',
    startFrameIndex: 0,
    endFrameIndex: 3,
    frameRateFps: 8,
    loop: true
  };

  const activeSpritesheet = spritesheetsList.find(s => s.id === currentAnimation.spritesheetId) || spritesheetsList[0];

  const getSpritesheetDataUrl = (sheet: PrefabSpritesheet): string => {
    if (sheet.imageUrl || sheet.dataUrl) return sheet.imageUrl || sheet.dataUrl || '';

    // Procedural fallback sprite sheet image
    const tileW = sheet.tileWidth || 64;
    const tileH = sheet.tileHeight || 64;
    const cols = sheet.cols || 8;
    const rows = sheet.rows || 4;

    const cvs = document.createElement('canvas');
    cvs.width = tileW * cols;
    cvs.height = tileH * rows;
    const ctx = cvs.getContext('2d');
    if (!ctx) return '';
    ctx.imageSmoothingEnabled = false;

    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = c * tileW;
      const y = r * tileH;

      ctx.fillStyle = (c + r) % 2 === 0 ? '#1e1b4b' : '#0f172a';
      ctx.fillRect(x, y, tileW, tileH);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, tileW, tileH);

      const cx = x + tileW / 2;
      const cy = y + tileH / 2;
      const pulse = Math.sin((i / total) * Math.PI * 4) * 6;

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 10, cy - 12 + pulse, 20, 24);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy - 18 + pulse, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx + 10, cy - 8 + pulse, 4, 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`#${i}`, x + 4, y + 12);
    }

    return cvs.toDataURL('image/png');
  };

  // Keyframe Resolution Helpers
  const startIdx = currentAnimation.startFrameIndex || 0;
  const endIdx = currentAnimation.endFrameIndex !== undefined ? currentAnimation.endFrameIndex : startIdx;
  const frameCount = Math.max(1, endIdx - startIdx + 1);
  const activeGlobalFrameIndex = startIdx + Math.min(currentFrameOffset, frameCount - 1);

  const getKeyframeForActiveFrame = (): any => {
    return currentAnimation.keyframes?.find(k => k.frameIndex === activeGlobalFrameIndex);
  };

  const hasKeyframeOnFrame = (globalFrameIndex: number): boolean => {
    return !!currentAnimation.keyframes?.some(k => k.frameIndex === globalFrameIndex);
  };

  const isCurrentFrameKeyframed = (): boolean => {
    return hasKeyframeOnFrame(activeGlobalFrameIndex);
  };

  // Hold-forward evaluation: look for latest keyframe at or before activeGlobalFrameIndex (within current animation clip)
  const getPointPosForActiveFrame = (pt: PrefabNamedPoint): { x: number; y: number } => {
    const keyframes = currentAnimation.keyframes || [];
    // Sort descending by frameIndex and find most recent keyframe <= activeGlobalFrameIndex
    const sortedKfs = [...keyframes]
      .filter(k => k.frameIndex >= startIdx && k.frameIndex <= activeGlobalFrameIndex)
      .sort((a, b) => b.frameIndex - a.frameIndex);

    for (const kf of sortedKfs) {
      const ptKf = kf.points?.find((p: any) => p.pointId === pt.id);
      if (ptKf && ptKf.enabled !== false && typeof ptKf.x === 'number' && typeof ptKf.y === 'number') {
        return { x: ptKf.x, y: ptKf.y };
      }
    }
    return { x: pt.defaultOffsetX, y: pt.defaultOffsetY };
  };

  const getPolyVertsForActiveFrame = (poly: PrefabNamedPolygon): PolygonHitboxVertex[] => {
    const keyframes = currentAnimation.keyframes || [];
    const sortedKfs = [...keyframes]
      .filter(k => k.frameIndex >= startIdx && k.frameIndex <= activeGlobalFrameIndex)
      .sort((a, b) => b.frameIndex - a.frameIndex);

    for (const kf of sortedKfs) {
      const polyKf = kf.polygons?.find((p: any) => p.polygonId === poly.id);
      if (polyKf && polyKf.enabled !== false && polyKf.vertices && polyKf.vertices.length > 0) {
        return polyKf.vertices;
      }
    }
    return poly.defaultVertices || [];
  };

  const getCapsuleForActiveFrame = (): PrefabCapsuleConfig => {
    const keyframes = currentAnimation.keyframes || [];
    const sortedKfs = [...keyframes]
      .filter(k => k.frameIndex >= startIdx && k.frameIndex <= activeGlobalFrameIndex)
      .sort((a, b) => b.frameIndex - a.frameIndex);

    for (const kf of sortedKfs) {
      if (kf.capsule) {
        return kf.capsule;
      }
    }
    return char.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 };
  };

  const isCapsuleKeyframedOnActiveFrame = (): boolean => {
    const kf = getKeyframeForActiveFrame();
    return !!kf?.capsule;
  };

  const isPointKeyframedOnActiveFrame = (pointId: string): boolean => {
    const kf = getKeyframeForActiveFrame();
    const ptKf = kf?.points?.find((p: any) => p.pointId === pointId);
    return !!(ptKf && ptKf.enabled !== false && typeof ptKf.x === 'number');
  };

  const updateActiveFramePoint = (pointId: string, pos: { x: number; y: number }) => {
    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);

          const baseKf = existingIdx >= 0 ? JSON.parse(JSON.stringify(keyframes[existingIdx])) : {
            frameIndex: activeGlobalFrameIndex,
            points: []
          };

          if (!baseKf.points) baseKf.points = [];
          const pIdx = baseKf.points.findIndex((p: any) => p.pointId === pointId);
          if (pIdx >= 0) {
            baseKf.points[pIdx].x = pos.x;
            baseKf.points[pIdx].y = pos.y;
            baseKf.points[pIdx].enabled = true;
          } else {
            baseKf.points.push({ pointId, enabled: true, x: pos.x, y: pos.y });
          }

          const newKeyframes = existingIdx >= 0
            ? keyframes.map((k, i) => i === existingIdx ? baseKf : k)
            : [...keyframes, baseKf];

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      // If user is moving point on frame offset 0, update default offset so it persists everywhere naturally
      let updatedPoints = c.points || [];
      let updatedSockets = c.sockets || [];
      if (currentFrameOffset === 0) {
        updatedPoints = (c.points || []).map(p => p.id === pointId ? { ...p, defaultOffsetX: pos.x, defaultOffsetY: pos.y } : p);
        updatedSockets = (c.sockets || []).map(s => {
          const matchingPt = (c.points || []).find(p => p.id === pointId);
          if (matchingPt && (s.tagId === matchingPt.id || s.label.toLowerCase().includes(matchingPt.name.toLowerCase()))) {
            return { ...s, offsetX: pos.x, offsetY: pos.y };
          }
          return s;
        });
      }

      return { ...c, animations: updatedAnimations, points: updatedPoints, sockets: updatedSockets };
    });
  };

  const isPolygonKeyframedOnActiveFrame = (polygonId: string): boolean => {
    const kf = getKeyframeForActiveFrame();
    const polyKf = kf?.polygons?.find((p: any) => p.polygonId === polygonId);
    return !!(polyKf && polyKf.enabled !== false && polyKf.vertices && polyKf.vertices.length > 0);
  };

  const updateActiveFramePolygon = (polygonId: string, vertices: PolygonHitboxVertex[]) => {
    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);

          const baseKf = existingIdx >= 0 ? JSON.parse(JSON.stringify(keyframes[existingIdx])) : {
            frameIndex: activeGlobalFrameIndex,
            polygons: []
          };

          if (!baseKf.polygons) baseKf.polygons = [];
          const polyIdx = baseKf.polygons.findIndex((p: any) => p.polygonId === polygonId);
          if (polyIdx >= 0) {
            baseKf.polygons[polyIdx].vertices = JSON.parse(JSON.stringify(vertices));
            baseKf.polygons[polyIdx].enabled = true;
          } else {
            baseKf.polygons.push({ polygonId, enabled: true, vertices: JSON.parse(JSON.stringify(vertices)) });
          }

          const newKeyframes = existingIdx >= 0
            ? keyframes.map((k, i) => i === existingIdx ? baseKf : k)
            : [...keyframes, baseKf];

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      let updatedPolygons = c.polygons || [];
      if (currentFrameOffset === 0) {
        updatedPolygons = (c.polygons || []).map(p => p.id === polygonId ? { ...p, defaultVertices: JSON.parse(JSON.stringify(vertices)) } : p);
      }

      return { ...c, animations: updatedAnimations, polygons: updatedPolygons };
    });
  };

  const updateActiveFrameCapsule = (updater: (prev: PrefabCapsuleConfig) => PrefabCapsuleConfig) => {
    const currentCapsule = getCapsuleForActiveFrame();
    const nextCapsule = updater(currentCapsule);

    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);

          const baseKf = existingIdx >= 0 ? JSON.parse(JSON.stringify(keyframes[existingIdx])) : {
            frameIndex: activeGlobalFrameIndex
          };

          baseKf.capsule = nextCapsule;

          const newKeyframes = existingIdx >= 0
            ? keyframes.map((k, i) => i === existingIdx ? baseKf : k)
            : [...keyframes, baseKf];

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      let updatedCapsule = c.capsule;
      if (currentFrameOffset === 0) {
        updatedCapsule = nextCapsule;
      }

      return { ...c, animations: updatedAnimations, capsule: updatedCapsule };
    });
  };

  // Frame Navigation Helpers
  const handlePrevFrame = () => {
    setIsPlayingAnim(false);
    setCurrentFrameOffset(prev => (prev > 0 ? prev - 1 : (currentAnimation.loop ? frameCount - 1 : 0)));
  };

  const handleNextFrame = () => {
    setIsPlayingAnim(false);
    setCurrentFrameOffset(prev => (prev < frameCount - 1 ? prev + 1 : (currentAnimation.loop ? 0 : frameCount - 1)));
  };

  const handleFirstFrame = () => {
    setIsPlayingAnim(false);
    setCurrentFrameOffset(0);
  };

  const handleLastFrame = () => {
    setIsPlayingAnim(false);
    setCurrentFrameOffset(frameCount - 1);
  };

  // Keyframe Mutation Operations
  const handleSetKeyframeForCurrentFrame = () => {
    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);
          const currentPts = (c.points || []).map(p => {
            const pos = getPointPosForActiveFrame(p);
            return { pointId: p.id, enabled: true, x: pos.x, y: pos.y };
          });
          const currentPolys = (c.polygons || []).map(poly => {
            const verts = getPolyVertsForActiveFrame(poly);
            return { polygonId: poly.id, enabled: true, vertices: JSON.parse(JSON.stringify(verts)) };
          });

          const currentCapsule = getCapsuleForActiveFrame();
          const newKf = {
            frameIndex: activeGlobalFrameIndex,
            points: currentPts,
            polygons: currentPolys,
            capsule: { ...currentCapsule }
          };

          const newKeyframes = existingIdx >= 0
            ? keyframes.map((k, i) => i === existingIdx ? newKf : k)
            : [...keyframes, newKf];

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      return { ...c, animations: updatedAnimations };
    });
  };

  const handleClearKeyframeForCurrentFrame = () => {
    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = (anim.keyframes || []).filter(k => k.frameIndex !== activeGlobalFrameIndex);
          return { ...anim, keyframes };
        }
        return anim;
      });
      return { ...c, animations: updatedAnimations };
    });
  };

  const handleCopyKeyframeFromPrev = () => {
    if (currentFrameOffset <= 0) return;
    const prevGlobalIdx = startIdx + currentFrameOffset - 1;
    const prevKf = currentAnimation.keyframes?.find(k => k.frameIndex === prevGlobalIdx);

    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);

          let newPts: any[];
          let newPolys: any[];

          if (prevKf) {
            newPts = JSON.parse(JSON.stringify(prevKf.points));
            newPolys = JSON.parse(JSON.stringify(prevKf.polygons));
          } else {
            newPts = (c.points || []).map(p => ({ pointId: p.id, enabled: true, x: p.defaultOffsetX, y: p.defaultOffsetY }));
            newPolys = (c.polygons || []).map(poly => ({ polygonId: poly.id, enabled: true, vertices: JSON.parse(JSON.stringify(poly.defaultVertices || [])) }));
          }

          const newKf = {
            frameIndex: activeGlobalFrameIndex,
            points: newPts,
            polygons: newPolys
          };

          const newKeyframes = existingIdx >= 0
            ? keyframes.map((k, i) => i === existingIdx ? newKf : k)
            : [...keyframes, newKf];

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      return { ...c, animations: updatedAnimations };
    });
  };

  // Resize Handlers for Sockets & Hitboxes Sidebar Panels
  const isDraggingSocketsHeightRef = useRef<boolean>(false);
  const startDragSocketsYRef = useRef<number>(0);
  const startSocketsHRef = useRef<number>(220);

  const handleSocketsResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSocketsHeightRef.current = true;
    startDragSocketsYRef.current = e.clientY;
    startSocketsHRef.current = socketsHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingSocketsHeightRef.current) return;
      const dy = ev.clientY - startDragSocketsYRef.current;
      const newH = Math.max(90, Math.min(650, startSocketsHRef.current + dy));
      setSocketsHeight(newH);
    };

    const handleMouseUp = () => {
      isDraggingSocketsHeightRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isDraggingHitboxesHeightRef = useRef<boolean>(false);
  const startDragHitboxesYRef = useRef<number>(0);
  const startHitboxesHRef = useRef<number>(180);

  const handleHitboxesResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHitboxesHeightRef.current = true;
    startDragHitboxesYRef.current = e.clientY;
    startHitboxesHRef.current = hitboxesHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingHitboxesHeightRef.current) return;
      const dy = ev.clientY - startDragHitboxesYRef.current;
      const newH = Math.max(90, Math.min(500, startHitboxesHRef.current + dy));
      setHitboxesHeight(newH);
    };

    const handleMouseUp = () => {
      isDraggingHitboxesHeightRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Helper to query keyframe data for any item across any animation frame offset
  const getItemFrameKeyframe = (
    itemType: 'capsule' | 'point' | 'polygon' | 'motionBlur',
    itemId: string,
    frameOffset: number
  ): { isKeyframed: boolean; data: any } => {
    const gIdx = startIdx + frameOffset;
    const kf = currentAnimation.keyframes?.find(k => k.frameIndex === gIdx);
    if (!kf) return { isKeyframed: false, data: null };

    if (itemType === 'capsule') {
      return { isKeyframed: !!kf.capsule, data: kf.capsule || null };
    }
    if (itemType === 'motionBlur') {
      return { isKeyframed: kf.motionBlur === true, data: kf.motionBlur };
    }
    if (itemType === 'point') {
      const ptKf = kf.points?.find(p => p.pointId === itemId && p.enabled !== false && typeof p.x === 'number');
      return { isKeyframed: !!ptKf, data: ptKf || null };
    }
    if (itemType === 'polygon') {
      const polyKf = kf.polygons?.find(p => p.polygonId === itemId && p.enabled !== false && p.vertices && p.vertices.length > 0);
      return { isKeyframed: !!polyKf, data: polyKf || null };
    }
    return { isKeyframed: false, data: null };
  };

  // Helper to toggle / set keyframe for an individual item on a specific frame
  const handleToggleItemKeyframe = (
    itemType: 'capsule' | 'point' | 'polygon' | 'motionBlur',
    itemId: string,
    frameOffset: number
  ) => {
    const gIdx = startIdx + frameOffset;
    updateCharacter(c => {
      const updatedAnimations = (c.animations || []).map(anim => {
        if (anim.stateId === currentAnimation.stateId) {
          const keyframes = anim.keyframes || [];
          const existingIdx = keyframes.findIndex(k => k.frameIndex === gIdx);

          let baseKf = existingIdx >= 0
            ? JSON.parse(JSON.stringify(keyframes[existingIdx]))
            : {
                frameIndex: gIdx
              };

          if (itemType === 'capsule') {
            if (baseKf.capsule && existingIdx >= 0) {
              delete baseKf.capsule;
            } else {
              baseKf.capsule = { ...getCapsuleForActiveFrame() };
            }
          } else if (itemType === 'motionBlur') {
            if (baseKf.motionBlur === true || baseKf.motionBlur === true) {
              delete baseKf.motionBlur;
            } else {
              baseKf.motionBlur = true;
            }
          } else if (itemType === 'point') {
            const ptObj = (c.points || []).find(p => p.id === itemId);
            if (!baseKf.points) baseKf.points = [];
            const pIdx = baseKf.points.findIndex((p: any) => p.pointId === itemId);
            if (pIdx >= 0 && existingIdx >= 0) {
              baseKf.points.splice(pIdx, 1);
            } else if (ptObj) {
              const curPos = getPointPosForActiveFrame(ptObj);
              baseKf.points.push({
                pointId: itemId,
                enabled: true,
                x: curPos.x,
                y: curPos.y
              });
            }
          } else if (itemType === 'polygon') {
            const polyObj = (c.polygons || []).find(p => p.id === itemId);
            if (!baseKf.polygons) baseKf.polygons = [];
            const polyIdx = baseKf.polygons.findIndex((p: any) => p.polygonId === itemId);
            if (polyIdx >= 0 && existingIdx >= 0) {
              baseKf.polygons.splice(polyIdx, 1);
            } else if (polyObj) {
              const curVerts = getPolyVertsForActiveFrame(polyObj);
              baseKf.polygons.push({
                polygonId: itemId,
                enabled: true,
                vertices: JSON.parse(JSON.stringify(curVerts))
              });
            }
          }

          const hasPoints = baseKf.points && baseKf.points.length > 0;
          const hasPolys = baseKf.polygons && baseKf.polygons.length > 0;
          const hasCap = !!baseKf.capsule;
          const hasBlur = baseKf.motionBlur === true;

          let newKeyframes: any[];
          if (!hasPoints && !hasPolys && !hasCap && !hasBlur) {
            newKeyframes = keyframes.filter((_, idx) => idx !== existingIdx);
          } else if (existingIdx >= 0) {
            newKeyframes = keyframes.map((k, idx) => idx === existingIdx ? baseKf : k);
          } else {
            newKeyframes = [...keyframes, baseKf];
          }

          return { ...anim, keyframes: newKeyframes };
        }
        return anim;
      });

      return { ...c, animations: updatedAnimations };
    });
  };

  // Helper to save edited socket or polygon item
  const handleSaveEditingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.type === 'point') {
      updateCharacter(c => ({
        ...c,
        points: (c.points || []).map(p => p.id === editingItem.id ? {
          ...p,
          name: editingItem.name,
          color: editingItem.color,
          tagId: editingItem.tagId as any
        } : p)
      }));
    } else {
      updateCharacter(c => ({
        ...c,
        polygons: (c.polygons || []).map(poly => poly.id === editingItem.id ? {
          ...poly,
          name: editingItem.name,
          color: editingItem.color,
          type: editingItem.polyType || 'hitbox'
        } : poly)
      }));
    }
    setEditingItem(null);
  };

  // Animation Playback Tick Effect
  useEffect(() => {
    if (!isPlayingAnim) return;
    const fps = Math.max(1, currentAnimation.frameRateFps || 8);
    const intervalMs = 1000 / fps;

    const timer = setInterval(() => {
      setCurrentFrameOffset(prev => {
        const next = prev + 1;
        if (next >= frameCount) {
          return currentAnimation.loop ? 0 : frameCount - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlayingAnim, currentAnimation, frameCount]);

  // Viewport Canvas Ref & Painting
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);

    const gridSize = 16;
    ctx.strokeStyle = '#1e1e2d';
    ctx.lineWidth = 0.5;
    const range = 240;
    for (let x = -range; x <= range; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -range);
      ctx.lineTo(x, range);
      ctx.stroke();
    }
    for (let y = -range; y <= range; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-range, y);
      ctx.lineTo(range, y);
      ctx.stroke();
    }

    // Origin crosshairs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // 1. Draw Prefab Sprite Frame from Active Spritesheet
    if (showSprite && activeSpritesheet) {
      const tileW = activeSpritesheet.tileWidth || 64;
      const tileH = activeSpritesheet.tileHeight || 64;
      const cols = activeSpritesheet.cols || 8;
      const rows = activeSpritesheet.rows || 4;
      const hw = tileW / 2;
      const hh = tileH / 2;

      const imgUrl = getSpritesheetDataUrl(activeSpritesheet);

      if (imgUrl) {
        let cachedImg = loadedImagesRef.current.get(imgUrl);
        if (!cachedImg) {
          cachedImg = new Image();
          cachedImg.src = imgUrl;
          cachedImg.onload = () => {
            setForceCanvasRedraw(prev => prev + 1);
          };
          loadedImagesRef.current.set(imgUrl, cachedImg);
        }

        if (cachedImg.complete && cachedImg.naturalWidth > 0) {
          const total = Math.max(1, cols * rows);
          const frameIndex = activeGlobalFrameIndex % total;
          const col = frameIndex % cols;
          const row = Math.floor(frameIndex / cols);
          const srcX = col * tileW;
          const srcY = row * tileH;

          ctx.save();
          ctx.imageSmoothingEnabled = false;
          
          const hasMotionBlur = getItemFrameKeyframe('motionBlur', 'blur', currentFrameOffset).isKeyframed;
          if (hasMotionBlur) {
             ctx.filter = 'blur(2.5px) drop-shadow(0px 0px 4px rgba(255,255,255,0.4))';
             ctx.globalAlpha = 0.85;
          }
          
          ctx.drawImage(
            cachedImg,
            srcX, srcY, tileW, tileH,
            -hw, -hh, tileW, tileH
          );
          ctx.restore();

          // Subtle frame boundary outline
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-hw, -hh, tileW, tileH);
        } else {
          // Fallback box while image is loading
          ctx.fillStyle = `${char.tintColor || '#06b6d4'}22`;
          ctx.strokeStyle = char.tintColor || '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-hw, -hh, tileW, tileH, 8);
          ctx.fill();
          ctx.stroke();

          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char.avatarIcon || '[Shield]', 0, 0);
        }
      }

      // Frame Index Badge
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(`Frame #${activeGlobalFrameIndex} [${currentAnimation.stateId}]`, 0, hh + 12);
    }

    // 2. Draw Capsule Collision Hull
    if (showCapsule) {
      const activeCapsule = getCapsuleForActiveFrame();
      const rad = activeCapsule.radius || 16;
      const h = activeCapsule.height || 44;
      const ox = activeCapsule.offsetX || 0;
      const oy = activeCapsule.offsetY || 0;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;

      const halfH = (h - rad * 2) / 2;
      ctx.beginPath();
      ctx.arc(0, -halfH, rad, Math.PI, 0);
      ctx.arc(0, halfH, rad, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Polygons (Hurtboxes / Hitboxes)
    if (showPolygons) {
      polygonsList.forEach(poly => {
        if (hiddenPolygonIds.has(poly.id)) return;
        const isSelected = selectedPolygonId === poly.id;
        const verts = getPolyVertsForActiveFrame(poly);
        if (verts.length < 3) return;

        ctx.save();
        ctx.beginPath();
        verts.forEach((v, idx) => {
          const vx = (dragOverride && dragOverride.id === poly.id && dragOverride.vertexIndex === idx) ? dragOverride.x : v.x;
          const vy = (dragOverride && dragOverride.id === poly.id && dragOverride.vertexIndex === idx) ? dragOverride.y : v.y;
          if (idx === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        ctx.closePath();

        ctx.fillStyle = poly.type === 'hitbox' ? 'rgba(239, 68, 68, 0.25)' : poly.type === 'shield' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(34, 197, 94, 0.25)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : (poly.color || (poly.type === 'hitbox' ? '#ef4444' : '#22c55e'));
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Vertices handles
        verts.forEach((v, idx) => {
          const vx = (dragOverride && dragOverride.id === poly.id && dragOverride.vertexIndex === idx) ? dragOverride.x : v.x;
          const vy = (dragOverride && dragOverride.id === poly.id && dragOverride.vertexIndex === idx) ? dragOverride.y : v.y;
          const isVSelected = isSelected && selectedVertexIdx === idx;

          ctx.fillStyle = isVSelected ? '#f59e0b' : '#ffffff';
          ctx.beginPath();
          ctx.arc(vx, vy, isVSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.restore();
      });
    }

    // 4. Draw Named Points (Sensory Sockets: Eyes, Ears, Torso, Feet, Weapon)
    if (showPoints) {
      pointsList.forEach(pt => {
        if (hiddenPointIds.has(pt.id)) return;
        const isSelected = selectedPointId === pt.id;
        const pos = getPointPosForActiveFrame(pt);
        const px = (dragOverride && dragOverride.id === pt.id) ? dragOverride.x : pos.x;
        const py = (dragOverride && dragOverride.id === pt.id) ? dragOverride.y : pos.y;

        ctx.save();
        ctx.translate(px, py);

        // Outer pulse ring if selected
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Point Center
        ctx.fillStyle = pt.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pt.name, 8, 3);

        ctx.restore();
      });
    }

    ctx.restore();
  }, [
    zoom,
    panX,
    panY,
    char,
    showSprite,
    showCapsule,
    showPoints,
    showPolygons,
    capsuleConfig,
    polygonsList,
    pointsList,
    selectedPointId,
    selectedPolygonId,
    selectedVertexIdx,
    hiddenPointIds,
    hiddenPolygonIds,
    dragOverride,
    activeGlobalFrameIndex,
    activeSpritesheet,
    currentAnimation,
    forceCanvasRedraw
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom(z => Math.min(Math.max(Number((z * factor).toFixed(2)), 0.25), 8.0));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Pointer drag helpers for interactive canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Pan with Right Click, Middle Click, Space, Alt, or Shift
    if (e.button === 2 || e.button === 1 || e.altKey || e.shiftKey || (window as any).__isSpaceDown) {
      setIsPanning(true);
      setPanStart({ x: mouseX - panX, y: mouseY - panY });
      return;
    }

    // World coordinate transform
    const worldX = (mouseX - canvas.width / 2 - panX) / zoom;
    const worldY = (mouseY - canvas.height / 2 - panY) / zoom;

    // Check hit on Points
    for (const pt of pointsList) {
      if (hiddenPointIds.has(pt.id)) continue;
      const pos = getPointPosForActiveFrame(pt);
      const dist = Math.hypot(pos.x - worldX, pos.y - worldY);
      if (dist < 8) {
        setSelectedPointId(pt.id);
        setSelectedPolygonId('');
        setSelectedVertexIdx(null);
        setDragTarget({ type: 'point', id: pt.id });
        return;
      }
    }

    // Check hit on Polygon Vertices
    for (const poly of polygonsList) {
      if (hiddenPolygonIds.has(poly.id)) continue;
      const verts = getPolyVertsForActiveFrame(poly);
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        const dist = Math.hypot(v.x - worldX, v.y - worldY);
        if (dist < 8) {
          setSelectedPolygonId(poly.id);
          setSelectedVertexIdx(i);
          setSelectedPointId('');
          setDragTarget({ type: 'poly_vertex', id: poly.id, vertexIndex: i });
          return;
        }
      }
    }

    // Deselect if clicked empty space
    setSelectedPointId('');
    setSelectedPolygonId('');
    setSelectedVertexIdx(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isPanning) {
      setPanX(mouseX - panStart.x);
      setPanY(mouseY - panStart.y);
      return;
    }

    if (!dragTarget) return;

    const worldX = Math.round((mouseX - canvas.width / 2 - panX) / zoom);
    const worldY = Math.round((mouseY - canvas.height / 2 - panY) / zoom);

    setDragOverride({
      id: dragTarget.id,
      vertexIndex: dragTarget.vertexIndex,
      x: worldX,
      y: worldY
    });
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragTarget && dragOverrideRef.current) {
      const { id, vertexIndex, x, y } = dragOverrideRef.current;
      
      updateCharacter(c => {
        // 1. Update keyframes for active animation
        const updatedAnimations = (c.animations || []).map(anim => {
          if (anim.stateId === currentAnimation.stateId) {
            const keyframes = anim.keyframes || [];
            const existingKfIndex = keyframes.findIndex(k => k.frameIndex === activeGlobalFrameIndex);

            const baseKf: any = existingKfIndex >= 0
              ? JSON.parse(JSON.stringify(keyframes[existingKfIndex]))
              : {
                  frameIndex: activeGlobalFrameIndex
                };

            if (dragTarget.type === 'point') {
              if (!baseKf.points) baseKf.points = [];
              const ptIdx = baseKf.points.findIndex((p: any) => p.pointId === id);
              if (ptIdx >= 0) {
                baseKf.points[ptIdx].x = x;
                baseKf.points[ptIdx].y = y;
                baseKf.points[ptIdx].enabled = true;
              } else {
                baseKf.points.push({ pointId: id, enabled: true, x, y });
              }
            } else if (dragTarget.type === 'poly_vertex' && vertexIndex !== undefined) {
              if (!baseKf.polygons) baseKf.polygons = [];
              const polyIdx = baseKf.polygons.findIndex((p: any) => p.polygonId === id);
              if (polyIdx >= 0) {
                if (!baseKf.polygons[polyIdx].vertices) baseKf.polygons[polyIdx].vertices = [];
                baseKf.polygons[polyIdx].vertices[vertexIndex] = { x, y };
                baseKf.polygons[polyIdx].enabled = true;
              } else {
                const origPoly = (c.polygons || []).find(p => p.id === id);
                const currentVerts = origPoly ? getPolyVertsForActiveFrame(origPoly) : [];
                const verts = JSON.parse(JSON.stringify(currentVerts));
                verts[vertexIndex] = { x, y };
                baseKf.polygons.push({ polygonId: id, enabled: true, vertices: verts });
              }
            }

            const newKeyframesList = existingKfIndex >= 0
              ? keyframes.map((k, idx) => idx === existingKfIndex ? baseKf : k)
              : [...keyframes, baseKf];

            return { ...anim, keyframes: newKeyframesList };
          }
          return anim;
        });

        // 2. Also keep base defaults in sync if on frame 0
        let updatedPoints = c.points || [];
        let updatedPolygons = c.polygons || [];
        let updatedSockets = c.sockets || [];

        if (currentFrameOffset === 0) {
          if (dragTarget.type === 'point') {
            updatedPoints = (c.points || []).map(p => p.id === id ? { ...p, defaultOffsetX: x, defaultOffsetY: y } : p);
            updatedSockets = (c.sockets || []).map(s => {
              const matchingPt = (c.points || []).find(p => p.id === id);
              if (matchingPt && (s.tagId === matchingPt.id || s.label.toLowerCase().includes(matchingPt.name.toLowerCase()))) {
                return { ...s, offsetX: x, offsetY: y };
              }
              return s;
            });
          } else if (dragTarget.type === 'poly_vertex' && vertexIndex !== undefined) {
            updatedPolygons = (c.polygons || []).map(p => {
              if (p.id === id) {
                const updatedVerts = [...(p.defaultVertices || [])];
                updatedVerts[vertexIndex] = { x, y };
                return { ...p, defaultVertices: updatedVerts };
              }
              return p;
            });
          }
        }

        return {
          ...c,
          animations: updatedAnimations,
          points: updatedPoints,
          polygons: updatedPolygons,
          sockets: updatedSockets
        };
      });
    }

    setDragTarget(null);
    setDragOverride(null);
  };

  // Variable Form Submissions
  const handleSaveVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!varForm.name.trim()) return;

    const newVar: BehaviorVariable = {
      id: varForm.id || generateVariableId(),
      name: varForm.name.trim(),
      category: varForm.category,
      type: varForm.type,
      defaultValue: varForm.type === 'number' ? Number(varForm.defaultValue) : varForm.defaultValue,
      isStatic: varForm.isStatic
    };

    updateCharacter(c => {
      const existing = c.variables || [];
      const updated = varForm.isEditing
        ? existing.map(v => v.id === newVar.id ? newVar : v)
        : [...existing, newVar];

      const varsRecord = { ...(c.behaviorVariables || {}) };
      if (varsRecord[newVar.id] === undefined) {
        varsRecord[newVar.id] = newVar.defaultValue;
      }

      return {
        ...c,
        variables: updated,
        behaviorVariables: varsRecord
      };
    });

    setIsVarModalOpen(false);
  };

  const handleDeleteVariable = (varId: string) => {
    updateCharacter(c => {
      const remaining = (c.variables || []).filter(v => v.id !== varId);
      const remainingVals = { ...(c.behaviorVariables || {}) };
      delete remainingVals[varId];
      return {
        ...c,
        variables: remaining,
        behaviorVariables: remainingVals
      };
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden select-none font-sans">
      
      {/* 1. TOP HEADER & SUBFOLDER NAVIGATION */}
      <FileSubfolderHeader
        subfolderName="prefabs"
        extension=".prefab"
        files={charFiles.map(c => ({
          id: c.id,
          name: c.name || c.prefabData?.name || c.fileName,
          fileName: c.fileName,
          updatedAt: c.updatedAt,
          checkout: c.checkout
        }))}
        activeFileName={currentFile.fileName}
        checkout={currentFile.checkout}
        onCheckOutFile={(fName, note) => {
          const { project: updated } = performFileCheckout(project, 'prefabs', fName, note);
          onUpdateProject(() => updated, { actionLabel: `Check out ${fName}` });
        }}
        onCheckInFile={(fName, pushChanges, note) => {
          if (pushChanges) {
            const now = new Date().toISOString();
            const updatedCharData = { ...char, updatedAt: now };
            updateCharacter(() => updatedCharData);
            onUpdateProject(p => ({
              ...p,
              updatedAt: now,
              fileSystem: {
                ...p.fileSystem,
                prefabs: (p.fileSystem.prefabs || []).map(f =>
                  f.fileName === currentFile.fileName ? {
                    ...f,
                    name: char.name || f.name,
                    updatedAt: now,
                    prefabData: updatedCharData,
                    checkout: undefined
                  } : f
                )
              }
            }), { actionLabel: `Check in ${fName}`, syncLinked: true });
          } else {
            const { project: updated } = performFileCheckIn(project, 'prefabs', fName, { note });
            onUpdateProject(() => updated, { actionLabel: `Check in ${fName}` });
          }
        }}
        onForceUnlockFile={(fName) => {
          const { project: updated } = performFileForceUnlock(project, 'prefabs', fName);
          onUpdateProject(() => updated, { actionLabel: `Force unlock ${fName}` });
        }}
        accentColor="rose"
        onBackToDashboard={onBackToDashboard}
        onRefreshFromLinked={onRefreshFromLinked}
        isSyncingLinked={isSyncingLinked}
        isOutOfSync={isOutOfSync}
        storageType={project?.storageLocation?.type}
        centerContent={
          <div className="flex items-center gap-1.5 max-w-full truncate">
            <span className="text-base leading-none shrink-0" title="Prefab Avatar">{char?.avatarIcon || '[Shield]'}</span>
            <input
              type="text"
              value={char?.name || ''}
              onChange={(e) => updateCharacter(c => ({ ...c, name: e.target.value }))}
              className="bg-transparent text-xs sm:text-sm font-bold text-white border-b border-dashed border-neutral-700 hover:border-rose-500 focus:border-rose-500 focus:outline-none transition py-0.5 max-w-[130px] sm:max-w-[190px] text-center"
              title="Click to edit prefab name"
            />
            <select
              value={char?.prefabType || 'player_hero'}
              onChange={(e) => updateCharacter(c => ({ ...c, prefabType: e.target.value as any }))}
              className="text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 shrink-0 cursor-pointer focus:outline-none focus:border-rose-400"
              title="Change Prefab Type"
            >
              <option value="player_hero">PLAYER HERO</option>
              <option value="friendly_npc">FRIENDLY NPC</option>
              <option value="enemy_mob">ENEMY MOB</option>
              <option value="boss_archon">BOSS ARCHON</option>
              <option value="environmental_prop">ENVIRONMENTAL PROP</option>
            </select>
          </div>
        }
        extraActions={
          <button
            type="button"
            onClick={() => setIsCopyModalOpen(true)}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-750 shadow-sm"
            title="Copy behavior rules & variables from another prefab"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span className="hidden md:inline">Copy Rules/Vars</span>
            <span className="md:hidden">Copy</span>
          </button>
        }
        onSelectFile={(fileName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, prefabFileName: fileName }
          }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: 'Select Prefab File' } as any);
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.prefab`;
          const newCharFile: PrefabFile = {
            id: `char_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            prefabData: {
              id: `char_${Date.now()}`,
              name,
              prefabType: 'enemy_mob',
              avatarIcon: '👹',
              spriteWidth: 64,
              spriteHeight: 64,
              tintColor: '#f59e0b',
              baseScale: 1.0,
              states: ['idle', 'patrol', 'combat'],
              variables: [
                { id: generateVariableId(), name: 'Max Health', category: 'attribute', type: 'number', isStatic: true, defaultValue: 100 },
                { id: generateVariableId(), name: 'Patrol Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 3.0 }
              ],
              behaviorVariables: {},
              rules: [],
              capsule: { radius: 16, height: 44, offsetX: 0, offsetY: 2 },
              spritesheets: [{ id: 'sheet_default', name: 'Default Spritesheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }],
              points: [],
              polygons: [],
              sockets: [],
              animations: [
                { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_default', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
              ]
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, prefabFileName: safeName },
            fileSystem: { ...p.fileSystem, prefabs: [...(p.fileSystem.prefabs || []), newCharFile] }
          }));
        }}
        onDuplicateFile={(_fileName) => {
          handleDuplicateCharacter();
        }}
        onSaveFile={() => {
          const now = new Date().toISOString();
          const updatedCharData = { ...char, updatedAt: now };
          updateCharacter(() => updatedCharData);
          onUpdateProject(p => ({
            ...p,
            updatedAt: now,
            fileSystem: {
              ...p.fileSystem,
              prefabs: (p.fileSystem.prefabs || []).map(f =>
                (f.fileName === currentFile.fileName || f.id === currentFile.id)
                  ? { ...f, name: updatedCharData.name || f.name, updatedAt: now, prefabData: updatedCharData }
                  : f
              )
            }
          }), { actionLabel: `Saved prefab ${currentFile.fileName}`, syncLinked: true } as any);
          const targetName = project?.storageLocation?.displayName || project?.storageLocation?.targetFolderName || 'target folder';
          showToast(`Saved prefab "${char.name || currentFile.name}" (${currentFile.fileName}) to ${targetName}`, 'success');
        }}
        onSaveAsFile={(newFileName) => {
          if (!project) return;
          const { project: updated } = performFileSaveAs(project, 'prefabs', currentFile.fileName, newFileName, { ...currentFile, prefabData: char });
          onUpdateProject(() => updated, { actionLabel: `Saved prefab as ${newFileName}` });
        }}
        onExportFile={(fileName) => {
          const jsonStr = JSON.stringify(currentFile, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
        }}
        onDeleteFile={(fileName) => {
          if ((project.fileSystem.prefabs || []).length <= 1) return;
          onUpdateProject(p => {
            const rem = (p.fileSystem.prefabs || []).filter(c => c.fileName !== fileName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, prefabFileName: rem[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, prefabs: rem }
            };
          });
        }}
        onRenameFile={(oldFileName, newName) => {
          const safeName = newName.endsWith('.prefab') ? newName : `${newName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.prefab`;
          onUpdateProject(p => ({
            ...p,
            activeFiles: {
              ...p.activeFiles,
              prefabFileName: p.activeFiles.prefabFileName === oldFileName ? safeName : p.activeFiles.prefabFileName
            },
            fileSystem: {
              ...p.fileSystem,
              prefabs: (p.fileSystem.prefabs || []).map(c => c.fileName === oldFileName ? {
                ...c,
                name: newName.replace(/\.prefab$/, ''),
                fileName: safeName,
                prefabData: { ...c.prefabData, name: newName.replace(/\.prefab$/, '') }
              } : c)
            }
          }));
        }}
      />

      {/* 2. STICKY PRIMARY WORKSPACE TABS (Always visible above scroll) */}
      <div className="bg-neutral-950/95 border-b border-neutral-800 px-3 md:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 z-10">
        <button
          type="button"
          onClick={() => setActiveTab('composition')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'composition' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Layers size={13} className={activeTab === 'composition' ? 'text-white' : 'text-emerald-400'} />
          <span>Composite Parts ({(char.parts || []).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('animation_studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'animation_studio' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Play size={13} />
          <span>Animation Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('spritesheet_manager')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'spritesheet_manager' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Grid size={13} />
          <span>Spritesheets ({spritesheetsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('variables')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'variables' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Database size={13} className={activeTab === 'variables' ? 'text-white' : 'text-rose-400'} />
          <span>Variables ({variablesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('states')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'states' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <GitMerge size={13} className={activeTab === 'states' ? 'text-white' : 'text-indigo-400'} />
          <span>States ({stateNodes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('behaviors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'behaviors' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Brain size={13} className={activeTab === 'behaviors' ? 'text-white' : 'text-amber-400'} />
          <span>Behaviors ({rulesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bones_ik')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            activeTab === 'bones_ik' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Target size={13} className={activeTab === 'bones_ik' ? 'text-white' : 'text-amber-400'} />
          <span>Bones & IK ({((char.skeleton?.bones || []).length)})</span>
        </button>
      </div>

      {/* 4. SCROLLABLE TAB WORKSPACE CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">

        {/* ========================================================================= */}
        {/* TAB 0: COMPOSITE PARTS (PREFAB COMPOSITION STUDIO) */}
        {/* ========================================================================= */}
        {activeTab === 'composition' && (
          <PrefabCompositionStudio
            project={project}
            char={char}
            onUpdateCharacter={updateCharacter}
            onUpdateProject={onUpdateProject}
            showToast={showToast}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 0.5: 2D BONES & INVERSE KINEMATICS (IK) STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'bones_ik' && (
          <div className="h-[760px] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
            <PrefabBoneIKStudio
              project={project}
              char={char}
              onUpdateCharacter={updateCharacter}
              onUpdateProject={onUpdateProject}
              showToast={showToast}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ANIMATION STUDIO (SPRITESHEET ANIMATION & TIMELINE) */}
        {/* ========================================================================= */}
        {activeTab === 'animation_studio' && (
          <div className="flex flex-col xl:flex-row gap-5 items-start">
            
            {/* LEFT COLUMN: Animation States & Clip Setup */}
            <div className="w-full xl:w-80 shrink-0 space-y-4">
              
              {/* Animation States List */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play size={14} />
                    Animation States
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newStateId = `state_${Date.now().toString().slice(-4)}`;
                      const newAnim: PrefabAnimationConfig = {
                        stateId: newStateId,
                        label: 'New Action',
                        spritesheetId: activeSpritesheet.id,
                        startFrameIndex: 0,
                        endFrameIndex: 3,
                        frameRateFps: 8,
                        loop: true
                      };
                      updateCharacter(c => ({
                        ...c,
                        animations: [...(c.animations || []), newAnim]
                      }));
                      setSelectedAnimStateId(newStateId);
                    }}
                    className="p-1 text-cyan-400 hover:bg-neutral-800 rounded transition"
                    title="Add Animation State"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {animationsList.map(a => {
                    const isSelected = a.stateId === selectedAnimStateId;
                    const kfCount = a.keyframes?.length || 0;
                    return (
                      <div
                        key={a.stateId}
                        onClick={() => {
                          setSelectedAnimStateId(a.stateId);
                          setCurrentFrameOffset(0);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                          isSelected ? 'bg-cyan-950/70 border border-cyan-500/50 text-white font-bold shadow-md shadow-cyan-950/40' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{isSelected ? '▶' : '•'}</span>
                          <span className="truncate">{a.label || a.stateId}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {kfCount > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30" title={`${kfCount} keyframed frame(s)`}>
                              ◆ {kfCount}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-neutral-500">
                            {a.frameRateFps || 8} fps
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Animation Clip Parameters */}
              {currentAnimation && (
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={14} />
                      Animation Clip Setup
                    </span>
                    {animationsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          updateCharacter(c => ({
                            ...c,
                            animations: (c.animations || []).filter(a => a.stateId !== currentAnimation.stateId)
                          }));
                          setSelectedAnimStateId(animationsList.find(a => a.stateId !== currentAnimation.stateId)?.stateId || 'idle');
                        }}
                        className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                        title="Delete Animation State"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Action Label</label>
                      <input
                        type="text"
                        value={currentAnimation.label || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCharacter(c => ({
                            ...c,
                            animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, label: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Spritesheet Source</label>
                      <select
                        value={currentAnimation.spritesheetId}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCharacter(c => ({
                            ...c,
                            animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, spritesheetId: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                      >
                        {spritesheetsList.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.tileWidth}x{s.tileHeight})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Start Frame #</label>
                        <input
                          type="number"
                          min={0}
                          value={currentAnimation.startFrameIndex || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            updateCharacter(c => ({
                              ...c,
                              animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, startFrameIndex: val } : a)
                            }));
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">End Frame #</label>
                        <input
                          type="number"
                          min={0}
                          value={currentAnimation.endFrameIndex !== undefined ? currentAnimation.endFrameIndex : 3}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            updateCharacter(c => ({
                              ...c,
                              animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, endFrameIndex: val } : a)
                            }));
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Speed (FPS)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={currentAnimation.frameRateFps || 8}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            updateCharacter(c => ({
                              ...c,
                              animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, frameRateFps: val } : a)
                            }));
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 cursor-pointer py-1 text-xs text-neutral-300">
                          <input
                            type="checkbox"
                            checked={currentAnimation.loop !== false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateCharacter(c => ({
                                ...c,
                                animations: (c.animations || []).map(a => a.stateId === currentAnimation.stateId ? { ...a, loop: checked } : a)
                              }));
                            }}
                            className="rounded bg-neutral-950 border-neutral-700 text-cyan-500"
                          />
                          <span>Loop Playback</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RESIZABLE SENSORY SOCKETS SECTION */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-3.5 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Circle size={13} />
                      Sockets ({pointsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPoints(!showPoints)}
                      className={`p-1 rounded transition ${showPoints ? 'text-sky-400 hover:text-sky-300' : 'text-neutral-600 hover:text-neutral-400'}`}
                      title={showPoints ? 'Hide Sockets from Canvas' : 'Show Sockets on Canvas'}
                    >
                      {showPoints ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Preset Size Pills */}
                    <div className="flex items-center gap-0.5 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSocketsHeight(140)}
                        className={`px-1.5 py-0.5 rounded transition ${socketsHeight <= 150 ? 'bg-sky-950 text-sky-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Compact height (140px)"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocketsHeight(230)}
                        className={`px-1.5 py-0.5 rounded transition ${socketsHeight > 150 && socketsHeight <= 280 ? 'bg-sky-950 text-sky-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Medium height (230px)"
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocketsHeight(380)}
                        className={`px-1.5 py-0.5 rounded transition ${socketsHeight > 280 ? 'bg-sky-950 text-sky-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Expanded height (380px)"
                      >
                        L
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPt: PrefabNamedPoint = {
                          id: `pt_${Date.now().toString().slice(-4)}`,
                          name: 'Custom Socket',
                          color: '#38bdf8',
                          defaultOffsetX: 0,
                          defaultOffsetY: 0
                        };
                        updateCharacter(c => ({ ...c, points: [...(c.points || []), newPt] }));
                      }}
                      className="p-1 text-sky-400 hover:bg-neutral-800 rounded transition"
                      title="Add Socket Point"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Resizable Sockets List Viewport */}
                <div
                  style={{ height: `${socketsHeight}px` }}
                  className="overflow-y-auto p-3 space-y-1.5 transition-[height] duration-75"
                >
                  {pointsList.length === 0 && (
                    <div className="text-center py-6 text-neutral-500 text-xs italic">
                      No sensory sockets added yet. Click + to create one.
                    </div>
                  )}
                  {pointsList.map(pt => {
                    const isHidden = hiddenPointIds.has(pt.id);
                    const isSelected = selectedPointId === pt.id;
                    return (
                      <div
                        key={pt.id}
                        onClick={() => {
                          setSelectedPointId(pt.id);
                          setSelectedPolygonId('');
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition ${
                          isSelected ? 'bg-sky-950/70 border-sky-500 text-white shadow-sm' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        } ${isHidden ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: pt.color }} />
                          <div className="truncate">
                            <span className="font-medium truncate">{pt.name}</span>
                            {pt.tagId && (
                              <span className="ml-1.5 text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-900 text-sky-300 border border-sky-500/20">
                                {pt.tagId}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-mono text-neutral-500 mr-1">
                            {pt.defaultOffsetX},{pt.defaultOffsetY}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingItem({
                              type: 'point',
                              id: pt.id,
                              name: pt.name,
                              color: pt.color,
                              tagId: pt.tagId
                            })}
                            className="p-1 text-neutral-400 hover:text-sky-300 rounded transition"
                            title="Edit Socket Details"
                          >
                            <Sliders size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHiddenPointIds(prev => {
                                const next = new Set(prev);
                                if (next.has(pt.id)) next.delete(pt.id);
                                else next.add(pt.id);
                                return next;
                              });
                            }}
                            className={`p-1 rounded transition ${isHidden ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-400 hover:text-white'}`}
                            title={isHidden ? 'Show Socket' : 'Hide Socket'}
                          >
                            {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateCharacter(c => ({
                                ...c,
                                points: (c.points || []).filter(p => p.id !== pt.id)
                              }));
                              if (selectedPointId === pt.id) setSelectedPointId('');
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Delete Socket"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sockets Section Vertical Resize Drag Handle */}
                <div
                  onMouseDown={handleSocketsResizeStart}
                  className="h-2.5 bg-neutral-950 hover:bg-sky-500/20 active:bg-sky-500/40 border-t border-neutral-800 cursor-row-resize flex items-center justify-center transition-colors group select-none"
                  title="Drag down or up to resize Sockets section height"
                >
                  <div className="w-8 h-1 rounded-full bg-neutral-700 group-hover:bg-sky-400 transition-colors" />
                </div>
              </div>

              {/* RESIZABLE HURTBOX / HITBOX POLYGONS SECTION */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-3.5 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Pentagon size={13} />
                      Hitboxes ({polygonsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPolygons(!showPolygons)}
                      className={`p-1 rounded transition ${showPolygons ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-600 hover:text-neutral-400'}`}
                      title={showPolygons ? 'Hide Hitboxes from Canvas' : 'Show Hitboxes on Canvas'}
                    >
                      {showPolygons ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => setHitboxesHeight(120)}
                        className={`px-1.5 py-0.5 rounded transition ${hitboxesHeight <= 140 ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Compact height (120px)"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setHitboxesHeight(200)}
                        className={`px-1.5 py-0.5 rounded transition ${hitboxesHeight > 140 && hitboxesHeight <= 260 ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Medium height (200px)"
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => setHitboxesHeight(320)}
                        className={`px-1.5 py-0.5 rounded transition ${hitboxesHeight > 260 ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Expanded height (320px)"
                      >
                        L
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPoly: PrefabNamedPolygon = {
                          id: `poly_${Date.now().toString().slice(-4)}`,
                          name: 'Attack Hitbox',
                          type: 'hitbox',
                          color: '#ef4444',
                          defaultVertices: [
                            { x: 10, y: -16 },
                            { x: 38, y: -16 },
                            { x: 38, y: 16 },
                            { x: 10, y: 16 }
                          ]
                        };
                        updateCharacter(c => ({ ...c, polygons: [...(c.polygons || []), newPoly] }));
                      }}
                      className="p-1 text-emerald-400 hover:bg-neutral-800 rounded transition"
                      title="Add Hitbox Polygon"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Resizable Polygons List Viewport */}
                <div
                  style={{ height: `${hitboxesHeight}px` }}
                  className="overflow-y-auto p-3 space-y-1.5 transition-[height] duration-75"
                >
                  {polygonsList.length === 0 && (
                    <div className="text-center py-6 text-neutral-500 text-xs italic">
                      No hitboxes added yet. Click + to create one.
                    </div>
                  )}
                  {polygonsList.map(poly => {
                    const isHidden = hiddenPolygonIds.has(poly.id);
                    const isSelected = selectedPolygonId === poly.id;
                    return (
                      <div
                        key={poly.id}
                        onClick={() => {
                          setSelectedPolygonId(poly.id);
                          setSelectedPointId('');
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition ${
                          isSelected ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-sm' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        } ${isHidden ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: poly.color }} />
                          <span className="truncate font-medium">{poly.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                            {poly.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingItem({
                              type: 'polygon',
                              id: poly.id,
                              name: poly.name,
                              color: poly.color,
                              polyType: poly.type
                            })}
                            className="p-1 text-neutral-400 hover:text-emerald-300 rounded transition"
                            title="Edit Polygon Properties"
                          >
                            <Sliders size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHiddenPolygonIds(prev => {
                                const next = new Set(prev);
                                if (next.has(poly.id)) next.delete(poly.id);
                                else next.add(poly.id);
                                return next;
                              });
                            }}
                            className={`p-1 rounded transition ${isHidden ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-400 hover:text-white'}`}
                            title={isHidden ? 'Show Polygon' : 'Hide Polygon'}
                          >
                            {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateCharacter(c => ({
                                ...c,
                                polygons: (c.polygons || []).filter(p => p.id !== poly.id)
                              }));
                              if (selectedPolygonId === poly.id) setSelectedPolygonId('');
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Delete Polygon"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hitboxes Section Vertical Resize Drag Handle */}
                <div
                  onMouseDown={handleHitboxesResizeStart}
                  className="h-2.5 bg-neutral-950 hover:bg-emerald-500/20 active:bg-emerald-500/40 border-t border-neutral-800 cursor-row-resize flex items-center justify-center transition-colors group select-none"
                  title="Drag down or up to resize Hitboxes section height"
                >
                  <div className="w-8 h-1 rounded-full bg-neutral-700 group-hover:bg-emerald-400 transition-colors" />
                </div>
              </div>

              {/* Capsule Collider Config */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Circle size={14} />
                      Capsule Collider
                    </span>
                    {isCapsuleKeyframedOnActiveFrame() ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                        ◆ Frame #{activeGlobalFrameIndex}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                        Base
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCapsule(!showCapsule)}
                    className={`p-1 rounded transition ${showCapsule ? 'text-sky-400 hover:text-sky-300' : 'text-neutral-600 hover:text-neutral-400'}`}
                    title={showCapsule ? 'Hide Capsule from Canvas' : 'Show Capsule on Canvas'}
                  >
                    {showCapsule ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>

                {(() => {
                  const activeCap = getCapsuleForActiveFrame();
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Radius (px)</label>
                          <input
                            type="number"
                            value={activeCap.radius || 16}
                            onChange={(e) => updateActiveFrameCapsule(prev => ({ ...prev, radius: Number(e.target.value) }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Height (px)</label>
                          <input
                            type="number"
                            value={activeCap.height || 44}
                            onChange={(e) => updateActiveFrameCapsule(prev => ({ ...prev, height: Number(e.target.value) }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Offset X (px)</label>
                          <input
                            type="number"
                            value={activeCap.offsetX || 0}
                            onChange={(e) => updateActiveFrameCapsule(prev => ({ ...prev, offsetX: Number(e.target.value) }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Offset Y (px)</label>
                          <input
                            type="number"
                            value={activeCap.offsetY || 0}
                            onChange={(e) => updateActiveFrameCapsule(prev => ({ ...prev, offsetY: Number(e.target.value) }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* MIDDLE COLUMN: Sockets/Hitboxes Keyframe Matrix Grid */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              
              {/* MATRIX GRID CARD */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3.5 shadow-xl flex flex-col">
                
                {/* Matrix Header & Playback Control Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Table size={14} className="text-cyan-400" />
                      Keyframe Matrix
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                      {currentAnimation.label || currentAnimation.stateId}
                    </span>
                  </div>

                  {/* Playback Controls & Frame Stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleFirstFrame}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                      title="First Frame (|<<)"
                    >
                      <SkipBack size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevFrame}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                      title="Previous Frame (<)"
                    >
                      <StepBack size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        isPlayingAnim ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }`}
                    >
                      {isPlayingAnim ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingAnim ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFrame}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                      title="Next Frame (>)"
                    >
                      <StepForward size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handleLastFrame}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                      title="Last Frame (>>|)"
                    >
                      <SkipForward size={12} />
                    </button>
                  </div>
                </div>

                {/* Keyframe Snapshot Quick Actions Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      Frame {currentFrameOffset + 1} / {frameCount}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      (Cell #{activeGlobalFrameIndex})
                    </span>
                    {isCurrentFrameKeyframed() ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                        ◆ Saved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-500 font-mono text-[10px]">
                        ○ Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quick Preset Matrix Size Pills */}
                    <div className="flex items-center gap-0.5 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 text-[9px] font-mono mr-1">
                      <button
                        type="button"
                        onClick={() => setAnimMatrixHeight(240)}
                        className={`px-1.5 py-0.5 rounded transition ${animMatrixHeight <= 260 ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Compact height (240px)"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnimMatrixHeight(360)}
                        className={`px-1.5 py-0.5 rounded transition ${animMatrixHeight > 260 && animMatrixHeight <= 440 ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Medium height (360px)"
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnimMatrixHeight(520)}
                        className={`px-1.5 py-0.5 rounded transition ${animMatrixHeight > 440 ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        title="Expanded height (520px)"
                      >
                        L
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSetKeyframeForCurrentFrame}
                      className="px-2.5 py-1 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm"
                      title="Snapshot socket & hitbox positions as keyframe for this frame"
                    >
                      <Key size={11} />
                      <span>Set Keyframe</span>
                    </button>

                    {isCurrentFrameKeyframed() && (
                      <button
                        type="button"
                        onClick={handleClearKeyframeForCurrentFrame}
                        className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        title="Revert this frame to default base positions"
                      >
                        <Trash2 size={11} />
                        <span>Clear</span>
                      </button>
                    )}

                    {currentFrameOffset > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyKeyframeFromPrev}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        title="Copy keyframe positions from the previous frame"
                      >
                        <Copy size={11} />
                        <span>Copy Prev</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* THE RESIZABLE MATRIX GRID: Sockets & Polygons per Animation Frame */}
                <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 shadow-inner flex flex-col">
                  <div
                    style={{ height: `${animMatrixHeight}px` }}
                    className="overflow-x-auto overflow-y-auto transition-[height] duration-75"
                  >
                    <table className="w-max text-left border-collapse text-xs table-fixed">
                      <colgroup>
                        <col style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }} />
                        {Array.from({ length: frameCount }).map((_, i) => (
                          <col key={i} style={{ width: '28px', minWidth: '28px', maxWidth: '28px' }} />
                        ))}
                      </colgroup>
                      
                      {/* Table Header: Item Name + Each Frame Column */}
                      <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-20 border-b border-neutral-800 text-[10px] select-none">
                        <tr className="h-7">
                          <th className="px-2 py-0 font-bold text-neutral-300 sticky left-0 bg-neutral-900/95 z-30 w-[130px] min-w-[130px] max-w-[130px] border-r border-neutral-800 truncate align-middle">
                            Element / Track
                          </th>
                          {Array.from({ length: frameCount }).map((_, offset) => {
                            const gIdx = startIdx + offset;
                            const isCurrent = offset === currentFrameOffset;
                            const hasKf = hasKeyframeOnFrame(gIdx);
                            return (
                              <th
                                key={offset}
                                onClick={() => {
                                  setIsPlayingAnim(false);
                                  setCurrentFrameOffset(offset);
                                }}
                                style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}
                                className={`p-0 text-center cursor-pointer font-mono border-r border-neutral-800/60 transition align-middle ${
                                  isCurrent
                                    ? 'bg-cyan-950/80 text-cyan-300 border-b-2 border-b-cyan-400 font-bold'
                                    : 'text-neutral-400 hover:bg-neutral-800/80 hover:text-white'
                                }`}
                                title={`Jump to Frame #${offset + 1} (Cell #${gIdx})`}
                              >
                                <div className="w-[28px] h-[28px] flex flex-col items-center justify-center leading-none">
                                  <span className="text-[10px] font-bold">{offset + 1}</span>
                                  {hasKf ? (
                                    <span className="text-amber-400 text-[8px] leading-none">◆</span>
                                  ) : (
                                    <span className="text-[7px] text-neutral-600 font-normal leading-none">{gIdx}</span>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-neutral-900 font-mono text-[11px]">
                        
                        {/* 0. MOTION BLUR TRACK ROW */}
                        <tr className="hover:bg-neutral-900/40 transition h-7">
                          <td className="px-2 py-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 font-sans truncate w-[130px] min-w-[130px] max-w-[130px] align-middle">
                            <div className="flex items-center gap-1.5 truncate">
                              <Activity size={10} className="text-pink-400 shrink-0" />
                              <span className="font-bold text-pink-300 text-xs truncate">Sprite Blur</span>
                            </div>
                          </td>
                          {Array.from({ length: frameCount }).map((_, offset) => {
                            const isCurrent = offset === currentFrameOffset;
                            const kfStatus = getItemFrameKeyframe('motionBlur', 'blur', offset);
                            return (
                              <td
                                key={offset}
                                onClick={() => {
                                  setCurrentFrameOffset(offset);
                                }}
                                onDoubleClick={() => handleToggleItemKeyframe('motionBlur', 'blur', offset)}
                                style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}
                                className={`p-0 text-center border-r border-neutral-800/40 cursor-pointer transition select-none align-middle ${
                                  isCurrent ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-neutral-900/60'
                                }`}
                                title={kfStatus.isKeyframed ? 'Motion Blur Enabled. Double-click to disable.' : 'Motion Blur Disabled. Double-click to enable.'}
                              >
                                <div className="w-[28px] h-[28px] flex items-center justify-center">
                                  {kfStatus.isKeyframed ? (
                                    <span className="text-pink-400 font-bold leading-none">■</span>
                                  ) : (
                                    <span className="text-neutral-700 leading-none hover:text-neutral-500">·</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* 1. CAPSULE TRACK ROW */}
                        <tr className="hover:bg-neutral-900/40 transition h-7">
                          <td className="px-2 py-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 font-sans truncate w-[130px] min-w-[130px] max-w-[130px] align-middle">
                            <div className="flex items-center gap-1.5 truncate">
                              <Circle size={10} className="text-sky-400 shrink-0" />
                              <span className="font-bold text-sky-300 text-xs truncate">Capsule</span>
                            </div>
                          </td>
                          {Array.from({ length: frameCount }).map((_, offset) => {
                            const isCurrent = offset === currentFrameOffset;
                            const kfStatus = getItemFrameKeyframe('capsule', 'capsule', offset);
                            return (
                              <td
                                key={offset}
                                onClick={() => {
                                  setCurrentFrameOffset(offset);
                                }}
                                onDoubleClick={() => handleToggleItemKeyframe('capsule', 'capsule', offset)}
                                style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}
                                className={`p-0 text-center border-r border-neutral-800/40 cursor-pointer transition select-none align-middle ${
                                  isCurrent ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-neutral-900/60'
                                }`}
                                title={kfStatus.isKeyframed ? `Custom Capsule: R${kfStatus.data.radius} H${kfStatus.data.height}. Double-click to toggle.` : 'Default Capsule. Double-click to keyframe.'}
                              >
                                <div className="w-[28px] h-[28px] flex items-center justify-center">
                                  {kfStatus.isKeyframed ? (
                                    <div className="w-4 h-4 rounded bg-amber-950/90 text-amber-300 border border-amber-500/60 flex items-center justify-center font-bold text-[9px] shadow-sm">
                                      ◆
                                    </div>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded text-neutral-700 flex items-center justify-center text-[9px]">
                                      ○
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* 2. SENSORY SOCKETS CATEGORY HEADER */}
                        <tr className="bg-neutral-900/60 font-sans h-5">
                          <td
                            colSpan={frameCount + 1}
                            className="px-2 py-0 text-[8.5px] font-bold text-sky-400 uppercase tracking-wider border-y border-neutral-800/80 leading-5"
                          >
                            Sockets ({pointsList.length})
                          </td>
                        </tr>

                        {/* SOCKET ROWS */}
                        {pointsList.map(pt => {
                          const isHidden = hiddenPointIds.has(pt.id);
                          const isSelected = selectedPointId === pt.id;
                          return (
                            <tr
                              key={pt.id}
                              className={`transition h-7 ${isSelected ? 'bg-sky-950/30' : 'hover:bg-neutral-900/40'} ${isHidden ? 'opacity-40' : ''}`}
                            >
                              <td
                                onClick={() => {
                                  setSelectedPointId(pt.id);
                                  setSelectedPolygonId('');
                                }}
                                className="px-2 py-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 font-sans cursor-pointer truncate w-[130px] min-w-[130px] max-w-[130px] align-middle"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                                  <span className={`text-xs truncate ${isSelected ? 'font-bold text-white' : 'text-neutral-300'}`}>
                                    {pt.name}
                                  </span>
                                </div>
                              </td>

                              {Array.from({ length: frameCount }).map((_, offset) => {
                                const isCurrent = offset === currentFrameOffset;
                                const kfStatus = getItemFrameKeyframe('point', pt.id, offset);
                                return (
                                  <td
                                    key={offset}
                                    onClick={() => {
                                      setCurrentFrameOffset(offset);
                                      setSelectedPointId(pt.id);
                                      setSelectedPolygonId('');
                                    }}
                                    onDoubleClick={() => handleToggleItemKeyframe('point', pt.id, offset)}
                                    style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}
                                    className={`p-0 text-center border-r border-neutral-800/40 cursor-pointer transition select-none align-middle ${
                                      isCurrent ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-neutral-900/60'
                                    }`}
                                    title={kfStatus.isKeyframed ? `Keyframe: (${kfStatus.data.x}, ${kfStatus.data.y}). Double-click to clear.` : `Holding/Default. Double-click to keyframe.`}
                                  >
                                    <div className="w-[28px] h-[28px] flex items-center justify-center">
                                      {kfStatus.isKeyframed ? (
                                        <div className="w-4 h-4 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 flex items-center justify-center font-bold text-[9px] shadow-sm">
                                          ◆
                                        </div>
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded text-neutral-700 flex items-center justify-center text-[9px]">
                                          ○
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* 3. HITBOXES CATEGORY HEADER */}
                        <tr className="bg-neutral-900/60 font-sans h-5">
                          <td
                            colSpan={frameCount + 1}
                            className="px-2 py-0 text-[8.5px] font-bold text-emerald-400 uppercase tracking-wider border-y border-neutral-800/80 leading-5"
                          >
                            Hitboxes ({polygonsList.length})
                          </td>
                        </tr>

                        {/* HITBOX ROWS */}
                        {polygonsList.map(poly => {
                          const isHidden = hiddenPolygonIds.has(poly.id);
                          const isSelected = selectedPolygonId === poly.id;
                          return (
                            <tr
                              key={poly.id}
                              className={`transition h-7 ${isSelected ? 'bg-emerald-950/30' : 'hover:bg-neutral-900/40'} ${isHidden ? 'opacity-40' : ''}`}
                            >
                              <td
                                onClick={() => {
                                  setSelectedPolygonId(poly.id);
                                  setSelectedPointId('');
                                }}
                                className="px-2 py-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 font-sans cursor-pointer truncate w-[130px] min-w-[130px] max-w-[130px] align-middle"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: poly.color }} />
                                  <span className={`text-xs truncate ${isSelected ? 'font-bold text-white' : 'text-neutral-300'}`}>
                                    {poly.name}
                                  </span>
                                </div>
                              </td>

                              {Array.from({ length: frameCount }).map((_, offset) => {
                                const isCurrent = offset === currentFrameOffset;
                                const kfStatus = getItemFrameKeyframe('polygon', poly.id, offset);
                                return (
                                  <td
                                    key={offset}
                                    onClick={() => {
                                      setCurrentFrameOffset(offset);
                                      setSelectedPolygonId(poly.id);
                                      setSelectedPointId('');
                                    }}
                                    onDoubleClick={() => handleToggleItemKeyframe('polygon', poly.id, offset)}
                                    style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}
                                    className={`p-0 text-center border-r border-neutral-800/40 cursor-pointer transition select-none align-middle ${
                                      isCurrent ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-neutral-900/60'
                                    }`}
                                    title={kfStatus.isKeyframed ? `Keyframe: ${kfStatus.data.vertices?.length || 0} vertices. Double-click to clear.` : `Holding/Default. Double-click to keyframe.`}
                                  >
                                    <div className="w-[28px] h-[28px] flex items-center justify-center">
                                      {kfStatus.isKeyframed ? (
                                        <div className="w-4 h-4 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 flex items-center justify-center font-bold text-[9px] shadow-sm">
                                          ◆
                                        </div>
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded text-neutral-700 flex items-center justify-center text-[9px]">
                                          ○
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Matrix Vertical Resize Drag Handle */}
                  <div
                    onMouseDown={handleMatrixResizeStart}
                    className="h-2.5 bg-neutral-950 hover:bg-cyan-950/60 border-t border-neutral-800 flex items-center justify-center cursor-row-resize transition group select-none"
                    title="Drag vertically to resize Matrix grid"
                  >
                    <div className="w-12 h-1 rounded-full bg-neutral-700 group-hover:bg-cyan-400 transition" />
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Shrunk Animation Canvas Viewport & Selected Element Inspector */}
            <div className="w-full xl:w-[360px] 2xl:w-[380px] shrink-0 space-y-4">
              
              {/* ANIMATION VIEWPORT CANVAS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 relative overflow-hidden flex flex-col items-center shadow-xl">
                
                {/* Viewport Toolbar */}
                <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800 text-xs text-neutral-400 flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevFrame}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition"
                      title="Previous Frame"
                    >
                      <StepBack size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                      className={`p-1 rounded-md transition ${isPlayingAnim ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-white'}`}
                      title={isPlayingAnim ? 'Pause' : 'Play'}
                    >
                      {isPlayingAnim ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFrame}
                      className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition"
                      title="Next Frame"
                    >
                      <StepForward size={12} />
                    </button>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold pl-1">
                      F#{currentFrameOffset + 1}
                    </span>
                  </div>

                  {/* Canvas Overlays Group Toggles */}
                  <div className="flex items-center gap-0.5 bg-neutral-950/80 px-1.5 py-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowSprite(!showSprite)}
                      className={`px-1 py-0.5 rounded transition ${showSprite ? 'text-cyan-400 font-bold' : 'text-neutral-500'}`}
                      title={showSprite ? 'Hide Sprite' : 'Show Sprite'}
                    >
                      Sprite
                    </button>
                    <span className="text-neutral-700">|</span>
                    <button
                      type="button"
                      onClick={() => setShowCapsule(!showCapsule)}
                      className={`px-1 py-0.5 rounded transition ${showCapsule ? 'text-sky-400 font-bold' : 'text-neutral-500'}`}
                      title={showCapsule ? 'Hide Capsule' : 'Show Capsule'}
                    >
                      Cap
                    </button>
                    <span className="text-neutral-700">|</span>
                    <button
                      type="button"
                      onClick={() => setShowPoints(!showPoints)}
                      className={`px-1 py-0.5 rounded transition ${showPoints ? 'text-indigo-400 font-bold' : 'text-neutral-500'}`}
                      title={showPoints ? 'Hide Sockets' : 'Show Sockets'}
                    >
                      Pts
                    </button>
                    <span className="text-neutral-700">|</span>
                    <button
                      type="button"
                      onClick={() => setShowPolygons(!showPolygons)}
                      className={`px-1 py-0.5 rounded transition ${showPolygons ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}
                      title={showPolygons ? 'Hide Hitboxes' : 'Show Hitboxes'}
                    >
                      Box
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <ViewportHUD
                    scale={zoom}
                    onZoomIn={() => setZoom(z => Math.min(6, Number((z + 0.25).toFixed(2))))}
                    onZoomOut={() => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                    onResetZoom={() => { setZoom(2.0); setPanX(0); setPanY(0); }}
                    onCenterContent={() => { setZoom(2.0); setPanX(0); setPanY(0); }}
                    themeColor="cyan"
                    position="relative"
                    showHelperHint={false}
                    className="py-0.5 px-1 bg-transparent border-0 shadow-none"
                  />
                </div>

                {/* Shrunk Canvas Viewport */}
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={320}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onContextMenu={(e) => e.preventDefault()}
                  className="cursor-crosshair rounded-xl shadow-inner mt-2 w-full max-w-full aspect-[380/320] bg-neutral-950/60"
                />

                <div className="w-full flex items-center justify-between pt-2 text-[9px] text-neutral-500 font-mono">
                  <span>Drag sockets / vertices to keyframe</span>
                  <span className="text-cyan-400 font-bold">RMB / Space+Drag to pan • Wheel to zoom</span>
                </div>
              </div>

              {/* SELECTED ITEM QUICK PROPERTY INSPECTOR */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={13} className="text-cyan-400" />
                    Property Inspector
                  </span>
                  {selectedPointId ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                      Socket Selected
                    </span>
                  ) : selectedPolygonId ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      Hitbox Selected
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-500 border border-neutral-800">
                      Frame #{activeGlobalFrameIndex}
                    </span>
                  )}
                </div>

                {/* 1. Point / Socket Inspector */}
                {selectedPointId && (() => {
                  const pt = pointsList.find(p => p.id === selectedPointId);
                  if (!pt) return null;
                  const activePos = getPointPosForActiveFrame(pt);
                  const isKf = isPointKeyframedOnActiveFrame(pt.id);

                  return (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: pt.color }} />
                          <span className="font-bold text-white text-sm">{pt.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            type: 'point',
                            id: pt.id,
                            name: pt.name,
                            color: pt.color,
                            tagId: pt.tagId
                          })}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-sky-300 rounded text-[11px] font-medium transition"
                        >
                          Edit Details
                        </button>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 space-y-2 font-mono">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Current Frame Pos:</span>
                          <span className="text-cyan-300 font-bold">({activePos.x}, {activePos.y})</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Base Default Pos:</span>
                          <span className="text-neutral-400">({pt.defaultOffsetX}, {pt.defaultOffsetY})</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Keyframe Status:</span>
                          {isKf ? (
                            <span className="text-amber-300 font-bold">◆ Frame Keyframe</span>
                          ) : (
                            <span className="text-neutral-500">○ Using Base Default</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">X Offset</label>
                          <input
                            type="number"
                            value={activePos.x}
                            onChange={(e) => {
                              const newX = Number(e.target.value);
                              updateActiveFramePoint(pt.id, { x: newX, y: activePos.y });
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Y Offset</label>
                          <input
                            type="number"
                            value={activePos.y}
                            onChange={(e) => {
                              const newY = Number(e.target.value);
                              updateActiveFramePoint(pt.id, { x: activePos.x, y: newY });
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleItemKeyframe('point', pt.id, currentFrameOffset)}
                          className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold transition"
                        >
                          {isKf ? 'Clear Socket Keyframe' : 'Snapshot to Keyframe'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPointId('')}
                          className="text-neutral-500 hover:text-neutral-300 text-xs"
                        >
                          Deselect
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Polygon / Hitbox Inspector */}
                {selectedPolygonId && (() => {
                  const poly = polygonsList.find(p => p.id === selectedPolygonId);
                  if (!poly) return null;
                  const activeVerts = getPolyVertsForActiveFrame(poly);
                  const isKf = isPolygonKeyframedOnActiveFrame(poly.id);

                  return (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm shadow" style={{ backgroundColor: poly.color }} />
                          <span className="font-bold text-white text-sm">{poly.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            type: 'polygon',
                            id: poly.id,
                            name: poly.name,
                            color: poly.color,
                            polyType: poly.type
                          })}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded text-[11px] font-medium transition"
                        >
                          Edit Details
                        </button>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Type:</span>
                          <span className="text-emerald-400 font-bold uppercase">{poly.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Vertices:</span>
                          <span className="text-white font-bold">{activeVerts.length} points</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Keyframe Status:</span>
                          {isKf ? (
                            <span className="text-amber-300 font-bold">◆ Frame Keyframe</span>
                          ) : (
                            <span className="text-neutral-500">○ Using Base Default</span>
                          )}
                        </div>
                      </div>

                      {/* Vertices List Stepper */}
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        <span className="text-[10px] text-neutral-400 font-bold block">Vertices:</span>
                        {activeVerts.map((v, vIdx) => (
                          <div key={vIdx} className="flex items-center justify-between bg-neutral-950 p-1.5 rounded border border-neutral-800 font-mono text-[11px]">
                            <span className="text-neutral-400">V#{vIdx + 1}:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-300">({v.x}, {v.y})</span>
                              {activeVerts.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVerts = activeVerts.filter((_, i) => i !== vIdx);
                                    updateActiveFramePolygon(poly.id, nextVerts);
                                  }}
                                  className="text-neutral-500 hover:text-red-400 p-0.5"
                                  title="Delete Vertex"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const last = activeVerts[activeVerts.length - 1] || { x: 0, y: 0 };
                            updateActiveFramePolygon(poly.id, [...activeVerts, { x: last.x + 10, y: last.y + 10 }]);
                          }}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus size={11} />
                          <span>Add Vertex</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPolygonId('')}
                          className="text-neutral-500 hover:text-neutral-300 text-xs"
                        >
                          Deselect
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Empty Selection Default: Quick Prefab / Capsule Glance */}
                {!selectedPointId && !selectedPolygonId && (
                  <div className="text-neutral-400 text-xs space-y-2 font-mono">
                    <p className="text-neutral-500 italic font-sans text-xs">
                      Click any socket, hitbox, or matrix cell to inspect and adjust properties live.
                    </p>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400">Active Spritesheet:</span>
                        <span className="text-cyan-300 font-bold">{activeSpritesheet.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400">Total Keyframes:</span>
                        <span className="text-amber-300 font-bold">{currentAnimation.keyframes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}


        {/* ========================================================================= */}
        {/* TAB 2: SPRITESHEET MANAGER */}
        {/* ========================================================================= */}
        {activeTab === 'spritesheet_manager' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Grid size={16} className="text-purple-400" />
                  Spritesheet Slots & Tile Grid Atlas
                </h3>
                <p className="text-xs text-neutral-400">
                  Upload custom sprite sheet images or generate procedural sample atlases. Inspect frame tiles with interactive grid overlays.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newSheet: PrefabSpritesheet = {
                      id: `sheet_${Date.now().toString().slice(-4)}`,
                      name: `Spritesheet Slot #${spritesheetsList.length + 1}`,
                      tileWidth: 64,
                      tileHeight: 64,
                      cols: 8,
                      rows: 4,
                      totalFrames: 32
                    };
                    updateCharacter(c => ({
                      ...c,
                      spritesheets: [...(c.spritesheets || []), newSheet]
                    }));
                    setSelectedSheetId(newSheet.id);
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-600/30"
                >
                  <Plus size={14} />
                  <span>Add Spritesheet Slot</span>
                </button>
              </div>
            </div>

            {/* Spritesheets Slot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spritesheetsList.map((sheet, sIdx) => {
                const isSelected = (selectedSheetId === sheet.id) || (!selectedSheetId && sIdx === 0);
                const sheetW = sheet.imageWidth || ((sheet.cols || 8) * (sheet.tileWidth || 64)) || 512;
                const sheetH = sheet.imageHeight || ((sheet.rows || 4) * (sheet.tileHeight || 64)) || 256;
                const splitMode = sheet.splitMode || 'columns';

                const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const dataUrl = evt.target?.result as string;
                    if (!dataUrl) return;

                    // Open Slicing Pre-Configuration Modal so sizes/columns can be previewed & set before committing
                    setSliceModalConfig({
                      isOpen: true,
                      sheetId: sheet.id,
                      sheetLabel: sheet.name || file.name.replace(/\.[^/.]+$/, ''),
                      initialImage: {
                        url: dataUrl,
                        name: sheet.name || file.name.replace(/\.[^/.]+$/, ''),
                        tileWidth: sheet.tileWidth || 64,
                        tileHeight: sheet.tileHeight || 64,
                        cols: sheet.cols || 8,
                        rows: sheet.rows || 4,
                        splitMode: sheet.splitMode || 'columns'
                      }
                    });
                  };
                  reader.readAsDataURL(file);
                };

                const handleLoadSample = (type: 'knight' | 'crawler' | 'fx') => {
                  const tw = sheet.tileWidth || 64;
                  const th = sheet.tileHeight || 64;
                  const cols = sheet.cols || 8;
                  const rows = sheet.rows || 4;
                  const totalW = tw * cols;
                  const totalH = th * rows;

                  const cvs = document.createElement('canvas');
                  cvs.width = totalW;
                  cvs.height = totalH;
                  const ctx = cvs.getContext('2d');
                  if (ctx) {
                    ctx.imageSmoothingEnabled = false;
                    const total = cols * rows;
                    for (let i = 0; i < total; i++) {
                      const c = i % cols;
                      const r = Math.floor(i / cols);
                      const x = c * tw;
                      const y = r * th;

                      ctx.fillStyle = (c + r) % 2 === 0 ? '#1e1b4b' : '#0f172a';
                      ctx.fillRect(x, y, tw, th);
                      ctx.strokeStyle = '#6366f1';
                      ctx.lineWidth = 1;
                      ctx.strokeRect(x, y, tw, th);

                      const cx = x + tw / 2;
                      const cy = y + th / 2;
                      const pulse = Math.sin((i / total) * Math.PI * 4) * 5;

                      if (type === 'knight') {
                        ctx.fillStyle = '#38bdf8';
                        ctx.fillRect(cx - 10, cy - 12 + pulse, 20, 24);
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath();
                        ctx.arc(cx, cy - 18 + pulse, 7, 0, Math.PI * 2);
                        ctx.fill();
                      } else if (type === 'crawler') {
                        ctx.fillStyle = '#f43f5e';
                        ctx.beginPath();
                        ctx.ellipse(cx, cy + pulse, 14, 8, 0, 0, Math.PI * 2);
                        ctx.fill();
                      } else {
                        ctx.fillStyle = '#a855f7';
                        ctx.beginPath();
                        ctx.arc(cx, cy + pulse, 12 + (i % 4) * 2, 0, Math.PI * 2);
                        ctx.fill();
                      }

                      ctx.fillStyle = '#94a3b8';
                      ctx.font = '10px monospace';
                      ctx.fillText(`#${i}`, x + 4, y + 12);
                    }

                    const sampleDataUrl = cvs.toDataURL('image/png');
                    updateCharacter(c => ({
                      ...c,
                      spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? {
                        ...s,
                        imageUrl: sampleDataUrl,
                        dataUrl: sampleDataUrl,
                        imageWidth: totalW,
                        imageHeight: totalH
                      } : s)
                    }));
                  }
                };

                return (
                  <div 
                    key={sheet.id}
                    onClick={() => setSelectedSheetId(sheet.id)}
                    className={`bg-neutral-900 border rounded-2xl p-4 space-y-3.5 transition cursor-pointer ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 font-mono">Slot #{sIdx + 1}</span>
                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
                            Active Atlas
                          </span>
                        )}
                        {spritesheetsList.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCharacter(c => ({
                                ...c,
                                spritesheets: (c.spritesheets || []).filter(s => s.id !== sheet.id)
                              }));
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Delete Spritesheet Slot"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prominent Spritesheet Size Banner */}
                    <div className="flex items-center justify-between text-xs bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800/80 shadow-inner">
                      <span className="text-neutral-400 font-mono text-[11px] flex items-center gap-1.5">
                        <Maximize2 size={13} className="text-purple-400" />
                        Spritesheet Size:
                      </span>
                      <span className="text-white font-mono font-bold text-xs bg-purple-950/60 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30">
                        {sheetW} × {sheetH} px
                      </span>
                    </div>

                    {/* Image Preview / Upload Area */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSliceModalConfig({
                          isOpen: true,
                          sheetId: sheet.id,
                          sheetLabel: sheet.name,
                          initialImage: {
                            url: sheet.imageUrl || sheet.dataUrl || '',
                            name: sheet.name,
                            tileWidth: sheet.tileWidth || 64,
                            tileHeight: sheet.tileHeight || 64,
                            cols: sheet.cols || 8,
                            rows: sheet.rows || 4,
                            splitMode: sheet.splitMode || 'columns'
                          }
                        });
                      }}
                      className="relative group bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[100px] overflow-hidden cursor-pointer transition"
                    >
                      {sheet.imageUrl || sheet.dataUrl ? (
                        <div className="relative w-full flex flex-col items-center">
                          <img 
                            src={sheet.imageUrl || sheet.dataUrl} 
                            alt={sheet.name} 
                            className="max-h-24 object-contain image-rendering-pixelated rounded"
                          />
                          <div className="text-[10px] text-neutral-400 font-mono mt-1.5 flex items-center gap-2">
                            <span>{sheet.cols} cols × {sheet.rows} rows</span>
                            <span>•</span>
                            <span>{sheet.tileWidth}×{sheet.tileHeight} px/tile</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Upload size={24} className="mx-auto text-neutral-600 group-hover:text-purple-400 transition" />
                          <p className="text-xs font-bold text-neutral-300">Upload & Configure Slicing</p>
                          <p className="text-[10px] text-neutral-500">Import from Cloud, Virtual Drive, or local file</p>
                        </div>
                      )}
                    </div>

                    {/* Action Triggers: Edit Sprite & Configure / Slice Grid */}
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSpriteSheetInStudio(sheet);
                        }}
                        className="flex-1 py-2 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        title="Edit this sprite sheet in the Image & Sprite Studio module"
                      >
                        <Paintbrush size={13} className="text-emerald-400" />
                        <span>Edit Sprite</span>
                      </button>

                      {sheet.imageUrl || sheet.dataUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSliceModalConfig({
                              isOpen: true,
                              sheetId: sheet.id,
                              sheetLabel: sheet.name,
                              initialImage: {
                                url: sheet.imageUrl || sheet.dataUrl || '',
                                name: sheet.name,
                                tileWidth: sheet.tileWidth,
                                tileHeight: sheet.tileHeight,
                                cols: sheet.cols,
                                rows: sheet.rows,
                                splitMode: sheet.splitMode || 'columns'
                              }
                            });
                          }}
                          className="flex-1 py-2 px-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <Grid size={13} className="text-purple-400" />
                          <span>Configure & Slice</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSliceModalConfig({
                              isOpen: true,
                              sheetId: sheet.id,
                              sheetLabel: sheet.name,
                              initialImage: {
                                url: '',
                                name: sheet.name,
                                tileWidth: sheet.tileWidth || 64,
                                tileHeight: sheet.tileHeight || 64,
                                cols: sheet.cols || 8,
                                rows: sheet.rows || 4,
                                splitMode: sheet.splitMode || 'columns'
                              }
                            });
                          }}
                          className="flex-1 py-2 px-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <Grid size={13} className="text-purple-400" />
                          <span>Configure & Slice</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Sample Presets */}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Quick Sample Preset:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleLoadSample('knight'); }}
                          className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono"
                        >
                          Knight
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleLoadSample('crawler'); }}
                          className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono"
                        >
                          Crawler
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleLoadSample('fx'); }}
                          className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono"
                        >
                          FX
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Sheet Label</label>
                        <input
                          type="text"
                          value={sheet.name}
                          onChange={(e) => {
                            updateCharacter(c => ({
                              ...c,
                              spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? { ...s, name: e.target.value } : s)
                            }));
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                        />
                      </div>

                      {/* Split Method Option Selector: Pixels (Width/Height) OR Columns/Rows */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold block flex items-center justify-between">
                          <span>Split Sheet By:</span>
                          <span className="text-[9px] text-purple-400 font-mono">
                            {splitMode === 'pixels' ? 'Tile Pixels (W×H)' : 'Columns & Rows'}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCharacter(c => ({
                                ...c,
                                spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? { ...s, splitMode: 'pixels' } : s)
                              }));
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 font-mono ${
                              splitMode === 'pixels'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                            }`}
                          >
                            <span>📏 Tile Pixels</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCharacter(c => ({
                                ...c,
                                spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? { ...s, splitMode: 'columns' } : s)
                              }));
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 font-mono ${
                              splitMode === 'columns'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                            }`}
                          >
                            <span> Columns & Rows</span>
                          </button>
                        </div>
                      </div>

                      {/* Option A: Split by Tile Width / Height Pixels */}
                      {splitMode === 'pixels' ? (
                        <div className="space-y-2 p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-neutral-300 font-bold block">Tile Width (px)</label>
                              <input
                                type="number"
                                min={1}
                                value={sheet.tileWidth}
                                onChange={(e) => {
                                  const newTw = Math.max(1, Number(e.target.value) || 1);
                                  const computedCols = Math.max(1, Math.floor(sheetW / newTw));
                                  const computedTotal = computedCols * (sheet.rows || 1);
                                  updateCharacter(c => ({
                                    ...c,
                                    spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? {
                                      ...s,
                                      tileWidth: newTw,
                                      cols: computedCols,
                                      totalFrames: computedTotal
                                    } : s)
                                  }));
                                }}
                                className="w-full bg-neutral-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-300 font-bold block">Tile Height (px)</label>
                              <input
                                type="number"
                                min={1}
                                value={sheet.tileHeight}
                                onChange={(e) => {
                                  const newTh = Math.max(1, Number(e.target.value) || 1);
                                  const computedRows = Math.max(1, Math.floor(sheetH / newTh));
                                  const computedTotal = (sheet.cols || 1) * computedRows;
                                  updateCharacter(c => ({
                                    ...c,
                                    spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? {
                                      ...s,
                                      tileHeight: newTh,
                                      rows: computedRows,
                                      totalFrames: computedTotal
                                    } : s)
                                  }));
                                }}
                                className="w-full bg-neutral-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800">
                            <span>Calculated Grid:</span>
                            <span className="text-purple-300 font-bold">{sheet.cols} cols × {sheet.rows} rows ({sheet.totalFrames} frames)</span>
                          </div>
                        </div>
                      ) : (
                        /* Option B: Split by Columns and Rows */
                        <div className="space-y-2 p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-neutral-300 font-bold block">Columns (count)</label>
                              <input
                                type="number"
                                min={1}
                                value={sheet.cols}
                                onChange={(e) => {
                                  const newCols = Math.max(1, Number(e.target.value) || 1);
                                  const computedTw = Math.max(1, Math.floor(sheetW / newCols));
                                  const computedTotal = newCols * (sheet.rows || 1);
                                  updateCharacter(c => ({
                                    ...c,
                                    spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? {
                                      ...s,
                                      cols: newCols,
                                      tileWidth: computedTw,
                                      totalFrames: computedTotal
                                    } : s)
                                  }));
                                }}
                                className="w-full bg-neutral-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-300 font-bold block">Rows (count)</label>
                              <input
                                type="number"
                                min={1}
                                value={sheet.rows}
                                onChange={(e) => {
                                  const newRows = Math.max(1, Number(e.target.value) || 1);
                                  const computedTh = Math.max(1, Math.floor(sheetH / newRows));
                                  const computedTotal = (sheet.cols || 1) * newRows;
                                  updateCharacter(c => ({
                                    ...c,
                                    spritesheets: (c.spritesheets || []).map(s => s.id === sheet.id ? {
                                      ...s,
                                      rows: newRows,
                                      tileHeight: computedTh,
                                      totalFrames: computedTotal
                                    } : s)
                                  }));
                                }}
                                className="w-full bg-neutral-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800">
                            <span>Calculated Tile Size:</span>
                            <span className="text-purple-300 font-bold">{sheet.tileWidth} × {sheet.tileHeight} px ({sheet.totalFrames} frames)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Full Spritesheet Tile Grid Inspector & Previewer */}
            {(() => {
              const activeSheet = spritesheetsList.find(s => s.id === selectedSheetId) || spritesheetsList[0];
              if (!activeSheet) return null;

              const cols = activeSheet.cols || 8;
              const rows = activeSheet.rows || 4;
              const tw = activeSheet.tileWidth || 64;
              const th = activeSheet.tileHeight || 64;
              const total = cols * rows;
              const renderLimit = 1024;
              const renderTotal = Math.min(total, renderLimit);
              const scale = sheetViewerZoom;
              const cellW = Math.round(tw * scale);
              const cellH = Math.round(th * scale);
              const sheetW = cols * cellW;
              const sheetH = rows * cellH;

              return (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-neutral-800">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Grid size={15} className="text-purple-400" />
                        Tile Grid Inspector: <span className="text-purple-300 font-mono">{activeSheet.name}</span>
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Click any cell frame in the grid below to inspect coordinates and pixel slice dimensions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">Zoom:</span>
                      {[0.5, 1, 2, 3, 4].map(z => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setSheetViewerZoom(z)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                            sheetViewerZoom === z ? 'bg-purple-600 text-white shadow-md' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Tile Grid Matrix */}
                  <div className="overflow-auto max-h-[520px] p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    {total > renderLimit && (
                      <div className="mb-3 p-2 bg-amber-500/20 border border-amber-500/50 rounded text-amber-200 text-xs flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>This spritesheet has {total} frames, which is too large to render safely. Only the first {renderLimit} frames are displayed.</span>
                      </div>
                    )}
                    <div 
                      className="grid gap-1.5 relative"
                      style={{
                        '--sheet-url': (activeSheet.imageUrl || activeSheet.dataUrl) ? `url(${activeSheet.imageUrl || activeSheet.dataUrl})` : 'none',
                        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
                        width: 'max-content'
                      } as React.CSSProperties}
                    >
                      {Array.from({ length: renderTotal }).map((_, fIdx) => {
                        const col = fIdx % cols;
                        const row = Math.floor(fIdx / cols);
                        const isInspected = inspectedFrameIdx === fIdx;

                        return (
                          <div
                            key={fIdx}
                            onClick={() => setInspectedFrameIdx(fIdx)}
                            className={`relative border rounded-lg cursor-pointer group transition overflow-hidden ${
                              isInspected
                                ? 'border-purple-400 bg-purple-950/60 ring-2 ring-purple-400/50'
                                : 'border-purple-900/30 bg-neutral-900/80 hover:border-purple-500/60 hover:bg-neutral-800'
                            }`}
                            style={{
                              width: `${cellW}px`,
                              height: `${cellH}px`
                            }}
                            title={`Frame #${fIdx} (Col ${col}, Row ${row})`}
                          >
                            {/* Frame Index Badge */}
                            <span className="absolute top-0.5 left-0.5 text-[9px] font-mono font-bold px-1 rounded bg-black/80 text-purple-300 z-10 select-none">
                              #{fIdx}
                            </span>

                            {/* Rendered Frame Image Slice if Available */}
                            {activeSheet.imageUrl || activeSheet.dataUrl ? (
                              <div
                                className="w-full h-full bg-no-repeat image-rendering-pixelated pointer-events-none"
                                style={{
                                  backgroundImage: 'var(--sheet-url)',
                                  backgroundPosition: `-${col * cellW}px -${row * cellH}px`,
                                  backgroundSize: `${sheetW}px ${sheetH}px`
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-neutral-600">
                                {col},{row}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspected Frame Details Card */}
                  {inspectedFrameIdx !== null && (
                    <div className="p-3 bg-neutral-950 border border-purple-900/40 rounded-xl flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-purple-500/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          {activeSheet.imageUrl || activeSheet.dataUrl ? (
                            <div
                              className="w-full h-full bg-no-repeat image-rendering-pixelated"
                              style={{
                                backgroundImage: `url(${activeSheet.imageUrl || activeSheet.dataUrl})`,
                                backgroundPosition: `-${(inspectedFrameIdx % cols) * 48}px -${Math.floor(inspectedFrameIdx / cols) * 48}px`,
                                backgroundSize: `${cols * 48}px ${rows * 48}px`
                              }}
                            />
                          ) : (
                            <span className="text-xs font-mono font-bold text-purple-400">#{inspectedFrameIdx}</span>
                          )}
                        </div>

                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>Inspected Frame #{inspectedFrameIdx}</span>
                            <span className="text-[10px] font-mono text-purple-400">
                              Col {inspectedFrameIdx % cols}, Row {Math.floor(inspectedFrameIdx / cols)}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-neutral-400">
                            Source Rect: X={(inspectedFrameIdx % cols) * tw}px, Y={Math.floor(inspectedFrameIdx / cols) * th}px, W={tw}px, H={th}px
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VARIABLES */}
        {/* ========================================================================= */}
        {activeTab === 'variables' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-rose-400" />
                  Prefab Variables & Attributes
                </h3>
                <p className="text-xs text-neutral-400">
                  Manage core stats, proficiencies, and bespoke parameters with immutable auto-generated IDs (<code className="font-mono text-cyan-400">var_xxxxxxxx</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVarForm({
                    id: generateVariableId(),
                    name: '',
                    category: 'attribute',
                    type: 'number',
                    defaultValue: 100,
                    isStatic: false,
                    isEditing: false
                  });
                  setIsVarModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-600/30"
              >
                <Plus size={14} />
                <span>Add Variable</span>
              </button>
            </div>

            {/* Variable Cards Grid */}
            {variablesList.length === 0 ? (
              <div className="p-8 text-center bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
                <Database size={32} className="mx-auto text-neutral-600" />
                <p className="text-sm font-bold text-neutral-300">No Custom Variables Configured</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Click "Add Variable" above to declare prefab health, stamina, move speeds, or combat proficiencies.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variablesList.map(v => {
                  const currentVal = (char.behaviorVariables?.[v.id] !== undefined)
                    ? char.behaviorVariables[v.id]
                    : v.defaultValue;

                  return (
                    <div 
                      key={v.id}
                      className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-rose-400">
                              {v.category}
                            </span>
                            <span className="text-[9px] text-neutral-500 font-mono">
                              ID: <code className="text-neutral-400">{v.id}</code>
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5" title={v.name}>
                            {v.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setVarForm({
                                id: v.id,
                                name: v.name,
                                category: v.category as any,
                                type: v.type as any,
                                defaultValue: v.defaultValue,
                                isStatic: Boolean(v.isStatic),
                                isEditing: true
                              });
                              setIsVarModalOpen(true);
                            }}
                            className="p-1 text-neutral-400 hover:text-white rounded"
                            title="Edit Variable Metadata"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariable(v.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded"
                            title="Delete Variable"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Live Value Edit */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Live Current Value</span>
                          <span className="text-[9px] font-mono text-neutral-500">Default: {String(v.defaultValue)}</span>
                        </div>

                        {v.type === 'boolean' ? (
                          <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                            <span className="text-xs text-neutral-300">Active</span>
                            <input
                              type="checkbox"
                              checked={Boolean(currentVal)}
                              onChange={(e) => {
                                updateCharacter(c => ({
                                  ...c,
                                  behaviorVariables: { ...(c.behaviorVariables || {}), [v.id]: e.target.checked }
                                }));
                              }}
                              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 bg-neutral-900 border-neutral-700"
                            />
                          </label>
                        ) : v.type === 'number' ? (
                          <input
                            type="number"
                            value={currentVal ?? v.defaultValue}
                            onChange={(e) => {
                              updateCharacter(c => ({
                                ...c,
                                behaviorVariables: { ...(c.behaviorVariables || {}), [v.id]: Number(e.target.value) }
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentVal ?? v.defaultValue}
                            onChange={(e) => {
                              updateCharacter(c => ({
                                ...c,
                                behaviorVariables: { ...(c.behaviorVariables || {}), [v.id]: e.target.value }
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STATES (FINITE STATE MACHINE GRAPH) */}
        {/* ========================================================================= */}
        {activeTab === 'states' && (
          <div className="space-y-6">
            
            {/* Header & Graph Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitMerge size={16} className="text-indigo-400" />
                  Prefab State Machine & Transitions Graph
                </h3>
                <p className="text-xs text-neutral-400">
                  Visual FSM: Drag nodes, dictate one-way (<span className="text-indigo-400">{"->"}</span>) or bidirectional (<span className="text-indigo-400">LeftRight</span>) transitions, and bind them directly to Behavior triggers.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {connectingFromStateId && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <span>Click target state to complete transition</span>
                    <button
                      type="button"
                      onClick={() => setConnectingFromStateId(null)}
                      className="p-0.5 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAutoLayoutStates}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-neutral-700"
                  title="Auto arrange state nodes in a circle"
                >
                  <RefreshCw size={13} className="text-cyan-400" />
                  <span>Auto-Layout</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransitionForm({
                      id: `tr_${Date.now().toString().slice(-4)}`,
                      fromStateId: stateNodes[0]?.id || '',
                      toStateId: stateNodes[1]?.id || '',
                      triggerLabel: 'Target Seen',
                      isEditing: false
                    });
                    setIsTransitionModalOpen(true);
                  }}
                  disabled={stateNodes.length < 2}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-neutral-700"
                >
                  <ArrowLeftRight size={13} className="text-purple-400" />
                  <span>Add Transition</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStateForm({
                      id: `st_${Date.now().toString().slice(-4)}`,
                      name: '',
                      color: defaultColors[stateNodes.length % defaultColors.length],
                      isInitial: stateNodes.length === 0,
                      description: '',
                      isEditing: false
                    });
                    setIsStateModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
                >
                  <Plus size={14} />
                  <span>Add State</span>
                </button>
              </div>
            </div>

            {/* Visual Graph Viewport Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* GRAPH CANVAS (Cols 8 or 9) */}
              <div className="lg:col-span-8 xl:col-span-9 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 relative overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Canvas Toolbar overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-xs shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <GitMerge size={13} />
                    FSM Canvas
                  </span>
                  <span className="text-neutral-600">|</span>
                  <span className="text-[11px] text-neutral-400">{stateNodes.length} States • {stateTransitions.length} Transitions</span>
                  <span className="text-neutral-600 hidden sm:inline">|</span>
                  <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">Right-click/Middle-click drag to pan • Scroll to zoom</span>
                </div>

                <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md p-1 rounded-xl border border-neutral-800 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setGraphZoom(z => Math.min(2.0, z + 0.15))}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphZoom(z => Math.max(0.4, z - 0.15))}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGraphZoom(1.0); setGraphPanX(0); setGraphPanY(0); }}
                    className="p-1 text-neutral-400 hover:text-white rounded text-[10px] font-mono font-bold px-1.5"
                    title="Reset View (Zoom & Pan)"
                  >
                    {Math.round(graphZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGraphZoom(1.0); setGraphPanX(0); setGraphPanY(0); }}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Reset Pan & Zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                {/* Interactive Node Graph Area */}
                <div 
                  ref={graphCanvasRef}
                  onContextMenu={(e) => e.preventDefault()}
                  onWheel={(e) => {
                    e.preventDefault();
                    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
                    setGraphZoom(z => Math.max(0.4, Math.min(2.2, Number((z + zoomDelta).toFixed(2)))));
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 2 || e.button === 1 || e.target === graphCanvasRef.current) {
                      setIsGraphPanning(true);
                      graphPanStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: graphPanX, panY: graphPanY };
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isGraphPanning && graphPanStartRef.current) {
                      const dx = e.clientX - graphPanStartRef.current.mouseX;
                      const dy = e.clientY - graphPanStartRef.current.mouseY;
                      setGraphPanX(graphPanStartRef.current.panX + dx);
                      setGraphPanY(graphPanStartRef.current.panY + dy);
                      return;
                    }

                    if (!draggingNodeId || !graphCanvasRef.current) return;
                    const rect = graphCanvasRef.current.getBoundingClientRect();
                    const nextX = Math.round((e.clientX - rect.left - graphPanX - dragNodeOffset.x) / graphZoom);
                    const nextY = Math.round((e.clientY - rect.top - graphPanY - dragNodeOffset.y) / graphZoom);

                    updateStateMachine(sm => ({
                      ...sm,
                      states: sm.states.map(s => s.id === draggingNodeId ? { ...s, x: Math.max(70, Math.min(1800, nextX)), y: Math.max(50, Math.min(1400, nextY)) } : s)
                    }));
                  }}
                  onMouseUp={() => {
                    setIsGraphPanning(false);
                    graphPanStartRef.current = null;
                    if (draggingNodeId) setDraggingNodeId(null);
                  }}
                  className={`flex-1 w-full min-h-[460px] bg-neutral-950 rounded-xl relative overflow-hidden select-none ${isGraphPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                  style={{
                    backgroundImage: 'radial-gradient(circle, #262635 1px, transparent 1px)',
                    backgroundSize: `${24 * graphZoom}px ${24 * graphZoom}px`,
                    backgroundPosition: `${graphPanX}px ${graphPanY}px`
                  }}
                >
                  
                  {/* SVG Transitions & Arrows Layer */}
                  <svg 
                    className="w-full h-full absolute inset-0 pointer-events-none z-0" 
                    style={{ 
                      transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                      transformOrigin: '0 0' 
                    }}
                  >
                    {stateTransitions.map((tr) => {
                      const fromNode = stateNodes.find(s => s.id === tr.fromStateId);
                      const toNode = stateNodes.find(s => s.id === tr.toStateId);
                      if (!fromNode || !toNode || fromNode.id === toNode.id) return null;

                      const isSelected = selectedTransitionId === tr.id;
                      const isUnset = isTransitionConditionUnset(tr);

                      const dx = toNode.x - fromNode.x;
                      const dy = toNode.y - fromNode.y;
                      const len = Math.sqrt(dx * dx + dy * dy) || 1;
                      const normX = -dy / len;
                      const normY = dx / len;
                      const curveFactor = 32;

                      const ctrlX = ((fromNode.x + toNode.x) / 2) + normX * curveFactor;
                      const ctrlY = ((fromNode.y + toNode.y) / 2) + normY * curveFactor;

                      const p0 = { x: fromNode.x, y: fromNode.y };
                      const p1 = { x: ctrlX, y: ctrlY };
                      const p2 = { x: toNode.x, y: toNode.y };

                      const pathD = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
                      const arrowHeads = getQuadBezierArrowHeads(p0, p1, p2, [0.22, 0.38, 0.62, 0.78]);

                      // Wire colors: Red if no condition, cyan/indigo if condition set
                      const wireStroke = isUnset
                        ? (isSelected ? '#f87171' : '#ef4444')
                        : (isSelected ? '#38bdf8' : '#6366f1');
                      
                      const arrowFill = isUnset
                        ? (isSelected ? '#f87171' : '#ef4444')
                        : (isSelected ? '#38bdf8' : '#818cf8');
                      
                      const arrowStroke = isUnset
                        ? (isSelected ? '#dc2626' : '#991b1b')
                        : (isSelected ? '#0284c7' : '#4338ca');

                      return (
                        <g 
                          key={tr.id} 
                          className="pointer-events-auto cursor-pointer" 
                          onClick={() => {
                            setSelectedTransitionId(tr.id);
                            setSelectedStateNodeId(null);
                          }}
                          onDoubleClick={() => {
                            setSelectedTransitionId(tr.id);
                            setSelectedStateNodeId(null);
                            setTransitionForm({
                              id: tr.id,
                              fromStateId: tr.fromStateId,
                              toStateId: tr.toStateId,
                              triggerLabel: tr.triggerLabel || '',
                              behaviorRuleId: tr.behaviorRuleId,
                              conditionType: tr.conditionType || (isUnset ? 'none' : 'custom'),
                              isEditing: true
                            });
                            setIsTransitionModalOpen(true);
                          }}
                        >
                          {/* Thicker invisible stroke for easier click targeting */}
                          <path
                            d={pathD}
                            stroke="transparent"
                            strokeWidth={18}
                            fill="none"
                          />
                          {/* Main connecting wire */}
                          <path
                            d={pathD}
                            stroke={wireStroke}
                            strokeWidth={isSelected ? 3.5 : 2.5}
                            fill="none"
                            strokeDasharray={isUnset ? (isSelected ? '6 3' : '4 3') : (isSelected ? '4 2' : undefined)}
                            className="transition-all hover:stroke-red-400"
                          />
                          {/* 4 Distinct Directional Arrow Heads along the link */}
                          {arrowHeads.map((arrow, idx) => (
                            <g
                              key={idx}
                              transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angleDeg})`}
                              className="pointer-events-none"
                            >
                              <path
                                d="M -7 -5.5 L 5 0 L -7 5.5 L -3.5 0 Z"
                                fill={arrowFill}
                                stroke={arrowStroke}
                                strokeWidth={0.9}
                                className="transition-colors"
                              />
                            </g>
                          ))}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Transition Midpoint Badges (Overlay) */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-10" 
                    style={{ 
                      transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                      transformOrigin: '0 0' 
                    }}
                  >
                    {stateTransitions.map((tr) => {
                      const fromNode = stateNodes.find(s => s.id === tr.fromStateId);
                      const toNode = stateNodes.find(s => s.id === tr.toStateId);
                      if (!fromNode || !toNode || fromNode.id === toNode.id) return null;

                      const dx = toNode.x - fromNode.x;
                      const dy = toNode.y - fromNode.y;
                      const len = Math.sqrt(dx * dx + dy * dy) || 1;
                      const normX = -dy / len;
                      const normY = dx / len;
                      const midX = ((fromNode.x + toNode.x) / 2) + normX * 32;
                      const midY = ((fromNode.y + toNode.y) / 2) + normY * 32;

                      const isSelected = selectedTransitionId === tr.id;
                      const isUnset = isTransitionConditionUnset(tr);

                      return (
                        <div
                          key={tr.id}
                          style={{ left: `${midX}px`, top: `${midY}px`, transform: 'translate(-50%, -50%)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransitionId(tr.id);
                            setSelectedStateNodeId(null);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransitionId(tr.id);
                            setSelectedStateNodeId(null);
                            setTransitionForm({
                              id: tr.id,
                              fromStateId: tr.fromStateId,
                              toStateId: tr.toStateId,
                              triggerLabel: tr.triggerLabel || '',
                              behaviorRuleId: tr.behaviorRuleId,
                              conditionType: tr.conditionType || (isUnset ? 'none' : 'custom'),
                              isEditing: true
                            });
                            setIsTransitionModalOpen(true);
                          }}
                          className={`pointer-events-auto absolute cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg border transition select-none group ${
                            isSelected 
                              ? (isUnset 
                                  ? 'bg-red-500 text-white ring-2 ring-red-300 border-red-400 font-extrabold scale-105' 
                                  : 'bg-cyan-500 text-black ring-2 ring-cyan-300 border-cyan-400 font-extrabold scale-105')
                              : (isUnset 
                                  ? 'bg-red-950/95 border-red-500/80 text-red-300 ring-1 ring-red-500/40 hover:border-red-400 hover:text-white hover:scale-105' 
                                  : 'bg-neutral-900/95 border-neutral-700 text-neutral-300 hover:border-cyan-400 hover:text-white hover:scale-105')
                          }`}
                          title={`Transition: ${fromNode.name} -> ${toNode.name}.${isUnset ? ' [!️ NO CONDITION SET - Wire is red]' : ` Condition: ${tr.triggerLabel}`}`}
                        >
                          <span className={`text-[11px] font-bold ${isSelected ? (isUnset ? 'text-white' : 'text-black') : (isUnset ? 'text-red-400' : 'text-cyan-400')}`}>
                            {isUnset ? '!️' : '->'}
                          </span>
                          <span className="truncate max-w-[120px]">
                            {isUnset ? 'None (No Condition)' : tr.triggerLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransitionId(tr.id);
                              setSelectedStateNodeId(null);
                              setTransitionForm({
                                id: tr.id,
                                fromStateId: tr.fromStateId,
                                toStateId: tr.toStateId,
                                triggerLabel: tr.triggerLabel || '',
                                behaviorRuleId: tr.behaviorRuleId,
                                conditionType: tr.conditionType || (isUnset ? 'none' : 'custom'),
                                isEditing: true
                              });
                              setIsTransitionModalOpen(true);
                            }}
                            className={`p-0.5 rounded transition ${isSelected ? (isUnset ? 'text-white hover:bg-white/20' : 'text-black hover:bg-black/20') : 'text-neutral-400 hover:text-white opacity-60 group-hover:opacity-100'}`}
                            title="Edit Transition Condition"
                          >
                            <Edit3 size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Draggable State Node Cards */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-10" 
                    style={{ 
                      transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                      transformOrigin: '0 0' 
                    }}
                  >
                    {stateNodes.map((node) => {
                      const isSelected = selectedStateNodeId === node.id;
                      const isInitial = node.isInitial;
                      const inCount = stateTransitions.filter(t => t.toStateId === node.id).length;
                      const outCount = stateTransitions.filter(t => t.fromStateId === node.id).length;

                      return (
                        <div
                          key={node.id}
                          style={{
                            left: `${node.x}px`,
                            top: `${node.y}px`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (e.button === 2) return; // Allow right click to pan even on node background
                            if (connectingFromStateId) {
                              // Connect state node
                              if (connectingFromStateId !== node.id) {
                                const newTr: PrefabStateTransition = {
                                  id: `tr_${Date.now().toString().slice(-4)}`,
                                  fromStateId: connectingFromStateId,
                                  toStateId: node.id,
                                  isBidirectional: false,
                                  triggerLabel: 'Condition'
                                };
                                updateStateMachine(sm => ({ ...sm, transitions: [...sm.transitions, newTr] }));
                              }
                              setConnectingFromStateId(null);
                              return;
                            }

                            setSelectedStateNodeId(node.id);
                            setSelectedTransitionId(null);
                            setDraggingNodeId(node.id);
                            dragNodeStartRef.current = {
                              mouseX: e.clientX,
                              mouseY: e.clientY,
                              nodeX: node.x,
                              nodeY: node.y
                            };
                          }}
                          className={`pointer-events-auto absolute w-48 rounded-2xl p-3 shadow-xl transition-colors border cursor-move select-none ${
                            isSelected 
                              ? 'bg-neutral-900 ring-2 ring-indigo-500 border-indigo-500' 
                              : 'bg-neutral-900/95 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {/* Node Header */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: node.color || '#38bdf8' }}
                              />
                              <h4 className="text-xs font-bold text-white truncate">
                                {node.name}
                              </h4>
                            </div>

                            {isInitial && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                <Star size={9} />
                                Start
                              </span>
                            )}
                          </div>

                          {/* Node Stats / Description */}
                          <div className="text-[10px] text-neutral-400 flex items-center justify-between font-mono pt-1 border-t border-neutral-800/80">
                            <span>In: <strong className="text-indigo-300">{inCount}</strong></span>
                            <span>Out: <strong className="text-indigo-300">{outCount}</strong></span>
                            <span className="text-[9px] text-neutral-500 truncate max-w-[60px]" title={node.id}>ID:{node.id.replace('st_', '')}</span>
                          </div>

                          {/* Node Quick Action Toolbar */}
                          <div className="flex items-center justify-between gap-1 pt-2 mt-1 border-t border-neutral-800/60">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectingFromStateId(node.id);
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-bold flex items-center gap-1"
                              title="Connect to another state"
                            >
                              <ArrowRight size={10} />
                              <span>Link</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStateMachine(sm => ({
                                    ...sm,
                                    initialStateId: node.id,
                                    states: sm.states.map(s => ({ ...s, isInitial: s.id === node.id }))
                                  }));
                                }}
                                className={`p-1 rounded text-neutral-400 hover:text-amber-400 ${node.isInitial ? 'text-amber-400' : ''}`}
                                title="Set as Start / Initial State"
                              >
                                <Star size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStateForm({
                                    id: node.id,
                                    name: node.name,
                                    color: node.color || '#38bdf8',
                                    isInitial: Boolean(node.isInitial),
                                    description: node.description || '',
                                    isEditing: true
                                  });
                                  setIsStateModalOpen(true);
                                }}
                                className="p-1 rounded text-neutral-400 hover:text-white"
                                title="Edit State"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStateNode(node.id);
                                }}
                                className="p-1 rounded text-neutral-500 hover:text-red-400"
                                title="Delete State Node"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* RIGHT SIDEBAR INSPECTOR (Cols 4 or 3): Inspector & Quick Configuration */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                
                {/* Active Selection Details Card */}
                {selectedStateNodeId ? (() => {
                  const activeNode = stateNodes.find(s => s.id === selectedStateNodeId);
                  if (!activeNode) return null;
                  const outgoing = stateTransitions.filter(t => t.fromStateId === activeNode.id);
                  const incoming = stateTransitions.filter(t => t.toStateId === activeNode.id);

                  return (
                    <div className="bg-neutral-900 border border-indigo-500/40 rounded-2xl p-4 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <GitMerge size={14} />
                          Selected State
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedStateNodeId(null)}
                          className="p-1 text-neutral-400 hover:text-white rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">State Name</label>
                          <input
                            type="text"
                            value={activeNode.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateStateMachine(sm => ({
                                ...sm,
                                states: sm.states.map(s => s.id === activeNode.id ? { ...s, name: val } : s)
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="text-[10px] text-neutral-400 font-bold">Accent Color</label>
                          <input
                            type="color"
                            value={activeNode.color || '#38bdf8'}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateStateMachine(sm => ({
                                ...sm,
                                states: sm.states.map(s => s.id === activeNode.id ? { ...s, color: val } : s)
                              }));
                            }}
                            className="w-8 h-6 bg-transparent rounded cursor-pointer"
                          />
                        </div>

                        <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(activeNode.isInitial)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateStateMachine(sm => ({
                                ...sm,
                                initialStateId: checked ? activeNode.id : sm.initialStateId,
                                states: sm.states.map(s => ({ ...s, isInitial: s.id === activeNode.id ? checked : false }))
                              }));
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-white">Initial Spawn State</span>
                        </label>
                      </div>

                      {/* Transitions from this state */}
                      <div className="space-y-2 pt-2 border-t border-neutral-800">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                          <span>Outgoing Transitions ({outgoing.length})</span>
                          <button
                            type="button"
                            onClick={() => setConnectingFromStateId(activeNode.id)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
                          >
                            + Connect
                          </button>
                        </div>

                        {outgoing.length === 0 ? (
                          <p className="text-[11px] text-neutral-500 italic">No outgoing transitions yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {outgoing.map(t => {
                              const targetNode = stateNodes.find(s => s.id === t.toStateId);
                              return (
                                <div 
                                  key={t.id} 
                                  onClick={() => {
                                    setSelectedTransitionId(t.id);
                                    setSelectedStateNodeId(null);
                                  }}
                                  className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-[11px] cursor-pointer transition group"
                                >
                                  <div className="truncate flex-1">
                                    <span className="text-cyan-400 font-mono">{"->"}</span>{' '}
                                    <span className="text-white font-bold">{targetNode?.name || t.toStateId}</span>
                                    <span className="text-neutral-400 text-[10px] ml-1.5 font-mono">({t.triggerLabel || 'Condition'})</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTransitionForm({
                                          id: t.id,
                                          fromStateId: t.fromStateId,
                                          toStateId: t.toStateId,
                                          triggerLabel: t.triggerLabel || '',
                                          isEditing: true
                                        });
                                        setIsTransitionModalOpen(true);
                                      }}
                                      className="p-1 text-neutral-400 hover:text-white rounded"
                                      title="Edit Transition Label"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTransition(t.id);
                                      }}
                                      className="p-1 text-neutral-500 hover:text-red-400 rounded"
                                      title="Delete Transition"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : selectedTransitionId ? (() => {
                  const activeTr = stateTransitions.find(t => t.id === selectedTransitionId);
                  if (!activeTr) return null;
                  const fromNode = stateNodes.find(s => s.id === activeTr.fromStateId);
                  const toNode = stateNodes.find(s => s.id === activeTr.toStateId);
                  const isUnset = isTransitionConditionUnset(activeTr);

                  return (
                    <div className={`bg-neutral-900 border rounded-2xl p-4 space-y-4 shadow-xl ${
                      isUnset ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-cyan-500/40'
                    }`}>
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <span className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                          isUnset ? 'text-red-400' : 'text-cyan-400'
                        }`}>
                          <ArrowRight size={14} />
                          Transition Details
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTransitionForm({
                                id: activeTr.id,
                                fromStateId: activeTr.fromStateId,
                                toStateId: activeTr.toStateId,
                                triggerLabel: activeTr.triggerLabel || '',
                                behaviorRuleId: activeTr.behaviorRuleId,
                                conditionType: activeTr.conditionType || (isUnset ? 'none' : 'custom'),
                                isEditing: true
                              });
                              setIsTransitionModalOpen(true);
                            }}
                            className="p-1 text-neutral-400 hover:text-white rounded"
                            title="Edit in Modal"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTransitionId(null)}
                            className="p-1 text-neutral-400 hover:text-white rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px]">
                          <span className="text-white font-bold truncate max-w-[90px]" title={fromNode?.name || activeTr.fromStateId}>
                            {fromNode?.name || activeTr.fromStateId}
                          </span>
                          <span className={`text-sm font-bold px-2.5 py-0.5 rounded bg-neutral-900 border ${
                            isUnset ? 'text-red-400 border-red-500/40' : 'text-cyan-400 border-neutral-800'
                          }`}>{"->"}</span>
                          <span className="text-white font-bold truncate max-w-[90px]" title={toNode?.name || activeTr.toStateId}>
                            {toNode?.name || activeTr.toStateId}
                          </span>
                        </div>

                        {/* Behavior Condition Selector - ONLY 'none' and available behaviors */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 font-bold block">Transition Behavior Condition</label>
                          <select
                            value={activeTr.behaviorRuleId || 'none'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'none') {
                                updateStateMachine(sm => ({
                                  ...sm,
                                  transitions: sm.transitions.map(t => t.id === activeTr.id ? {
                                    ...t,
                                    triggerLabel: 'None',
                                    behaviorRuleId: undefined,
                                    conditionType: 'none'
                                  } : t)
                                }));
                              } else {
                                const found = rulesList.find(r => r.id === val);
                                const bName = found ? (found.name || `Rule #${val}`) : val;
                                updateStateMachine(sm => ({
                                  ...sm,
                                  transitions: sm.transitions.map(t => t.id === activeTr.id ? {
                                    ...t,
                                    triggerLabel: bName,
                                    behaviorRuleId: val,
                                    conditionType: 'behavior'
                                  } : t)
                                }));
                              }
                            }}
                            className={`w-full bg-neutral-950 border rounded px-2.5 py-2 text-white font-mono text-xs ${
                              isUnset ? 'border-red-500/60 focus:border-red-400 text-red-300' : 'border-cyan-500/50 focus:border-cyan-400 text-cyan-200'
                            }`}
                          >
                            <option value="none">[X] None (No Condition - Highlighted Red)</option>
                            {rulesList.map(r => (
                              <option key={r.id} value={r.id}>
                                [Local] Behavior: {r.name || r.id}
                              </option>
                            ))}
                          </select>
                          {rulesList.length === 0 && (
                            <p className="text-[10px] text-neutral-500 italic mt-1">
                              No behavior rules created yet for this prefab. Add a rule in the Behaviors tab to link it as an IF condition.
                            </p>
                          )}
                        </div>

                        {/* Unset Red Notice */}
                        {isUnset && (
                          <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] flex items-start gap-2">
                            <span className="text-red-400 font-bold shrink-0">!️</span>
                            <span>Condition is unset. This transition wire & arrows will show in <strong>RED</strong> on the canvas until configured.</span>
                          </div>
                        )}

                        {/* Quick action: Add Return Transition if not already present */}
                        {(() => {
                          const returnExists = stateTransitions.some(t => t.fromStateId === activeTr.toStateId && t.toStateId === activeTr.fromStateId);
                          if (!returnExists && activeTr.fromStateId !== activeTr.toStateId) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleAddReturnTransition(activeTr.fromStateId, activeTr.toStateId)}
                                className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                              >
                                <Plus size={13} />
                                <span>Add Return Transition ({toNode?.name || 'Target'} {"->"} {fromNode?.name || 'Origin'})</span>
                              </button>
                            );
                          }
                          return null;
                        })()}

                        <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                          <button
                            type="button"
                            onClick={() => {
                              setTransitionForm({
                                id: activeTr.id,
                                fromStateId: activeTr.fromStateId,
                                toStateId: activeTr.toStateId,
                                triggerLabel: activeTr.triggerLabel || '',
                                behaviorRuleId: activeTr.behaviorRuleId,
                                conditionType: activeTr.conditionType || (isUnset ? 'none' : 'custom'),
                                isEditing: true
                              });
                              setIsTransitionModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Edit3 size={12} />
                            <span>Edit in Modal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTransition(activeTr.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-indigo-400" />
                      State Machine Guide
                    </span>
                    <ul className="text-xs text-neutral-400 space-y-2 list-disc list-inside">
                      <li>Click and drag any state node to reposition it on the canvas.</li>
                      <li>Click <strong>"Link"</strong> on any node to connect it to a target state.</li>
                      <li>Click any transition wire or label badge to choose its Behavior condition.</li>
                      <li>Transitions with condition <strong>"None"</strong> or unset will appear in <strong className="text-red-400">RED</strong>.</li>
                      <li>Mark any node with <Star size={11} className="inline text-amber-400" /> to declare it as the initial spawn state.</li>
                    </ul>
                  </div>
                )}

                {/* State Machine Overview List */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      All Registered States ({stateNodes.length})
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {stateNodes.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStateNodeId(s.id);
                          setSelectedTransitionId(null);
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                          selectedStateNodeId === s.id 
                            ? 'bg-neutral-950 border-indigo-500 text-white' 
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#38bdf8' }} />
                          <span className="font-bold truncate">{s.name}</span>
                          {s.isInitial && <span className="text-[9px] text-amber-400 font-mono">* Start</span>}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">{s.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Transitions Overview List */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRight size={13} className="text-cyan-400" />
                      All Transitions ({stateTransitions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTransitionForm({
                          id: `tr_${Date.now().toString().slice(-4)}`,
                          fromStateId: stateNodes[0]?.id || '',
                          toStateId: stateNodes[1]?.id || '',
                          triggerLabel: '',
                          behaviorRuleId: undefined,
                          conditionType: 'none',
                          isEditing: false
                        });
                        setIsTransitionModalOpen(true);
                      }}
                      disabled={stateNodes.length < 2}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 disabled:opacity-40 font-mono flex items-center gap-0.5"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>

                  {stateTransitions.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic">No transitions created yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {stateTransitions.map(tr => {
                        const fromNode = stateNodes.find(s => s.id === tr.fromStateId);
                        const toNode = stateNodes.find(s => s.id === tr.toStateId);
                        const isSelected = selectedTransitionId === tr.id;
                        const isUnset = isTransitionConditionUnset(tr);

                        return (
                          <div
                            key={tr.id}
                            onClick={() => {
                              setSelectedTransitionId(tr.id);
                              setSelectedStateNodeId(null);
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition group ${
                              isSelected 
                                ? (isUnset ? 'bg-neutral-950 border-red-500 text-white ring-1 ring-red-500/50' : 'bg-neutral-950 border-cyan-500 text-white ring-1 ring-cyan-500/50')
                                : (isUnset ? 'bg-neutral-950/60 border-red-500/40 text-neutral-300 hover:border-red-400' : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700')
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-white truncate max-w-[70px]">{fromNode?.name || tr.fromStateId}</span>
                                <span className={isUnset ? 'text-red-400 font-mono' : 'text-cyan-400 font-mono'}>{"->"}</span>
                                <span className="font-bold text-white truncate max-w-[70px]">{toNode?.name || tr.toStateId}</span>
                              </div>
                              <div className="text-[10px] font-mono truncate mt-0.5">
                                {isUnset ? (
                                  <span className="text-red-400 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/30">
                                    !️ Condition: None (Unset)
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">
                                    Condition: <span className="text-cyan-300 font-semibold">{tr.triggerLabel}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransitionForm({
                                    id: tr.id,
                                    fromStateId: tr.fromStateId,
                                    toStateId: tr.toStateId,
                                    triggerLabel: tr.triggerLabel || '',
                                    behaviorRuleId: tr.behaviorRuleId,
                                    conditionType: tr.conditionType || (isUnset ? 'none' : 'custom'),
                                    isEditing: true
                                  });
                                  setIsTransitionModalOpen(true);
                                }}
                                className="p-1 text-neutral-400 hover:text-white rounded"
                                title="Edit Transition Condition"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTransition(tr.id);
                                }}
                                className="p-1 text-neutral-500 hover:text-red-400 rounded"
                                title="Delete Transition"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BEHAVIORS (COLLAPSIBLE / MINIMIZABLE IFTTT RULES ENGINE) */}
        {/* ========================================================================= */}
        {activeTab === 'behaviors' && (
          <PrefabBehaviorsTab
            char={char}
            updateCharacter={updateCharacter}
            rulesList={rulesList}
            variablesList={variablesList}
            expandedRuleIds={expandedRuleIds}
            setExpandedRuleIds={setExpandedRuleIds}
            createDefaultTrigger={createDefaultTrigger}
            renderVariableSelectOptions={renderVariableSelectOptions}
            animationsList={animationsList}
            pointsList={pointsList}
            polygonsList={polygonsList}
            stateNodes={stateNodes}
            availableInputMappings={availableInputMappings}
            stateTransitions={stateTransitions}
          />
        )}
      </div>

      {/* MODAL: Sprite Studio */}
      <SpriteEditorModal
        isOpen={isSpriteStudioOpen}
        onClose={() => setIsSpriteStudioOpen(false)}
        onSave={handleSpriteStudioSave}
        title="Palette Spray Studio — Sprite Editor"
      />

      {/* MODAL: Spritesheet Slicer */}
      <SpritesheetSliceModal
        isOpen={sliceModalConfig.isOpen}
        onClose={() => setSliceModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleSliceModalConfirm}
        project={project}
        initialImage={sliceModalConfig.initialImage}
        sheetLabel={sliceModalConfig.sheetLabel}
      />

      {/* MODAL: Variable Creation / Edit */}
      {isVarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn animate-duration-150">
          <form
            onSubmit={handleSaveVariable}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-400" />
                {varForm.isEditing ? 'Edit Variable Definition' : 'Create New Variable'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVarModalOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Variable Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. run_speed, max_health"
                  value={varForm.name}
                  onChange={(e) => setVarForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Category</label>
                  <select
                    value={varForm.category}
                    onChange={(e) => setVarForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="attribute">⚔️ Attribute / Stat</option>
                    <option value="proficiency">📊 Proficiency / Rank</option>
                    <option value="setting">⚙️ Setting / Flag</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Type</label>
                  <select
                    value={varForm.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      const defVal = newType === 'number' ? 0 : newType === 'boolean' ? false : '';
                      setVarForm(prev => ({ ...prev, type: newType, defaultValue: defVal }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="number">🔢 Number</option>
                    <option value="string">🔤 String</option>
                    <option value="boolean">🔘 Boolean</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Default Initial Value</label>
                {varForm.type === 'boolean' ? (
                  <label className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!varForm.defaultValue}
                      onChange={(e) => setVarForm(prev => ({ ...prev, defaultValue: e.target.checked }))}
                      className="rounded text-rose-600 focus:ring-rose-500 bg-neutral-900 border-neutral-700"
                    />
                    <span className="text-xs text-neutral-300">True (Enabled by default)</span>
                  </label>
                ) : (
                  <input
                    type={varForm.type === 'number' ? 'number' : 'text'}
                    value={varForm.defaultValue}
                    onChange={(e) => setVarForm(prev => ({ ...prev, defaultValue: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={varForm.isStatic}
                  onChange={(e) => setVarForm(prev => ({ ...prev, isStatic: e.target.checked }))}
                  className="rounded text-rose-600 focus:ring-rose-500 bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="text-xs text-white font-bold block">Static Constant</span>
                  <span className="text-[10px] text-neutral-400 block leading-tight">Shared across all instances of this prefab</span>
                </div>
              </label>
            </div>

            <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsVarModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{varForm.isEditing ? 'Save Changes' : 'Create Variable'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: State Machine Node Creation / Edit */}
      {isStateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn animate-duration-150">
          <form
            onSubmit={handleSaveStateNode}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                {stateForm.isEditing ? 'Edit Behavior State' : 'Add FSM Behavior State'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStateModalOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">State Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Idle, Patrol, Attack, Hit"
                  value={stateForm.name}
                  onChange={(e) => setStateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Node Theme Color</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={stateForm.color}
                    onChange={(e) => setStateForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={stateForm.color}
                    onChange={(e) => setStateForm(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Description / Notes</label>
                <textarea
                  placeholder="Notes about when this state is entered or what it accomplishes..."
                  value={stateForm.description}
                  onChange={(e) => setStateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white resize-none"
                />
              </div>

              <label className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stateForm.isInitial}
                  onChange={(e) => setStateForm(prev => ({ ...prev, isInitial: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="text-xs text-white font-bold block">Default Entry State (Initial)</span>
                  <span className="text-[10px] text-neutral-400 block leading-tight">The state this prefab begins in when spawned</span>
                </div>
              </label>
            </div>

            <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{stateForm.isEditing ? 'Save Changes' : 'Create State'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: State Transition Creation / Edit */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn animate-duration-150">
          <form
            onSubmit={handleSaveTransition}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                {transitionForm.isEditing ? 'Edit State Transition' : 'Add FSM State Transition'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">From State</label>
                  <select
                    value={transitionForm.fromStateId}
                    onChange={(e) => setTransitionForm(prev => ({ ...prev, fromStateId: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="" disabled>-- Pick State --</option>
                    {stateNodes.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">To State</label>
                  <select
                    value={transitionForm.toStateId}
                    onChange={(e) => setTransitionForm(prev => ({ ...prev, toStateId: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="" disabled>-- Pick State --</option>
                    {stateNodes.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Trigger Event / Action String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. click, hit_ground, timeout_1.5"
                  value={transitionForm.triggerLabel}
                  onChange={(e) => setTransitionForm(prev => ({ ...prev, triggerLabel: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Condition Guard Mode</label>
                <select
                  value={transitionForm.conditionType || 'none'}
                  onChange={(e) => setTransitionForm(prev => ({ ...prev, conditionType: e.target.value as any }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="none">🟢 Immediate (Transition Always on Event)</option>
                  <option value="behavior">🧠 Behavior Rule Guard (Linked rule must be true)</option>
                  <option value="custom">🛠️ Custom Script Expression</option>
                </select>
              </div>

              {transitionForm.conditionType === 'behavior' && (
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Linked Behavior Rule</label>
                  <select
                    value={transitionForm.behaviorRuleId || ''}
                    onChange={(e) => setTransitionForm(prev => ({ ...prev, behaviorRuleId: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Pick Behavior Rule --</option>
                    {(char.rules || []).map(r => (
                      <option key={r.id} value={r.id}>{r.name || r.id}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{transitionForm.isEditing ? 'Save Changes' : 'Create Transition'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Copy Behaviors & Rules */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn animate-duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Prefab Logic & Variables</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose another prefab from your project. This will import and overwrite all 
                **Rules, Variables, State Machine Nodes, Transitions,** and config 
                from that prefab into the current file.
              </p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-300 flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>Warning: This will overwrite your current behavior, variables, and states. This cannot be undone!</span>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">Source Prefab</label>
                <select
                  value={sourceCharIdToCopy}
                  onChange={(e) => setSourceCharIdToCopy(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="" disabled>-- Pick Source Prefab --</option>
                  {charFiles.filter(cf => (cf.prefabData?.id || cf.id) !== (char?.id || currentFile?.id)).map(cf => (
                    <option key={cf.id} value={cf.id}>{cf.name || cf.prefabData?.name || cf.fileName} ({cf.fileName})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!sourceCharIdToCopy}
                onClick={handleCopyBehaviorFromCharacter}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import & Overwrite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
