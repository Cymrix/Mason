export type ToolType =
  | 'spray'
  | 'fill'
  | 'colorpick'
  | 'picker'
  | 'pan'
  | 'select'
  | 'measure'
  | 'pencil'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'dither';

export type SprayMode =
  | 'paint'
  | 'pencil'
  | 'flow'
  | 'eraser'
  | 'colorize'
  | 'combine'
  | 'blur'
  | 'path';

export type DabShape = 'circle' | 'square' | 'stamp';
export type BrushShape = DabShape;
export type SprayAngleMode = 'manual' | 'follow_cursor';


export interface BrushSettings {
  size: number;
  shape: DabShape;
  pixelPerfect: boolean;
  symmetry: SymmetryMode;
  dither: DitherPatternType;
  sprayRadius: number;
  sprayDensity: number;
  opacity: number; // 0-100
}

export type GradientStepMode = 'distance' | 'dab';
export type FillMode = 'connected' | 'unconnected';
export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'both';
export type DitherPatternType = 'none' | 'checker50' | 'bayer2' | 'bayer4' | 'bayer8' | 'horizontal' | 'diagonal';
export type BlendModeType = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
export type LoopMode = 'loop' | 'pingpong' | 'once';

export interface PaletteColor {
  id: number;
  hex: string;
}

export interface PaletteGroup {
  id: number;
  name: string;
  isMain?: boolean;
  colors?: PaletteColor[];
  colorRefs?: number[];
  collapsed: boolean;
  columns: number;
}

export interface GradientRamp {
  id: string;
  name: string;
  stops: string[]; // hex array
}

export interface StampAsset {
  id: string;
  name: string;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  pivotX?: number;
  pivotY?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 - 100
  blendMode: BlendModeType;
  canvas: HTMLCanvasElement;
}

export interface SerializableLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendModeType;
  dataUrl: string;
}

export interface AnimationFrame {
  id: string;
  name: string;
  duration: number; // in ms
  layers: Layer[];
}

export interface SerializableFrame {
  id: string;
  name: string;
  duration: number;
  layers: SerializableLayer[];
}

export interface SpriteProjectData {
  version: number;
  name: string;
  width: number;
  height: number;
  fps: number;
  frames: SerializableFrame[];
  currentFrameIndex: number;
  paletteGroups?: PaletteGroup[];
  gradients?: GradientRamp[];
  exportSettings?: {
    exportMode: 'flattened' | 'spritesheet' | 'animation';
    targetFileName?: string;
    cols?: number;
    rows?: number;
    tileWidth?: number;
    tileHeight?: number;
    frameCount?: number;
  };
}

export interface SelectionState {
  x: number;
  y: number;
  w: number;
  h: number;
  floatingCanvas?: HTMLCanvasElement | null;
  isFloating?: boolean;
}

export interface HistoryStep {
  description: string;
  frames: SerializableFrame[];
  width: number;
  height: number;
  activeFrameIndex: number;
  activeLayerIndex: number;
}

export interface SpraySettings {
  mode: SprayMode;
  brushSize: number;
  falloff: number; // 0 - 100%
  density: number; // 0 - 100%
  flow: number; // 0 - 100%
  opacity: number; // 0 - 100%
  pixelPerfect: boolean;
  interpolate: boolean;

  // Dab Shape & Geometry
  dabShape: DabShape;
  dabWidth: number;
  dabHeight: number;
  dabLockAspect: boolean;
  dabRoundness: number; // 0 - 100%

  // Jitter controls
  sizeJitterMin: number; // % (default 100)
  sizeJitterMax: number; // % (default 100)
  dabWidthJitterMin: number;
  dabWidthJitterMax: number;
  dabHeightJitterMin: number;
  dabHeightJitterMax: number;
  opacityJitterMin: number;
  opacityJitterMax: number;
  angleJitterMin: number;
  angleJitterMax: number;

  // Angle & Rotation
  angleMode: SprayAngleMode;
  manualAngle: number; // degrees 0 - 360

  // Taper parameters
  taperEnabled: boolean;
  taperLength: number; // dabs
  taperSizePct: number; // %
  taperSpreadPct: number; // %
  taperOpacityFade: boolean;

  // Gradient sequential options
  sourceKind: 'palette' | 'gradient';
  selectedGradientId: string | null;
  gradientOrdered: boolean;
  gradientStepMode: GradientStepMode;
  gradientCycleLength: number; // in pixels
  gradientDabsPerStep: number;

  // Advanced modes
  seamlessMode: boolean;
  symmetry: SymmetryMode;
  dither: DitherPatternType;
  fillTolerance: number;
  fillMode: FillMode;
}

export interface PalettePreset {
  id: string;
  name: string;
  author?: string;
  colors: string[];
}

