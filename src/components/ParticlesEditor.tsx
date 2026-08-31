import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  Flame, 
  Wind, 
  Eye, 
  Plus, 
  Copy, 
  Trash2, 
  Save,
  Download, 
  Activity, 
  Zap, 
  Check, 
  Gauge,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Target,
  X,
  FileText,
  Compass,
  Upload,
  Cloud,
  ChevronDown,
  ChevronUp,
  Grid,
  ShieldAlert,
  Layers,
  Navigation,
  Search
} from 'lucide-react';
import { 
  MasonProject, 
  ParticleSystemData, 
  ParticleSystemFile, 
  ParticleShape, 
  ParticleEmitterShape, 
  ParticleBlendMode, 
  ParticleSizeCurve,
  ParticleCurveMode,
  ParticleFxStyle,
  ParticleEmissiveMode,
  ParticleAnimStyle,
  DEFAULT_PARTICLE_SYSTEMS
} from '../engine/masonProjectSchema';
import { ParticleEngine, evaluateTrackValue } from '../engine/ParticleEngine';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { useAppTheme } from '../theme/ThemeContext';
import { exportParticleFile, createNewParticleInProject } from '../utils/masonStorage';
import { SpritesheetSliceModal, SpritesheetSliceResult } from './shared/spritesheet';
import { ViewportHUD } from './shared/viewport';
import { getSavedModuleTab, saveModuleTab } from '../utils/moduleTabStore';

interface ParticlesEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles: () => void;
  onBackToDashboard: () => void;
}


export const SVG_PARTICLE_PRESETS: { id: string; name: string; icon: string; path: string }[] = [
  {
    id: 'heart',
    name: 'Heart',
    icon: '❤️',
    path: 'M 0 -10 C -5 -16 -15 -12 -15 -2 C -15 8 -2 15 0 20 C 2 15 15 8 15 -2 C 15 -12 5 -16 0 -10 Z'
  },
  {
    id: 'skull',
    name: 'Skull',
    icon: '💀',
    path: 'M -10 -12 C -10 -20 10 -20 10 -12 C 10 -4 8 0 8 6 L -8 6 C -8 0 -10 -4 -10 -12 Z M -6 8 L -6 14 L -2 14 L -2 8 M 2 8 L 2 14 L 6 14 L 6 8 M -5 -10 A 3 3 0 1 0 -5 -9.9 M 5 -10 A 3 3 0 1 0 5 -9.9'
  },
  {
    id: 'crescent_moon',
    name: 'Crescent Moon',
    icon: '🌙',
    path: 'M 0 -15 A 15 15 0 1 0 15 10 A 12 12 0 1 1 0 -15 Z'
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    icon: '⚡',
    path: 'M 2 -18 L -12 0 L -2 0 L -6 18 L 12 -2 L 2 -2 Z'
  },
  {
    id: 'crystal_gem',
    name: 'Crystal Gem',
    icon: '💎',
    path: 'M 0 -16 L 12 -6 L 0 18 L -12 -6 Z M -12 -6 L 12 -6 M 0 -16 L 0 18'
  },
  {
    id: 'shield_crest',
    name: 'Shield Crest',
    icon: '🛡️',
    path: 'M -12 -16 L 12 -16 L 12 0 C 12 10 0 18 0 18 C 0 18 -12 10 -12 0 Z'
  },
  {
    id: 'leaf_flora',
    name: 'Spore Leaf',
    icon: '🍃',
    path: 'M 0 -18 C 15 -10 15 10 0 18 C -15 10 -15 -10 0 -18 Z M 0 -14 L 0 14'
  },
  {
    id: 'arcane_rune',
    name: 'Arcane Glyph',
    icon: '🔮',
    path: 'M 0 -16 L 14 10 L -14 10 Z M 0 16 L -14 -10 L 14 -10 Z'
  },
  {
    id: 'flame_blade',
    name: 'Flame Blade',
    icon: '🔥',
    path: 'M 0 -18 C 8 -10 10 0 4 10 C 12 4 14 -4 14 -4 C 18 12 4 18 0 20 C -12 18 -16 6 -8 -4 C -8 6 -2 12 0 -18 Z'
  },
  {
    id: 'cross_light',
    name: 'Holy Cross',
    icon: '✝️',
    path: 'M -4 -18 L 4 -18 L 4 -6 L 16 -6 L 16 2 L 4 2 L 4 18 L -4 18 L -4 2 L -16 2 L -16 -6 L -4 -6 Z'
  },
  {
    id: 'star_burst',
    name: '4-Point Spark',
    icon: '✦',
    path: 'M 0 -18 Q 0 0 18 0 Q 0 0 0 18 Q 0 0 -18 0 Q 0 0 0 -18 Z'
  },
  {
    id: 'drop_splash',
    name: 'Liquid Drop',
    icon: '💧',
    path: 'M 0 -18 C 10 -5 12 5 12 8 C 12 15 6 20 0 20 C -6 20 -12 15 -12 8 C -12 5 -10 -5 0 -18 Z'
  }
];

export const POLYGON_PRESETS: { id: string; name: string; icon: string; points: Array<{ x: number; y: number }> }[] = [
  {
    id: 'box',
    name: 'Square Box',
    icon: '🟩',
    points: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }]
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: '🔺',
    points: [{ x: 0, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }]
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    icon: '⬡',
    points: [
      { x: 0, y: -0.5 },
      { x: 0.43, y: -0.25 },
      { x: 0.43, y: 0.25 },
      { x: 0, y: 0.5 },
      { x: -0.43, y: 0.25 },
      { x: -0.43, y: -0.25 }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: '💠',
    points: [{ x: 0, y: -0.5 }, { x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: -0.5, y: 0 }]
  },
  {
    id: 'star',
    name: '5-Point Star',
    icon: '⭐',
    points: Array.from({ length: 10 }).map((_, i) => {
      const rad = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? 0.5 : 0.22;
      return { x: Number((Math.cos(rad) * r).toFixed(2)), y: Number((Math.sin(rad) * r).toFixed(2)) };
    })
  }
];

interface AlphaDualRangeSliderProps {
  label: string;
  minAlpha: number; // 0.0 to 1.0
  maxAlpha?: number; // 0.0 to 1.0
  onChange: (min: number, max: number | undefined) => void;
  colorHex?: string;
  isOptionalMid?: boolean;
  hasMidDefined?: boolean;
  onToggleMid?: () => void;
}

const AlphaDualRangeSlider: React.FC<AlphaDualRangeSliderProps> = ({
  label,
  minAlpha,
  maxAlpha,
  onChange,
  colorHex = '#f59e0b',
  isOptionalMid,
  hasMidDefined,
  onToggleMid,
}) => {
  const isFixed = maxAlpha === undefined || maxAlpha <= minAlpha;

  return (
    <div className="p-2.5 bg-neutral-900/80 border border-neutral-800/80 rounded-xl space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-neutral-700 shadow-sm"
            style={{ backgroundColor: colorHex }}
          />
          <span className="text-xs font-bold text-neutral-200">{label}</span>
        </div>

        <div className="flex items-center gap-3">
          {isOptionalMid && onToggleMid && (
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasMidDefined}
                onChange={onToggleMid}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-950 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>Mid keyframe</span>
            </label>
          )}

          {(!isOptionalMid || hasMidDefined) && (
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!isFixed}
                onChange={(e) => {
                  if (e.target.checked) {
                    const newMax = Math.min(1.0, Number((minAlpha + 0.20).toFixed(2)));
                    onChange(minAlpha, newMax);
                  } else {
                    onChange(minAlpha, undefined);
                  }
                }}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-950 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>Range</span>
            </label>
          )}
        </div>
      </div>

      {(!isOptionalMid || hasMidDefined) && (
        <div className="pt-0.5">
          {/* Dual Sliders: Min & Max */}
          <div className={`grid ${!isFixed ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 text-[10px]`}>
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-0.5 font-mono">
                <span>{isFixed ? 'Opacity' : 'Min Opacity'}</span>
                <span className="font-bold text-white">{Math.round(minAlpha * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={minAlpha}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  if (!isFixed && maxAlpha !== undefined && newMin > maxAlpha) {
                    onChange(newMin, newMin);
                  } else {
                    onChange(newMin, maxAlpha);
                  }
                }}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            {!isFixed && (
              <div>
                <div className="flex items-center justify-between text-amber-300 mb-0.5 font-mono">
                  <span>Max Opacity</span>
                  <span className="font-bold text-amber-200">{Math.round((maxAlpha ?? minAlpha) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={minAlpha}
                  max="1"
                  step="0.05"
                  value={maxAlpha ?? minAlpha}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    onChange(minAlpha, newMax);
                  }}
                  className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AVAILABLE_INITIALIZE_PROPS = [
  {
    id: 'size_curve',
    label: '📏 Size Curve',
    category: 'visuals' as const,
    badge: 'Scale Envelope',
    desc: 'Configure and animate particle size over its lifetime.'
  },
  {
    id: 'color_flow',
    label: '🎨 Color Flow',
    category: 'visuals' as const,
    badge: 'Palette Gradient',
    desc: 'Set up starting colors and transition flows.'
  },
  {
    id: 'alpha_opac',
    label: '🏁 Alpha Opacity',
    category: 'visuals' as const,
    badge: 'Transparency',
    desc: 'Control alpha transparency and fading curves.'
  },
  {
    id: 'rotation',
    label: '🔄 Rotation & Spin',
    category: 'visuals' as const,
    badge: 'Orientation',
    desc: 'Configure starting rotation angles and spin velocity.'
  },
  {
    id: 'bloom',
    label: '🔆 Glow Bloom',
    category: 'visuals' as const,
    badge: 'Emissive Aura',
    desc: 'Render glowing neon aura shadows and light emission.'
  },
  {
    id: 'motionBlur',
    label: '☄️ Motion Blur',
    category: 'visuals' as const,
    badge: 'Velocity Streak',
    desc: 'Streak particles across their velocity vector.'
  },
  {
    id: 'trails',
    label: '✨ Trails Ribbon',
    category: 'visuals' as const,
    badge: 'History Tail',
    desc: 'Draw a trailing history behind particles.'
  },
  {
    id: 'launch_speed',
    label: '🚀 Launch Speed',
    category: 'forces' as const,
    badge: 'Velocity',
    desc: 'Adjust min/max speeds of emitted particles.'
  },
  {
    id: 'gravity',
    label: '🪐 Gravity Forces',
    category: 'forces' as const,
    badge: 'Gravity Pull',
    desc: 'Apply horizontal or vertical directional gravity.'
  },
  {
    id: 'drag',
    label: '💧 Fluid Drag',
    category: 'forces' as const,
    badge: 'Air Resistance',
    desc: 'Settle or slow down movement over time.'
  },
  {
    id: 'wind',
    label: '💨 Wind Forces',
    category: 'forces' as const,
    badge: 'Ambient Drift',
    desc: 'Continuous environmental drift sideways.'
  },
  {
    id: 'angle',
    label: '📐 Angle & Spread',
    category: 'forces' as const,
    badge: 'Directional Cone',
    desc: 'Launch angle orientation and emission cone spread.'
  },
  {
    id: 'turbulence',
    label: '🌪️ Turbulence & Noise',
    category: 'forces' as const,
    badge: 'Velocity Jitter',
    desc: 'Applies organic velocity noise perturbations for flurries, embers, and rising heat.'
  },
  {
    id: 'pull',
    label: '🧲 Emitter Pull',
    category: 'forces' as const,
    badge: 'Vortex Drag',
    desc: 'Drag particles along when the emitter moves.'
  },
  {
    id: 'physics',
    label: '🧱 Solid Map Collision',
    category: 'physics' as const,
    badge: 'Surface Bounce',
    desc: 'Bounce off room borders or platforms.'
  },
  {
    id: 'destroy_on_hit',
    label: '💥 Destroy on Hit',
    category: 'physics' as const,
    badge: 'Instant Despawn',
    desc: 'Despawn instantly when hitting a solid surface.'
  }
];

export const getPropsFromParticleData = (data: ParticleSystemData): string[] => {
  const props: string[] = [];
  if (!data) return props;
  const k = data.kinematics || ({} as any);
  const v = data.visuals || ({} as any);
  const ph = data.physics || ({} as any);

  if (v.animateSize !== false) props.push('size_curve');
  if (v.animateColor !== false) props.push('color_flow');
  if (v.animateAlpha !== false) props.push('alpha_opac');
  if (v.animateRotation || (k.minAngularVelocity ?? 0) !== 0 || (k.maxAngularVelocity ?? 0) !== 0) props.push('rotation');
  if ((k.minSpeed ?? 0) !== 0 || (k.maxSpeed ?? 0) !== 0) props.push('launch_speed');
  if ((k.gravityX ?? 0) !== 0 || (k.gravityY ?? 0) !== 0 || (k.gravityScale ?? 0) !== 0 || (k.gravityScaleX ?? 0) !== 0) props.push('gravity');
  if ((k.drag ?? 1.0) !== 1.0 || (k.angularDrag !== undefined && k.angularDrag !== 1.0)) props.push('drag');
  if ((k.windForce ?? 0) !== 0 || (k.windSensitivity !== undefined && k.windSensitivity !== 1.0)) props.push('wind');
  if ((k.angleDeg ?? 270) !== 270 || (k.spreadDeg ?? 0) !== 0) props.push('angle');
  if ((k.turbulenceJitter ?? 0) > 0) props.push('turbulence');
  if (k.emitterPull) props.push('pull');
  if ((v.glowBlurRadius ?? 0) > 0 || v.isEmissive) props.push('bloom');
  if (v.startMotionBlur !== undefined || v.endMotionBlur !== undefined || v.animateMotionBlur) props.push('motionBlur');
  if (v.hasTrails) props.push('trails');
  if (ph.collideWithMapSolids || ph.fluidSelfCollision) props.push('physics');
  if (ph.destroyOnCollision) props.push('destroy_on_hit');

  return Array.from(new Set(props));
};

export const ParticlesEditor: React.FC<ParticlesEditorProps> = ({
  project,
  onUpdateProject,
  onOpenFiles,
  onBackToDashboard
}) => {
  const { theme } = useAppTheme();
  // Ensure particles files array exists
  const particleFiles: ParticleSystemFile[] = useMemo(() => {
    if (project.fileSystem.particles && project.fileSystem.particles.length > 0) {
      return project.fileSystem.particles;
    }
    return DEFAULT_PARTICLE_SYSTEMS.map(p => ({
      id: p.id,
      name: p.name,
      fileName: `${p.id.replace('particles_', '')}.particle`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      particleData: p
    }));
  }, [project.fileSystem.particles]);

  const activeFileName = project.activeFiles.particleFileName || particleFiles[0]?.fileName;
  const activeFile = particleFiles.find(f => f.fileName === activeFileName) || particleFiles[0];
  const activeParticleData = activeFile?.particleData || DEFAULT_PARTICLE_SYSTEMS[0];

  // UI State
  const [activeTab, setActiveTabState] = useState<'initialize' | 'animation' | 'spritesheets' | 'presets'>(
    () => getSavedModuleTab('particles', 'initialize') as any
  );
  const setActiveTab = (tab: 'initialize' | 'animation' | 'spritesheets' | 'presets') => {
    setActiveTabState(tab);
    saveModuleTab('particles', tab);
  };
  const [selectedTrack, setSelectedTrack] = useState<string>('size');
  const [addedProps, setAddedProps] = useState<string[]>([]);
  const [paramSearch, setParamSearch] = useState<string>('');
  const [paramCategory, setParamCategory] = useState<'all' | 'forces' | 'visuals' | 'physics'>('all');
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
  const dragStateRef = useRef<{track: string, nodes: any[]} | null>(null);
  const [dragTick, setDragTick] = useState(0);

  const visibleTracks = useMemo(() => {
    const list: string[] = [];
    const em = activeParticleData.emitter;
    const v = activeParticleData.visuals;
    const k = activeParticleData.kinematics;

    // Emitter tracks
    if (em.animateEmitterWidth) list.push('emitter_width');
    if (em.animateEmitterHeight) list.push('emitter_height');
    if (em.animateEmitterRotation) list.push('emitter_rotation');
    if (em.animateEmissionRate) list.push('emission_rate');
    if (em.animateBurstCount) list.push('burst_count');
    if (em.animateBurstInterval) list.push('burst_interval');

    // Particle property tracks
    if (addedProps.includes('size_curve') || v.animateSize !== false) list.push('size');
    if (addedProps.includes('color_flow') || v.animateColor !== false) list.push('color');
    if (addedProps.includes('alpha_opac') || v.animateAlpha !== false) list.push('alpha');
    if (addedProps.includes('bloom') || v.animateEmissive) list.push('emissive');
    if (addedProps.includes('rotation') || v.animateRotation) list.push('rotation');
    if (addedProps.includes('launch_speed') || v.animateSpeed) list.push('speed');
    if (addedProps.includes('drag') || v.animateDrag) list.push('drag');
    if (addedProps.includes('motionBlur') || v.animateMotionBlur) list.push('motionBlur');
    if (addedProps.includes('gravity') || (v as any).animateGravity) list.push('gravity');
    if (addedProps.includes('wind') || (v as any).animateWind) list.push('wind');
    if (addedProps.includes('angle') || (v as any).animateAngle) list.push('angle');
    if (addedProps.includes('turbulence') || (k.turbulenceJitter ?? 0) > 0) list.push('turbulence');
    if (addedProps.includes('trails') || (v as any).animateTrails) list.push('trails');

    return Array.from(new Set(list));
  }, [addedProps, activeParticleData.emitter, activeParticleData.visuals, activeParticleData.kinematics]);

  useEffect(() => {
    if (visibleTracks.length > 0 && !visibleTracks.includes(selectedTrack)) {
      setSelectedTrack(visibleTracks[0]);
    }
  }, [visibleTracks, selectedTrack]);

  // Synchronize active customizable parameters whenever active particle data changes
  useEffect(() => {
    setAddedProps(getPropsFromParticleData(activeParticleData));
  }, [activeParticleData.id]);

  const handleAddParam = (propId: string) => {
    setAddedProps(prev => [...prev.filter(x => x !== propId), propId]);
    updateActiveParticle(pr => {
      const updated = JSON.parse(JSON.stringify(pr));
      if (propId === 'size_curve') {
        updated.visuals.animateSize = true;
        if (updated.visuals.startSize === updated.visuals.endSize) {
          updated.visuals.endSize = Math.max(1, Math.round((updated.visuals.startSize ?? 8) * 0.3));
        }
      } else if (propId === 'color_flow') {
        updated.visuals.animateColor = true;
      } else if (propId === 'alpha_opac') {
        updated.visuals.animateAlpha = true;
      } else if (propId === 'rotation') {
        updated.visuals.animateRotation = true;
        if ((updated.kinematics.minAngularVelocity ?? 0) === 0 && (updated.kinematics.maxAngularVelocity ?? 0) === 0) {
          updated.kinematics.minAngularVelocity = -90;
          updated.kinematics.maxAngularVelocity = 90;
          updated.kinematics.angularDrag = 0.98;
        }
      } else if (propId === 'launch_speed') {
        if ((updated.kinematics.minSpeed ?? 0) === 0 && (updated.kinematics.maxSpeed ?? 0) === 0) {
          updated.kinematics.minSpeed = 60;
          updated.kinematics.maxSpeed = 140;
        }
      } else if (propId === 'gravity') {
        if ((updated.kinematics.gravityY ?? 0) === 0 && (updated.kinematics.gravityX ?? 0) === 0) {
          updated.kinematics.gravityY = 180;
          updated.kinematics.gravityX = 0;
        }
      } else if (propId === 'drag') {
        if ((updated.kinematics.drag ?? 1.0) === 1.0) {
          updated.kinematics.drag = 0.98;
          updated.kinematics.angularDrag = 0.98;
        }
      } else if (propId === 'wind') {
        if ((updated.kinematics.windForce ?? 0) === 0) {
          updated.kinematics.windForce = 30;
          updated.kinematics.windSensitivity = 1.0;
        }
      } else if (propId === 'angle') {
        if ((updated.kinematics.spreadDeg ?? 0) === 0) {
          updated.kinematics.angleDeg = updated.kinematics.angleDeg ?? 270;
          updated.kinematics.spreadDeg = 45;
        }
      } else if (propId === 'turbulence') {
        if ((updated.kinematics.turbulenceJitter ?? 0) === 0) {
          updated.kinematics.turbulenceJitter = 20;
        }
      } else if (propId === 'pull') {
        updated.kinematics.emitterPull = true;
        updated.kinematics.emitterPullRadius = updated.kinematics.emitterPullRadius ?? 150;
        updated.kinematics.emitterPullStrength = updated.kinematics.emitterPullStrength ?? 1.0;
        updated.kinematics.emitterPullFalloff = updated.kinematics.emitterPullFalloff ?? 1.0;
      } else if (propId === 'bloom') {
        if ((updated.visuals.glowBlurRadius ?? 0) === 0) {
          updated.visuals.glowBlurRadius = 10;
          updated.visuals.isEmissive = true;
          updated.visuals.emissiveStartStrength = 35;
          updated.visuals.emissiveEndStrength = 0;
        }
      } else if (propId === 'motionBlur') {
        updated.visuals.animateMotionBlur = true;
        updated.visuals.startMotionBlur = updated.visuals.startMotionBlur ?? 1;
        updated.visuals.endMotionBlur = updated.visuals.endMotionBlur ?? 1;
      } else if (propId === 'trails') {
        updated.visuals.hasTrails = true;
        updated.visuals.trailLength = updated.visuals.trailLength || 10;
        updated.visuals.trailWidthScale = updated.visuals.trailWidthScale || 1.0;
        updated.visuals.trailTaper = updated.visuals.trailTaper ?? true;
        updated.visuals.trailTaperLength = updated.visuals.trailTaperLength || 10;
      } else if (propId === 'physics') {
        updated.physics.collideWithMapSolids = true;
        updated.physics.collisionRestitution = updated.physics.collisionRestitution ?? 0.4;
      } else if (propId === 'destroy_on_hit') {
        updated.physics.destroyOnCollision = true;
      }
      return updated;
    });
  };

  const handleRemoveParam = (propId: string) => {
    setAddedProps(prev => prev.filter(x => x !== propId));
    updateActiveParticle(pr => {
      const updated = JSON.parse(JSON.stringify(pr));
      if (propId === 'size_curve') {
        updated.visuals.animateSize = false;
        updated.visuals.midSize = undefined;
      } else if (propId === 'color_flow') {
        updated.visuals.animateColor = false;
        updated.visuals.midColor = undefined;
      } else if (propId === 'alpha_opac') {
        updated.visuals.animateAlpha = false;
        updated.visuals.startAlpha = 1.0;
        updated.visuals.endAlpha = 1.0;
        updated.visuals.midAlpha = undefined;
      } else if (propId === 'rotation') {
        updated.visuals.animateRotation = false;
        updated.visuals.startRotationDeg = 0;
        updated.visuals.endRotationDeg = 0;
        updated.visuals.midRotationDeg = undefined;
        updated.kinematics.minAngularVelocity = 0;
        updated.kinematics.maxAngularVelocity = 0;
        updated.kinematics.angularDrag = 1.0;
      } else if (propId === 'launch_speed') {
        updated.kinematics.minSpeed = 0;
        updated.kinematics.maxSpeed = 0;
      } else if (propId === 'gravity') {
        updated.kinematics.gravityX = 0;
        updated.kinematics.gravityY = 0;
        updated.kinematics.gravityScale = 0;
        updated.kinematics.gravityScaleX = 0;
      } else if (propId === 'drag') {
        updated.kinematics.drag = 1.0;
        updated.kinematics.angularDrag = 1.0;
        updated.kinematics.startDrag = 1.0;
        updated.kinematics.midDrag = undefined;
        updated.kinematics.endDrag = 1.0;
      } else if (propId === 'wind') {
        updated.kinematics.windForce = 0;
        updated.kinematics.windSensitivity = 0;
      } else if (propId === 'angle') {
        updated.kinematics.angleDeg = 270;
        updated.kinematics.spreadDeg = 0;
      } else if (propId === 'turbulence') {
        updated.kinematics.turbulenceJitter = 0;
      } else if (propId === 'pull') {
        updated.kinematics.emitterPull = false;
        updated.kinematics.emitterPullStrength = 0;
      } else if (propId === 'bloom') {
        updated.visuals.glowBlurRadius = 0;
        updated.visuals.isEmissive = false;
        updated.visuals.emissiveStartStrength = 0;
        updated.visuals.emissiveEndStrength = 0;
      } else if (propId === 'motionBlur') {
        updated.visuals.animateMotionBlur = false;
        updated.visuals.startMotionBlur = undefined;
        updated.visuals.endMotionBlur = undefined;
        updated.visuals.midMotionBlur = undefined;
      } else if (propId === 'trails') {
        updated.visuals.hasTrails = false;
        updated.visuals.trailLength = 0;
      } else if (propId === 'physics') {
        updated.physics.collideWithMapSolids = false;
        updated.physics.fluidSelfCollision = false;
      } else if (propId === 'destroy_on_hit') {
        updated.physics.destroyOnCollision = false;
      }
      return updated;
    });

    // Real-time synchronization: immediately strip removed property effect from all active live engine particles
    if (engineRef.current && engineRef.current.particles) {
      engineRef.current.particles.forEach(p => {
        if (propId === 'gravity') { p.gravityX = 0; p.gravityY = 0; }
        else if (propId === 'wind') { p.windForce = 0; }
        else if (propId === 'turbulence') { p.turbulenceJitter = 0; }
        else if (propId === 'drag') { p.drag = 1.0; p.angularDrag = 1.0; }
        else if (propId === 'pull') { p.emitterPull = false; }
        else if (propId === 'bloom') { p.glowBlurRadius = 0; p.isEmissive = false; }
        else if (propId === 'trails') { p.hasTrails = false; p.trailHistory = []; }
        else if (propId === 'physics') { p.collides = false; }
        else if (propId === 'destroy_on_hit') { p.destroyOnCollision = false; }
        else if (propId === 'rotation') { p.animateRotation = false; p.vRot = 0; }
        else if (propId === 'size_curve') { p.animateSize = false; }
        else if (propId === 'color_flow') { p.animateColor = false; }
        else if (propId === 'alpha_opac') { p.animateAlpha = false; }
        else if (propId === 'motionBlur') { p.animateMotionBlur = false; }
      });
    }
  };

  // Reset engine particles and timing refs whenever switching active particle file or system
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.clear();
    }
    const now = performance.now();
    lastFrameTimeRef.current = now;
    lastEmitTimeRef.current = now;
    lastBurstTimeRef.current = now;
    emitAccumulatorRef.current = 0;
    nextBurstIntervalRef.current = null;
    isFirstFrameRef.current = true;
  }, [activeParticleData.id, activeFile.fileName]);

  const [scrubberProgress, setScrubberProgress] = useState<number>(0.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [bgTheme, setBgTheme] = useState<'grid' | 'dungeon' | 'magma' | 'void' | 'cave' | 'boxes' | 'forest'>('grid');
  const [floorCollisionEnabled, setFloorCollisionEnabled] = useState<boolean>(true);
  const [emitterPos, setEmitterPos] = useState<{ x: number; y: number }>({ x: 320, y: 220 });
  
  // Viewport Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasTool, setCanvasTool] = useState<'select' | 'pan'>('select');
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDraggingEmitter, setIsDraggingEmitter] = useState<boolean>(false);

  // New File Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newSystemName, setNewSystemName] = useState<string>('New Particle Burst');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);

  // Telemetry & Feedback
  const [fps, setFps] = useState<number>(60);
  const [activeParticleCount, setActiveParticleCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showCollisionWireframe, setShowCollisionWireframe] = useState<boolean>(false);
  const [simulatedBiomeWind, setSimulatedBiomeWind] = useState<number>(15); // Simulated Active Biome Wind Force (px/s)
  const [simulatedBiomeWindEnabled, setSimulatedBiomeWindEnabled] = useState<boolean>(false); // Simulated Biome Wind Enable/Disable

  // Resizable Inspector Sidebar Width (saved in localStorage)
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mason_particles_inspector_width');
      return saved ? parseInt(saved, 10) : 420;
    } catch (e) {
      return 420;
    }
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(300, Math.min(750, newWidth));
      setInspectorWidth(constrainedWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsResizing(false);
      const finalWidth = Math.max(300, Math.min(750, window.innerWidth - e.clientX));
      try {
        localStorage.setItem('mason_particles_inspector_width', finalWidth.toString());
      } catch (err) {
        // ignore
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const [windowWidth, setWindowWidth] = useState<number>(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showCollisionWireframeRef = useRef<boolean>(showCollisionWireframe);
  useEffect(() => {
    showCollisionWireframeRef.current = showCollisionWireframe;
  }, [showCollisionWireframe]);

  const simulatedBiomeWindRef = useRef<number>(simulatedBiomeWind);
  useEffect(() => {
    simulatedBiomeWindRef.current = simulatedBiomeWind;
  }, [simulatedBiomeWind]);

  const simulatedBiomeWindEnabledRef = useRef<boolean>(simulatedBiomeWindEnabled);
  useEffect(() => {
    simulatedBiomeWindEnabledRef.current = simulatedBiomeWindEnabled;
  }, [simulatedBiomeWindEnabled]);

  // Custom FX Presets State (saved in localStorage)
  const [customPresets, setCustomPresets] = useState<{name: string, visuals: any, kinematics?: any}[]>(() => {
    try {
      const saved = localStorage.getItem('mason_particle_fx_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom Full Particle System Presets (saved in localStorage)
  const [customSystemPresets, setCustomSystemPresets] = useState<ParticleSystemData[]>(() => {
    try {
      const saved = localStorage.getItem('mason_custom_particle_system_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Collapsible sections state for Static tab
  const [openSections, setOpenSections] = useState({
    emitter: true,
    kinematics: true,
    physics: false,
    visuals: true
  });
  const toggleSection = (sec: 'emitter' | 'kinematics' | 'physics' | 'visuals') => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleSavePreset = () => {
    const name = prompt('Enter a name for your custom FX Preset:');
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    if (customPresets.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      alert('A preset with this name already exists.');
      return;
    }

    const newPreset = {
      name: cleanName,
      visuals: {
        animateSize: activeParticleData.visuals.animateSize,
        animateColor: activeParticleData.visuals.animateColor,
        animateAlpha: activeParticleData.visuals.animateAlpha,
        animateEmissive: activeParticleData.visuals.animateEmissive,
        animateRotation: activeParticleData.visuals.animateRotation,
        sizeAnimStyle: activeParticleData.visuals.sizeAnimStyle,
        colorAnimStyle: activeParticleData.visuals.colorAnimStyle,
        emissiveAnimStyle: activeParticleData.visuals.emissiveAnimStyle,
        rotationAnimStyle: activeParticleData.visuals.rotationAnimStyle,
        sizeCurve: activeParticleData.visuals.sizeCurve,
        alphaCurve: activeParticleData.visuals.alphaCurve,
        emissiveCurve: activeParticleData.visuals.emissiveCurve,
        rotationCurve: activeParticleData.visuals.rotationCurve,
        startSize: activeParticleData.visuals.startSize,
        startSizeMax: activeParticleData.visuals.startSizeMax,
        midSize: activeParticleData.visuals.midSize,
        midSizeMax: activeParticleData.visuals.midSizeMax,
        endSize: activeParticleData.visuals.endSize,
        endSizeMax: activeParticleData.visuals.endSizeMax,
        startColor: activeParticleData.visuals.startColor,
        midColor: activeParticleData.visuals.midColor,
        endColor: activeParticleData.visuals.endColor,
        startAlpha: activeParticleData.visuals.startAlpha,
        startAlphaMax: activeParticleData.visuals.startAlphaMax,
        midAlpha: activeParticleData.visuals.midAlpha,
        midAlphaMax: activeParticleData.visuals.midAlphaMax,
        endAlpha: activeParticleData.visuals.endAlpha,
        endAlphaMax: activeParticleData.visuals.endAlphaMax,
        glowBlurRadius: activeParticleData.visuals.glowBlurRadius,
        blendMode: activeParticleData.visuals.blendMode
      },
      kinematics: {
        drag: activeParticleData.kinematics.drag,
        dragCurve: activeParticleData.kinematics.dragCurve,
        startDrag: activeParticleData.kinematics.startDrag,
        startDragMax: activeParticleData.kinematics.startDragMax,
        midDrag: activeParticleData.kinematics.midDrag,
        midDragMax: activeParticleData.kinematics.midDragMax,
        endDrag: activeParticleData.kinematics.endDrag,
        endDragMax: activeParticleData.kinematics.endDragMax
      }
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('mason_particle_fx_presets', JSON.stringify(updated));
    showToast(`Successfully saved preset "${cleanName}"!`);
  };

  const handleDeletePreset = (nameToDelete: string) => {
    if (!confirm(`Are you sure you want to delete the custom preset "${nameToDelete}"?`)) return;
    const updated = customPresets.filter(p => p.name !== nameToDelete);
    setCustomPresets(updated);
    localStorage.setItem('mason_particle_fx_presets', JSON.stringify(updated));
    showToast(`Deleted preset "${nameToDelete}"`);
  };

  const applyFXPreset = (styleKey: string) => {
    let updatedVisuals = { ...activeParticleData.visuals };
    let updatedKinematics = { ...activeParticleData.kinematics };

    if (styleKey === 'custom') {
      updateActiveParticle(p => ({
        ...p,
        visuals: { ...p.visuals, fxStyle: 'custom' as any }
      }));
      return;
    }

    const customMatch = customPresets.find(pr => pr.name === styleKey);
    if (customMatch) {
      updateActiveParticle(p => ({
        ...p,
        visuals: {
          ...p.visuals,
          ...customMatch.visuals,
          fxStyle: 'custom' as any
        },
        kinematics: {
          ...p.kinematics,
          ...(customMatch.kinematics || {})
        }
      }));
      return;
    }

    if (styleKey === 'pulse_oscillate') {
      updatedVisuals.fxStyle = 'pulse_oscillate';
      updatedVisuals.animateSize = true;
      updatedVisuals.sizeAnimStyle = 'oscillate';
      updatedVisuals.sizeCurve = 'bell_arch';
      updatedVisuals.startSize = 2;
      updatedVisuals.midSize = 8;
      updatedVisuals.endSize = 1;
    } else if (styleKey === 'flicker_shimmer') {
      updatedVisuals.fxStyle = 'flicker_shimmer';
      updatedVisuals.animateAlpha = true;
      updatedVisuals.colorAnimStyle = 'oscillate';
      updatedVisuals.alphaCurve = 'burst_decay';
      updatedVisuals.startAlpha = 1.0;
      updatedVisuals.midAlpha = 0.2;
      updatedVisuals.endAlpha = 0.8;
    } else if (styleKey === 'orbit_swirl') {
      updatedVisuals.fxStyle = 'orbit_swirl';
      updatedVisuals.animateRotation = true;
      updatedVisuals.rotationAnimStyle = 'repeat';
      updatedVisuals.rotationCurve = 'balanced';
      updatedVisuals.startRotationDeg = 0;
      updatedVisuals.midRotationDeg = 180;
      updatedVisuals.endRotationDeg = 360;
    } else if (styleKey === 'spark_crackle') {
      updatedVisuals.fxStyle = 'spark_crackle';
      updatedVisuals.animateColor = true;
      updatedVisuals.animateAlpha = true;
      updatedVisuals.colorAnimStyle = 'oscillate';
      updatedVisuals.alphaCurve = 'burst_decay';
      updatedVisuals.startAlpha = 1.0;
      updatedVisuals.midAlpha = 0.1;
      updatedVisuals.endAlpha = 0.9;
    } else if (styleKey === 'default') {
      updatedVisuals.fxStyle = 'default';
      updatedVisuals.animateSize = true;
      updatedVisuals.animateColor = true;
      updatedVisuals.animateAlpha = true;
      updatedVisuals.animateEmissive = true;
      updatedVisuals.animateRotation = true;
      updatedVisuals.sizeAnimStyle = 'one_shot';
      updatedVisuals.colorAnimStyle = 'one_shot';
      updatedVisuals.emissiveAnimStyle = 'one_shot';
      updatedVisuals.rotationAnimStyle = 'one_shot';
    }

    updateActiveParticle(p => ({
      ...p,
      visuals: updatedVisuals,
      kinematics: updatedKinematics
    }));
  };

  const updateTrackNodes = (track: string, nodes: { time: number; value: any }[]) => {
    updateActiveParticle(p => {
      const trackNodes = { ...(p.visuals.trackNodes || {}) };
      trackNodes[track] = nodes.sort((a, b) => a.time - b.time);
      return {
        ...p,
        visuals: {
          ...p.visuals,
          trackNodes
        }
      };
    });
  };

  const handleAddNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation' | 'speed' | 'drag' | 'motionBlur') => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, track);
    if (nodes.length >= 5) {
      showToast("Max limit of 5 nodes reached for this track!");
      return;
    }
    
    // Find a suitable time gap
    const sortedTimes = nodes.map(n => n.time).sort((a, b) => a - b);
    let bestTime = 0.5;
    let biggestGap = 0;
    
    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const gap = sortedTimes[i + 1] - sortedTimes[i];
      if (gap > biggestGap) {
        biggestGap = gap;
        bestTime = sortedTimes[i] + gap / 2;
      }
    }
    
    // Interpolate value at bestTime
    const interpolatedVal = evaluateTrackValue(bestTime, track, activeParticleData.visuals);
    
    const newNodes = [...nodes, { time: bestTime, value: interpolatedVal }].sort((a, b) => a.time - b.time);
    updateTrackNodes(track, newNodes);
  };

  const handleDeleteNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation' | 'speed' | 'drag' | 'motionBlur', index: number) => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, track);
    if (nodes.length <= 2) {
      showToast("Must have at least Spawn and Death nodes!");
      return;
    }
    const newNodes = nodes.filter((_, i) => i !== index);
    updateTrackNodes(track, newNodes);
  };

  const handleUpdateNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation' | 'speed' | 'drag' | 'motionBlur', index: number, field: 'time' | 'value', val: any) => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, track);
    const updated = nodes.map((n, i) => {
      if (i === index) {
        return { ...n, [field]: val };
      }
      return n;
    });
    if (field === 'time') {
      updated.sort((a, b) => a.time - b.time);
    }
    updateTrackNodes(track, updated);
  };

  const generateTrackSvgPath = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation' | 'speed' | 'drag' | 'motionBlur', minVal: number, maxVal: number) => {
    const points: string[] = [];
    const sampleCount = 60;
    
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const rawVal = evaluateTrackValue(t, track, activeParticleData.visuals);
      
      let numericVal = 0;
      if (track === 'color') {
        const rgb = hexToRgb(rawVal as string);
        numericVal = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
      } else if (track === 'rotation') {
        numericVal = ((Number(rawVal) % 360) + 360) % 360 / 360;
      } else {
        const denom = (maxVal - minVal) || 1;
        numericVal = (Number(rawVal) - minVal) / denom;
      }
      
      const x = t * 100;
      const y = 100 - (Math.max(0, Math.min(1, numericVal)) * 90 + 5);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  const activeTabRef = useRef<string>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine>(new ParticleEngine());
  const isFirstFrameRef = useRef<boolean>(true);
  const lastEmitTimeRef = useRef<number>(performance.now());
  const lastBurstTimeRef = useRef<number>(performance.now());
  const emitAccumulatorRef = useRef<number>(0);
  const nextBurstIntervalRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());
  const pathCacheRef = useRef<Map<string, Path2D>>(new Map());
  const spriteCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detailsSvgRef = useRef<SVGSVGElement | null>(null);
  const lastEmitterPosRef = useRef<{x: number, y: number} | null>(null);

  // Bakes and caches any particle shape (standard, glyph, or vector SVG) into a high-res offscreen raster canvas texture
  const getOrCreateParticleSprite = (
    shape: ParticleShape,
    customGlyph: string | undefined,
    customSvgPath: string | undefined,
    glowBlurRadius: number,
    colorRgbStr: string
  ): HTMLCanvasElement => {
    const cacheKey = `${shape}_${customGlyph || ''}_${customSvgPath || ''}_${glowBlurRadius}_${colorRgbStr}`;
    let sprite = spriteCacheRef.current.get(cacheKey);
    if (sprite) return sprite;

    const canvasSize = 64; // Base offscreen texture size
    const offscreen = document.createElement('canvas');
    offscreen.width = canvasSize;
    offscreen.height = canvasSize;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return offscreen;
    oCtx.imageSmoothingEnabled = false;

    const center = canvasSize / 2;
    const baseSize = 36; // Inner drawing dimension leaving margin for glow

    oCtx.save();
    oCtx.translate(center, center);

    if (glowBlurRadius > 0) {
      oCtx.shadowBlur = Math.min(glowBlurRadius, 14);
      oCtx.shadowColor = `rgb(${colorRgbStr})`;
    }

    oCtx.fillStyle = `rgb(${colorRgbStr})`;
    oCtx.strokeStyle = `rgb(${colorRgbStr})`;

    if (shape === 'glow_circle' || shape === 'smoke_puff') {
      oCtx.beginPath();
      oCtx.arc(0, 0, baseSize / 2, 0, Math.PI * 2);
      oCtx.fill();
    } else if (shape === 'spark_line') {
      oCtx.lineWidth = Math.max(2, baseSize / 4);
      oCtx.beginPath();
      oCtx.moveTo(-baseSize / 2, 0);
      oCtx.lineTo(baseSize / 2, 0);
      oCtx.stroke();
    } else if (shape === 'ember') {
      oCtx.beginPath();
      oCtx.arc(0, 0, baseSize / 2, 0, Math.PI * 2);
      oCtx.fill();
      oCtx.fillStyle = '#ffffff';
      oCtx.beginPath();
      oCtx.arc(0, 0, Math.max(1, baseSize / 4), 0, Math.PI * 2);
      oCtx.fill();
    } else if (shape === 'star') {
      const spikes = 4;
      const outerR = baseSize / 2;
      const innerR = outerR * 0.4;
      oCtx.beginPath();
      for (let s = 0; s < spikes * 2; s++) {
        const rad = (s * Math.PI) / spikes;
        const currentR = s % 2 === 0 ? outerR : innerR;
        const sx = Math.cos(rad) * currentR;
        const sy = Math.sin(rad) * currentR;
        if (s === 0) oCtx.moveTo(sx, sy);
        else oCtx.lineTo(sx, sy);
      }
      oCtx.closePath();
      oCtx.fill();
    } else if (shape === 'diamond') {
      const half = baseSize / 2;
      oCtx.beginPath();
      oCtx.moveTo(0, -half);
      oCtx.lineTo(half, 0);
      oCtx.lineTo(0, half);
      oCtx.lineTo(-half, 0);
      oCtx.closePath();
      oCtx.fill();
    } else if (shape === 'ring') {
      oCtx.lineWidth = Math.max(2, baseSize / 5);
      oCtx.beginPath();
      oCtx.arc(0, 0, baseSize / 2, 0, Math.PI * 2);
      oCtx.stroke();
    } else if (shape === 'square' || shape === 'pixel_square') {
      oCtx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    } else if (shape === 'bubble') {
      oCtx.lineWidth = 2;
      oCtx.beginPath();
      oCtx.arc(0, 0, baseSize / 2, 0, Math.PI * 2);
      oCtx.stroke();
      oCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      oCtx.beginPath();
      oCtx.arc(-baseSize / 5, -baseSize / 5, baseSize / 6, 0, Math.PI * 2);
      oCtx.fill();
    } else if (shape === 'custom_glyph') {
      oCtx.font = `${Math.round(baseSize)}px sans-serif`;
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillText(customGlyph || '✦', 0, 0);
    } else if (shape === 'svg_path') {
      const svgPathStr = customSvgPath || SVG_PARTICLE_PRESETS[0].path;
      let path2d: Path2D;
      try {
        path2d = new Path2D(svgPathStr);
      } catch {
        path2d = new Path2D(SVG_PARTICLE_PRESETS[0].path);
      }
      const scale = baseSize / 32;
      oCtx.scale(scale, scale);
      oCtx.fill(path2d);
      oCtx.lineWidth = 1;
      oCtx.stroke(path2d);
    }

    oCtx.restore();

    // Cache management
    if (spriteCacheRef.current.size > 256) {
      const firstKey = spriteCacheRef.current.keys().next().value;
      if (firstKey) spriteCacheRef.current.delete(firstKey);
    }

    spriteCacheRef.current.set(cacheKey, offscreen);
    return offscreen;
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Spritesheet Slicer & Pre-Configuration Modal State
  const [particleSliceModalConfig, setParticleSliceModalConfig] = useState<{
    isOpen: boolean;
    initialImage?: {
      url: string;
      name?: string;
      tileWidth?: number;
      tileHeight?: number;
      cols?: number;
      rows?: number;
      splitMode?: 'pixels' | 'columns';
    };
    sheetLabel?: string;
  }>({ isOpen: false });

  const handleParticleSliceConfirm = (res: SpritesheetSliceResult) => {
    updateActiveParticle(p => ({
      ...p,
      visuals: {
        ...p.visuals,
        shape: 'spritesheet',
        spritesheet: {
          id: p.visuals.spritesheet?.id || `spritesheet_${Date.now()}`,
          name: res.name || 'Particle Spritesheet',
          imageUrl: res.imageUrl,
          dataUrl: res.dataUrl || res.imageUrl,
          tileWidth: res.tileWidth,
          tileHeight: res.tileHeight,
          cols: res.cols,
          rows: res.rows,
          totalFrames: res.totalFrames,
          splitMode: res.splitMode
        }
      }
    }));
    showToast('Particle spritesheet configured and sliced successfully!');
  };

  // Keyboard listeners for spacebar pan toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Global event listener for smooth details graph keyframe node dragging
  useEffect(() => {
    if (draggedNodeIndex === null) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const svgEl = detailsSvgRef.current;
      if (!svgEl) return;

      const rect = svgEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const t = Math.max(0, Math.min(1, mouseX / rect.width));
      const rawVal = yToVal(selectedTrack, mouseY, rect.height);

      const currentNodes = getTrackNodesForData(activeParticleData.visuals, selectedTrack);
      const sorted = [...currentNodes].sort((a, b) => a.time - b.time);
      const updated = sorted.map((node, idx) => {
        if (idx !== draggedNodeIndex) return node;

        let finalT = node.time;
        // Keep internal keyframes constrained between their left and right neighbors
        if (idx > 0 && idx < sorted.length - 1) {
          const minTime = sorted[idx - 1].time + 0.01;
          const maxTime = sorted[idx + 1].time - 0.01;
          finalT = Math.max(minTime, Math.min(maxTime, t));
        }

        return {
          ...node,
          time: Number(finalT.toFixed(3)),
          value: selectedTrack === 'color' ? node.value : rawVal
        };
      });

      dragStateRef.current = { track: selectedTrack, nodes: updated };
      setDragTick(t => t + 1);
    };

    const handleGlobalMouseUp = () => {
      if (dragStateRef.current) {
        const { track, nodes } = dragStateRef.current;
        updateActiveParticle(prev => ({
          ...prev,
          visuals: {
            ...prev.visuals,
            trackNodes: {
              ...(prev.visuals.trackNodes || {}),
              [track]: nodes
            }
          }
        }));
      }
      dragStateRef.current = null;
      setDraggedNodeIndex(null);
      setDragTick(t => t + 1);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedNodeIndex, selectedTrack, activeParticleData.visuals]);

  // Update current particle file helper
  const updateActiveParticle = (updater: (prev: ParticleSystemData) => ParticleSystemData) => {
    onUpdateProject(p => {
      const currentFiles = p.fileSystem.particles || particleFiles;
      const currentFile = currentFiles.find(f => f.fileName === activeFile.fileName) || activeFile;
      const currentParticleData = currentFile?.particleData || DEFAULT_PARTICLE_SYSTEMS[0];

      const rawUpdated = updater(currentParticleData);
      let updatedData = { ...rawUpdated };

      if (currentParticleData.visuals && updatedData.visuals) {
        // --- Bidirectional Sync ---
        const oldVis = currentParticleData.visuals;
        const newVis = updatedData.visuals;
        
        // Ensure trackNodes is safely deep-cloned if we are going to modify it
        if (newVis.trackNodes && newVis.trackNodes === oldVis.trackNodes) {
           newVis.trackNodes = { ...oldVis.trackNodes };
        }
        
        const syncTrack = (trackName: string, startField: string, endField: string, midField: string) => {
           let initChanged = false;
           
           if (oldVis[startField] !== newVis[startField]) {
               initChanged = true;
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time) < 0.001 ? { ...n, value: newVis[startField] } : n);
               }
           }
           if (oldVis[endField] !== newVis[endField]) {
               initChanged = true;
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time - 1) < 0.001 ? { ...n, value: newVis[endField] } : n);
               }
           }
           if (oldVis[midField] !== newVis[midField] && newVis[midField] !== undefined) {
               initChanged = true;
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time - 0.5) < 0.001 ? { ...n, value: newVis[midField] } : n);
               }
           }
           
           // If the initialization fields weren't touched, check if the track nodes were touched and sync back
           if (!initChanged && newVis.trackNodes?.[trackName] && newVis.trackNodes[trackName] !== oldVis.trackNodes?.[trackName]) {
               const n0 = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time) < 0.001);
               if (n0) newVis[startField] = n0.value;
               const n1 = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time - 1) < 0.001);
               if (n1) newVis[endField] = n1.value;
               const nMid = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time - 0.5) < 0.001);
               if (nMid) {
                   newVis[midField] = nMid.value;
               } else if (newVis[midField] !== undefined) {
                   newVis[midField] = undefined; // If mid node was deleted, clear the mid field
               }
           }
        };

        syncTrack('color', 'startColor', 'endColor', 'midColor');
        syncTrack('size', 'startSize', 'endSize', 'midSize');
        syncTrack('alpha', 'startAlpha', 'endAlpha', 'midAlpha');
        syncTrack('emissive', 'emissiveStartStrength', 'emissiveEndStrength', 'emissiveMidStrength');
        syncTrack('rotation', 'startRotationDeg', 'endRotationDeg', 'midRotationDeg');
        syncTrack('motionBlur', 'startMotionBlur', 'endMotionBlur', 'midMotionBlur' as any);
        // --------------------------

        const oldStyle = currentParticleData.visuals.fxStyle as any;
        const newStyle = updatedData.visuals.fxStyle as any;
        if (oldStyle !== 'custom' && oldStyle === newStyle) {
          const visualsChanged = JSON.stringify(currentParticleData.visuals) !== JSON.stringify(updatedData.visuals);
          const kinematicsChanged = JSON.stringify(currentParticleData.kinematics) !== JSON.stringify(updatedData.kinematics);
          if (visualsChanged || kinematicsChanged) {
            updatedData.visuals = {
              ...updatedData.visuals,
              fxStyle: 'custom' as any
            };
          }
        }
      }

      const updatedFiles = currentFiles.map(f => {
        if (f.fileName === activeFile.fileName) {
          return {
            ...f,
            name: updatedData.name,
            updatedAt: new Date().toISOString(),
            particleData: updatedData
          };
        }
        return f;
      });
      return {
        ...p,
        fileSystem: {
          ...p.fileSystem,
          particles: updatedFiles
        }
      };
    });
  };

  const toValidHex = (hex: any): string => {
    if (!hex || typeof hex !== 'string') return '#ffa500';
    if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
      if (hex.length === 4) {
        return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      return hex;
    }
    const rgb = hexToRgb(hex);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };
  // Helper to parse hex colors to RGB
  


  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16) || 0;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, c)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const getTrackBounds = (track: string): { min: number; max: number } => {
    switch (track) {
      case 'size':
        return { min: 0, max: 80 };
      case 'alpha':
        return { min: 0.0, max: 1.0 };
      case 'emissive':
        return { min: 0, max: 100 };
      case 'rotation':
        return { min: 0, max: 360 };
      case 'speed':
        return { min: 0, max: 400 };
      case 'drag':
        return { min: 0.8, max: 1.05 };
      case 'motionBlur':
        return { min: 0, max: 10 };
      case 'gravity':
        return { min: -400, max: 600 };
      case 'wind':
        return { min: -100, max: 100 };
      case 'angle':
        return { min: 0, max: 360 };
      case 'trails':
        return { min: 0, max: 40 };
      case 'emitter_width':
        return { min: 2, max: 500 };
      case 'emitter_height':
        return { min: 2, max: 400 };
      case 'emitter_rotation':
        return { min: 0, max: 360 };
      case 'emission_rate':
        return { min: 0, max: 300 };
      case 'burst_count':
        return { min: 0, max: 150 };
      case 'burst_interval':
        return { min: 0.1, max: 8 };
      case 'color':
      default:
        return { min: 0, max: 1 };
    }
  };

  const getTrackInfo = (track: string) => {
    switch (track) {
      case 'emitter_width':
        return { label: 'Emitter Width', icon: '↔️', colorClass: 'text-amber-400', stroke: '#f59e0b', badge: 'Emitter', desc: 'Emitter width zone in pixels', unit: 'px' };
      case 'emitter_height':
        return { label: 'Emitter Height', icon: '↕️', colorClass: 'text-amber-400', stroke: '#f59e0b', badge: 'Emitter', desc: 'Emitter height zone in pixels', unit: 'px' };
      case 'emitter_rotation':
        return { label: 'Emitter Rotation', icon: '🔄', colorClass: 'text-emerald-400', stroke: '#10b981', badge: 'Emitter', desc: 'Emitter zone angle in degrees', unit: '°' };
      case 'emission_rate':
        return { label: 'Emission Rate', icon: '⚡', colorClass: 'text-cyan-400', stroke: '#06b6d4', badge: 'Rate', desc: 'Spawn rate in particles per second', unit: 'p/s' };
      case 'burst_count':
        return { label: 'Burst Count', icon: '💥', colorClass: 'text-orange-400', stroke: '#f97316', badge: 'Burst', desc: 'Particles spawned per burst', unit: 'p' };
      case 'burst_interval':
        return { label: 'Burst Interval', icon: '⏱️', colorClass: 'text-indigo-400', stroke: '#818cf8', badge: 'Burst', desc: 'Delay between periodic bursts', unit: 's' };
      case 'size':
        return { label: 'Size Curve', icon: '📏', colorClass: 'text-amber-400', stroke: '#f59e0b', badge: 'Visuals', desc: 'Particle diameter scale over lifetime', unit: 'px' };
      case 'color':
        return { label: 'Color Flow', icon: '🎨', colorClass: 'text-rose-400', stroke: '#f43f5e', badge: 'Visuals', desc: 'Particle palette gradient over lifetime', unit: '' };
      case 'alpha':
        return { label: 'Alpha Opacity', icon: '🏁', colorClass: 'text-sky-300', stroke: '#38bdf8', badge: 'Visuals', desc: 'Transparency & fading curve', unit: '' };
      case 'emissive':
        return { label: 'Emissive Bloom', icon: '💡', colorClass: 'text-purple-400', stroke: '#c084fc', badge: 'Visuals', desc: 'Glow bloom light emission intensity', unit: '%' };
      case 'rotation':
        return { label: 'Particle Spin', icon: '🔄', colorClass: 'text-emerald-400', stroke: '#10b981', badge: 'Visuals', desc: 'Particle angular spin over lifetime', unit: '°' };
      case 'speed':
        return { label: 'Launch Speed', icon: '🚀', colorClass: 'text-cyan-400', stroke: '#06b6d4', badge: 'Forces', desc: 'Speed modifier over lifetime', unit: 'px/s' };
      case 'drag':
        return { label: 'Fluid Drag', icon: '💧', colorClass: 'text-blue-400', stroke: '#60a5fa', badge: 'Forces', desc: 'Deceleration and air resistance', unit: '' };
      case 'motionBlur':
        return { label: 'Motion Blur', icon: '☄️', colorClass: 'text-pink-400', stroke: '#f472b6', badge: 'Visuals', desc: 'Velocity streak stretch', unit: 'px' };
      case 'gravity':
        return { label: 'Gravity Pull', icon: '🪐', colorClass: 'text-yellow-400', stroke: '#eab308', badge: 'Forces', desc: 'Gravitational acceleration', unit: 'px/s²' };
      case 'wind':
        return { label: 'Wind Drift', icon: '💨', colorClass: 'text-teal-400', stroke: '#14b8a6', badge: 'Forces', desc: 'Sideways wind drift velocity', unit: 'px/s' };
      case 'angle':
        return { label: 'Angle & Spread', icon: '📐', colorClass: 'text-violet-400', stroke: '#a78bfa', badge: 'Forces', desc: 'Launch direction angle', unit: '°' };
      case 'trails':
        return { label: 'Trails Ribbon', icon: '✨', colorClass: 'text-fuchsia-400', stroke: '#d946ef', badge: 'Visuals', desc: 'Trail history points', unit: 'pts' };
      default:
        return { label: track, icon: '📈', colorClass: 'text-amber-400', stroke: '#f59e0b', badge: 'Track', desc: 'Configurable property track', unit: '' };
    }
  };

  const valToY = (track: string, val: any, height: number): number => {
    const { min, max } = getTrackBounds(track);
    let numericVal = 0;
    if (track === 'color') {
      numericVal = 0.5;
    } else {
      numericVal = Number(val) || 0;
    }
    const ratio = (numericVal - min) / (max - min);
    const clamped = Math.max(0, Math.min(1, ratio));
    return height - (clamped * (height - 24) + 12);
  };

  const yToVal = (track: string, y: number, height: number): any => {
    const { min, max } = getTrackBounds(track);
    if (track === 'color') {
      return '#ffa500';
    }
    const ratio = (height - y - 12) / (height - 24);
    const clamped = Math.max(0, Math.min(1, ratio));
    const rawVal = min + clamped * (max - min);
    if (track === 'alpha' || track === 'drag' || track === 'burst_interval') {
      return Number(rawVal.toFixed(2));
    }
    return Math.round(rawVal);
  };

  const getSparklinePath = (track: string, width: number = 100, height: number = 100, margin: number = 6) => {
    const points: string[] = [];
    const steps = 40;
    const { min, max } = getTrackBounds(track);
    
    for (let i = 0; i <= steps; i++) {
      const T = i / steps;
      const val = evaluateTrackValue(T, track, activeParticleData.visuals);
      
      let physicalVal = 0;
      if (track === 'color') {
        physicalVal = 0.5;
      } else {
        physicalVal = Number(val) || 0;
      }
      
      const ratio = (physicalVal - min) / (max - min);
      const clamped = Math.max(0, Math.min(1, ratio));
      const y = height - (clamped * (height - margin * 2) + margin);
      const x = T * width;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  const getSelectedTrackConfig = () => {
    const v = activeParticleData.visuals as any;
    const track = selectedTrack;
    let curve = v.trackCurves?.[track] || 'linear';
    let animStyle: ParticleAnimStyle = v.trackAnimStyles?.[track] || 'one_shot';
    let repeats = v.trackRepeats?.[track] ?? 1;

    if (track === 'size') {
      curve = v.sizeCurve || curve;
      animStyle = v.sizeAnimStyle || animStyle;
    } else if (track === 'color') {
      curve = v.colorCurve || curve;
      animStyle = v.colorAnimStyle || animStyle;
    } else if (track === 'alpha') {
      curve = v.alphaCurve || curve;
      animStyle = v.alphaAnimStyle || animStyle;
    } else if (track === 'emissive') {
      curve = v.emissiveCurve || curve;
      animStyle = v.emissiveAnimStyle || animStyle;
    } else if (track === 'rotation') {
      curve = v.rotationCurve || curve;
      animStyle = v.rotationAnimStyle || animStyle;
    }

    return { curve, animStyle, repeats };
  };

  const updateSelectedTrackConfig = (field: 'curve' | 'animStyle' | 'repeats', value: any) => {
    updateActiveParticle(p => {
      const v = { ...p.visuals } as any;
      const track = selectedTrack;

      if (field === 'curve') {
        v.trackCurves = { ...(v.trackCurves || {}), [track]: value };
        if (track === 'size') v.sizeCurve = value;
        else if (track === 'color') v.colorCurve = value;
        else if (track === 'alpha') v.alphaCurve = value;
        else if (track === 'emissive') v.emissiveCurve = value;
        else if (track === 'rotation') v.rotationCurve = value;
      } else if (field === 'animStyle') {
        v.trackAnimStyles = { ...(v.trackAnimStyles || {}), [track]: value };
        if (track === 'size') v.sizeAnimStyle = value;
        else if (track === 'color') v.colorAnimStyle = value;
        else if (track === 'alpha') v.alphaAnimStyle = value;
        else if (track === 'emissive') v.emissiveAnimStyle = value;
        else if (track === 'rotation') v.rotationAnimStyle = value;
      } else if (field === 'repeats') {
        const repeats = { ...(v.trackRepeats || {}) };
        repeats[track] = Number(value);
        v.trackRepeats = repeats;
      }

      return { ...p, visuals: v };
    });
  };

  const handleAddNodeButton = () => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, selectedTrack);
    if (nodes.length >= 5) {
      showToast('Maximum 5 nodes allowed for track curves.');
      return;
    }
    const sorted = [...nodes].sort((a, b) => a.time - b.time);
    let maxGap = 0;
    let insertAfterIdx = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i+1].time - sorted[i].time;
      if (gap > maxGap) {
        maxGap = gap;
        insertAfterIdx = i;
      }
    }
    const newTime = sorted[insertAfterIdx].time + maxGap / 2;
    const bounds = getTrackBounds(selectedTrack);
    const midVal = selectedTrack === 'color' ? '#ffa500' : (bounds.min + bounds.max) / 2;

    const newNode = {
      time: Number(newTime.toFixed(3)),
      value: midVal
    };

    const updated = [...nodes, newNode].sort((a, b) => a.time - b.time);
    updateActiveParticle(p => ({
      ...p,
      visuals: {
        ...p.visuals,
        trackNodes: {
          ...(p.visuals.trackNodes || {}),
          [selectedTrack]: updated
        }
      }
    }));
    showToast(`Added node at ${(newTime * 100).toFixed(0)}%`);
  };

  const handleDeleteNodeLocal = (idxToDelete: number) => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, selectedTrack);
    if (idxToDelete === 0 || idxToDelete === nodes.length - 1) {
      showToast('Cannot delete Spawn or Death keyframe nodes.');
      return;
    }
    const updated = nodes.filter((_, idx) => idx !== idxToDelete);
    updateActiveParticle(p => ({
      ...p,
      visuals: {
        ...p.visuals,
        trackNodes: {
          ...(p.visuals.trackNodes || {}),
          [selectedTrack]: updated
        }
      }
    }));
    showToast('Deleted interpolation node.');
  };

  const getDynamicColorGradient = () => {
    const stops: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const T = i / steps;
      const col = evaluateTrackValue(T, 'color', activeParticleData.visuals);
      stops.push(`${col} ${(T * 100).toFixed(0)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  const getDynamicAlphaGradient = () => {
    const stops: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const T = i / steps;
      const alpha = evaluateTrackValue(T, 'alpha', activeParticleData.visuals);
      stops.push(`rgba(255, 255, 255, ${alpha}) ${(T * 100).toFixed(0)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  const getTrackNodesForData = (visuals: any, track: string): { time: number; value: any }[] => {
    if (dragStateRef.current && dragStateRef.current.track === track) {
      return dragStateRef.current.nodes;
    }

    if (visuals?.trackNodes?.[track]) {
      return visuals.trackNodes[track];
    }

    const em = activeParticleData.emitter;
    const k = activeParticleData.kinematics;

    if (track === 'emitter_width') {
      const w = em.width ?? 32;
      return [{ time: 0, value: w }, { time: 1, value: w }];
    }
    if (track === 'emitter_height') {
      const h = em.height ?? 32;
      return [{ time: 0, value: h }, { time: 1, value: h }];
    }
    if (track === 'emitter_rotation') {
      const r = em.rotationDeg ?? 0;
      return [{ time: 0, value: r }, { time: 1, value: r }];
    }
    if (track === 'emission_rate') {
      const minR = em.emissionRateMin ?? em.emissionRate ?? 20;
      const maxR = em.emissionRateMax ?? em.emissionRate ?? 20;
      return [{ time: 0, value: minR }, { time: 1, value: maxR }];
    }
    if (track === 'burst_count') {
      const minB = em.burstCountMin ?? em.burstCount ?? 20;
      const maxB = em.burstCountMax ?? em.burstCount ?? 20;
      return [{ time: 0, value: minB }, { time: 1, value: maxB }];
    }
    if (track === 'burst_interval') {
      const minI = em.burstIntervalMin ?? em.burstInterval ?? 1.0;
      const maxI = em.burstIntervalMax ?? em.burstInterval ?? 1.0;
      return [{ time: 0, value: minI }, { time: 1, value: maxI }];
    }

    if (track === 'size') {
      const start = visuals?.startSize ?? 8;
      const end = visuals?.endSize ?? 2;
      if (visuals?.midSize !== undefined && visuals.midSize !== start) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.midSize }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'color') {
      const start = visuals?.startColor ?? '#ffa500';
      const end = visuals?.endColor ?? '#ff0000';
      if (visuals?.midColor) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.midColor }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'alpha') {
      const start = visuals?.startAlpha ?? 1.0;
      const end = visuals?.endAlpha ?? 0.0;
      if (visuals?.midAlpha !== undefined) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.midAlpha }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'emissive') {
      const start = visuals?.emissiveStartStrength ?? 35;
      const end = visuals?.emissiveEndStrength ?? 0;
      if (visuals?.emissiveMidStrength !== undefined) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.emissiveMidStrength }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'rotation') {
      const start = visuals?.startRotationDeg ?? 0;
      const end = visuals?.endRotationDeg ?? 360;
      if (visuals?.midRotationDeg !== undefined) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.midRotationDeg }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'speed') {
      const minS = k?.minSpeed ?? 60;
      const maxS = k?.maxSpeed ?? 140;
      return [{ time: 0, value: minS }, { time: 1, value: maxS }];
    }
    if (track === 'drag') {
      const d = k?.drag ?? 0.98;
      return [{ time: 0, value: d }, { time: 1, value: d }];
    }
    if (track === 'motionBlur') {
      const start = visuals?.startMotionBlur ?? 0;
      const end = visuals?.endMotionBlur ?? 0;
      if (visuals?.midMotionBlur !== undefined) {
        return [{ time: 0, value: start }, { time: 0.5, value: visuals.midMotionBlur }, { time: 1, value: end }];
      }
      return [{ time: 0, value: start }, { time: 1, value: end }];
    }
    if (track === 'gravity') {
      const g = k?.gravityY ?? 180;
      return [{ time: 0, value: g }, { time: 1, value: g }];
    }
    if (track === 'wind') {
      const w = k?.windForce ?? 30;
      return [{ time: 0, value: w }, { time: 1, value: w }];
    }
    if (track === 'angle') {
      const a = k?.angleDeg ?? 270;
      return [{ time: 0, value: a }, { time: 1, value: a }];
    }
    if (track === 'trails') {
      const tl = visuals?.trailLength ?? 10;
      return [{ time: 0, value: tl }, { time: 1, value: tl }];
    }
    return [{ time: 0, value: 0 }, { time: 1, value: 1 }];
  };
  
  const evaluateTrackValue = (
    progress: number,
    track: string,
    visuals: any
  ): any => {
    let animStyle: ParticleAnimStyle = visuals.trackAnimStyles?.[track] || 'one_shot';
    let repeatCount = visuals.trackRepeats?.[track] ?? 1;
    let curve: ParticleCurveMode = visuals.trackCurves?.[track] || 'linear';

    if (track === 'size') {
      animStyle = visuals.sizeAnimStyle || animStyle;
      repeatCount = visuals.trackRepeats?.size ?? visuals.sizeLoops ?? repeatCount;
      curve = visuals.sizeCurve || curve;
    } else if (track === 'color') {
      animStyle = visuals.colorAnimStyle || animStyle;
      repeatCount = visuals.trackRepeats?.color ?? visuals.colorLoops ?? repeatCount;
      curve = visuals.colorCurve || curve;
    } else if (track === 'alpha') {
      animStyle = visuals.alphaAnimStyle || animStyle;
      repeatCount = visuals.trackRepeats?.alpha ?? visuals.alphaLoops ?? repeatCount;
      curve = visuals.alphaCurve || curve;
    } else if (track === 'emissive') {
      animStyle = visuals.emissiveAnimStyle || animStyle;
      repeatCount = visuals.trackRepeats?.emissive ?? visuals.emissiveLoops ?? repeatCount;
      curve = visuals.emissiveCurve || curve;
    } else if (track === 'rotation') {
      animStyle = visuals.rotationAnimStyle || animStyle;
      repeatCount = visuals.trackRepeats?.rotation ?? visuals.rotationLoops ?? repeatCount;
      curve = visuals.rotationCurve || curve;
    }

    let localProgress = progress;
    if (animStyle === 'repeat') {
      const duration = 1 / repeatCount;
      localProgress = (progress % duration) * repeatCount;
    } else if (animStyle === 'oscillate') {
      const duration = 1 / repeatCount;
      const pairProgress = (progress % duration) * repeatCount;
      if (pairProgress < 0.5) {
        localProgress = pairProgress * 2;
      } else {
        localProgress = 2 - pairProgress * 2;
      }
    }
    localProgress = Math.max(0, Math.min(1, localProgress));

    const nodes = getTrackNodesForData(visuals, track);
    const sorted = [...nodes].sort((a, b) => a.time - b.time);

    let nodeA = sorted[0];
    let nodeB = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (localProgress >= sorted[i].time && localProgress <= sorted[i + 1].time) {
        nodeA = sorted[i];
        nodeB = sorted[i + 1];
        break;
      }
    }

    let segmentT = 0;
    const timeDelta = nodeB.time - nodeA.time;
    if (timeDelta > 0.0001) {
      segmentT = (localProgress - nodeA.time) / timeDelta;
    }
    segmentT = Math.max(0, Math.min(1, segmentT));

    let easedT = segmentT;
    switch (curve) {
      case 'balanced':
        easedT = segmentT * segmentT * (3 - 2 * segmentT);
        break;
      case 'bell_arch':
      case 'bell':
        easedT = Math.sin(segmentT * Math.PI);
        break;
      case 'burst_decay':
      case 'quick_in_long_out':
        easedT = 1 - Math.pow(1 - segmentT, 2.2);
        break;
      case 'burst_shrink':
      case 'long_in_quick_out':
        easedT = Math.pow(segmentT, 2.2);
        break;
      case 'constant':
        easedT = 0;
        break;
      case 'linear':
      default:
        easedT = segmentT;
        break;
    }

    if (track === 'color') {
      const rgbA = hexToRgb(nodeA.value as string);
      const rgbB = hexToRgb(nodeB.value as string);
      const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * easedT);
      const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * easedT);
      const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * easedT);
      return rgbToHex(r, g, b);
    } else {
      const valA = Number(nodeA.value);
      const valB = Number(nodeB.value);
      if (curve === 'constant') {
        return valA;
      }
      return valA + (valB - valA) * easedT;
    }
  };

  // Helper to map particle normalized progress to looping or oscillating curves over the lifetime
  const getAnimProgress = (progress: number, animStyle?: ParticleAnimStyle): number => {
    if (!animStyle || animStyle === 'one_shot') {
      return progress;
    }
    if (animStyle === 'repeat') {
      // 3 repetitions over lifetime
      return (progress * 3) % 1.0;
    }
    if (animStyle === 'oscillate') {
      // 3 complete cycles (0 -> 1 -> 0) over lifetime
      const t = progress * 6; // 3 cycles * 2 (up/down)
      return 1 - Math.abs((t % 2) - 1);
    }
    return progress;
  };

  // Generic 3-Point Lifecycle Evaluator for Size & Alpha across Start -> Mid -> End
  const evaluate3PointValue = (
    progress: number,
    vStart: number,
    vEnd: number,
    vMid?: number,
    curve: ParticleCurveMode = 'balanced'
  ): number => {
    const mid = vMid !== undefined ? vMid : (vStart + vEnd) / 2;

    switch (curve) {
      case 'linear':
      case 'constant':
      case 'grow':
      case 'shrink': {
        if (progress <= 0.5) {
          const localT = progress * 2;
          return vStart + (mid - vStart) * localT;
        } else {
          const localT = (progress - 0.5) * 2;
          return mid + (vEnd - mid) * localT;
        }
      }
      case 'quick_in_long_out': {
        // Short Ease In (0 -> 0.25), Long Fade Out (0.25 -> 1.0)
        if (progress <= 0.25) {
          const localT = progress / 0.25;
          const easeT = Math.sin((localT * Math.PI) / 2);
          return vStart + (mid - vStart) * easeT;
        } else {
          const localT = (progress - 0.25) / 0.75;
          const easeT = Math.pow(1 - localT, 1.8);
          return vEnd + (mid - vEnd) * easeT;
        }
      }
      case 'long_in_quick_out': {
        // Long Fade In (0 -> 0.75), Short Ease Out (0.75 -> 1.0)
        if (progress <= 0.75) {
          const localT = progress / 0.75;
          const easeT = Math.pow(localT, 1.8);
          return vStart + (mid - vStart) * easeT;
        } else {
          const localT = (progress - 0.75) / 0.25;
          const easeT = Math.sin((localT * Math.PI) / 2);
          return mid + (vEnd - mid) * easeT;
        }
      }
      case 'bell_arch':
      case 'bell': {
        const archFactor = Math.sin(progress * Math.PI);
        const effectiveMid = vMid !== undefined ? vMid : Math.max(vStart, vEnd) * 1.5;
        if (progress <= 0.5) {
          return vStart + (effectiveMid - vStart) * archFactor;
        } else {
          return vEnd + (effectiveMid - vEnd) * archFactor;
        }
      }
      case 'burst_decay':
      case 'burst_shrink': {
        const decay = Math.pow(1 - progress, 2.2);
        const peak = Math.max(vStart, mid);
        return vEnd + (peak - vEnd) * decay;
      }
      case 'balanced':
      default: {
        if (progress <= 0.5) {
          const localT = progress * 2;
          const easeT = localT * localT * (3 - 2 * localT);
          return vStart + (mid - vStart) * easeT;
        } else {
          const localT = (progress - 0.5) * 2;
          const easeT = localT * localT * (3 - 2 * localT);
          return mid + (vEnd - mid) * easeT;
        }
      }
    }
  };

  // Interpolate RGB color & alpha over progress [0..1]
  const evaluateColorAlpha = (
    progress: number,
    startColor: string,
    startAlpha: number,
    midColor: string | undefined,
    midAlpha: number | undefined,
    endColor: string,
    endAlpha: number,
    alphaCurve?: ParticleCurveMode
  ) => {
    const visuals = activeParticleData?.visuals || { startColor, startAlpha, midColor, midAlpha, endColor, endAlpha, alphaCurve };
    const colHex = evaluateTrackValue(progress, 'color', visuals);
    const alphaVal = evaluateTrackValue(progress, 'alpha', visuals);
    const rgb = hexToRgb(colHex);
    return { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaVal})`, alpha: alphaVal, r: rgb.r, g: rgb.g, b: rgb.b };
  };

  // Evaluate size over progress with 3-stage lifecycle and curve support
  const evaluateSize = (
    progress: number,
    startSize: number,
    endSize: number,
    midSize?: number,
    curve?: ParticleSizeCurve
  ): number => {
    const visuals = activeParticleData?.visuals || { startSize, endSize, midSize, sizeCurve: curve };
    return Math.max(0.1, evaluateTrackValue(progress, 'size', visuals));
  };

  const spawnParticles = (count: number, customOrigin?: { x: number; y: number }) => {
    const origin = customOrigin || emitterPos;
    engineRef.current.spawnParticles(count, activeParticleData, origin);
  };

  // Main 60fps GPU simulation render loop
  useEffect(() => {
    let animId: number;

    const renderLoop = (now: number) => {
      // First frame initialization or reset calibration
      if (isFirstFrameRef.current || lastFrameTimeRef.current === 0 || now < lastFrameTimeRef.current) {
        lastFrameTimeRef.current = now;
        lastEmitTimeRef.current = now;
        lastBurstTimeRef.current = now;
        emitAccumulatorRef.current = 0;
        isFirstFrameRef.current = false;
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      // Calculate FPS
      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 500) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current)));
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }
      ctx.imageSmoothingEnabled = false;

      const width = canvas.width;
      const height = canvas.height;
      const floorY = height - 50;

      // Handle continuous stream emission with accumulator to avoid initial burst catch-up
      if (isPlaying && activeParticleData.emitter.isContinuous) {
        const rateMin = activeParticleData.emitter.emissionRateMin ?? activeParticleData.emitter.emissionRate ?? 20;
        const rateMax = activeParticleData.emitter.emissionRateMax ?? activeParticleData.emitter.emissionRate ?? 20;
        const currentRate = rateMin + Math.random() * (rateMax - rateMin);
        
        if (currentRate > 0) {
          emitAccumulatorRef.current += dt * currentRate;
          const particlesToSpawn = Math.floor(emitAccumulatorRef.current);
          if (particlesToSpawn > 0) {
            // Cap per-frame spawn count so tab backgrounding or lag spike doesn't emit massive bursts
            const maxPerFrame = Math.max(1, Math.ceil(currentRate * 0.1));
            const count = Math.min(particlesToSpawn, maxPerFrame);
            spawnParticles(count);
            emitAccumulatorRef.current = Math.max(0, emitAccumulatorRef.current - particlesToSpawn);
          }
        }
      } else {
        emitAccumulatorRef.current = 0;
      }

      // Handle periodic bursts
      // Only burst periodically if explicitly enabled, or if not continuous and has a positive burst interval and count
      const burstEnabled = activeParticleData.emitter.burstEnabled === true ||
        (activeParticleData.emitter.burstEnabled === undefined &&
          (activeParticleData.emitter.burstInterval ?? 0) > 0 &&
          (activeParticleData.emitter.burstCount ?? 0) > 0 &&
          !activeParticleData.emitter.isContinuous);

      if (isPlaying && burstEnabled) {
        const intervalMin = activeParticleData.emitter.burstIntervalMin ?? activeParticleData.emitter.burstInterval ?? 1.0;
        const intervalMax = activeParticleData.emitter.burstIntervalMax ?? activeParticleData.emitter.burstInterval ?? 1.0;
        
        if (intervalMin > 0 || intervalMax > 0) {
          if (nextBurstIntervalRef.current === null) {
            nextBurstIntervalRef.current = Math.max(0.05, intervalMin + Math.random() * Math.max(0, intervalMax - intervalMin));
          }

          if (now - lastBurstTimeRef.current >= nextBurstIntervalRef.current * 1000) {
            const countMin = activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 30;
            const countMax = activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 30;
            const count = Math.floor(countMin + Math.random() * Math.max(0, countMax - countMin));
            if (count > 0) {
              spawnParticles(count);
            }
            lastBurstTimeRef.current = now;
            nextBurstIntervalRef.current = Math.max(0.05, intervalMin + Math.random() * Math.max(0, intervalMax - intervalMin));
          }
        }
      }

            const globalWind = simulatedBiomeWindEnabled ? simulatedBiomeWind : 0;
      
      let edx = 0;
      let edy = 0;
      if (lastEmitterPosRef.current) {
        edx = emitterPos.x - lastEmitterPosRef.current.x;
        edy = emitterPos.y - lastEmitterPosRef.current.y;
      }
      lastEmitterPosRef.current = { x: emitterPos.x, y: emitterPos.y };
      
      engineRef.current.update(dt, activeParticleData.physics, floorY, globalWind, {
        x: emitterPos.x,
        y: emitterPos.y,
        dx: edx,
        dy: edy
      });
      setActiveParticleCount(engineRef.current.particles.length);

      // Render environment
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      const gridSize = 64;
      
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      
      const scaledWidth = width / zoom;
      const scaledHeight = height / zoom;
      const startX = -panOffset.x / zoom;
      const startY = -panOffset.y / zoom;
      
      ctx.beginPath();
      for (let x = Math.floor(startX / gridSize) * gridSize; x < startX + scaledWidth; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + scaledHeight);
      }
      for (let y = Math.floor(startY / gridSize) * gridSize; y < startY + scaledHeight; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + scaledWidth, y);
      }
      ctx.stroke();
      
      // Draw emitter handle
      if (isPlaying) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(emitterPos.x, emitterPos.y, 4 / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.arc(emitterPos.x, emitterPos.y, 12 / zoom, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (activeParticleData.physics.collideWithMapSolids) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, floorY, width, height - floorY);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(width, floorY);
        ctx.stroke();
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('SOLID FLOOR GEOMETRY (COLLISION PLANE)', 16, floorY + 20);
      }

      engineRef.current.render(ctx, panOffset, zoom, activeParticleData, showCollisionWireframe, emitterPos);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeParticleData, bgTheme, floorCollisionEnabled, emitterPos, isDraggingEmitter, zoom, panOffset, showCollisionWireframe, activeTab]);

  // Screen mouse coordinates to transformed World coordinates converter
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mouseX: 0, mouseY: 0, worldX: 0, worldY: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;

    return { mouseX, mouseY, worldX, worldY };
  };

  // Mouse wheel zoom handler centered at mouse pointer position
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const delta = e.deltaY < 0 ? 1.12 : 0.88;
    const nextZoom = Math.min(4.0, Math.max(0.25, Math.round(zoom * delta * 100) / 100));
    if (nextZoom === zoom) return;

    const zoomRatio = nextZoom / zoom;

    // Shift pan offset to keep mouse position fixed in world space during zoom
    const nextPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
    const nextPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

    setZoom(nextZoom);
    setPanOffset({ x: nextPanX, y: nextPanY });
  };

  // Mouse Down handler (Emitter dragging, panning, or burst)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mouseX, mouseY, worldX, worldY } = getCanvasCoords(e);

    // Right-click (2), Middle-click (1), Pan Tool active OR Space key pressed -> Pan viewport
    if (e.button === 2 || e.button === 1 || isSpacePressed || canvasTool === 'pan') {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Check if click is close to emitter center anchor in world space
    const distToEmitter = Math.hypot(worldX - emitterPos.x, worldY - emitterPos.y);
    if (distToEmitter < 24 / zoom) {
      setIsDraggingEmitter(true);
    } else {
      // Click-to-burst at clicked world coordinates
      const countMin = activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 20;
      const countMax = activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 20;
      const countToSpawn = Math.round(countMin + Math.random() * (countMax - countMin));
      spawnParticles(countToSpawn || 25, { x: worldX, y: worldY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isDraggingEmitter) {
      const { worldX, worldY } = getCanvasCoords(e);
      setEmitterPos({ x: Math.round(worldX), y: Math.round(worldY) });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingEmitter(false);
    setIsPanning(false);
  };

  // Create new particle file modal confirmation
  const handleConfirmCreateNew = () => {
    if (!newSystemName.trim()) return;
    const template = DEFAULT_PARTICLE_SYSTEMS[selectedTemplateIndex] || DEFAULT_PARTICLE_SYSTEMS[0];
    const { project: updatedProj, newFile } = createNewParticleInProject(
      project,
      newSystemName.trim(),
      template
    );
    onUpdateProject(() => updatedProj);
    setIsCreateModalOpen(false);
    setNewSystemName('New Particle Burst');
    engineRef.current.particles = [];
    showToast(`Created particle file: ${newFile.fileName}`);
  };

  const handleDuplicate = () => {
    const clonedData: ParticleSystemData = {
      ...JSON.parse(JSON.stringify(activeParticleData)),
      id: `particles_${Date.now()}`,
      name: `${activeParticleData.name} (Copy)`
    };
    const { project: updatedProj, newFile } = createNewParticleInProject(
      project,
      `${activeParticleData.name} Copy`,
      clonedData
    );
    onUpdateProject(() => updatedProj);
    showToast(`Duplicated into ${newFile.fileName}`);
  };

  const handleDelete = () => {
    if (particleFiles.length <= 1) {
      showToast('Cannot delete the last particle system file.');
      return;
    }
    const remaining = particleFiles.filter(f => f.fileName !== activeFile.fileName);
    onUpdateProject(p => ({
      ...p,
      activeFiles: {
        ...p.activeFiles,
        particleFileName: remaining[0].fileName
      },
      fileSystem: {
        ...p.fileSystem,
        particles: remaining
      }
    }));
    showToast(`Deleted ${activeFile.fileName}`);
  };

  const handleLoadPreset = (preset: ParticleSystemData) => {
    const loadedData: ParticleSystemData = {
      ...JSON.parse(JSON.stringify(preset)),
      id: activeParticleData.id,
      name: activeParticleData.name
    };
    updateActiveParticle(() => loadedData);
    setAddedProps(getPropsFromParticleData(loadedData));
    if (engineRef.current) {
      engineRef.current.clear();
    }
    showToast(`Loaded preset parameters: ${preset.name}`);
  };

  const handleSaveSystemPreset = () => {
    const name = prompt('Enter a name for your custom Particle System Preset:');
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    if (customSystemPresets.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(`A preset named "${cleanName}" already exists.`);
      return;
    }

    const newPreset: ParticleSystemData = {
      ...JSON.parse(JSON.stringify(activeParticleData)),
      name: cleanName,
      id: `custom_preset_${Date.now()}`
    };

    const updated = [...customSystemPresets, newPreset];
    setCustomSystemPresets(updated);
    localStorage.setItem('mason_custom_particle_system_presets', JSON.stringify(updated));
    showToast(`Saved custom preset: ${cleanName}`);
  };

  const handleDeleteSystemPreset = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom preset?')) return;
    const updated = customSystemPresets.filter(p => p.id !== idToDelete);
    setCustomSystemPresets(updated);
    localStorage.setItem('mason_custom_particle_system_presets', JSON.stringify(updated));
    showToast('Deleted custom preset.');
  };

  const handleLoadSample = (type: 'fire' | 'orb' | 'spark') => {
    const tw = 64;
    const th = 64;
    const cols = 8;
    const rows = 1;
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
        const x = i * tw;
        const y = 0;
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(x, y, tw, th);

        const cx = x + tw / 2;
        const cy = y + th / 2;
        const t = i / (total - 1);

        if (type === 'fire') {
          const flameH = (1 - t) * 20 + 4;
          const flameW = (1 - t) * 12 + 2;
          const driftY = t * 14;
          
          const grad = ctx.createRadialGradient(cx, cy - driftY, 2, cx, cy - driftY, flameW * 1.5);
          grad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
          grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy - driftY, flameW * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(cx, cy - driftY, flameW * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'orb') {
          const radius = 16 + Math.sin(t * Math.PI * 2) * 4;
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t * Math.PI * 2);

          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 3;
          for (let s = 0; s < 4; s++) {
            ctx.beginPath();
            ctx.moveTo(-radius - 6, 0);
            ctx.lineTo(radius + 6, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 4);
          }

          const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          grad.addColorStop(0.3, 'rgba(192, 132, 252, 0.8)');
          grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const size = Math.sin(t * Math.PI) * 22;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
          ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const sampleDataUrl = cvs.toDataURL('image/png');
      updateActiveParticle(p => ({
        ...p,
        visuals: {
          ...p.visuals,
          shape: 'spritesheet',
          spritesheet: {
            id: `procedural_${type}_${Date.now()}`,
            name: `${type.toUpperCase()} Animation`,
            imageUrl: sampleDataUrl,
            dataUrl: sampleDataUrl,
            tileWidth: tw,
            tileHeight: th,
            cols,
            rows,
            totalFrames: total,
            splitMode: 'columns'
          }
        }
      }));
      showToast(`Loaded procedural ${type} spritesheet sample!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-200 select-none overflow-hidden relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 right-6 z-50 px-4 py-2 bg-amber-600 text-white rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* NEW PARTICLE SYSTEM CREATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles size={18} />
                <span>Create New Particle System File (.particle)</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Particle System Name</label>
                <input
                  type="text"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  placeholder="e.g., Poison Smoke, Frost Nova, Holy Aura"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Starter Template Preset</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {DEFAULT_PARTICLE_SYSTEMS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        selectedTemplateIndex === idx 
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                      }`}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate text-white">{preset.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{preset.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateNew}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Plus size={14} />
                <span>Create Particle File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subfolder Header matching all other modules */}
      <FileSubfolderHeader
        subfolderName="particles"
        extension=".particle"
        accentColor={theme.moduleColors.particles || 'amber'}
        files={particleFiles.map(f => ({
          id: f.id,
          name: f.particleData?.name || f.name || f.fileName,
          fileName: f.fileName,
          updatedAt: f.updatedAt
        }))}
        activeFileName={activeFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: {
              ...p.activeFiles,
              particleFileName: fName
            }
          }));
          engineRef.current.particles = [];
        }}
        onNewFile={(name) => {
          const template = DEFAULT_PARTICLE_SYSTEMS[0];
          const { project: updatedProj, newFile } = createNewParticleInProject(
            project,
            name,
            template
          );
          onUpdateProject(() => updatedProj);
          engineRef.current.particles = [];
          showToast(`Created particle file: ${newFile.fileName}`);
        }}
        onDuplicateFile={() => {
          handleDuplicate();
        }}
        onSaveFile={() => {
          onUpdateProject(p => ({ ...p }));
          showToast(`Saved ${activeFile.fileName}`);
        }}
        onExportFile={() => {
          exportParticleFile(activeFile);
        }}
        onDeleteFile={() => {
          handleDelete();
        }}
        onRenameFile={(_, newName) => {
          updateActiveParticle(prev => ({
            ...prev,
            name: newName
          }));
          showToast(`Renamed particle system to ${newName}`);
        }}
        onBackToDashboard={onBackToDashboard}
        centerContent={
          <div className="flex items-center gap-2 max-w-full truncate">
            <span className="text-base">{activeParticleData.icon || '✨'}</span>
            <input
              type="text"
              value={activeParticleData.name}
              onChange={(e) => {
                const val = e.target.value;
                updateActiveParticle(prev => ({ ...prev, name: val }));
              }}
              className="bg-transparent text-xs font-bold text-white border-b border-dashed border-neutral-700 hover:border-amber-500 focus:border-amber-500 focus:outline-none transition py-0.5 max-w-[160px] sm:max-w-[240px] text-center"
              title="Click to edit particle system name"
            />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold">
              {activeParticleData.category || 'ambient'}
            </span>
          </div>
        }
      />

      {/* Main Studio Body: Canvas Viewport on Left, Inspector on Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Live Interactive Canvas Area */}
        <div className="flex-1 flex flex-col bg-neutral-950 border-r border-neutral-800 overflow-hidden relative">
          {/* Canvas Top Toolbar */}
          <div className="h-10 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isPlaying ? 'bg-amber-600 text-white shadow' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const countMin = activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 20;
                  const countMax = activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 20;
                  const countToSpawn = Math.round(countMin + Math.random() * (countMax - countMin));
                  spawnParticles(countToSpawn || 30);
                }}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Zap size={13} />
                <span>Burst Trigger</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  engineRef.current.particles = [];
                }}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                title="Clear all active particles"
              >
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
            </div>

            {/* Scenery Selector & Performance / Wireframe / Biome Wind Controls */}
            <div className="flex items-center gap-2.5">
              {/* Simulated Biome Wind Test Bar */}
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none" title="Enable or disable simulated Biome Wind force in editor preview">
                  <input
                    type="checkbox"
                    checked={simulatedBiomeWindEnabled}
                    onChange={(e) => setSimulatedBiomeWindEnabled(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <Wind size={13} className={simulatedBiomeWindEnabled ? 'text-sky-400' : 'text-neutral-500'} />
                  <span className={simulatedBiomeWindEnabled ? 'text-neutral-200' : 'text-neutral-500'}>
                    Simulated Biome Wind:
                  </span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  disabled={!simulatedBiomeWindEnabled}
                  value={simulatedBiomeWind}
                  onChange={(e) => setSimulatedBiomeWind(Number(e.target.value))}
                  className={`w-16 accent-sky-500 cursor-pointer ${!simulatedBiomeWindEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title="Simulate active Biome Environmental Wind speed (px/s)"
                />
                <span className={`font-mono text-[10px] w-14 text-right font-bold ${simulatedBiomeWindEnabled ? 'text-sky-400' : 'text-neutral-500'}`}>
                  {!simulatedBiomeWindEnabled
                    ? '🛑 OFF'
                    : simulatedBiomeWind > 0
                      ? `➡️ +${simulatedBiomeWind}`
                      : simulatedBiomeWind < 0
                        ? `⬅️ ${simulatedBiomeWind}`
                        : '🍃 0'}
                </span>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCollisionWireframe}
                  onChange={(e) => setShowCollisionWireframe(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[11px]">Wireframe Hull</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={floorCollisionEnabled}
                  onChange={(e) => setFloorCollisionEnabled(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[11px]">Solid Floor</span>
              </label>

              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400 font-mono font-bold hidden sm:inline-block">
                ⚡ {((activeParticleData.visuals.renderResolutionScale ?? activeParticleData.visuals.metaballResolutionScale ?? 1.0) * 100).toFixed(0)}% Buffer
              </span>

              <div className="flex items-center gap-1 bg-neutral-950 rounded-lg p-0.5 border border-neutral-800">
                {[
                  { id: 'grid', label: 'Grid' },
                  { id: 'dungeon', label: 'Dungeon' },
                  { id: 'magma', label: 'Magma' },
                  { id: 'void', label: 'Void' },
                  { id: 'cave', label: 'Grotto' },
                ].map(th => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setBgTheme(th.id as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      bgTheme === th.id ? 'bg-neutral-800 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Simulation Canvas with Zoom & Pan */}
          <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-neutral-950">
            <canvas
              ref={canvasRef}
              width={640}
              height={440}
              onWheel={handleCanvasWheel}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-full h-full max-w-[720px] max-h-[500px] rounded-2xl border border-neutral-800/80 shadow-2xl object-contain ${
                isPanning || canvasTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
              }`}
            />

            {/* Floating Viewport Zoom & Pan Controls Bar */}
            <ViewportHUD
              scale={zoom}
              onZoomIn={() => setZoom(z => Math.min(4.0, parseFloat((z + 0.15).toFixed(2))))}
              onZoomOut={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.15).toFixed(2))))}
              onResetZoom={() => {
                setZoom(1.0);
                setPanOffset({ x: 0, y: 0 });
              }}
              onCenterContent={() => {
                setEmitterPos({ x: 320, y: 220 });
                setPanOffset({ x: 0, y: 0 });
              }}
              position="top-right"
              themeColor="amber"
              showHelperHint={true}
              leadingSlot={
                <button
                  type="button"
                  onClick={() => setCanvasTool(t => t === 'pan' ? 'select' : 'pan')}
                  className={`p-1.5 rounded-lg border transition ${
                    canvasTool === 'pan'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Pan Tool (or Right-click / Middle-click / Space drag)"
                >
                  <Hand size={14} />
                </button>
              }
            />

            {/* Real-time Telemetry Overlay */}
            <div className="absolute bottom-6 left-6 pointer-events-none flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-400 z-20">
              <div className="flex items-center gap-1">
                <Gauge size={13} className="text-amber-400" />
                <span className="text-white font-bold">{fps}</span> FPS
              </div>
              <div className="w-px h-3 bg-neutral-800" />
              <div className="flex items-center gap-1">
                <Sparkles size={13} className="text-cyan-400" />
                <span className="text-white font-bold">{activeParticleCount}</span> / {activeParticleData.emitter.maxParticles || 300}
              </div>
              <div className="w-px h-3 bg-neutral-800" />
              <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                ⚡ Baked Raster Sprites
              </div>
              <div className="w-px h-3 bg-neutral-800" />
              <div className="text-[10px] text-neutral-500 hidden xl:block">
                Wheel zoom • Right-click / Space drag pan • Drag 🎯 emitter
              </div>
            </div>
          </div>
        </div>

        {/* Divider Resizer Bar */}
        <div 
          className={`hidden lg:flex w-[3px] bg-neutral-800 hover:bg-amber-500 cursor-col-resize select-none shrink-0 transition-all duration-150 relative items-center justify-center z-30 ${isResizing ? 'bg-amber-500 w-[5px]' : ''}`}
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize Inspector"
        >
          {/* Subtle knurled pattern or vertical line inside the drag handle */}
          <div className="absolute h-8 w-[1px] bg-neutral-600 group-hover:bg-amber-200 pointer-events-none rounded" />
          {/* Extended mouse trigger zone */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
        </div>

        {/* Right: Multi-tab Inspector Panels */}
        <div 
          className="w-full lg:w-auto bg-neutral-900 flex flex-col border-l border-neutral-800 overflow-hidden shrink-0"
          style={{
            width: windowWidth >= 1024 ? `${inspectorWidth}px` : undefined
          }}
        >
          {/* Tabs Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 p-1">
            {[
              { id: 'initialize', label: 'Initialize', icon: Flame },
              { id: 'animation', label: 'Animation', icon: Activity },
              { id: 'spritesheets', label: 'Spritesheets', icon: Upload },
              { id: 'presets', label: 'Presets', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition ${
                    active 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inspector Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* System Info Header Card */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeParticleData.icon || '✨'}
                    onChange={(e) => updateActiveParticle(p => ({ ...p, icon: e.target.value }))}
                    className="w-8 h-8 text-center text-lg bg-neutral-900 border border-neutral-700 rounded-lg"
                  />
                  <input
                    type="text"
                    value={activeParticleData.name}
                    onChange={(e) => updateActiveParticle(p => ({ ...p, name: e.target.value }))}
                    className="text-sm font-bold bg-transparent border-b border-transparent focus:border-amber-500 text-white focus:outline-none"
                    placeholder="Particle System Name"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeParticleData.id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-amber-300 rounded-lg flex items-center gap-1 transition border border-neutral-700"
                  title="Copy Particle System ID"
                >
                  {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedId ? 'Copied ID' : 'Copy ID'}</span>
                </button>
              </div>

              <textarea
                value={activeParticleData.description || ''}
                onChange={(e) => updateActiveParticle(p => ({ ...p, description: e.target.value }))}
                className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-300 placeholder-neutral-500 resize-none h-12 focus:outline-none focus:border-amber-500"
                placeholder="Description / Usage notes..."
              />
            </div>

            {/* TAB 1: INITIALIZE (EMITTER + BASIC GEOMETRY + OPTIONAL MODULES) */}
            {activeTab === 'initialize' && (
              <div className="space-y-4">
                {/* 1. Emitter Geometry and Rates (ALWAYS SHOW) */}
                <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 border-b border-neutral-800/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Flame size={14} className="text-amber-400" />
                      <span>Emitter Geometry & Rates</span>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-3.5 bg-neutral-950/20 text-xs">
                    {/* Emitter Shape */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 flex justify-between">
                        <span>Geometry Shape</span>
                        <span className="text-amber-400 font-mono">{activeParticleData.emitter.shape}</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                        {['point', 'circle', 'box', 'line', 'ring', 'cone'].map(shp => (
                          <button
                            key={shp}
                            type="button"
                            onClick={() => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, shape: shp as any } }))}
                            className={`py-1 rounded text-[10px] font-bold transition ${
                              activeParticleData.emitter.shape === shp ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {shp.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emitter Dimensions & Size (Box, Line, Circle, Ring, Cone) */}
                    {activeParticleData.emitter.shape !== 'point' && (
                      <div className="space-y-2 pt-1 border-t border-neutral-800/40">
                        {/* Box, Circle, Ring: Width & Height */}
                        {(activeParticleData.emitter.shape === 'box' || activeParticleData.emitter.shape === 'circle' || activeParticleData.emitter.shape === 'ring') && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                                {activeParticleData.emitter.shape === 'box' ? 'Width (px)' : 'Width / Dia X (px)'}
                              </label>
                              <input
                                type="number"
                                min="2"
                                max="600"
                                value={activeParticleData.emitter.width || activeParticleData.emitter.radius || 32}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, width: val, radius: val / 2 } }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                                {activeParticleData.emitter.shape === 'box' ? 'Height (px)' : 'Height / Dia Y (px)'}
                              </label>
                              <input
                                type="number"
                                min="2"
                                max="600"
                                value={activeParticleData.emitter.height || activeParticleData.emitter.radius || 32}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, height: val } }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Cone: Width (Spread) & Height (Reach) */}
                        {activeParticleData.emitter.shape === 'cone' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 block mb-1">Spread Width (px)</label>
                              <input
                                type="number"
                                min="2"
                                max="600"
                                value={activeParticleData.emitter.width || 48}
                                onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, width: Number(e.target.value) } }))}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 block mb-1">Cone Length (px)</label>
                              <input
                                type="number"
                                min="2"
                                max="600"
                                value={activeParticleData.emitter.height || 64}
                                onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, height: Number(e.target.value) } }))}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Line: Width (Length) */}
                        {activeParticleData.emitter.shape === 'line' && (
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Line Length / Width (px)</label>
                            <input
                              type="number"
                              min="2"
                              max="600"
                              value={activeParticleData.emitter.width || 64}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, width: Number(e.target.value) } }))}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}

                        {/* Emitter Rotation / Angle (For all except Point) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-neutral-400">Emitter Rotation / Angle</label>
                            <span className="text-emerald-400 font-mono text-[10px]">{activeParticleData.emitter.rotationDeg || 0}°</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="1"
                              value={activeParticleData.emitter.rotationDeg || 0}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, rotationDeg: Number(e.target.value) } }))}
                              className="flex-1 accent-emerald-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max="360"
                              value={activeParticleData.emitter.rotationDeg || 0}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, rotationDeg: Number(e.target.value) % 360 } }))}
                              className="w-14 bg-neutral-950 border border-neutral-800 rounded p-1 text-center font-mono text-xs text-white"
                            />
                          </div>
                          <div className="grid grid-cols-4 gap-1 pt-0.5">
                            {[0, 90, 180, 270].map(deg => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, rotationDeg: deg } }))}
                                className={`py-0.5 px-1 rounded text-[9px] font-mono font-bold transition border ${
                                  (activeParticleData.emitter.rotationDeg || 0) === deg 
                                    ? 'bg-emerald-900/60 border-emerald-500/80 text-emerald-300' 
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emitter Animation Track Toggles */}
                    <div className="pt-2 border-t border-neutral-800/40 space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                        <span>Animate Emitter Properties on Timeline</span>
                        <span className="text-[9px] text-neutral-500 lowercase">tracks toggle</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-neutral-950/70 p-2 rounded-lg border border-neutral-800/80">
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateEmitterWidth || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateEmitterWidth: e.target.checked } }))}
                            className="rounded accent-amber-500 w-3.5 h-3.5"
                          />
                          <span>↔️ Width Track</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateEmitterHeight || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateEmitterHeight: e.target.checked } }))}
                            className="rounded accent-amber-500 w-3.5 h-3.5"
                          />
                          <span>↕️ Height Track</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateEmitterRotation || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateEmitterRotation: e.target.checked } }))}
                            className="rounded accent-emerald-500 w-3.5 h-3.5"
                          />
                          <span>🔄 Rotation Track</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateEmissionRate || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateEmissionRate: e.target.checked } }))}
                            className="rounded accent-cyan-500 w-3.5 h-3.5"
                          />
                          <span>⚡ Rate Track</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateBurstCount || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateBurstCount: e.target.checked } }))}
                            className="rounded accent-orange-500 w-3.5 h-3.5"
                          />
                          <span>💥 Burst Qty Track</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={activeParticleData.emitter.animateBurstInterval || false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, animateBurstInterval: e.target.checked } }))}
                            className="rounded accent-indigo-500 w-3.5 h-3.5"
                          />
                          <span>⏱️ Interval Track</span>
                        </label>
                      </div>
                    </div>

                    {/* Emission Rates (Range) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Min Rate (p/s)</label>
                        <input
                          type="number"
                          min="0"
                          max="300"
                          value={activeParticleData.emitter.emissionRateMin ?? activeParticleData.emitter.emissionRate ?? 20}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveParticle(p => {
                              const emissionRateMin = val;
                              const emissionRateMax = p.emitter.emissionRateMax ?? p.emitter.emissionRate ?? 20;
                              return {
                                ...p,
                                emitter: {
                                  ...p.emitter,
                                  emissionRateMin,
                                  emissionRate: emissionRateMin, // Keep base sync'd
                                  emissionRateMax: Math.max(emissionRateMin, emissionRateMax)
                                }
                              };
                            });
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Max Rate (p/s)</label>
                        <input
                          type="number"
                          min="0"
                          max="300"
                          value={activeParticleData.emitter.emissionRateMax ?? activeParticleData.emitter.emissionRate ?? 20}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveParticle(p => {
                              const emissionRateMin = p.emitter.emissionRateMin ?? p.emitter.emissionRate ?? 20;
                              const emissionRateMax = val;
                              return {
                                ...p,
                                emitter: {
                                  ...p.emitter,
                                  emissionRateMax,
                                  emissionRateMin: Math.min(emissionRateMin, emissionRateMax)
                                }
                              };
                            });
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Max Particles & Lifecycle Age Range */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800/30">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1" title="Max active particles limit">Limit</label>
                        <input
                          type="number"
                          min="10"
                          max="1500"
                          value={activeParticleData.emitter.maxParticles}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, maxParticles: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Min Age (s)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={activeParticleData.visuals.minLifetime}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, minLifetime: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Max Age (s)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={activeParticleData.visuals.maxLifetime}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, maxLifetime: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Burst Toggle Checkbox */}
                    <div className="pt-2 border-t border-neutral-800/30">
                      <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-[11px] text-neutral-300">
                        <input
                          type="checkbox"
                          checked={activeParticleData.emitter.burstEnabled !== false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateActiveParticle(p => ({
                              ...p,
                              emitter: {
                                ...p.emitter,
                                burstEnabled: val
                              }
                            }));
                            nextBurstIntervalRef.current = null; // reset periodic bursts timer
                          }}
                          className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                        />
                        <span>Enable Periodic Burst</span>
                      </label>
                    </div>

                    {/* Periodic Burst Options (Min & Max Quantity, Min & Max Interval) */}
                    <div className={`space-y-2.5 transition-all duration-150 ${activeParticleData.emitter.burstEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Burst Min Qty</label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            disabled={activeParticleData.emitter.burstEnabled === false}
                            value={activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 20}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveParticle(p => {
                                const burstCountMin = val;
                                const burstCountMax = p.emitter.burstCountMax ?? p.emitter.burstCount ?? 20;
                                return {
                                  ...p,
                                  emitter: {
                                    ...p.emitter,
                                    burstCountMin,
                                    burstCount: burstCountMin, // Sync base field
                                    burstCountMax: Math.max(burstCountMin, burstCountMax)
                                  }
                                };
                              });
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Burst Max Qty</label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            disabled={activeParticleData.emitter.burstEnabled === false}
                            value={activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 20}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveParticle(p => {
                                const burstCountMin = p.emitter.burstCountMin ?? p.emitter.burstCount ?? 20;
                                const burstCountMax = val;
                                return {
                                  ...p,
                                  emitter: {
                                    ...p.emitter,
                                    burstCountMax,
                                    burstCountMin: Math.min(burstCountMin, burstCountMax)
                                  }
                                };
                              });
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Burst Min Interval (s)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            disabled={activeParticleData.emitter.burstEnabled === false}
                            value={activeParticleData.emitter.burstIntervalMin ?? activeParticleData.emitter.burstInterval ?? 1.0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveParticle(p => {
                                const burstIntervalMin = val;
                                const burstIntervalMax = p.emitter.burstIntervalMax ?? p.emitter.burstInterval ?? 1.0;
                                return {
                                  ...p,
                                  emitter: {
                                    ...p.emitter,
                                    burstIntervalMin,
                                    burstInterval: burstIntervalMin, // Sync base field
                                    burstIntervalMax: Math.max(burstIntervalMin, burstIntervalMax)
                                  }
                                };
                              });
                              nextBurstIntervalRef.current = null; // force recalculation immediately
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Burst Max Interval (s)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            disabled={activeParticleData.emitter.burstEnabled === false}
                            value={activeParticleData.emitter.burstIntervalMax ?? activeParticleData.emitter.burstInterval ?? 1.0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveParticle(p => {
                                const burstIntervalMin = p.emitter.burstIntervalMin ?? p.emitter.burstInterval ?? 1.0;
                                const burstIntervalMax = val;
                                return {
                                  ...p,
                                  emitter: {
                                    ...p.emitter,
                                    burstIntervalMax,
                                    burstIntervalMin: Math.min(burstIntervalMin, burstIntervalMax)
                                  }
                                };
                              });
                              nextBurstIntervalRef.current = null; // force recalculation immediately
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Particle Base Geometry (ALWAYS SHOW) */}
                <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                  <div className="p-3 bg-neutral-900 border-b border-neutral-800/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Eye size={14} className="text-purple-400" />
                      <span>Particle Base Geometry</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-3 bg-neutral-950/20 text-xs">
                    {/* Basic Shape Selector */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Shape / Texture</label>
                      <select
                        value={activeParticleData.visuals.shape}
                        onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, shape: e.target.value as ParticleShape } }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="glow_circle">Glowing Aura Circle</option>
                        <option value="spark_line">Stretched Spark Line</option>
                        <option value="ember">Flickering Square Ember</option>
                        <option value="smoke_puff">Soft Swirling Smoke</option>
                        <option value="star">Celestial Shimmer Star</option>
                        <option value="diamond">Facet Gem Diamond</option>
                        <option value="ring">Hollow Halo Ring</option>
                        <option value="square">Solid Box Square</option>
                        <option value="pixel_square">Crisp Retro Pixel</option>
                        <option value="bubble">Translucent Floating Bubble</option>
                        <option value="custom_glyph">Procedural Prefab Glyph</option>
                        <option value="svg_path">Custom Vector SVG Path</option>
                        <option value="spritesheet">Animated Spritesheet Atlas</option>
                      </select>
                    </div>

                    {/* Custom glyph / svg inputs if active */}
                    {activeParticleData.visuals.shape === 'custom_glyph' && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Custom Prefab / Symbol / Emoji</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={activeParticleData.visuals.customGlyph || '✦'}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, customGlyph: e.target.value } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-center text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    {activeParticleData.visuals.shape === 'svg_path' && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">SVG Path String d="..."</label>
                        <input
                          type="text"
                          value={activeParticleData.visuals.customSvgPath || 'M 10 10 L 90 90'}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, customSvgPath: e.target.value } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[10px] text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    {/* Blending & Scale */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Canvas Blend Mode</label>
                        <select
                          value={activeParticleData.visuals.blendMode || 'lighter'}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, blendMode: e.target.value as any } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="source-over">Standard Blend (Opacity)</option>
                          <option value="lighter">Additive (Intense Glow)</option>
                          <option value="screen">Screen (Soft Lighting)</option>
                          <option value="multiply">Multiply (Dark Smoke)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Texture Cache Scale</label>
                        <select
                          value={activeParticleData.visuals.renderResolutionScale || 1.0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, renderResolutionScale: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="1.0">100% Crisp Native High-Res</option>
                          <option value="0.75">75% Balanced performance</option>
                          <option value="0.5">50% Fast Retro Double-pixels</option>
                          <option value="0.25">25% Ultra Fast (Pixel-art bloom)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Section Cards (Render properties present in addedProps) */}
                {addedProps.includes('size_curve') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>📏 Size Curve Module</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('size_curve')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Size Curve Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Base Size (px)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={activeParticleData.visuals.startSize}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startSize: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Go to the Animation tab to customize size over time using nodes.
                      </p>
                    </div>
                  </div>
                )}

                {addedProps.includes('color_flow') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🎨 Color Flow Module</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('color_flow')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Color Flow Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Base Color</label>
                          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                            <input
                              type="color"
                              value={activeParticleData.visuals.startColor}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startColor: e.target.value } }))}
                              className="w-8 h-6 bg-transparent rounded cursor-pointer border-none"
                            />
                            <span className="font-mono text-[10px] text-neutral-400 uppercase">{activeParticleData.visuals.startColor}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Go to the Animation tab to add multi-color keyframe nodes or use a flow preset.
                      </p>
                    </div>
                  </div>
                )}

                {addedProps.includes('alpha_opac') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🏁 Alpha Opacity Module</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('alpha_opac')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Alpha Opacity Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Base Alpha</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={activeParticleData.visuals.startAlpha ?? 1.0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startAlpha: Number(e.target.value) } }))}
                            className="w-full accent-amber-500"
                          />
                          <div className="text-right text-[9px] font-mono text-neutral-400 mt-0.5">{Math.round((activeParticleData.visuals.startAlpha ?? 1.0) * 100)}%</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Go to the Animation tab to adjust fade in/out curves and envelope rates.
                      </p>
                    </div>
                  </div>
                )}

                {addedProps.includes('rotation') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🔄 Rotation & Spin Module</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('rotation')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Rotation Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Min Spin Speed (deg/s)</label>
                          <input
                            type="number"
                            min="-720"
                            max="720"
                            value={activeParticleData.kinematics.minAngularVelocity ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, minAngularVelocity: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Max Spin Speed (deg/s)</label>
                          <input
                            type="number"
                            min="-720"
                            max="720"
                            value={activeParticleData.kinematics.maxAngularVelocity ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, maxAngularVelocity: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Base Rotation (deg)</label>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={activeParticleData.visuals.startRotationDeg ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startRotationDeg: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Go to the Animation tab to customize easing or repeat curves.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Dynamic Section Cards (Render properties present in addedProps) */}
                {addedProps.includes('launch_speed') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🚀 Launch Speed</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('launch_speed')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove speed constraints"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Min Launch Speed (px/s)</label>
                        <input
                          type="number"
                          min="-400"
                          max="800"
                          value={activeParticleData.kinematics.minSpeed}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, minSpeed: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Max Launch Speed (px/s)</label>
                        <input
                          type="number"
                          min="-400"
                          max="800"
                          value={activeParticleData.kinematics.maxSpeed}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, maxSpeed: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addedProps.includes('gravity') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🪐 Gravity Forces</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('gravity')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove gravity forces"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Gravity Y Force (Vertical)</label>
                        <input
                          type="number"
                          min="-1000"
                          max="1500"
                          value={activeParticleData.kinematics.gravityY ?? 0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, gravityY: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Gravity X Force (Horizontal)</label>
                        <input
                          type="number"
                          min="-1000"
                          max="1000"
                          value={activeParticleData.kinematics.gravityX ?? 0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, gravityX: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addedProps.includes('motionBlur') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>☄️ Motion Blur</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('motionBlur')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove motion blur"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs">
                      <label className="text-[10px] font-bold text-neutral-400 block mb-1">Base Blur Intensity</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={activeParticleData.visuals.startMotionBlur ?? 0}
                        onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startMotionBlur: Number(e.target.value) } }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
                {addedProps.includes('drag') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>💧 Fluid Drag</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('drag')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove drag"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs">
                      <label className="text-[10px] font-bold text-neutral-400 block mb-1">Fluid Drag Coefficient</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.8"
                        max="1.0"
                        value={activeParticleData.kinematics.drag ?? 0.98}
                        onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, drag: Number(e.target.value) } }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {addedProps.includes('pull') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🧲 Emitter Pull</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('pull')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove pull"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Radius</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={activeParticleData.kinematics.emitterPullRadius ?? 150}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, emitterPullRadius: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Strength</label>
                          <input
                            type="number"
                            step="0.1"
                            value={activeParticleData.kinematics.emitterPullStrength ?? 1.0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, emitterPullStrength: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Falloff Curve</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={activeParticleData.kinematics.emitterPullFalloff ?? 1.0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, emitterPullFalloff: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            title="0 = Constant, 1 = Linear, >1 = Exponential/Quadratic falloff"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {addedProps.includes('wind') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>💨 Wind Forces</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('wind')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove wind forces"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs">
                      <label className="text-[10px] font-bold text-neutral-400 block mb-1">Ambient Wind Force</label>
                      <input
                        type="number"
                        min="-200"
                        max="200"
                        value={activeParticleData.kinematics.windForce ?? 0}
                        onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, windForce: Number(e.target.value) } }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {addedProps.includes('angle') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>📐 Angle & Spread</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('angle')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove angle parameters"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block mb-1">Angle (deg)</label>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={activeParticleData.kinematics.angleDeg ?? 270}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, angleDeg: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block mb-1">Spread (deg)</label>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={activeParticleData.kinematics.spreadDeg ?? 0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, spreadDeg: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addedProps.includes('turbulence') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🌪️ Turbulence & Noise</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('turbulence')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove turbulence parameter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-neutral-400">Velocity Noise Jitter</label>
                          <span className="font-mono text-[10px] text-amber-400 font-bold">
                            {activeParticleData.kinematics.turbulenceJitter ?? 0} px/s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={activeParticleData.kinematics.turbulenceJitter ?? 0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, turbulenceJitter: Number(e.target.value) } }))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[8.5px] text-neutral-500 font-mono mt-0.5">
                          <span>0 (Direct)</span>
                          <span>25 (Flurries)</span>
                          <span>60 (Blizzard)</span>
                          <span>100 (Wild)</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-neutral-400 leading-normal">
                        Applies continuous organic multi-frequency noise to particle velocities, creating fluttering blizzard flurries, rising heat shimmers, and swirling fire embers.
                      </p>
                    </div>
                  </div>
                )}

                {addedProps.includes('bloom') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🔆 Glow Bloom</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('bloom')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove glow bloom"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs">
                      <label className="text-[10px] font-bold text-neutral-400 block mb-1">Glow Bloom Radius</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={activeParticleData.visuals.glowBlurRadius ?? 8}
                        onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, glowBlurRadius: Number(e.target.value) } }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {addedProps.includes('trails') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>☄️ Trails</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('trails')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove trails"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Length (Frames)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={activeParticleData.visuals.trailLength ?? 10}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, trailLength: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Width Multiplier</label>
                          <input
                            type="number"
                            min="0.1"
                            max="10.0"
                            step="0.1"
                            value={activeParticleData.visuals.trailWidthScale ?? 1.0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, trailWidthScale: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60 mt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activeParticleData.visuals.trailTaper ?? false}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, trailTaper: e.target.checked } }))}
                            className="rounded accent-amber-500 scale-90 cursor-pointer"
                          />
                          <label className="text-[10px] font-bold text-neutral-400">Taper Tail</label>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Taper Length (Frames)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            disabled={!activeParticleData.visuals.trailTaper}
                            value={activeParticleData.visuals.trailTaperLength ?? activeParticleData.visuals.trailLength ?? 10}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, trailTaperLength: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {addedProps.includes('physics') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🧱 Solid Map Collision</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('physics')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove collision parameters"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <label className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
                        <span className="font-bold text-neutral-300">Fluid Self-Collision</span>
                        <input
                          type="checkbox"
                          checked={activeParticleData.physics.fluidSelfCollision || false}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, fluidSelfCollision: e.target.checked } }))}
                          className="rounded accent-amber-500 font-mono w-4 h-4"
                        />
                      </label>

                      {activeParticleData.physics.fluidSelfCollision && (
                        <div className="grid grid-cols-1 pt-1 border-t border-neutral-800/30">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Repulsion Force</label>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.05"
                              value={activeParticleData.physics.fluidRepulsionForce ?? 0.5}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, fluidRepulsionForce: Number(e.target.value) } }))}
                              className="w-full accent-amber-500"
                            />
                            <div className="text-right text-[9px] font-mono text-neutral-400 mt-0.5">{(activeParticleData.physics.fluidRepulsionForce ?? 0.5).toFixed(2)}x strength</div>
                          </div>
                        </div>
                      )}

                      <label className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
                        <span className="font-bold text-neutral-300">Solid Room Tiles Bounce</span>
                        <input
                          type="checkbox"
                          checked={activeParticleData.physics.collideWithMapSolids}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, collideWithMapSolids: e.target.checked } }))}
                          className="rounded accent-amber-500 font-mono w-4 h-4"
                        />
                      </label>

                      {activeParticleData.physics.collideWithMapSolids && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/30">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Restitution (Bounce)</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={activeParticleData.physics.collisionRestitution}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, collisionRestitution: Number(e.target.value) } }))}
                              className="w-full accent-amber-500"
                            />
                            <div className="text-right text-[9px] font-mono text-neutral-400 mt-0.5">{(activeParticleData.physics.collisionRestitution * 100).toFixed(0)}% energy</div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Max Bounces Limit</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={activeParticleData.physics.maxBounces || 0}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, maxBounces: Number(e.target.value) || undefined } }))}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                              placeholder="Unlimited"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addedProps.includes('destroy_on_hit') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>💥 Destroy on Hit</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam('destroy_on_hit')}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove destroy parameter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs">
                      <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-neutral-950 border border-neutral-800">
                        <span className="text-neutral-300 font-bold">Destroy Immediately on Hit</span>
                        <input
                          type="checkbox"
                          checked={activeParticleData.physics.destroyOnCollision}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, physics: { ...p.physics, destroyOnCollision: e.target.checked } }))}
                          className="rounded accent-amber-500 font-mono w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. Enhanced Customizable Parameters Catalog */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Customizable Parameters Library</span>
                      <span className="text-[9px] text-neutral-500">
                        {addedProps.length} active / {AVAILABLE_INITIALIZE_PROPS.length} total parameters
                      </span>
                    </div>
                  </div>

                  {/* Search and Category Filter Bar */}
                  <div className="space-y-1.5 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <div className="relative">
                      <input
                        type="text"
                        value={paramSearch}
                        onChange={(e) => setParamSearch(e.target.value)}
                        placeholder="Search parameters (e.g. gravity, wind, trails)..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                      <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-500 pointer-events-none" />
                      {paramSearch && (
                        <button
                          type="button"
                          onClick={() => setParamSearch('')}
                          className="absolute right-2 top-2 text-[10px] text-neutral-400 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-1">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'forces', label: '⚡ Forces & Motion' },
                        { id: 'visuals', label: '🎨 Visual FX' },
                        { id: 'physics', label: '🧱 Physics' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setParamCategory(cat.id as any)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition border ${
                            paramCategory === cat.id
                              ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_INITIALIZE_PROPS
                      .filter(p => {
                        const matchesSearch = p.label.toLowerCase().includes(paramSearch.toLowerCase()) ||
                                              p.desc.toLowerCase().includes(paramSearch.toLowerCase());
                        const matchesCategory = paramCategory === 'all' || p.category === paramCategory;
                        return matchesSearch && matchesCategory;
                      })
                      .map(p => {
                        const alreadyAdded = addedProps.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            className={`p-2.5 rounded-xl border flex flex-col justify-between transition duration-150 ${
                              alreadyAdded
                                ? 'bg-amber-950/20 border-amber-500/40 text-neutral-200'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900/80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                                  {p.label}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  alreadyAdded 
                                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400' 
                                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                                }`}>
                                  {alreadyAdded ? '✓ Added' : p.badge}
                                </span>
                              </div>
                              <p className="text-[9px] text-neutral-400 leading-snug mb-2">
                                {p.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (alreadyAdded) {
                                  handleRemoveParam(p.id);
                                } else {
                                  handleAddParam(p.id);
                                }
                              }}
                              className={`w-full py-1 px-2 rounded-lg text-[9.5px] font-bold transition flex items-center justify-center gap-1 ${
                                alreadyAdded
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40'
                                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                              }`}
                            >
                              {alreadyAdded ? '✕ Remove Parameter' : '+ Add Parameter'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Map & Behavior Integration Guide */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] text-neutral-300">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Code size={13} />
                    <span>Room Placement Integration</span>
                  </div>
                  <p>
                    Ambient particles can be painted directly on room tiles using the Map Editor, or triggered via Biome Behavior Actions.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: ANIMATION GRAPH & keyframes */}
            {activeTab === 'animation' && (
              <div className="space-y-4">
                 {/* FX Preset Overwrite Selector */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block">FX Animation Preset Profile</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleSavePreset}
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9px] font-bold text-amber-400 rounded-md transition flex items-center gap-1"
                        title="Save current envelope configs as a new custom FX preset style"
                      >
                        <Plus size={10} />
                        Save FX Style
                      </button>
                      {customPresets.some(p => p.name === activeParticleData.visuals.fxStyle) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(activeParticleData.visuals.fxStyle)}
                          className="px-2 py-0.5 bg-neutral-900 hover:bg-red-950/60 border border-red-900/50 text-[9px] font-bold text-rose-400 rounded-md transition flex items-center gap-1"
                          title="Delete selected custom style preset"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <select
                    value={activeParticleData.visuals.fxStyle || 'custom'}
                    onChange={(e) => applyFXPreset(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none font-medium"
                  >
                    <optgroup label="System Presets" className="bg-neutral-950 text-neutral-400 text-xs">
                      <option value="custom">⚙️ Custom Envelope (Manual fine-tuning)</option>
                      <option value="pulse_oscillate">💓 Pulsing/Breathing sizes</option>
                      <option value="flicker_shimmer">✨ Flickering fire embers</option>
                      <option value="orbit_swirl">🌀 Orbit Vortex Swirls</option>
                      <option value="spark_crackle">⚡ Spark Crackling static</option>
                    </optgroup>
                    {customPresets.length > 0 && (
                      <optgroup label="Your Saved Styles" className="bg-neutral-950 text-neutral-400 text-xs">
                        {customPresets.map(pr => (
                          <option key={pr.name} value={pr.name}>💾 {pr.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[10px] text-neutral-500 italic">
                    Selecting a preset profile overrides the envelope configurations below automatically. Saving an FX style captures your current size/color/alpha/emissive curves.
                  </p>
                </div>

                {/* Timeline Graph & Multi-Track Matrix */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Activity size={14} />
                      <span>Animation Tracks Matrix & Graph</span>
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      Age: <span className="text-amber-300">{(scrubberProgress * 100).toFixed(0)}%</span>
                    </span>
                  </div>

                  {/* Scrubber slider line */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={scrubberProgress}
                    onChange={(e) => setScrubberProgress(Number(e.target.value))}
                    className="w-full accent-amber-500 mb-2"
                  />

                  {/* Matrix Grid Container */}
                  <div className="border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-950/80 relative text-[10px]">
                    {/* Header Timeline Ruler */}
                    <div className="grid grid-cols-[110px_1fr] border-b border-neutral-800 bg-neutral-900/40 text-neutral-500 font-mono text-[9px] py-1 px-2 select-none">
                      <span className="font-bold uppercase tracking-wider text-neutral-400">Track Node</span>
                      <div className="flex justify-between relative px-2">
                        <span>0% (Spawn)</span>
                        <span>25%</span>
                        <span>50% (Mid)</span>
                        <span>75%</span>
                        <span>100% (Death)</span>
                      </div>
                    </div>

                    {/* Timeline Tracks Rows */}
                    <div className="divide-y divide-neutral-900 relative">
                      {/* Interactive Scrubber Line overlay spanning across all rows */}
                      {visibleTracks.length > 0 && (
                        <div 
                          className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          style={{ left: `calc(110px + ${scrubberProgress} * (100% - 110px))` }}
                        >
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
                        </div>
                      )}

                      {/* Row 1: Size Track */}
                      {addedProps.includes('size_curve') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'size' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('size');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">📏 Size Curve</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateSize !== false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateSize: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Size Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {activeParticleData.visuals.animateSize !== false ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-amber-500 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('size', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'size').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-amber-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}% = ${nd.value}px`} 
                                  />
                                ))}
                                <span className="absolute bottom-1 right-2 text-[8px] font-mono text-neutral-600 uppercase">
                                  {activeParticleData.visuals.sizeCurve || 'linear'} ({activeParticleData.visuals.sizeAnimStyle || 'one_shot'})
                                </span>
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked static ({activeParticleData.visuals.startSize}px)</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 2: Color Track */}
                      {addedProps.includes('color_flow') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'color' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('color');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">🎨 Color Flow</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateColor !== false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateColor: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Color Animation"
                            />
                          </div>
                          <div className="relative h-9 px-2 flex items-center bg-neutral-950/20">
                            {activeParticleData.visuals.animateColor !== false ? (
                              <>
                                <div 
                                  className="absolute inset-x-2 h-4 rounded-md border border-neutral-800"
                                  style={{ background: getDynamicColorGradient() }}
                                />
                                {getTrackNodesForData(activeParticleData.visuals, 'color').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2.5 h-2.5 bg-white rounded-sm border border-neutral-950 shadow" 
                                    style={{ left: `${nd.time * 96 + 2}%`, backgroundColor: nd.value }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}%`} 
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked Color ({activeParticleData.visuals.startColor})</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 3: Alpha Track */}
                      {addedProps.includes('alpha_opac') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'alpha' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('alpha');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">🏁 Alpha Opac</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateAlpha !== false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateAlpha: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Alpha Animation"
                            />
                          </div>
                          <div className="relative h-9 px-2 flex items-center bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:8px_8px] bg-neutral-950/60">
                            {activeParticleData.visuals.animateAlpha !== false ? (
                              <>
                                <div 
                                  className="absolute inset-x-2 h-4 rounded-md border border-neutral-800"
                                  style={{ background: getDynamicAlphaGradient() }}
                                />
                                {getTrackNodesForData(activeParticleData.visuals, 'alpha').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute text-[8px] font-mono font-bold bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800 text-neutral-300" 
                                    style={{ left: `${nd.time * 94 + 2}%` }}
                                  >
                                    {nd.value}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked Alpha ({activeParticleData.visuals.startAlpha})</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 4: Emissive Track */}
                      {addedProps.includes('bloom') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'emissive' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('emissive');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">💡 Emissive</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateEmissive !== false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateEmissive: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Emissive Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {activeParticleData.visuals.isEmissive ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-purple-400 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('emissive', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'emissive').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-purple-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}% = ${nd.value}`} 
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">❌ Bloom Light Disabled</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 5: Rotation Track */}
                      {addedProps.includes('rotation') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'rotation' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('rotation');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">🔄 Rotation</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateRotation || false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateRotation: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Rotation Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {activeParticleData.visuals.animateRotation ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-emerald-500 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('rotation', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'rotation').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-emerald-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}% = ${nd.value}°`} 
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked static rotation</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 6: Speed Modifier Track */}
                      {addedProps.includes('launch_speed') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'speed' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('speed');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">🚀 Speed</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateSpeed || false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateSpeed: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Speed Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {activeParticleData.visuals.animateSpeed ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-cyan-500 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('speed', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'speed').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-cyan-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}% = ${nd.value}px/s`} 
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked static speed</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 7: Drag Modifier Track */}
                {addedProps.includes('motionBlur') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'motionBlur' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('motionBlur');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300 text-[10px]">☄️ Motion Blur</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateMotionBlur ?? true}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateMotionBlur: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Motion Blur Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {(activeParticleData.visuals.animateMotionBlur ?? true) ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-pink-500 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('motionBlur', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'motionBlur').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-pink-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`T: ${nd.time.toFixed(2)}`}
                                  />
                                ))}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center px-4">
                                <div className="h-0.5 w-full bg-neutral-800 rounded"></div>
                              </div>
                            )}
                          </div>
                        </div>
                )}
                {addedProps.includes('drag') && (
                        <div 
                          className={`grid grid-cols-[110px_1fr] items-center cursor-pointer hover:bg-neutral-900/30 group ${
                            selectedTrack === 'drag' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                          onClick={(e) => {
                            setSelectedTrack('drag');
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left - 110;
                            const width = rect.width - 110;
                            if (clickX >= 0 && width > 0) {
                              setScrubberProgress(Math.max(0, Math.min(1, clickX / width)));
                            }
                          }}
                        >
                          <div className="p-2 border-r border-neutral-900 flex items-center justify-between bg-neutral-950">
                            <span className="font-bold text-neutral-300">💧 Drag Curve</span>
                            <input 
                              type="checkbox"
                              checked={activeParticleData.visuals.animateDrag || false}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, animateDrag: e.target.checked } }))}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-amber-500 scale-75 cursor-pointer"
                              title="Toggle Drag Animation"
                            />
                          </div>
                          <div className="relative h-9 bg-neutral-950/40 px-2 flex items-center">
                            {activeParticleData.visuals.animateDrag ? (
                              <>
                                <svg className="absolute inset-0 w-full h-full stroke-blue-500 fill-none opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d={getSparklinePath('drag', 100, 100)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                {getTrackNodesForData(activeParticleData.visuals, 'drag').map((nd, idx) => (
                                  <div 
                                    key={idx}
                                    className="absolute w-2 h-2 bg-blue-400 rotate-45 border border-neutral-900" 
                                    style={{ left: `${nd.time * 96 + 2}%` }}
                                    title={`Node ${idx}: ${(nd.time * 100).toFixed(0)}% = ${nd.value}`} 
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-600 italic pl-1">🔒 Locked static drag</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fallback Message when no tracks are added */}
                      {visibleTracks.length === 0 && (
                        <div className="p-8 text-center text-neutral-500 space-y-2">
                          <Activity size={24} className="mx-auto text-neutral-700 animate-pulse" />
                          <p className="text-xs font-bold text-neutral-400">No Animation Tracks Added Yet</p>
                          <p className="text-[10px] text-neutral-600 max-w-xs mx-auto leading-normal">
                            Go back to the <span className="text-amber-500 font-bold">Initialize</span> tab and add Size Curve, Color Flow, Alpha Opacity, Glow Bloom, or Rotation & Spin to start animating properties!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scrubber evaluation visualizer mockup box */}
                  <div className="bg-neutral-900/60 rounded-lg p-3 border border-neutral-800/80 flex items-center justify-between gap-4">
                    <div className="text-[10px] text-neutral-400 space-y-1">
                      <div>Evaluated Size: <span className="text-white font-mono">
                        {(() => {
                          const sizeProg = getAnimProgress(scrubberProgress, activeParticleData.visuals.sizeAnimStyle);
                          return evaluateSize(
                            sizeProg,
                            activeParticleData.visuals.startSize,
                            activeParticleData.visuals.endSize,
                            activeParticleData.visuals.midSize,
                            activeParticleData.visuals.sizeCurve
                          ).toFixed(1);
                        })()}px</span>
                      </div>
                      <div>Evaluated Alpha: <span className="text-white font-mono">
                        {(() => {
                          const colProg = getAnimProgress(scrubberProgress, activeParticleData.visuals.colorAnimStyle);
                          const res = evaluateColorAlpha(
                            colProg,
                            activeParticleData.visuals.startColor,
                            activeParticleData.visuals.startAlpha,
                            activeParticleData.visuals.midColor,
                            activeParticleData.visuals.midAlpha,
                            activeParticleData.visuals.endColor,
                            activeParticleData.visuals.endAlpha,
                            activeParticleData.visuals.alphaCurve
                          );
                          return (res.alpha * 100).toFixed(0);
                        })()}%</span>
                      </div>
                    </div>

                    {/* Live Preview circle particle mockup */}
                    <div className="w-14 h-14 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-center overflow-hidden relative">
                      {(() => {
                        const sizeProg = getAnimProgress(scrubberProgress, activeParticleData.visuals.sizeAnimStyle);
                        const sVal = evaluateSize(
                          sizeProg,
                          activeParticleData.visuals.startSize,
                          activeParticleData.visuals.endSize,
                          activeParticleData.visuals.midSize,
                          activeParticleData.visuals.sizeCurve
                        );
                        const colProg = getAnimProgress(scrubberProgress, activeParticleData.visuals.colorAnimStyle);
                        const colObj = evaluateColorAlpha(
                          colProg,
                          activeParticleData.visuals.startColor,
                          activeParticleData.visuals.startAlpha,
                          activeParticleData.visuals.midColor,
                          activeParticleData.visuals.midAlpha,
                          activeParticleData.visuals.endColor,
                          activeParticleData.visuals.endAlpha,
                          activeParticleData.visuals.alphaCurve
                        );
                        
                        const visualScale = Math.min(1.0, 36 / (sVal || 1));
                        const displaySize = sVal * visualScale;

                        return (
                          <div
                            className="rounded-full transition"
                            style={{
                              width: `${Math.max(4, displaySize)}px`,
                              height: `${Math.max(4, displaySize)}px`,
                              backgroundColor: `rgb(${colObj.r}, ${colObj.g}, ${colObj.b})`,
                              opacity: colObj.alpha,
                              boxShadow: activeParticleData.visuals.glowBlurRadius > 0 
                                ? `0 0 ${activeParticleData.visuals.glowBlurRadius * 0.7}px rgb(${colObj.r}, ${colObj.g}, ${colObj.b})` 
                                : 'none'
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* DETAILS CARD FOR SELECTED TRACK */}
                {visibleTracks.length > 0 && (() => {
                  const { curve, animStyle, repeats } = getSelectedTrackConfig();
                  const nodes = getTrackNodesForData(activeParticleData.visuals, selectedTrack);
                  const bounds = getTrackBounds(selectedTrack);
                  const trackLabel = selectedTrack === 'size' ? '📐 Size Envelope Track' 
                                   : selectedTrack === 'color' ? '🎨 Color Flow Track'
                                   : selectedTrack === 'alpha' ? '🏁 Alpha Opac Track'
                                   : selectedTrack === 'emissive' ? '💡 Emissive Track'
                                   : '🔄 Rotation Spin Track';
                  const trackColorClass = selectedTrack === 'size' ? 'text-amber-400'
                                       : selectedTrack === 'color' ? 'text-rose-400'
                                       : selectedTrack === 'alpha' ? 'text-sky-300'
                                       : selectedTrack === 'emissive' ? 'text-purple-400'
                                       : 'text-emerald-400';
                  
                  return (
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                      {/* Details Header */}
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <span className={`text-xs font-extrabold flex items-center gap-1.5 ${trackColorClass}`}>
                          <Activity size={13} />
                          {trackLabel} Details
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-500 font-mono">({nodes.length}/5 Nodes)</span>
                          <button
                            type="button"
                            onClick={handleAddNodeButton}
                            disabled={nodes.length >= 5}
                            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-bold text-neutral-300 rounded-md transition"
                          >
                            ➕ Add Node
                          </button>
                        </div>
                      </div>

                      {/* Interactive Graph Canvas */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-1">
                          <span>Value: {bounds.max}</span>
                          <span className="text-[8px] italic text-neutral-600">Double-click graph to add a node • Drag nodes to edit</span>
                          <span>{bounds.min}</span>
                        </div>
                        
                        <div className="relative">
                          {/* SVG Plotter */}
                          <svg
                            ref={detailsSvgRef}
                            className="w-full h-[140px] bg-neutral-950 rounded-lg border border-neutral-900 relative cursor-crosshair overflow-hidden select-none"
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const mouseX = e.clientX - rect.left;
                              const mouseY = e.clientY - rect.top;
                              
                              const t = Math.max(0.01, Math.min(0.99, mouseX / rect.width));
                              const rawVal = yToVal(selectedTrack, mouseY, rect.height);
                              
                              let success = false;
                              updateActiveParticle(prev => {
                                const currentNodes = getTrackNodesForData(prev.visuals, selectedTrack);
                                if (currentNodes.length >= 5) {
                                  return prev;
                                }
                                success = true;
                                const newNode = {
                                  time: Number(t.toFixed(3)),
                                  value: selectedTrack === 'color' ? '#ffa500' : rawVal
                                };
                                const updated = [...currentNodes, newNode].sort((a, b) => a.time - b.time);
                                return {
                                  ...prev,
                                  visuals: {
                                    ...prev.visuals,
                                    trackNodes: {
                                      ...(prev.visuals.trackNodes || {}),
                                      [selectedTrack]: updated
                                    }
                                  }
                                };
                              });
                              if (success) {
                                showToast(`Added interpolation node at ${(t * 100).toFixed(0)}%`);
                              } else {
                                showToast('Maximum 5 nodes allowed for track curves.');
                              }
                            }}
                          >
                            {/* Grid Lines */}
                            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#222" strokeWidth="1" />
                            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#222" strokeWidth="1" />
                            <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="3 3" />

                            {/* Repeated/Tiled backgrounds visualization if looping/oscillating */}
                            {animStyle !== 'one_shot' && (
                              <g opacity="0.15">
                                {Array.from({ length: repeats }).map((_, rIdx) => {
                                  if (rIdx === 0) return null;
                                  const startX = (rIdx / repeats) * 100;
                                  return (
                                    <line
                                      key={rIdx}
                                      x1={`${startX}%`}
                                      y1="0"
                                      x2={`${startX}%`}
                                      y2="100%"
                                      stroke="#ef4444"
                                      strokeWidth="1.5"
                                      strokeDasharray="4 2"
                                    />
                                  );
                                })}
                              </g>
                            )}

                            {/* Dynamic Plot Path representing base curve */}
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" x="0" y="0" width="100%" height="100%" className="overflow-visible pointer-events-none">
                              {selectedTrack !== 'color' ? (
                                <path
                                  d={getSparklinePath(selectedTrack, 100, 100, (12/140)*100)}
                                  fill="none"
                                  stroke={
                                    selectedTrack === 'size' ? '#f59e0b' :
                                    selectedTrack === 'alpha' ? '#ffffff' :
                                    selectedTrack === 'emissive' ? '#a855f7' : '#10b981'
                                  }
                                  strokeWidth="2.5"
                                  vectorEffect="non-scaling-stroke"
                                  className="drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]"
                                />
                              ) : (
                                // Draw color stops as a full beautiful gradient background block
                                <rect
                                  x="0"
                                  y="0"
                                  width="100"
                                  height="100"
                                  fill="url(#colorTrackGradDetails)"
                                  className="opacity-70 rounded-lg"
                                />
                              )}
                            </svg>

                            {/* SVG Defs for Gradients */}
                            <defs>
                              <linearGradient id="colorTrackGradDetails" x1="0" y1="0" x2="1" y2="0">
                                {nodes.map((n, idx) => (
                                  <stop key={idx} offset={`${n.time * 100}%`} stopColor={n.value} />
                                ))}
                              </linearGradient>
                            </defs>

                            {/* Interactive Draggable Knobs */}
                            {nodes.map((node, idx) => {
                              const x = node.time * 100;
                              const y = (valToY(selectedTrack, node.value, 140) / 140) * 100;
                              const isDraggable = idx > 0 && idx < nodes.length - 1;
                              const fillCol = selectedTrack === 'color' ? node.value : '#1e1b4b';
                              const borderCol = selectedTrack === 'size' ? '#f59e0b' :
                                                selectedTrack === 'color' ? '#ffffff' :
                                                selectedTrack === 'alpha' ? '#38bdf8' :
                                                selectedTrack === 'emissive' ? '#c084fc' : '#34d399';
                              return (
                               <circle
                                  key={idx}
                                  cx={`${x}%`}
                                  cy={`${y}%`}
                                  r="7"
                                  style={{
                                    transformOrigin: 'center',
                                    transformBox: 'fill-box',
                                    transition: 'transform 100ms ease, stroke-width 100ms ease'
                                  }}
                                  className={`cursor-pointer ${
                                    isDraggable ? 'hover:scale-125 hover:stroke-white' : ''
                                  }`}
                                  fill={fillCol}
                                  stroke={borderCol}
                                  strokeWidth="2.5"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setDraggedNodeIndex(idx);
                                  }}
                                >
                                  <title>
                                    {idx === 0 ? 'Spawn' : idx === nodes.length - 1 ? 'Death' : `Node ${idx}`} at {(node.time * 100).toFixed(0)}%
                                  </title>
                                </circle>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* Dropdown Options Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Growth Curve Mode</label>
                          <select
                            value={curve}
                            onChange={(e) => updateSelectedTrackConfig('curve', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 p-1.5 rounded text-[10px] text-white focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="linear">📈 Linear Slope</option>
                            <option value="balanced">⚖️ Ease Balanced</option>
                            <option value="bell_arch">🔔 Bell Arch Peak</option>
                            <option value="burst_decay">💥 Burst Decay Drop</option>
                            <option value="burst_shrink">📉 Burst Shrink Fast</option>
                            <option value="constant">🔒 Locked Constant</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Anim Sequence style</label>
                          <select
                            value={animStyle}
                            onChange={(e) => updateSelectedTrackConfig('animStyle', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 p-1.5 rounded text-[10px] text-white focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="one_shot">Once Over Lifetime</option>
                            <option value="repeat">Loop / Repeat</option>
                            <option value="oscillate">Oscillate (Up & Back)</option>
                          </select>
                        </div>
                      </div>

                      {/* Loops/Oscillations Conditional Field */}
                      {(animStyle === 'repeat' || animStyle === 'oscillate') && (
                        <div className="bg-neutral-900/40 p-2 border border-neutral-800 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-neutral-300 block">Number of {animStyle === 'repeat' ? 'Loops' : 'Oscillations'}</span>
                            <span className="text-[8.5px] text-neutral-500 block leading-tight">Repeats the base curve pattern over particle lifetime.</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="2"
                              max="10"
                              value={repeats}
                              onChange={(e) => updateSelectedTrackConfig('repeats', Math.max(1, Number(e.target.value)))}
                              className="w-12 bg-neutral-950 border border-neutral-800 p-1 rounded text-center text-xs text-white font-mono"
                            />
                            <span className="text-[10px] text-neutral-400 font-bold">times</span>
                          </div>
                        </div>
                      )}

                      {/* Node Interpolation Points Table */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">Interpolation Keyframes List</span>
                        <div className="space-y-1 divide-y divide-neutral-900 border border-neutral-900 bg-neutral-900/10 rounded-lg overflow-hidden font-mono">
                          {nodes.map((node, idx) => {
                            const isSpawn = idx === 0;
                            const isDeath = idx === nodes.length - 1;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between p-2 text-[10px] font-medium gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-neutral-500 w-8">
                                    {isSpawn ? 'Spawn' : isDeath ? 'Death' : `Key #${idx}`}
                                  </span>
                                  
                                  {/* Position (Time) Field */}
                                  {isSpawn || isDeath ? (
                                    <span className="text-[9px] font-mono text-neutral-600 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-900">
                                      {isSpawn ? '0% age' : '100% age'}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-neutral-500 font-mono">Age:</span>
                                      <input
                                        type="number"
                                        min="0.01"
                                        max="0.99"
                                        step="0.01"
                                        value={node.time}
                                        onChange={(e) => {
                                          const t = Number(e.target.value);
                                          const sorted = [...nodes].sort((a, b) => a.time - b.time);
                                          const updated = sorted.map((n, i) => {
                                            if (i !== idx) return n;
                                            return { ...n, time: t };
                                          });
                                          updateActiveParticle(p => ({
                                            ...p,
                                            visuals: {
                                              ...p.visuals,
                                              trackNodes: {
                                                ...(p.visuals.trackNodes || {}),
                                                [selectedTrack]: updated.sort((a, b) => a.time - b.time)
                                              }
                                            }
                                          }));
                                        }}
                                        className="w-12 bg-neutral-950 border border-neutral-800 px-1 py-0.5 rounded text-center text-[10px] font-mono text-white"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Value / Color Input Field */}
                                  {selectedTrack === 'color' ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="color"
                                        value={node.value}
                                        onChange={(e) => {
                                          const updated = nodes.map((n, i) => {
                                            if (i !== idx) return n;
                                            return { ...n, value: e.target.value };
                                          });
                                          updateActiveParticle(p => ({
                                            ...p,
                                            visuals: {
                                              ...p.visuals,
                                              trackNodes: {
                                                ...(p.visuals.trackNodes || {}),
                                                [selectedTrack]: updated
                                              }
                                            }
                                          }));
                                        }}
                                        className="w-6 h-5 rounded-md border border-neutral-800 bg-transparent cursor-pointer"
                                      />
                                      <span className="text-[9px] font-mono text-neutral-400 uppercase">{node.value}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-neutral-500 font-mono">Value:</span>
                                      <input
                                        type="number"
                                        min={bounds.min}
                                        max={bounds.max}
                                        step={selectedTrack === 'alpha' ? 0.05 : 1}
                                        value={node.value}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const updated = nodes.map((n, i) => {
                                            if (i !== idx) return n;
                                            return { ...n, value: val };
                                          });
                                          updateActiveParticle(p => ({
                                            ...p,
                                            visuals: {
                                              ...p.visuals,
                                              trackNodes: {
                                                ...(p.visuals.trackNodes || {}),
                                                [selectedTrack]: updated
                                              }
                                            }
                                          }));
                                        }}
                                        className="w-16 bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded text-center text-[10px] font-mono text-white"
                                      />
                                    </div>
                                  )}

                                  {/* Delete Node */}
                                  {!isSpawn && !isDeath && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNodeLocal(idx)}
                                      className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                                      title="Delete interpolation keyframe node"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: SPRITESHEETS */}
            {activeTab === 'spritesheets' && (
              <div className="space-y-4">
                {/* Custom uploader zone */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Grid size={14} className="text-purple-400" />
                      Spritesheet Asset
                    </span>
                    {activeParticleData.visuals.spritesheet && (
                      <button
                        type="button"
                        onClick={() => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, spritesheet: undefined, shape: 'glow_circle' } }))}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Reset Atlas
                      </button>
                    )}
                  </div>

                  <div 
                    onClick={() => {
                      setParticleSliceModalConfig({
                        isOpen: true,
                        sheetLabel: activeParticleData.visuals.spritesheet?.name || 'Particle Atlas',
                        initialImage: {
                          url: activeParticleData.visuals.spritesheet?.imageUrl || activeParticleData.visuals.spritesheet?.dataUrl || '',
                          name: activeParticleData.visuals.spritesheet?.name || 'Particle Atlas',
                          tileWidth: activeParticleData.visuals.spritesheet?.tileWidth || 64,
                          tileHeight: activeParticleData.visuals.spritesheet?.tileHeight || 64,
                          cols: activeParticleData.visuals.spritesheet?.cols || 8,
                          rows: activeParticleData.visuals.spritesheet?.rows || 1,
                          splitMode: activeParticleData.visuals.spritesheet?.splitMode || 'columns'
                        }
                      });
                    }}
                    className="border border-dashed border-neutral-800 hover:border-purple-500/50 rounded-lg p-4 bg-neutral-900/30 hover:bg-neutral-900/60 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <Cloud size={22} className="text-emerald-400" />
                      <Upload size={22} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-300">Import & Configure Spritesheet Atlas</div>
                      <p className="text-[9px] text-neutral-500">Load from Cloud Drive, Virtual Drive, or local file</p>
                    </div>
                    <button
                      type="button"
                      className="w-full py-2 px-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Upload size={13} className="text-purple-400" />
                      <span>Configure & Slice Atlas</span>
                    </button>
                  </div>

                  {/* Slicer Trigger for Active Atlas */}
                  {activeParticleData.visuals.spritesheet && (
                    <button
                      type="button"
                      onClick={() => {
                        const s = activeParticleData.visuals.spritesheet;
                        if (!s) return;
                        setParticleSliceModalConfig({
                          isOpen: true,
                          sheetLabel: s.name,
                          initialImage: {
                            url: s.imageUrl || s.dataUrl || '',
                            name: s.name,
                            tileWidth: s.tileWidth,
                            tileHeight: s.tileHeight,
                            cols: s.cols,
                            rows: s.rows,
                            splitMode: s.splitMode
                          }
                        });
                      }}
                      className="w-full py-2 px-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Grid size={13} className="text-purple-400" />
                      <span>✂️ Configure & Slice Atlas Grid</span>
                    </button>
                  )}

                  {/* Procedural Atlas Sample Generators */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-neutral-400 block">GENERATE SAMPLE PROCEDURAL SPRITESHEETS</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLoadSample('fire')}
                        className="p-1 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold flex flex-col items-center gap-0.5 transition"
                      >
                        <Flame size={12} />
                        <span>Flame Strip</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample('orb')}
                        className="p-1 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold flex flex-col items-center gap-0.5 transition"
                      >
                        <Sparkles size={12} />
                        <span>Mage Orb</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample('spark')}
                        className="p-1 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 rounded text-[9px] font-bold flex flex-col items-center gap-0.5 transition"
                      >
                        <Activity size={12} />
                        <span>Spark Strike</span>
                      </button>
                    </div>
                  </div>
                </div>

                {activeParticleData.visuals.spritesheet ? (
                  <>
                    {/* Grid Atlas Dimensions */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">Grid Layout Atlas Configuration</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Grid Columns</label>
                          <input
                            type="number"
                            min="1"
                            max="32"
                            value={activeParticleData.visuals.spritesheet.cols}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              updateActiveParticle(p => p.visuals.spritesheet ? ({
                                ...p,
                                visuals: {
                                  ...p.visuals,
                                  spritesheet: { ...p.visuals.spritesheet, cols: val, totalFrames: val * p.visuals.spritesheet.rows }
                                }
                              }) : p);
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Grid Rows</label>
                          <input
                            type="number"
                            min="1"
                            max="32"
                            value={activeParticleData.visuals.spritesheet.rows}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              updateActiveParticle(p => p.visuals.spritesheet ? ({
                                ...p,
                                visuals: {
                                  ...p.visuals,
                                  spritesheet: { ...p.visuals.spritesheet, rows: val, totalFrames: val * p.visuals.spritesheet.cols }
                                }
                              }) : p);
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Tile Width (px)</label>
                          <input
                            type="number"
                            min="4"
                            max="512"
                            value={activeParticleData.visuals.spritesheet.tileWidth}
                            onChange={(e) => {
                              const val = Math.max(4, Number(e.target.value));
                              updateActiveParticle(p => p.visuals.spritesheet ? ({
                                ...p,
                                visuals: {
                                  ...p.visuals,
                                  spritesheet: { ...p.visuals.spritesheet, tileWidth: val }
                                }
                              }) : p);
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Tile Height (px)</label>
                          <input
                            type="number"
                            min="4"
                            max="512"
                            value={activeParticleData.visuals.spritesheet.tileHeight}
                            onChange={(e) => {
                              const val = Math.max(4, Number(e.target.value));
                              updateActiveParticle(p => p.visuals.spritesheet ? ({
                                ...p,
                                visuals: {
                                  ...p.visuals,
                                  spritesheet: { ...p.visuals.spritesheet, tileHeight: val }
                                }
                              }) : p);
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Frame Player Engine Parameters */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">Frame Playback Engine</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Playback Mode</label>
                          <select
                            value={activeParticleData.visuals.frameAnimStyle || 'loop'}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, frameAnimStyle: e.target.value as any } }))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white"
                          >
                            <option value="loop">Continuous Loop</option>
                            <option value="keyframe">Interpolated Over Life</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Frame Rate (FPS)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={activeParticleData.visuals.frameRateFps || 12}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, frameRateFps: Number(e.target.value) } }))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white font-mono"
                            disabled={activeParticleData.visuals.frameAnimStyle === 'keyframe'}
                          />
                        </div>
                      </div>

                      {/* Playback indices */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <span className="text-[9px] text-neutral-400">Start Frame</span>
                          <input
                            type="number"
                            min="0"
                            max={(activeParticleData.visuals.spritesheet.totalFrames || 8) - 1}
                            value={activeParticleData.visuals.startFrameIndex ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startFrameIndex: Number(e.target.value) } }))}
                            className="w-full bg-neutral-900 border border-neutral-800 p-1 rounded font-mono text-white mt-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-400">Mid Frame</span>
                          <input
                            type="number"
                            min="0"
                            max={(activeParticleData.visuals.spritesheet.totalFrames || 8) - 1}
                            value={activeParticleData.visuals.midFrameIndex ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, midFrameIndex: Number(e.target.value) } }))}
                            className="w-full bg-neutral-900 border border-neutral-800 p-1 rounded font-mono text-white mt-0.5"
                            disabled={activeParticleData.visuals.frameAnimStyle !== 'keyframe'}
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-400">End Frame</span>
                          <input
                            type="number"
                            min="0"
                            max={(activeParticleData.visuals.spritesheet.totalFrames || 8) - 1}
                            value={activeParticleData.visuals.endFrameIndex ?? ((activeParticleData.visuals.spritesheet.totalFrames || 8) - 1)}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, endFrameIndex: Number(e.target.value) } }))}
                            className="w-full bg-neutral-900 border border-neutral-800 p-1 rounded font-mono text-white mt-0.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive Grid Atlas Viewer */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">Interactive Atlas Grid Layout</span>
                      <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800 relative overflow-x-auto">
                        <div 
                          className="relative border border-neutral-700/50 bg-[linear-gradient(45deg,#1c1c1c_25%,transparent_25%),linear-gradient(-45deg,#1c1c1c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c1c1c_75%),linear-gradient(-45deg,transparent_75%,#1c1c1c_75%)] bg-[size:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0] mx-auto overflow-hidden rounded"
                          style={{
                            width: `${activeParticleData.visuals.spritesheet.cols * 32}px`,
                            height: `${activeParticleData.visuals.spritesheet.rows * 32}px`
                          }}
                        >
                          {activeParticleData.visuals.spritesheet.imageUrl && (
                            <img 
                              src={activeParticleData.visuals.spritesheet.imageUrl} 
                              alt="Atlas" 
                              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                            />
                          )}

                          {/* Grid Overlay mapping frame numbers */}
                          {Array.from({ length: activeParticleData.visuals.spritesheet.cols * activeParticleData.visuals.spritesheet.rows }).map((_, fIdx) => {
                            const isSelectedRange = fIdx >= (activeParticleData.visuals.startFrameIndex ?? 0) && fIdx <= (activeParticleData.visuals.endFrameIndex ?? 9999);
                            return (
                              <div
                                key={fIdx}
                                className={`absolute text-[8px] font-mono flex items-center justify-center border border-neutral-800/40 select-none cursor-pointer transition ${
                                  isSelectedRange ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold z-10' : 'text-neutral-500/80 hover:bg-neutral-800/40 hover:text-neutral-300'
                                }`}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  left: `${(fIdx % activeParticleData.visuals.spritesheet.cols) * 32}px`,
                                  top: `${Math.floor(fIdx / activeParticleData.visuals.spritesheet.cols) * 32}px`
                                }}
                                onClick={() => {
                                  updateActiveParticle(p => ({
                                    ...p,
                                    visuals: {
                                      ...p.visuals,
                                      startFrameIndex: fIdx,
                                      endFrameIndex: Math.max(fIdx, p.visuals.endFrameIndex ?? fIdx)
                                    }
                                  }));
                                  showToast(`Set start index to Frame #${fIdx}`);
                                }}
                              >
                                {fIdx}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-neutral-500 text-center mt-1.5 italic">
                          Highlighted frames are part of current animation selection range. Click any grid cell to quick-set start.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-800 border-dashed text-xs text-neutral-400 text-center space-y-1">
                    <p className="font-bold text-neutral-300">No Spritesheet Atlas Loaded</p>
                    <p className="text-[10px] text-neutral-500">
                      Upload a transparent sprite strip or generate a procedural sample below to unlock custom multi-frame physics animations!
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* TAB 5: PRESETS LIBRARY */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                {/* Save Current System Card */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Save size={14} />
                    <span>Save Current Configuration</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Save the entire active particle system (physics parameters, kinematics, visuals, and animation tracks) as a reusable custom preset.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveSystemPreset}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Save New Custom Preset</span>
                  </button>
                </div>

                {/* Custom Presets Section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center justify-between">
                    <span>👤 Your Custom Presets</span>
                    <span className="font-mono text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50 text-[9px]">
                      {customSystemPresets.length} Saved
                    </span>
                  </h4>

                  {customSystemPresets.length === 0 ? (
                    <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-800 border-dashed text-[10px] text-neutral-500 text-center">
                      No custom presets saved yet. Build a cool particle system and click the button above to store it!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customSystemPresets.map(preset => (
                        <div
                          key={preset.id}
                          className="p-3 bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 rounded-xl transition flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs">
                              ⭐
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white leading-tight">
                                {preset.name}
                              </div>
                              <span className="text-[9px] text-neutral-500 font-mono">
                                Shape: {preset.visuals?.shape || 'Standard'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLoadPreset(preset)}
                              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-[11px] font-bold transition"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSystemPreset(preset.id, e)}
                              className="p-1.5 bg-neutral-900 hover:bg-red-950 text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-900 rounded-lg transition"
                              title="Delete Preset"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Default Presets Section */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    🏛️ Factory Templates
                  </h4>

                  <div className="space-y-2">
                    {DEFAULT_PARTICLE_SYSTEMS.map(preset => (
                      <div
                        key={preset.id}
                        className="p-3 bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-neutral-800 group-hover:scale-105 transition"
                            style={{ backgroundColor: `${preset.tintColor}20` }}
                          >
                            {preset.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{preset.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                                {preset.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shrink-0"
                        >
                          Apply Preset
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spritesheet Slicer & Pre-Configuration Interactive Modal */}
      {particleSliceModalConfig.isOpen && (
        <SpritesheetSliceModal
          isOpen={particleSliceModalConfig.isOpen}
          onClose={() => setParticleSliceModalConfig({ isOpen: false })}
          onConfirm={handleParticleSliceConfirm}
          project={project}
          initialImage={particleSliceModalConfig.initialImage}
          sheetLabel={particleSliceModalConfig.sheetLabel}
          title="Particle Spritesheet Slicing & Pre-Configuration"
        />
      )}
    </div>
  );
};
