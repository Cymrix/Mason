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
  ChevronDown,
  ChevronUp,
  Grid,
  ShieldAlert,
  Layers,
  Navigation
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
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { exportParticleFile, createNewParticleInProject } from '../utils/masonStorage';

interface ParticlesEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles: () => void;
  onBackToDashboard: () => void;
}

interface ParticleInstance {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  lifetime: number;
  maxLifetime: number;
  startSize: number;
  midSize?: number;
  endSize: number;
  sizeCurve: ParticleSizeCurve;
  alphaCurve?: ParticleCurveMode;
  startColor: string;
  startAlpha: number;
  midColor?: string;
  midAlpha?: number;
  endColor: string;
  endAlpha: number;
  shape: ParticleShape;
  customGlyph?: string;
  customSvgPath?: string;
  glowBlurRadius: number;
  blendMode: ParticleBlendMode;
  drag: number;
  startDrag?: number;
  midDrag?: number;
  endDrag?: number;
  dragCurve?: ParticleCurveMode;
  angularDrag: number;
  gravityScale?: number;
  gravityScaleX?: number;
  gravityX: number;
  gravityY: number;
  windSensitivity?: number;
  windForce: number;
  turbulenceJitter: number;
  collides: boolean;
  restitution: number;
  bounces?: number;
  destroyOnCollision: boolean;
  spawnCollisionSparks: boolean;
  isRestingOnFloor?: boolean;
  fxStyle?: ParticleFxStyle;
  isEmissive?: boolean;
  emissiveMode?: ParticleEmissiveMode;
  emissiveStartColor?: string;
  emissiveStartStrength?: number;
  emissiveMidColor?: string;
  emissiveMidStrength?: number;
  emissiveEndColor?: string;
  emissiveEndStrength?: number;
  emissiveCurve?: ParticleCurveMode;
  startRotationDeg?: number;
  midRotationDeg?: number;
  endRotationDeg?: number;
  rotationCurve?: ParticleCurveMode;
  sizeAnimStyle?: ParticleAnimStyle;
  colorAnimStyle?: ParticleAnimStyle;
  emissiveAnimStyle?: ParticleAnimStyle;
  rotationAnimStyle?: ParticleAnimStyle;
  animateSize?: boolean;
  animateColor?: boolean;
  animateAlpha?: boolean;
  animateEmissive?: boolean;
  animateRotation?: boolean;
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
    desc: 'Configure and animate particle size over its lifetime.'
  },
  {
    id: 'color_flow',
    label: '🎨 Color Flow',
    desc: 'Set up starting colors and transition flows.'
  },
  {
    id: 'alpha_opac',
    label: '🏁 Alpha Opacity',
    desc: 'Control alpha transparency and fading curves.'
  },
  {
    id: 'rotation',
    label: '🔄 Rotation & Spin',
    desc: 'Configure starting rotation angles and spin velocity.'
  },
  {
    id: 'launch_speed',
    label: '🚀 Launch Speed',
    desc: 'Adjust min/max speeds of emitted particles.'
  },
  {
    id: 'gravity',
    label: '🪐 Gravity Forces',
    desc: 'Apply horizontal or vertical directional gravity.'
  },
  {
    id: 'drag',
    label: '💧 Fluid Drag',
    desc: 'Settle or slow down movement over time.'
  },
  {
    id: 'wind',
    label: '💨 Wind Forces',
    desc: 'Continuous environmental drift sideways.'
  },
  {
    id: 'angle',
    label: '📐 Angle & Spread',
    desc: 'Launch angle range and turbulence noise.'
  },
  {
    id: 'bloom',
    label: '🔆 Glow Bloom',
    desc: 'Render glowing neon aura shadows.'
  },
  {
    id: 'physics',
    label: '🧱 Solid Map Collision',
    desc: 'Bounce off room borders or platforms.'
  },
  {
    id: 'destroy_on_hit',
    label: '💥 Destroy on Hit',
    desc: 'Despawn instantly when hitting a surface.'
  }
];

export const ParticlesEditor: React.FC<ParticlesEditorProps> = ({
  project,
  onUpdateProject,
  onOpenFiles,
  onBackToDashboard
}) => {
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
  const [activeTab, setActiveTab] = useState<'initialize' | 'animation' | 'spritesheets' | 'presets'>('initialize');
  const [selectedTrack, setSelectedTrack] = useState<'size' | 'color' | 'alpha' | 'emissive' | 'rotation'>('size');
  const [addedProps, setAddedProps] = useState<string[]>([]);
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);

  const visibleTracks = useMemo(() => {
    const list: ('size' | 'color' | 'alpha' | 'emissive' | 'rotation')[] = [];
    if (addedProps.includes('size_curve')) list.push('size');
    if (addedProps.includes('color_flow')) list.push('color');
    if (addedProps.includes('alpha_opac')) list.push('alpha');
    if (addedProps.includes('bloom')) list.push('emissive');
    if (addedProps.includes('rotation')) list.push('rotation');
    return list;
  }, [addedProps]);

  useEffect(() => {
    if (visibleTracks.length > 0 && !visibleTracks.includes(selectedTrack)) {
      setSelectedTrack(visibleTracks[0]);
    }
  }, [visibleTracks, selectedTrack]);

  useEffect(() => {
    // Populate added properties based on loaded system configuration
    const props: string[] = [];
    const k = activeParticleData.kinematics;
    const v = activeParticleData.visuals;
    const ph = activeParticleData.physics;

    if (v.animateSize !== false) props.push('size_curve');
    if (v.animateColor !== false) props.push('color_flow');
    if (v.animateAlpha !== false) props.push('alpha_opac');
    if (v.animateRotation) props.push('rotation');
    if (k.minSpeed !== 0 || k.maxSpeed !== 0) props.push('launch_speed');
    if ((k.gravityX ?? 0) !== 0 || (k.gravityY ?? 0) !== 0) props.push('gravity');
    if (k.drag !== 1.0) props.push('drag');
    if ((k.windForce ?? 0) !== 0) props.push('wind');
    if ((k.angleDeg ?? 270) !== 270 || (k.spreadDeg ?? 45) !== 45 || (k.turbulenceJitter ?? 0) !== 0) props.push('angle');
    if ((v.glowBlurRadius ?? 8) > 0) props.push('bloom');
    if (ph.collideWithMapSolids) props.push('physics');
    if (ph.destroyOnCollision) props.push('destroy_on_hit');

    setAddedProps(props);
  }, [activeParticleData.id]);

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

  const handleAddNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation') => {
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

  const handleDeleteNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', index: number) => {
    const nodes = getTrackNodesForData(activeParticleData.visuals, track);
    if (nodes.length <= 2) {
      showToast("Must have at least Spawn and Death nodes!");
      return;
    }
    const newNodes = nodes.filter((_, i) => i !== index);
    updateTrackNodes(track, newNodes);
  };

  const handleUpdateNode = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', index: number, field: 'time' | 'value', val: any) => {
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

  const generateTrackSvgPath = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', minVal: number, maxVal: number) => {
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
  const particlesRef = useRef<ParticleInstance[]>([]);
  const lastEmitTimeRef = useRef<number>(0);
  const lastBurstTimeRef = useRef<number>(0);
  const nextBurstIntervalRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());
  const pathCacheRef = useRef<Map<string, Path2D>>(new Map());
  const spriteCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detailsSvgRef = useRef<SVGSVGElement | null>(null);

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

      updateActiveParticle(prev => {
        const currentNodes = getTrackNodesForData(prev.visuals, selectedTrack);
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
    };

    const handleGlobalMouseUp = () => {
      setDraggedNodeIndex(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedNodeIndex, selectedTrack]);

  // Update current particle file helper
  const updateActiveParticle = (updater: (prev: ParticleSystemData) => ParticleSystemData) => {
    onUpdateProject(p => {
      const currentFiles = p.fileSystem.particles || particleFiles;
      const currentFile = currentFiles.find(f => f.fileName === activeFile.fileName) || activeFile;
      const currentParticleData = currentFile?.particleData || DEFAULT_PARTICLE_SYSTEMS[0];

      const rawUpdated = updater(currentParticleData);
      let updatedData = { ...rawUpdated };

      if (currentParticleData.visuals && updatedData.visuals) {
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

  const getTrackBounds = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation'): { min: number; max: number } => {
    switch (track) {
      case 'size':
        return { min: 0, max: 80 };
      case 'alpha':
        return { min: 0.0, max: 1.0 };
      case 'emissive':
        return { min: 0, max: 100 };
      case 'rotation':
        return { min: 0, max: 360 };
      case 'color':
      default:
        return { min: 0, max: 1 };
    }
  };

  const valToY = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', val: any, height: number): number => {
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

  const yToVal = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', y: number, height: number): any => {
    const { min, max } = getTrackBounds(track);
    if (track === 'color') {
      return '#ffa500';
    }
    const ratio = (height - y - 12) / (height - 24);
    const clamped = Math.max(0, Math.min(1, ratio));
    const rawVal = min + clamped * (max - min);
    if (track === 'alpha') {
      return Number(clamped.toFixed(2));
    }
    return Math.round(rawVal);
  };

  const getSparklinePath = (track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation', width: number = 100, height: number = 100, margin: number = 6) => {
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
    let curve = 'linear';
    let animStyle: ParticleAnimStyle = 'one_shot';
    let repeats = v.trackRepeats?.[track] ?? 1;

    if (track === 'size') {
      curve = v.sizeCurve || 'linear';
      animStyle = v.sizeAnimStyle || 'one_shot';
    } else if (track === 'color') {
      curve = v.colorCurve || 'linear';
      animStyle = v.colorAnimStyle || 'one_shot';
    } else if (track === 'alpha') {
      curve = v.alphaCurve || 'linear';
      animStyle = v.alphaAnimStyle || 'one_shot';
    } else if (track === 'emissive') {
      curve = v.emissiveCurve || 'linear';
      animStyle = v.emissiveAnimStyle || 'one_shot';
    } else if (track === 'rotation') {
      curve = v.rotationCurve || 'linear';
      animStyle = v.rotationAnimStyle || 'one_shot';
    }

    return { curve, animStyle, repeats };
  };

  const updateSelectedTrackConfig = (field: 'curve' | 'animStyle' | 'repeats', value: any) => {
    updateActiveParticle(p => {
      const v = { ...p.visuals } as any;
      const track = selectedTrack;

      if (field === 'curve') {
        if (track === 'size') v.sizeCurve = value;
        else if (track === 'color') v.colorCurve = value;
        else if (track === 'alpha') v.alphaCurve = value;
        else if (track === 'emissive') v.emissiveCurve = value;
        else if (track === 'rotation') v.rotationCurve = value;
      } else if (field === 'animStyle') {
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
    if (visuals?.trackNodes?.[track]) {
      return visuals.trackNodes[track];
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

    return [{ time: 0, value: 0 }, { time: 1, value: 1 }];
  };

  const evaluateTrackValue = (
    progress: number,
    track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation',
    visuals: any
  ): any => {
    let animStyle: ParticleAnimStyle = 'one_shot';
    let repeatCount = 1;
    let curve: ParticleCurveMode = 'linear';

    if (track === 'size') {
      animStyle = visuals.sizeAnimStyle || 'one_shot';
      repeatCount = visuals.trackRepeats?.size ?? visuals.sizeLoops ?? 1;
      curve = visuals.sizeCurve || 'linear';
    } else if (track === 'color') {
      animStyle = visuals.colorAnimStyle || 'one_shot';
      repeatCount = visuals.trackRepeats?.color ?? visuals.colorLoops ?? 1;
      curve = visuals.colorCurve || 'linear';
    } else if (track === 'alpha') {
      animStyle = visuals.alphaAnimStyle || 'one_shot';
      repeatCount = visuals.trackRepeats?.alpha ?? visuals.alphaLoops ?? 1;
      curve = visuals.alphaCurve || 'linear';
    } else if (track === 'emissive') {
      animStyle = visuals.emissiveAnimStyle || 'one_shot';
      repeatCount = visuals.trackRepeats?.emissive ?? visuals.emissiveLoops ?? 1;
      curve = visuals.emissiveCurve || 'linear';
    } else if (track === 'rotation') {
      animStyle = visuals.rotationAnimStyle || 'one_shot';
      repeatCount = visuals.trackRepeats?.rotation ?? visuals.rotationLoops ?? 1;
      curve = visuals.rotationCurve || 'linear';
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

  // Spawn a burst of particles at given position
  const spawnParticles = (count: number, customOrigin?: { x: number; y: number }) => {
    const data = activeParticleData;
    const origin = customOrigin || emitterPos;
    const { emitter, kinematics, visuals, physics } = data;

    const newParticles: ParticleInstance[] = [];

    const getRandVal = (min: number, max?: number) => {
      if (max === undefined || max <= min) return min;
      return min + Math.random() * (max - min);
    };

    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length + newParticles.length >= (emitter.maxParticles || 300)) {
        break;
      }

      // Calculate initial position based on emitter shape
      let spawnX = origin.x;
      let spawnY = origin.y;

      if (emitter.shape === 'box') {
        spawnX += (Math.random() - 0.5) * (emitter.width || 32);
        spawnY += (Math.random() - 0.5) * (emitter.height || 32);
      } else if (emitter.shape === 'circle') {
        const r = Math.sqrt(Math.random()) * (emitter.radius || 20);
        const theta = Math.random() * Math.PI * 2;
        spawnX += Math.cos(theta) * r;
        spawnY += Math.sin(theta) * r;
      } else if (emitter.shape === 'ring') {
        const theta = Math.random() * Math.PI * 2;
        const r = emitter.radius || 25;
        spawnX += Math.cos(theta) * r;
        spawnY += Math.sin(theta) * r;
      } else if (emitter.shape === 'line') {
        spawnX += (Math.random() - 0.5) * (emitter.width || 48);
      }
      // Calculate launch angle and speed
      const angleDeg = kinematics.angleDeg !== undefined ? kinematics.angleDeg : 270;
      const spreadDeg = kinematics.spreadDeg !== undefined ? kinematics.spreadDeg : 30;
      const baseAngleRad = angleDeg * (Math.PI / 180);
      const spreadRad = ((Math.random() - 0.5) * spreadDeg) * (Math.PI / 180);
      const launchAngle = baseAngleRad + spreadRad;
      // Scale launch speed: 1 unit in UI equals 100 force in physics simulation
      const rawMinSpd = kinematics.minSpeed !== undefined ? kinematics.minSpeed : 0.3;
      const rawMaxSpd = kinematics.maxSpeed !== undefined ? kinematics.maxSpeed : 0.85;
      const effMinSpd = (rawMinSpd > 15 ? rawMinSpd / 100 : rawMinSpd) * 100;
      const effMaxSpd = (rawMaxSpd > 15 ? rawMaxSpd / 100 : rawMaxSpd) * 100;
      const speed = effMinSpd + Math.random() * Math.max(0, effMaxSpd - effMinSpd);

      if (emitter.shape === 'cone') {
        const coneRadius = Math.random() * (emitter.radius || 30);
        spawnX += Math.cos(launchAngle) * coneRadius;
        spawnY += Math.sin(launchAngle) * coneRadius;
      }

      const vx = Math.cos(launchAngle) * speed;
      const vy = Math.sin(launchAngle) * speed;

      const lifetime = visuals.minLifetime + Math.random() * Math.max(0.1, visuals.maxLifetime - visuals.minLifetime);
      const vRot = kinematics.minAngularVelocity + Math.random() * Math.max(0, kinematics.maxAngularVelocity - kinematics.minAngularVelocity);

      const instStartSize = getRandVal(visuals.startSize, visuals.startSizeMax);
      const instMidSize = visuals.midSize !== undefined ? getRandVal(visuals.midSize, visuals.midSizeMax) : undefined;
      const instEndSize = getRandVal(visuals.endSize, visuals.endSizeMax);

      const instStartAlpha = getRandVal(visuals.startAlpha ?? 1.0, visuals.startAlphaMax);
      const instMidAlpha = visuals.midAlpha !== undefined ? getRandVal(visuals.midAlpha, visuals.midAlphaMax) : undefined;
      const instEndAlpha = getRandVal(visuals.endAlpha ?? 0.0, visuals.endAlphaMax);

      const instStartRot = getRandVal(visuals.startRotationDeg ?? 0, visuals.startRotationDegMax);
      const instMidRot = visuals.midRotationDeg !== undefined ? getRandVal(visuals.midRotationDeg, visuals.midRotationDegMax) : undefined;
      const instEndRot = getRandVal(visuals.endRotationDeg ?? 360, visuals.endRotationDegMax);

      const instEmissiveStartStr = getRandVal(visuals.emissiveStartStrength ?? 35, visuals.emissiveStartStrengthMax);
      const instEmissiveMidStr = visuals.emissiveMidStrength !== undefined ? getRandVal(visuals.emissiveMidStrength, visuals.emissiveMidStrengthMax) : undefined;
      const instEmissiveEndStr = getRandVal(visuals.emissiveEndStrength ?? 0, visuals.emissiveEndStrengthMax);

      const getRandDrag = (v1: number, v2?: number) => {
        if (v2 === undefined) return v1;
        return v1 + Math.random() * (v2 - v1);
      };

      const instStartDrag = getRandDrag(kinematics.startDrag ?? kinematics.drag ?? 0.98, kinematics.startDragMax);
      const instMidDrag = kinematics.midDrag !== undefined ? getRandDrag(kinematics.midDrag, kinematics.midDragMax) : undefined;
      const instEndDrag = getRandDrag(kinematics.endDrag ?? kinematics.drag ?? 0.98, kinematics.endDragMax);

      newParticles.push({
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        rotation: instStartRot,
        vRot,
        lifetime: 0,
        maxLifetime: lifetime,
        startSize: instStartSize,
        midSize: instMidSize,
        endSize: instEndSize,
        sizeCurve: visuals.sizeCurve || 'balanced',
        alphaCurve: visuals.alphaCurve || 'balanced',
        startColor: visuals.startColor,
        startAlpha: instStartAlpha,
        midColor: visuals.midColor,
        midAlpha: instMidAlpha,
        endColor: visuals.endColor,
        endAlpha: instEndAlpha,
        shape: visuals.shape || 'glow_circle',
        customGlyph: visuals.customGlyph,
        customSvgPath: visuals.customSvgPath,
        glowBlurRadius: visuals.glowBlurRadius ?? 8,
        blendMode: visuals.blendMode || 'lighter',
        drag: instStartDrag,
        startDrag: instStartDrag,
        midDrag: instMidDrag,
        endDrag: instEndDrag,
        dragCurve: kinematics.dragCurve || 'linear',
        angularDrag: kinematics.angularDrag ?? 0.98,
        gravityScale: kinematics.gravityScale !== undefined ? kinematics.gravityScale : (kinematics.gravityY !== undefined ? kinematics.gravityY / 980 : 0),
        gravityScaleX: kinematics.gravityScaleX !== undefined ? kinematics.gravityScaleX : (kinematics.gravityX !== undefined ? kinematics.gravityX / 980 : 0),
        gravityX: kinematics.gravityX ?? 0,
        gravityY: kinematics.gravityY ?? 0,
        windSensitivity: kinematics.windSensitivity !== undefined ? kinematics.windSensitivity : 1.0,
        windForce: kinematics.windForce ?? 0,
        turbulenceJitter: kinematics.turbulenceJitter ?? 0,
        collides: physics.collideWithMapSolids ?? false,
        restitution: physics.collisionRestitution ?? 0.3,
        bounces: 0,
        destroyOnCollision: physics.destroyOnCollision ?? false,
        spawnCollisionSparks: physics.spawnCollisionSparks ?? false,
        fxStyle: visuals.fxStyle || 'default',
        isEmissive: visuals.isEmissive ?? false,
        emissiveMode: visuals.emissiveMode || 'glow_only',
        emissiveStartColor: visuals.emissiveStartColor || visuals.startColor,
        emissiveStartStrength: instEmissiveStartStr,
        emissiveMidColor: visuals.emissiveMidColor,
        emissiveMidStrength: instEmissiveMidStr,
        emissiveEndColor: visuals.emissiveEndColor || visuals.endColor,
        emissiveEndStrength: instEmissiveEndStr,
        emissiveCurve: visuals.emissiveCurve || 'balanced',
        startRotationDeg: instStartRot,
        midRotationDeg: instMidRot,
        endRotationDeg: instEndRot,
        rotationCurve: visuals.rotationCurve || 'linear',
        sizeAnimStyle: visuals.sizeAnimStyle || 'one_shot',
        colorAnimStyle: visuals.colorAnimStyle || 'one_shot',
        emissiveAnimStyle: visuals.emissiveAnimStyle || 'one_shot',
        rotationAnimStyle: visuals.rotationAnimStyle || 'one_shot',
        animateSize: visuals.animateSize !== false,
        animateColor: visuals.animateColor !== false,
        animateAlpha: visuals.animateAlpha !== false,
        animateEmissive: visuals.animateEmissive !== false,
        animateRotation: visuals.animateRotation !== false
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Main 60fps GPU simulation render loop
  useEffect(() => {
    let animId: number;

    const renderLoop = (now: number) => {
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

      const width = canvas.width;
      const height = canvas.height;
      const floorY = height - 50;

      // Handle continuous stream emission
      if (isPlaying && activeParticleData.emitter.isContinuous) {
        const rateMin = activeParticleData.emitter.emissionRateMin ?? activeParticleData.emitter.emissionRate ?? 20;
        const rateMax = activeParticleData.emitter.emissionRateMax ?? activeParticleData.emitter.emissionRate ?? 20;
        const currentRate = rateMin + Math.random() * (rateMax - rateMin);
        if (currentRate > 0) {
          const emitInterval = 1 / currentRate;
          if (now - lastEmitTimeRef.current >= emitInterval * 1000) {
            const particlesToSpawn = Math.max(1, Math.floor(((now - lastEmitTimeRef.current) / 1000) * currentRate));
            spawnParticles(particlesToSpawn);
            lastEmitTimeRef.current = now;
          }
        }
      }

      // Handle periodic bursts
      const burstEnabled = activeParticleData.emitter.burstEnabled !== false;
      if (isPlaying && burstEnabled) {
        const intervalMin = activeParticleData.emitter.burstIntervalMin ?? activeParticleData.emitter.burstInterval ?? 1.0;
        const intervalMax = activeParticleData.emitter.burstIntervalMax ?? activeParticleData.emitter.burstInterval ?? 1.0;

        if (nextBurstIntervalRef.current === null) {
          nextBurstIntervalRef.current = intervalMin + Math.random() * (intervalMax - intervalMin);
        }

        if (nextBurstIntervalRef.current > 0 && now - lastBurstTimeRef.current >= nextBurstIntervalRef.current * 1000) {
          const countMin = activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 20;
          const countMax = activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 20;
          const countToSpawn = Math.round(countMin + Math.random() * (countMax - countMin));
          
          if (countToSpawn > 0) {
            spawnParticles(countToSpawn);
          }
          lastBurstTimeRef.current = now;
          // Pick next random interval
          nextBurstIntervalRef.current = intervalMin + Math.random() * (intervalMax - intervalMin);
        }
      }

      // Clear full screen
      ctx.clearRect(0, 0, width, height);

      // Fill background screen style
      if (bgTheme === 'grid') {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'dungeon') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'boxes') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#111827');
        bgGrad.addColorStop(1, '#030712');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'forest') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'magma') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1c100b');
        bgGrad.addColorStop(1, '#2c0c04');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'void') {
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 350);
        bgGrad.addColorStop(0, '#2e1065');
        bgGrad.addColorStop(1, '#05020a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'cave') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#064e3b');
        bgGrad.addColorStop(1, '#022c22');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // ===========================================
      // SAVE CONTEXT FOR VIEWPORT ZOOM & PAN TRANSFORM
      // ===========================================
      ctx.save();
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      // Draw Grid & Realistic Scene Geometry in transformed world space
      if (bgTheme === 'grid') {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = -width; x < width * 2; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, -height);
          ctx.lineTo(x, height * 2);
          ctx.stroke();
        }
        for (let y = -height; y < height * 2; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(-width, y);
          ctx.lineTo(width * 2, y);
          ctx.stroke();
        }
      } else if (bgTheme === 'dungeon') {
        // Stone Brick Wall Grid
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 1.5;
        for (let y = 30; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(-width, y);
          ctx.lineTo(width * 2, y);
          ctx.stroke();
        }
        for (let y = 30; y < height; y += 40) {
          const rowOffset = ((y / 40) % 2) * 35;
          for (let x = -width + rowOffset; x < width * 2; x += 70) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 40);
            ctx.stroke();
          }
        }

        // Wall Torch Sconces with animated flames
        const torchTime = performance.now() / 1000;
        const torchLocations = [{ x: 100, y: 180 }, { x: 540, y: 180 }];
        torchLocations.forEach(t => {
          ctx.fillStyle = '#475569';
          ctx.fillRect(t.x - 4, t.y, 8, 20); // Iron bracket
          ctx.fillStyle = '#b45309';
          ctx.fillRect(t.x - 6, t.y - 10, 12, 10); // Wooden torch handle

          // Flame glow
          const flicker = 0.85 + 0.15 * Math.sin(torchTime * 12 + t.x);
          const tGrad = ctx.createRadialGradient(t.x, t.y - 16, 2, t.x, t.y - 16, 32 * flicker);
          tGrad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
          tGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
          tGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          ctx.arc(t.x, t.y - 16, 32 * flicker, 0, Math.PI * 2);
          ctx.fill();
        });

        // Dungeon Stone Pillars
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(140, 140, 50, floorY - 140);
        ctx.fillRect(450, 140, 50, floorY - 140);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(140, 140, 50, floorY - 140);
        ctx.strokeRect(450, 140, 50, floorY - 140);
      } else if (bgTheme === 'boxes') {
        // Wooden Workshop / Storehouse
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-width, 100, width * 3, 8); // Wall beam trim

        // Wall Shelf
        ctx.fillStyle = '#374151';
        ctx.fillRect(80, 140, 160, 12);
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(100, 152, 10, 16);
        ctx.fillRect(210, 152, 10, 16);

        // 3D Box Obstacle A (Crate A)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(180, 260, 80, 80);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(180, 260, 80, 80);
        ctx.beginPath();
        ctx.moveTo(180, 260); ctx.lineTo(260, 340);
        ctx.moveTo(260, 260); ctx.lineTo(180, 340);
        ctx.stroke();

        // 3D Box Obstacle B (Crate B)
        ctx.fillStyle = '#92400e';
        ctx.fillRect(380, 220, 100, 120);
        ctx.strokeStyle = '#451a03';
        ctx.strokeRect(380, 220, 100, 120);
        ctx.beginPath();
        ctx.moveTo(380, 220); ctx.lineTo(480, 340);
        ctx.moveTo(480, 220); ctx.lineTo(380, 340);
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('CRATE A', 198, 305);
        ctx.fillText('CRATE B', 408, 285);
      } else if (bgTheme === 'forest') {
        // Full Moon
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(520, 80, 32, 0, Math.PI * 2);
        ctx.fill();

        // Tree Silhouettes
        ctx.fillStyle = '#064e3b';
        [80, 220, 480, 580].forEach(tx => {
          ctx.fillRect(tx - 12, 160, 24, floorY - 160);
          ctx.beginPath();
          ctx.arc(tx, 140, 45, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (bgTheme === 'cave') {
        // Stalactites & Crystal Clusters
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.moveTo(100, 0); ctx.lineTo(120, 90); ctx.lineTo(140, 0);
        ctx.moveTo(300, 0); ctx.lineTo(325, 110); ctx.lineTo(350, 0);
        ctx.moveTo(480, 0); ctx.lineTo(500, 80); ctx.lineTo(520, 0);
        ctx.fill();

        // Glowing Crystal Clusters on Ground
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(120, 340); ctx.lineTo(128, 290); ctx.lineTo(136, 340);
        ctx.moveTo(132, 340); ctx.lineTo(144, 275); ctx.lineTo(152, 340);
        ctx.fill();
      }

      // Draw Floor Platform in world space
      if (floorCollisionEnabled) {
        ctx.fillStyle = bgTheme === 'boxes' ? '#374151' : (bgTheme === 'forest' ? '#064e3b' : '#334155');
        ctx.fillRect(-width, floorY, width * 3, 4);
        ctx.fillStyle = bgTheme === 'boxes' ? '#1f2937' : (bgTheme === 'forest' ? '#022c22' : '#0f172a');
        ctx.fillRect(-width, floorY + 4, width * 3, height);
        
        ctx.font = '10px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('SOLID FLOOR GEOMETRY (COLLISION PLANE)', 16, floorY + 20);
      }

      // Update & Render Particles in world space
      const aliveParticles: ParticleInstance[] = [];
      const newSparks: ParticleInstance[] = [];

      // Set global composite blend mode & buffer scale
      const targetBlendMode = activeParticleData.visuals.blendMode || 'lighter';
      const resScale = activeParticleData.visuals.renderResolutionScale ?? 1.0;
      const useOffscreenBuffer = resScale < 1.0;

      let renderCtx = ctx;
      let bCtx: CanvasRenderingContext2D | null = null;
      const bufWidth = Math.ceil(width * resScale);
      const bufHeight = Math.ceil(height * resScale);

      if (useOffscreenBuffer) {
        if (!bufferCanvasRef.current) {
          bufferCanvasRef.current = document.createElement('canvas');
        }
        if (bufferCanvasRef.current.width !== bufWidth || bufferCanvasRef.current.height !== bufHeight) {
          bufferCanvasRef.current.width = bufWidth;
          bufferCanvasRef.current.height = bufHeight;
        }
        bCtx = bufferCanvasRef.current.getContext('2d');
        if (bCtx) {
          bCtx.clearRect(0, 0, bufWidth, bufHeight);
          bCtx.imageSmoothingEnabled = false;
          bCtx.save();
          bCtx.scale(resScale, resScale);
          const centerX = width / 2;
          const centerY = height / 2;
          bCtx.translate(centerX + panOffset.x, centerY + panOffset.y);
          bCtx.scale(zoom, zoom);
          bCtx.translate(-centerX, -centerY);
          bCtx.globalCompositeOperation = targetBlendMode;
          renderCtx = bCtx;
        }
      } else {
        ctx.globalCompositeOperation = targetBlendMode;
        ctx.imageSmoothingEnabled = false;
      }

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        if (isPlaying) {
          p.lifetime += dt;
        }

        if (p.lifetime >= p.maxLifetime) {
          continue; // expired
        }

        const progress = Math.min(1, Math.max(0, p.lifetime / p.maxLifetime));

        if (isPlaying) {
          // Physics step - Standardized Earth 1.0G = 980 px/s² gravity
          const effGravityY = (p.gravityScale !== undefined ? p.gravityScale : (p.gravityY / 980)) * 980;
          const effGravityX = (p.gravityScaleX !== undefined ? p.gravityScaleX : (p.gravityX / 980)) * 980;
          const activeWind = simulatedBiomeWindEnabledRef.current ? simulatedBiomeWindRef.current : 0;
          const effWindAcc = (activeWind + p.windForce) * (p.windSensitivity ?? 1.0);

          // Floor collision with custom physics hull & offset
          const colShape = activeParticleData.physics.collisionShape || 'circle';
          const offsetY = activeParticleData.physics.collisionOffset?.y || 0;
          const colScale = activeParticleData.physics.collisionScale ?? 1.0;
          
          let maxYOffset = p.startSize / 2;
          if (colShape === 'box') {
            maxYOffset = (p.startSize / 2) * colScale;
          } else if (colShape === 'triangle' || colShape === 'hexagon' || colShape === 'diamond' || colShape === 'custom_polygon') {
            let pts = activeParticleData.physics.customPolygon;
            if (!pts || pts.length === 0) {
              const preset = POLYGON_PRESETS.find(pr => pr.id === colShape);
              pts = preset ? preset.points : POLYGON_PRESETS[0].points;
            }
            const maxPtY = pts && pts.length > 0 ? Math.max(...pts.map(pt => pt.y)) : 0.5;
            maxYOffset = maxPtY * p.startSize * colScale;
          } else {
            maxYOffset = (p.startSize / 2) * colScale;
          }

          // Check if particle resting on surface should be lifted off by external forces (upward wind or inverted gravity)
          if (p.isRestingOnFloor) {
            if (effGravityY < -10 || effWindAcc < -40) {
              p.isRestingOnFloor = false;
            }
          }

          if (p.isRestingOnFloor) {
            // Particle has depleted its bounce energy and is resting on floor
            p.vy = 0;
            p.vRot *= Math.pow(0.85, dt * 60);

            // Horizontal forces (wind & gravity X) still slide resting particles smoothly
            p.vx += (effGravityX + effWindAcc) * dt;
            p.vx *= Math.pow(0.88, dt * 60); // Surface friction

            p.x += p.vx * dt;
            p.y = floorY - offsetY - maxYOffset;
            p.rotation += p.vRot * dt;
          } else {
            // Free airborne motion
            p.vx += (effGravityX + effWindAcc) * dt;
            p.vy += effGravityY * dt;

            if (p.turbulenceJitter > 0) {
              p.vx += (Math.random() - 0.5) * p.turbulenceJitter;
              p.vy += (Math.random() - 0.5) * p.turbulenceJitter;
            }

            // 3-Keyframe Lifecycle Air Drag Curve
            const currentDrag = evaluate3PointValue(progress, p.startDrag ?? p.drag ?? 0.98, p.endDrag ?? p.drag ?? 0.98, p.midDrag, p.dragCurve || 'linear');
            p.vx *= Math.pow(currentDrag, dt * 60);
            p.vy *= Math.pow(currentDrag, dt * 60);

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Multi-Node Timeline Rotation Curve
            if (p.animateRotation !== false) {
              const evalRot = evaluateTrackValue(progress, 'rotation', activeParticleData.visuals);
              p.rotation = evalRot + (p.vRot * p.lifetime);
            } else {
              p.rotation += p.vRot * dt;
            }
            p.vRot *= Math.pow(p.angularDrag, dt * 60);

            // Behavioral FX Style Motion Modulation
            if (p.fxStyle === 'orbit_swirl') {
              const dx = p.x - emitterPos.x;
              const dy = p.y - emitterPos.y;
              const dist = Math.hypot(dx, dy) + 12;
              const swirlForce = 120 / dist;
              p.vx += (-dy / dist) * swirlForce * dt * 60;
              p.vy += (dx / dist) * swirlForce * dt * 60;
            } else if (p.fxStyle === 'spark_crackle') {
              if (Math.random() < 0.12) {
                p.vx += (Math.random() - 0.5) * 40;
                p.vy += (Math.random() - 0.5) * 40;
              }
            }

            const lowestParticleY = p.y + offsetY + maxYOffset;

            if ((floorCollisionEnabled || p.collides) && lowestParticleY >= floorY) {
              if (p.destroyOnCollision) {
                if (p.spawnCollisionSparks) {
                  for (let s = 0; s < 3; s++) {
                    newSparks.push({
                      ...p,
                      y: floorY - offsetY - maxYOffset - 1,
                      vx: (Math.random() - 0.5) * 60,
                      vy: -Math.random() * 40,
                      lifetime: 0,
                      maxLifetime: 0.3,
                      startSize: 3,
                      endSize: 0,
                      collides: false
                    });
                  }
                }
                continue; // destroy
              } else {
                const restitution = activeParticleData.physics.collisionRestitution !== undefined
                  ? activeParticleData.physics.collisionRestitution
                  : (p.restitution ?? 0.3);

                const maxBounces = activeParticleData.physics.maxBounces;
                const currentBounces = p.bounces || 0;

                p.y = floorY - offsetY - maxYOffset;

                const nextBounceVy = -Math.abs(p.vy) * restitution;
                const isMinBounceThreshold = Math.abs(nextBounceVy) < 12 || Math.abs(p.vy) < 25;

                // Restitution energy depleted -> transition to surface rest without jitter
                if (restitution === 0 || (maxBounces !== undefined && maxBounces > 0 && currentBounces >= maxBounces) || isMinBounceThreshold) {
                  p.vy = 0;
                  p.vx = p.vx * 0.5;
                  p.vRot = 0;
                  p.isRestingOnFloor = true;
                } else {
                  p.bounces = currentBounces + 1;
                  p.vy = nextBounceVy;
                  p.vx = p.vx * (0.8 + 0.2 * restitution);
                  p.vRot = p.vRot * restitution;
                }
              }
            }
          }
        }

        aliveParticles.push(p);

        // Render Particle using pre-rendered offscreen raster sprite
        let size: number;
        if (p.animateSize !== false) {
          size = evaluateTrackValue(progress, 'size', activeParticleData.visuals);
        } else {
          size = p.startSize;
        }

        let alpha: number;
        let r: number, g: number, b: number;

        if (p.animateColor !== false || p.animateAlpha !== false) {
          const colHex = evaluateTrackValue(progress, 'color', activeParticleData.visuals);
          const rgb = hexToRgb(colHex);
          r = rgb.r;
          g = rgb.g;
          b = rgb.b;
          alpha = evaluateTrackValue(progress, 'alpha', activeParticleData.visuals);
        } else {
          const c = hexToRgb(p.startColor);
          r = c.r;
          g = c.g;
          b = c.b;
          alpha = p.startAlpha;
        }

        // Apply FX Style Visual Modulations
        if (p.fxStyle === 'pulse_oscillate') {
          size *= (1 + 0.35 * Math.sin(p.lifetime * 10));
        } else if (p.fxStyle === 'flicker_shimmer') {
          const shimmer = 0.65 + 0.35 * Math.sin(p.lifetime * 28 + p.x * 0.05) * Math.cos(p.lifetime * 16);
          alpha = Math.max(0, Math.min(1, alpha * shimmer));
        } else if (p.fxStyle === 'spark_crackle') {
          if (Math.random() < 0.15) {
            alpha = Math.min(1.0, alpha * 1.6);
          }
        }

        if (size <= 0.1) continue;

        // Render Dynamic Emissive Lighting & Glow Pass
        if (p.isEmissive) {
          let emissiveRadius: number;
          let emissiveColorObj: { alpha: number; r: number; g: number; b: number };

          if (p.animateEmissive !== false) {
            emissiveRadius = Math.max(2, evaluateTrackValue(progress, 'emissive', activeParticleData.visuals));
            const colHex = evaluateTrackValue(progress, 'color', activeParticleData.visuals);
            const rgb = hexToRgb(colHex);
            emissiveColorObj = {
              alpha: evaluateTrackValue(progress, 'alpha', activeParticleData.visuals),
              r: rgb.r,
              g: rgb.g,
              b: rgb.b
            };
          } else {
            emissiveRadius = p.emissiveStartStrength ?? 35;
            const c = hexToRgb(p.emissiveStartColor || p.startColor);
            emissiveColorObj = {
              alpha: p.startAlpha,
              r: c.r,
              g: c.g,
              b: c.b
            };
          }

          if (p.emissiveMode === 'light_up_area' && emissiveRadius > 1) {
            // Cast dynamic radial illumination onto scene geometry & walls
            renderCtx.save();
            renderCtx.globalCompositeOperation = 'screen';
            const lightGrad = renderCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, emissiveRadius * 2.2);
            lightGrad.addColorStop(0, `rgba(${emissiveColorObj.r}, ${emissiveColorObj.g}, ${emissiveColorObj.b}, ${emissiveColorObj.alpha * 0.75})`);
            lightGrad.addColorStop(0.5, `rgba(${emissiveColorObj.r}, ${emissiveColorObj.g}, ${emissiveColorObj.b}, ${emissiveColorObj.alpha * 0.25})`);
            lightGrad.addColorStop(1, `rgba(${emissiveColorObj.r}, ${emissiveColorObj.g}, ${emissiveColorObj.b}, 0)`);
            renderCtx.fillStyle = lightGrad;
            renderCtx.beginPath();
            renderCtx.arc(p.x, p.y, emissiveRadius * 2.2, 0, Math.PI * 2);
            renderCtx.fill();
            renderCtx.restore();
          } else if (p.emissiveMode === 'glow_only' && emissiveRadius > 1) {
            // Soft glowing halo flare
            renderCtx.save();
            renderCtx.globalCompositeOperation = 'lighter';
            const lightGrad = renderCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, emissiveRadius * 1.4);
            lightGrad.addColorStop(0, `rgba(${emissiveColorObj.r}, ${emissiveColorObj.g}, ${emissiveColorObj.b}, ${emissiveColorObj.alpha * 0.5})`);
            lightGrad.addColorStop(1, `rgba(${emissiveColorObj.r}, ${emissiveColorObj.g}, ${emissiveColorObj.b}, 0)`);
            renderCtx.fillStyle = lightGrad;
            renderCtx.beginPath();
            renderCtx.arc(p.x, p.y, emissiveRadius * 1.4, 0, Math.PI * 2);
            renderCtx.fill();
            renderCtx.restore();
          }
        }

        let isSpritesheetDrawn = false;
        if (p.shape === 'spritesheet' && activeParticleData.visuals.spritesheet) {
          const sheet = activeParticleData.visuals.spritesheet;
          const src = sheet.dataUrl || sheet.imageUrl;
          if (src) {
            let img = imageCacheRef.current.get(src);
            if (!img) {
              img = new Image();
              img.src = src;
              imageCacheRef.current.set(src, img);
            }
            if (img.complete && img.width > 0) {
              const cols = sheet.cols || 8;
              const rows = sheet.rows || 1;
              const tw = sheet.tileWidth || 64;
              const th = sheet.tileHeight || 64;
              
              // Calculate frame index over lifetime
              let frameIdx = 0;
              const frameAnimStyle = activeParticleData.visuals.frameAnimStyle || 'loop'; // 'loop' vs 'keyframe'
              if (frameAnimStyle === 'keyframe') {
                const startF = activeParticleData.visuals.startFrameIndex ?? 0;
                const midF = activeParticleData.visuals.midFrameIndex ?? startF;
                const endF = activeParticleData.visuals.endFrameIndex ?? startF;
                frameIdx = Math.round(evaluate3PointValue(progress, startF, endF, midF, 'linear'));
              } else {
                // Loop frames from startFrameIndex to endFrameIndex over lifetime
                const startF = activeParticleData.visuals.startFrameIndex ?? 0;
                const endF = activeParticleData.visuals.endFrameIndex ?? ((sheet.totalFrames || (cols * rows)) - 1);
                const frameRange = endF - startF + 1;
                if (frameRange > 1) {
                  const fps = activeParticleData.visuals.frameRateFps || 12;
                  const elapsedFrames = Math.floor(p.lifetime * fps);
                  if (activeParticleData.visuals.frameLoop !== false) {
                    frameIdx = startF + (elapsedFrames % frameRange);
                  } else {
                    frameIdx = Math.min(endF, startF + elapsedFrames);
                  }
                } else {
                  frameIdx = startF;
                }
              }
              
              // Ensure bounds
              const maxFrames = sheet.totalFrames || (cols * rows);
              frameIdx = Math.max(0, Math.min(maxFrames - 1, frameIdx));
              const col = frameIdx % cols;
              const row = Math.floor(frameIdx / cols);
              
              renderCtx.save();
              renderCtx.translate(p.x, p.y);
              renderCtx.rotate((p.rotation * Math.PI) / 180);
              renderCtx.globalAlpha = alpha;
              
              renderCtx.drawImage(
                img,
                col * tw,
                row * th,
                tw,
                th,
                -size / 2,
                -size / 2,
                size,
                size
              );
              renderCtx.restore();
              isSpritesheetDrawn = true;
            }
          }
        }

        if (!isSpritesheetDrawn) {
          const spriteCanvas = getOrCreateParticleSprite(
            p.shape,
            p.customGlyph,
            p.customSvgPath,
            p.glowBlurRadius,
            `${r},${g},${b}`
          );

          renderCtx.save();
          renderCtx.translate(p.x, p.y);
          renderCtx.rotate((p.rotation * Math.PI) / 180);
          renderCtx.globalAlpha = alpha;
          renderCtx.drawImage(spriteCanvas, -size / 2, -size / 2, size, size);
          renderCtx.restore();
        }
      }

      if (useOffscreenBuffer && bCtx && bufferCanvasRef.current) {
        bCtx.restore(); // Restore bCtx transform matrix back to identity
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen space identity matrix
        ctx.globalCompositeOperation = targetBlendMode;
        ctx.imageSmoothingEnabled = false; // Nearest-neighbor pixel-perfect buffer scaling
        ctx.drawImage(bufferCanvasRef.current, 0, 0, bufWidth, bufHeight, 0, 0, width, height);
        ctx.restore();
      }

      particlesRef.current = [...aliveParticles, ...newSparks];
      setActiveParticleCount(particlesRef.current.length);

      // Draw Physics Debug Wireframe Hull Overlay
      if (showCollisionWireframeRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        const colShape = activeParticleData.physics.collisionShape || 'circle';
        const offsetX = activeParticleData.physics.collisionOffset?.x || 0;
        const offsetY = activeParticleData.physics.collisionOffset?.y || 0;
        const colScale = activeParticleData.physics.collisionScale ?? 1.0;

        let pts = activeParticleData.physics.customPolygon;
        if (!pts || pts.length === 0) {
          const preset = POLYGON_PRESETS.find(pr => pr.id === colShape);
          pts = preset ? preset.points : POLYGON_PRESETS[0].points;
        }

        const drawHullAt = (x: number, y: number, rotationDeg: number, baseSize: number) => {
          const effectiveSize = baseSize * colScale;
          ctx.save();
          ctx.translate(x + offsetX, y + offsetY);
          ctx.rotate((rotationDeg * Math.PI) / 180);

          ctx.strokeStyle = '#06b6d4'; // Cyan 500
          ctx.lineWidth = 1.5 / zoom;
          ctx.setLineDash([4 / zoom, 3 / zoom]);

          if (colShape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, effectiveSize / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else if (colShape === 'box') {
            const half = effectiveSize / 2;
            ctx.strokeRect(-half, -half, effectiveSize, effectiveSize);
          } else if (pts && pts.length > 0) {
            ctx.beginPath();
            pts.forEach((pt, idx) => {
              const vx = pt.x * effectiveSize;
              const vy = pt.y * effectiveSize;
              if (idx === 0) ctx.moveTo(vx, vy);
              else ctx.lineTo(vx, vy);
            });
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            pts.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x * effectiveSize, pt.y * effectiveSize, 3 / zoom, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          // Center offset crosshair
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2 / zoom;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(-5 / zoom, 0); ctx.lineTo(5 / zoom, 0);
          ctx.moveTo(0, -5 / zoom); ctx.lineTo(0, 5 / zoom);
          ctx.stroke();

          ctx.restore();
        };

        if (particlesRef.current.length > 0) {
          for (let i = 0; i < particlesRef.current.length; i++) {
            const p = particlesRef.current[i];
            const progress = Math.min(1, Math.max(0, p.lifetime / p.maxLifetime));
            const currentSize = evaluateSize(progress, p.startSize, p.endSize, p.midSize, p.sizeCurve);
            if (currentSize > 0.1) {
              drawHullAt(p.x, p.y, p.rotation, currentSize);
            }
          }
        } else {
          // Preview hull at emitter anchor when 0 active particles exist
          const previewSize = activeParticleData.emitter.width || activeParticleData.emitter.radius || 32;
          drawHullAt(emitterPos.x, emitterPos.y, 0, previewSize);
        }

        ctx.restore();
      }

      // Draw Emitter Anchor & Bounds Gizmo in transformed world space
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.translate(emitterPos.x, emitterPos.y);

      const emitterShape = activeParticleData.emitter.shape;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([3, 3]);

      if (emitterShape === 'box') {
        const ew = activeParticleData.emitter.width || 32;
        const eh = activeParticleData.emitter.height || 32;
        ctx.strokeRect(-ew / 2, -eh / 2, ew, eh);
      } else if (emitterShape === 'circle' || emitterShape === 'ring') {
        const er = activeParticleData.emitter.radius || 24;
        ctx.beginPath();
        ctx.arc(0, 0, er, 0, Math.PI * 2);
        ctx.stroke();
      } else if (emitterShape === 'line') {
        const ew = activeParticleData.emitter.width || 48;
        ctx.beginPath();
        ctx.moveTo(-ew / 2, 0);
        ctx.lineTo(ew / 2, 0);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Center crosshair anchor
      ctx.fillStyle = isDraggingEmitter ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 6 / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      // Launch direction indicator arrow & cone spread gizmo
      const dirAngleDeg = activeParticleData.kinematics.angleDeg !== undefined ? activeParticleData.kinematics.angleDeg : 270;
      const spreadDeg = activeParticleData.kinematics.spreadDeg || 0;
      const angleRad = dirAngleDeg * (Math.PI / 180);
      const spreadHalfRad = (spreadDeg / 2) * (Math.PI / 180);
      const arrowLength = 36 / zoom;

      // Cone spread arc fan
      if (spreadDeg > 0) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, arrowLength, angleRad - spreadHalfRad, angleRad + spreadHalfRad);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Center launch arrow
      const arrowX = Math.cos(angleRad) * arrowLength;
      const arrowY = Math.sin(angleRad) * arrowLength;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();

      // Arrow head
      const headLen = 8 / zoom;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - headLen * Math.cos(angleRad - Math.PI / 6),
        arrowY - headLen * Math.sin(angleRad - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - headLen * Math.cos(angleRad + Math.PI / 6),
        arrowY - headLen * Math.sin(angleRad + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Restore zoom transform
      ctx.restore();

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

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldX = (mouseX - (centerX + panOffset.x)) / zoom + centerX;
    const worldY = (mouseY - (centerY + panOffset.y)) / zoom + centerY;

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

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const zoomRatio = nextZoom / zoom;

    // Shift pan offset to keep mouse position fixed in world space during zoom
    const nextPanX = (mouseX - centerX) - (mouseX - centerX - panOffset.x) * zoomRatio;
    const nextPanY = (mouseY - centerY) - (mouseY - centerY - panOffset.y) * zoomRatio;

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
    particlesRef.current = [];
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
    updateActiveParticle(() => ({
      ...JSON.parse(JSON.stringify(preset)),
      id: activeParticleData.id,
      name: activeParticleData.name
    }));
    particlesRef.current = [];
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
        accentColor="amber"
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
          particlesRef.current = [];
        }}
        onNewFile={(name) => {
          const template = DEFAULT_PARTICLE_SYSTEMS[0];
          const { project: updatedProj, newFile } = createNewParticleInProject(
            project,
            name,
            template
          );
          onUpdateProject(() => updatedProj);
          particlesRef.current = [];
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
                  particlesRef.current = [];
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
            <div className="absolute top-6 right-6 z-20 flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 p-1 rounded-xl shadow-xl">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-400 hover:bg-neutral-800 transition"
                title="Reset Zoom & Pan (100%)"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoom(z => Math.min(4.0, parseFloat((z + 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              <div className="w-px h-4 bg-neutral-800 my-auto" />

              <button
                type="button"
                onClick={() => setCanvasTool(t => t === 'pan' ? 'select' : 'pan')}
                className={`p-1.5 rounded-lg transition ${
                  canvasTool === 'pan' ? 'bg-amber-600 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="Pan Tool (or Right-click / Middle-click / Space drag)"
              >
                <Hand size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmitterPos({ x: 320, y: 220 });
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Center Emitter Anchor"
              >
                <Target size={14} />
              </button>
            </div>

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

                    {/* Emitter Dimensions */}
                    {(activeParticleData.emitter.shape === 'box' || activeParticleData.emitter.shape === 'line') && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Width (px)</label>
                          <input
                            type="number"
                            min="2"
                            max="600"
                            value={activeParticleData.emitter.width || 32}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, width: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        {activeParticleData.emitter.shape === 'box' && (
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Height (px)</label>
                            <input
                              type="number"
                              min="2"
                              max="400"
                              value={activeParticleData.emitter.height || 32}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, height: Number(e.target.value) } }))}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Circle Radius */}
                    {activeParticleData.emitter.shape === 'circle' && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Circle Radius (px)</label>
                        <input
                          type="number"
                          min="2"
                          max="300"
                          value={activeParticleData.emitter.radius || 40}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, emitter: { ...p.emitter, radius: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

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
                        <option value="custom_glyph">Procedural Character Glyph</option>
                        <option value="svg_path">Custom Vector SVG Path</option>
                        <option value="spritesheet">Animated Spritesheet Atlas</option>
                      </select>
                    </div>

                    {/* Custom glyph / svg inputs if active */}
                    {activeParticleData.visuals.shape === 'custom_glyph' && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Custom Character / Symbol / Emoji</label>
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'size_curve'));
                          updateActiveParticle(p => ({
                            ...p,
                            visuals: { ...p.visuals, animateSize: false }
                          }));
                        }}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Size Curve Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Start Size (px)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={activeParticleData.visuals.startSize}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startSize: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">End Size (px)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={activeParticleData.visuals.endSize || 2}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, endSize: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Animates from start size to end size. Go to the Animation tab to customize nodes or use a curve envelope.
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'color_flow'));
                          updateActiveParticle(p => ({
                            ...p,
                            visuals: { ...p.visuals, animateColor: false }
                          }));
                        }}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Color Flow Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Start Color</label>
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
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">End Color</label>
                          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                            <input
                              type="color"
                              value={activeParticleData.visuals.endColor || '#000000'}
                              onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, endColor: e.target.value } }))}
                              className="w-8 h-6 bg-transparent rounded cursor-pointer border-none"
                            />
                            <span className="font-mono text-[10px] text-neutral-400 uppercase">{activeParticleData.visuals.endColor || '#000000'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Animates the color over time. Go to the Animation tab to add multi-color keyframe nodes or use a flow preset.
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'alpha_opac'));
                          updateActiveParticle(p => ({
                            ...p,
                            visuals: { ...p.visuals, animateAlpha: false }
                          }));
                        }}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove Alpha Opacity Module"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Start Alpha</label>
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
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">End Alpha</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={activeParticleData.visuals.endAlpha ?? 0.0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, endAlpha: Number(e.target.value) } }))}
                            className="w-full accent-amber-500"
                          />
                          <div className="text-right text-[9px] font-mono text-neutral-400 mt-0.5">{Math.round((activeParticleData.visuals.endAlpha ?? 0.0) * 100)}%</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Animates opacity curves. Go to the Animation tab to adjust fade in/out curves and envelope rates.
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'rotation'));
                          updateActiveParticle(p => ({
                            ...p,
                            visuals: { ...p.visuals, animateRotation: false },
                            kinematics: { ...p.kinematics, minAngularVelocity: 0, maxAngularVelocity: 0 }
                          }));
                        }}
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
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Start Rot (deg)</label>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={activeParticleData.visuals.startRotationDeg ?? 0}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, startRotationDeg: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">End Rot (deg)</label>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={activeParticleData.visuals.endRotationDeg ?? 360}
                            onChange={(e) => updateActiveParticle(p => ({ ...p, visuals: { ...p.visuals, endRotationDeg: Number(e.target.value) } }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">
                        Animates rotation angle and spin torque. Go to the Animation tab to customize easing or repeat curves.
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'launch_speed'));
                          updateActiveParticle(p => ({
                            ...p,
                            kinematics: { ...p.kinematics, minSpeed: 0, maxSpeed: 0 }
                          }));
                        }}
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'gravity'));
                          updateActiveParticle(p => ({
                            ...p,
                            kinematics: { ...p.kinematics, gravityX: 0, gravityY: 0 }
                          }));
                        }}
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

                {addedProps.includes('drag') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>💧 Fluid Drag</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'drag'));
                          updateActiveParticle(p => ({
                            ...p,
                            kinematics: { ...p.kinematics, drag: 1.0 }
                          }));
                        }}
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

                {addedProps.includes('wind') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>💨 Wind Forces</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'wind'));
                          updateActiveParticle(p => ({
                            ...p,
                            kinematics: { ...p.kinematics, windForce: 0 }
                          }));
                        }}
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'angle'));
                          updateActiveParticle(p => ({
                            ...p,
                            kinematics: { ...p.kinematics, angleDeg: 270, spreadDeg: 45, turbulenceJitter: 0 }
                          }));
                        }}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove angle parameters"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs grid grid-cols-3 gap-1.5">
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
                          value={activeParticleData.kinematics.spreadDeg ?? 45}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, spreadDeg: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block mb-1">Turbulence</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeParticleData.kinematics.turbulenceJitter ?? 0}
                          onChange={(e) => updateActiveParticle(p => ({ ...p, kinematics: { ...p.kinematics, turbulenceJitter: Number(e.target.value) } }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'bloom'));
                          updateActiveParticle(p => ({
                            ...p,
                            visuals: { ...p.visuals, glowBlurRadius: 0 }
                          }));
                        }}
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

                {addedProps.includes('physics') && (
                  <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🧱 Solid Map Collision</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'physics'));
                          updateActiveParticle(p => ({
                            ...p,
                            physics: { ...p.physics, collideWithMapSolids: false }
                          }));
                        }}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
                        title="Remove collision parameters"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-950/20 text-xs space-y-3">
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
                        onClick={() => {
                          setAddedProps(prev => prev.filter(p => p !== 'destroy_on_hit'));
                          updateActiveParticle(p => ({
                            ...p,
                            physics: { ...p.physics, destroyOnCollision: false }
                          }));
                        }}
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

                {/* 4. Dropdown list to add new parameters */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-2 tracking-wider">Add Customizable Parameters</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AVAILABLE_INITIALIZE_PROPS.map(p => {
                      const alreadyAdded = addedProps.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => {
                            setAddedProps(prev => [...prev, p.id]);
                            if (p.id === 'size_curve') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                visuals: { ...pr.visuals, animateSize: true }
                              }));
                            } else if (p.id === 'color_flow') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                visuals: { ...pr.visuals, animateColor: true }
                              }));
                            } else if (p.id === 'alpha_opac') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                visuals: { ...pr.visuals, animateAlpha: true }
                              }));
                            } else if (p.id === 'rotation') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                visuals: { ...pr.visuals, animateRotation: true },
                                kinematics: { ...pr.kinematics, minAngularVelocity: -90, maxAngularVelocity: 90 }
                              }));
                            } else if (p.id === 'launch_speed') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                kinematics: { ...pr.kinematics, minSpeed: 60, maxSpeed: 140 }
                              }));
                            } else if (p.id === 'gravity') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                kinematics: { ...pr.kinematics, gravityY: 180, gravityX: 0 }
                              }));
                            } else if (p.id === 'drag') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                kinematics: { ...pr.kinematics, drag: 0.98 }
                              }));
                            } else if (p.id === 'wind') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                kinematics: { ...pr.kinematics, windForce: 30 }
                              }));
                            } else if (p.id === 'angle') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                kinematics: { ...pr.kinematics, angleDeg: 270, spreadDeg: 45, turbulenceJitter: 0 }
                              }));
                            } else if (p.id === 'bloom') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                visuals: { ...pr.visuals, glowBlurRadius: 8 }
                              }));
                            } else if (p.id === 'physics') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                physics: { ...pr.physics, collideWithMapSolids: true, collisionRestitution: 0.4 }
                              }));
                            } else if (p.id === 'destroy_on_hit') {
                              updateActiveParticle(pr => ({
                                ...pr,
                                physics: { ...pr.physics, destroyOnCollision: true }
                              }));
                            }
                          }}
                          className={`p-2 rounded-lg text-left border text-[10px] flex flex-col font-bold transition duration-150 ${
                            alreadyAdded
                              ? 'bg-neutral-950/20 border-neutral-900 text-neutral-600 cursor-not-allowed'
                              : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:border-amber-500/50 hover:bg-neutral-900'
                          }`}
                        >
                          <span className="text-white font-extrabold">{p.label}</span>
                          <span className="text-[8.5px] font-normal text-neutral-500 mt-0.5 leading-snug">{p.desc}</span>
                        </button>
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
                          style={{ left: `calc(110px + ${scrubberProgress * 100}% - ${scrubberProgress * 6}px)` }}
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
                                // Draw color stops as a beautiful line
                                <path
                                  d="M 0,50 L 100,50"
                                  fill="none"
                                  stroke="url(#colorTrackGradDetails)"
                                  strokeWidth="6"
                                  vectorEffect="non-scaling-stroke"
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

                  <div className="border border-dashed border-neutral-800 rounded-lg p-4 bg-neutral-900/30 flex flex-col items-center justify-center text-center space-y-2 relative">
                    <Upload size={24} className="text-neutral-500" />
                    <div>
                      <div className="text-xs font-bold text-neutral-300">Upload Atlas PNG</div>
                      <p className="text-[9px] text-neutral-500">Supports transparent pixel sheets</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result as string;
                            if (dataUrl) {
                              updateActiveParticle(p => ({
                                ...p,
                                visuals: {
                                  ...p.visuals,
                                  shape: 'spritesheet',
                                  spritesheet: {
                                    id: `spritesheet_${Date.now()}`,
                                    name: file.name,
                                    imageUrl: dataUrl,
                                    dataUrl: dataUrl,
                                    tileWidth: 64,
                                    tileHeight: 64,
                                    cols: 8,
                                    rows: 1,
                                    totalFrames: 8,
                                    splitMode: 'columns'
                                  }
                                }
                              }));
                              showToast('Uploaded particle spritesheet successfully!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

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
    </div>
  );
};
