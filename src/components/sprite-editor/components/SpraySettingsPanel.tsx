import React from 'react';
import {
  SpraySettings,
  SprayMode,
  DabShape,
  ToolType,
  SprayAngleMode,
  GradientStepMode
} from '../types';
import {
  Paintbrush,
  Sparkles,
  Pipette,
  Eraser,
  Move,
  Scan,
  Ruler,
  Maximize2,
  Circle,
  Square,
  Compass,
  Sliders,
  ChevronDown,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface SpraySettingsPanelProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  settings: SpraySettings;
  onUpdateSettings: (updater: (prev: SpraySettings) => SpraySettings) => void;
}

export const SpraySettingsPanel: React.FC<SpraySettingsPanelProps> = ({
  activeTool,
  onSelectTool,
  settings,
  onUpdateSettings
}) => {
  const [isJitterOpen, setIsJitterOpen] = React.useState(true);
  const [isTaperOpen, setIsTaperOpen] = React.useState(false);
  const [isGradientSeqOpen, setIsGradientSeqOpen] = React.useState(false);

  const update = <K extends keyof SpraySettings>(key: K, value: SpraySettings[K]) => {
    onUpdateSettings(prev => ({ ...prev, [key]: value }));
  };

  const sprayModes: { id: SprayMode; label: string; desc: string }[] = [
    { id: 'paint', label: 'Paint', desc: 'Standard single/group spray' },
    { id: 'pencil', label: 'Pencil', desc: '1px pixel spray dabs' },
    { id: 'flow', label: 'Continuous Flow', desc: 'Auto-burst timer while held' },
    { id: 'eraser', label: 'Eraser', desc: 'Erase pixel clusters' },
    { id: 'colorize', label: 'Colorize', desc: 'Shift hue/saturation over existing pixels' },
    { id: 'blur', label: 'Blur Soften', desc: 'Soften edges and blend colors' }
  ];

  return (
    <div className="w-64 bg-[#18191e] border-r border-[#262833] flex flex-col h-full overflow-y-auto text-neutral-200 text-xs select-none">
      {/* Primary Tool Switcher Bar */}
      <div className="p-2 border-b border-[#262833] grid grid-cols-4 gap-1">
        <button
          onClick={() => onSelectTool('spray')}
          className={`flex flex-col items-center justify-center p-2 rounded transition-all ${
            activeTool === 'spray'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'hover:bg-neutral-800 text-neutral-400 border border-transparent'
          }`}
          title="Spray / Brush (B)"
        >
          <Paintbrush className="w-4 h-4 mb-1" />
          <span className="text-[10px]">Spray</span>
        </button>

        <button
          onClick={() => onSelectTool('colorpick')}
          className={`flex flex-col items-center justify-center p-2 rounded transition-all ${
            activeTool === 'colorpick' || activeTool === 'picker'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'hover:bg-neutral-800 text-neutral-400 border border-transparent'
          }`}
          title="Color Picker (I)"
        >
          <Pipette className="w-4 h-4 mb-1" />
          <span className="text-[10px]">Pick</span>
        </button>

        <button
          onClick={() => onSelectTool('select')}
          className={`flex flex-col items-center justify-center p-2 rounded transition-all ${
            activeTool === 'select'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'hover:bg-neutral-800 text-neutral-400 border border-transparent'
          }`}
          title="Select Marquee (M)"
        >
          <Scan className="w-4 h-4 mb-1" />
          <span className="text-[10px]">Select</span>
        </button>

        <button
          onClick={() => onSelectTool('pan')}
          className={`flex flex-col items-center justify-center p-2 rounded transition-all ${
            activeTool === 'pan'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'hover:bg-neutral-800 text-neutral-400 border border-transparent'
          }`}
          title="Pan Canvas (Space)"
        >
          <Move className="w-4 h-4 mb-1" />
          <span className="text-[10px]">Pan</span>
        </button>
      </div>

      <div className="p-3 space-y-4 flex-1">
        {/* Spray Mode Selector */}
        <div className="bg-[#1f2027] border border-[#2a2c38] rounded-md p-2.5 space-y-2">
          <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
            Spray Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {sprayModes.map(m => (
              <button
                key={m.id}
                onClick={() => update('mode', m.id)}
                className={`text-left px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                  settings.mode === m.id
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-[#15161b] hover:bg-[#252733] text-neutral-300 border border-[#2d2f3d]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core Brush Parameters */}
        <div className="bg-[#1f2027] border border-[#2a2c38] rounded-md p-2.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
              Spray Dynamics
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              r: {settings.brushSize}px
            </span>
          </div>

          {/* Size / Radius Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Spray Radius</span>
              <span className="font-mono text-neutral-200">{settings.brushSize} px</span>
            </div>
            <input
              type="range"
              min={1}
              max={128}
              value={settings.brushSize}
              onChange={e => update('brushSize', Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Density Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Density (Dabs/Tick)</span>
              <span className="font-mono text-neutral-200">{settings.density}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={settings.density}
              onChange={e => update('density', Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Falloff Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Falloff Distribution</span>
              <span className="font-mono text-neutral-200">{settings.falloff}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.falloff}
              onChange={e => update('falloff', Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Flow Interval (if flow mode active) */}
          {settings.mode === 'flow' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Flow Speed</span>
                <span className="font-mono text-neutral-200">{settings.flow}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={settings.flow}
                onChange={e => update('flow', Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Opacity</span>
              <span className="font-mono text-neutral-200">{settings.opacity}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={settings.opacity}
              onChange={e => update('opacity', Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Interpolation Checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.interpolate}
              onChange={e => update('interpolate', e.target.checked)}
              className="rounded accent-amber-400"
            />
            <span className="text-[11px] text-neutral-300">Stroke Interpolation</span>
          </label>
        </div>

        {/* Dab Geometry & Shapes */}
        <div className="bg-[#1f2027] border border-[#2a2c38] rounded-md p-2.5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
            Dab Geometry
          </span>

          {/* Dab Shape selection */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => update('dabShape', 'circle')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] ${
                settings.dabShape === 'circle'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'bg-[#15161b] text-neutral-400 border border-[#2d2f3d]'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>

            <button
              onClick={() => update('dabShape', 'square')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] ${
                settings.dabShape === 'square'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'bg-[#15161b] text-neutral-400 border border-[#2d2f3d]'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Square</span>
            </button>
          </div>

          {/* Dab Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1">Width (px)</span>
              <input
                type="number"
                min={1}
                max={64}
                value={settings.dabWidth}
                onChange={e => update('dabWidth', Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#15161b] border border-[#2d2f3d] rounded px-2 py-1 text-xs text-neutral-200"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1">Height (px)</span>
              <input
                type="number"
                min={1}
                max={64}
                value={settings.dabHeight}
                disabled={settings.dabLockAspect}
                onChange={e => update('dabHeight', Math.max(1, Number(e.target.value)))}
                className={`w-full bg-[#15161b] border border-[#2d2f3d] rounded px-2 py-1 text-xs text-neutral-200 ${
                  settings.dabLockAspect ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dabLockAspect}
              onChange={e => update('dabLockAspect', e.target.checked)}
              className="rounded accent-amber-400"
            />
            <span className="text-[11px] text-neutral-300">Lock 1:1 Aspect Ratio</span>
          </label>
        </div>

        {/* Collapsible Jitter Controls */}
        <div className="bg-[#1f2027] border border-[#2a2c38] rounded-md overflow-hidden">
          <button
            onClick={() => setIsJitterOpen(!isJitterOpen)}
            className="w-full flex items-center justify-between p-2.5 text-left font-bold text-[11px] text-neutral-300 uppercase tracking-wider hover:bg-[#252733]"
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Jitter & Variations</span>
            </div>
            {isJitterOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isJitterOpen && (
            <div className="p-3 pt-1 space-y-3 border-t border-[#2a2c38]">
              {/* Size Jitter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Size Jitter Range</span>
                  <span className="font-mono text-neutral-200">
                    {settings.sizeJitterMin}% - {settings.sizeJitterMax}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={settings.sizeJitterMin}
                    onChange={e => update('sizeJitterMin', Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                  />
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={settings.sizeJitterMax}
                    onChange={e => update('sizeJitterMax', Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Opacity Jitter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Opacity Jitter Range</span>
                  <span className="font-mono text-neutral-200">
                    {settings.opacityJitterMin}% - {settings.opacityJitterMax}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={settings.opacityJitterMin}
                    onChange={e => update('opacityJitterMin', Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                  />
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={settings.opacityJitterMax}
                    onChange={e => update('opacityJitterMax', Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Angle Jitter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Angle Jitter Range</span>
                  <span className="font-mono text-neutral-200">
                    ±{settings.angleJitterMax}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={settings.angleJitterMax}
                  onChange={e => {
                    const val = Number(e.target.value);
                    onUpdateSettings(prev => ({
                      ...prev,
                      angleJitterMin: -val,
                      angleJitterMax: val
                    }));
                  }}
                  className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                />
              </div>

              {/* Angle Mode Selector */}
              <div className="pt-1">
                <span className="text-[10px] text-neutral-400 block mb-1">Rotation Mode</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => update('angleMode', 'manual')}
                    className={`py-1 rounded text-[11px] ${
                      settings.angleMode === 'manual'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#15161b] text-neutral-400 border border-[#2d2f3d]'
                    }`}
                  >
                    Manual Dial
                  </button>
                  <button
                    onClick={() => update('angleMode', 'follow_cursor')}
                    className={`py-1 rounded text-[11px] ${
                      settings.angleMode === 'follow_cursor'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#15161b] text-neutral-400 border border-[#2d2f3d]'
                    }`}
                  >
                    Follow Cursor
                  </button>
                </div>

                {settings.angleMode === 'manual' && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">Angle: {settings.manualAngle}°</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={settings.manualAngle}
                      onChange={e => update('manualAngle', Number(e.target.value))}
                      className="w-32 accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Stroke Taper */}
        <div className="bg-[#1f2027] border border-[#2a2c38] rounded-md overflow-hidden">
          <button
            onClick={() => setIsTaperOpen(!isTaperOpen)}
            className="w-full flex items-center justify-between p-2.5 text-left font-bold text-[11px] text-neutral-300 uppercase tracking-wider hover:bg-[#252733]"
          >
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Stroke Taper</span>
            </div>
            {isTaperOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isTaperOpen && (
            <div className="p-3 pt-1 space-y-2.5 border-t border-[#2a2c38]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.taperEnabled}
                  onChange={e => update('taperEnabled', e.target.checked)}
                  className="rounded accent-amber-400"
                />
                <span className="text-[11px] text-neutral-300">Enable Stroke Taper</span>
              </label>

              {settings.taperEnabled && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Taper Length (dabs)</span>
                      <span className="font-mono text-neutral-200">{settings.taperLength}</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={64}
                      value={settings.taperLength}
                      onChange={e => update('taperLength', Number(e.target.value))}
                      className="w-full accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.taperOpacityFade}
                      onChange={e => update('taperOpacityFade', e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-[10px] text-neutral-300">Fade Opacity with Taper</span>
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
