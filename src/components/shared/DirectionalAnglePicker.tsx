import React, { useState, useRef, useCallback } from 'react';
import { ParticleDirectionRange } from '../../engine/masonProjectSchema';
import { Compass, Plus, Minus, Trash2, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';

export interface DirectionalAnglePickerProps {
  angleDeg: number;
  spreadDeg: number;
  directionRanges?: ParticleDirectionRange[];
  onChange: (angleDeg: number, spreadDeg: number, directionRanges?: ParticleDirectionRange[]) => void;
  onRemoveParam?: () => void;
}

const RANGE_COLORS = [
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', label: 'amber' },
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.25)', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50', label: 'cyan' },
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50', label: 'emerald' },
  { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.25)', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/50', label: 'violet' },
];

export const DirectionalAnglePicker: React.FC<DirectionalAnglePickerProps> = ({
  angleDeg,
  spreadDeg,
  directionRanges,
  onChange,
  onRemoveParam,
}) => {
  const [activeRangeIdx, setActiveRangeIdx] = useState<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Normalize ranges array to ensure we have a valid list if populated, or fallback to single primary angle/spread
  const currentRanges: ParticleDirectionRange[] = (directionRanges && directionRanges.length > 0)
    ? directionRanges
    : [{ angleDeg, spreadDeg, weight: 1, enabled: true, label: 'Range 1' }];

  const activeIdx = Math.min(activeRangeIdx, currentRanges.length - 1);
  const activeRange = currentRanges[activeIdx] || currentRanges[0];

  const updateRanges = (newRanges: ParticleDirectionRange[]) => {
    // Sync primary angle and spread with Range 1 for backwards compatibility
    const primary = newRanges[0] || { angleDeg: 270, spreadDeg: 30 };
    onChange(primary.angleDeg, primary.spreadDeg, newRanges.length > 1 ? newRanges : (newRanges.length === 1 && (newRanges[0].angleDeg !== angleDeg || newRanges[0].spreadDeg !== spreadDeg) ? newRanges : undefined));
  };

  const handleAngleChangeForActive = (newAngle: number) => {
    const updated = currentRanges.map((r, i) => i === activeIdx ? { ...r, angleDeg: (newAngle + 360) % 360 } : r);
    updateRanges(updated);
  };

  const handleSpreadChangeForActive = (newSpread: number) => {
    const updated = currentRanges.map((r, i) => i === activeIdx ? { ...r, spreadDeg: Math.max(0, Math.min(360, newSpread)) } : r);
    updateRanges(updated);
  };

  const handleWeightChangeForActive = (newWeight: number) => {
    const updated = currentRanges.map((r, i) => i === activeIdx ? { ...r, weight: Math.max(1, Math.min(10, newWeight)) } : r);
    updateRanges(updated);
  };

  const handleToggleEnable = (idx: number) => {
    const updated = currentRanges.map((r, i) => i === idx ? { ...r, enabled: r.enabled === false ? true : false } : r);
    updateRanges(updated);
  };

  const handleAddRange = () => {
    if (currentRanges.length >= 4) return;
    const defaultAngles = [270, 0, 90, 180]; // N, E, S, W
    const nextAngle = defaultAngles[currentRanges.length] ?? ((currentRanges[currentRanges.length - 1].angleDeg + 90) % 360);
    const newRange: ParticleDirectionRange = {
      angleDeg: nextAngle,
      spreadDeg: 30,
      weight: 1,
      enabled: true,
      label: `Range ${currentRanges.length + 1}`
    };
    const updated = [...currentRanges, newRange];
    setActiveRangeIdx(updated.length - 1);
    updateRanges(updated);
  };

  const handleRemoveRange = (idx: number) => {
    if (currentRanges.length <= 1) return;
    const updated = currentRanges.filter((_, i) => i !== idx);
    setActiveRangeIdx(Math.max(0, idx - 1));
    updateRanges(updated);
  };

  // Preset Handlers
  const applyPreset4Cardinal = () => {
    const cardinalRanges: ParticleDirectionRange[] = [
      { angleDeg: 270, spreadDeg: 20, weight: 1, enabled: true, label: 'North (Up)' },
      { angleDeg: 0, spreadDeg: 20, weight: 1, enabled: true, label: 'East (Right)' },
      { angleDeg: 90, spreadDeg: 20, weight: 1, enabled: true, label: 'South (Down)' },
      { angleDeg: 180, spreadDeg: 20, weight: 1, enabled: true, label: 'West (Left)' },
    ];
    setActiveRangeIdx(0);
    updateRanges(cardinalRanges);
  };

  const applyPreset2Horizontal = () => {
    const hRanges: ParticleDirectionRange[] = [
      { angleDeg: 0, spreadDeg: 30, weight: 1, enabled: true, label: 'Right' },
      { angleDeg: 180, spreadDeg: 30, weight: 1, enabled: true, label: 'Left' },
    ];
    setActiveRangeIdx(0);
    updateRanges(hRanges);
  };

  const applyPreset2Vertical = () => {
    const vRanges: ParticleDirectionRange[] = [
      { angleDeg: 270, spreadDeg: 30, weight: 1, enabled: true, label: 'Up' },
      { angleDeg: 90, spreadDeg: 30, weight: 1, enabled: true, label: 'Down' },
    ];
    setActiveRangeIdx(0);
    updateRanges(vRanges);
  };

  const applyPresetSingle = () => {
    const singleRange: ParticleDirectionRange[] = [
      { angleDeg: activeRange.angleDeg ?? 270, spreadDeg: activeRange.spreadDeg ?? 30, weight: 1, enabled: true, label: 'Range 1' }
    ];
    setActiveRangeIdx(0);
    onChange(singleRange[0].angleDeg, singleRange[0].spreadDeg, undefined);
  };

  // Circle mouse interaction
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateAngleFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    updateAngleFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    isDraggingRef.current = false;
  };

  const updateAngleFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    let rad = Math.atan2(y, x);
    let deg = Math.round((rad * 180 / Math.PI + 360) % 360);
    handleAngleChangeForActive(deg);
  };

  // Helper to draw SVG wedge path
  const CX = 100;
  const CY = 100;
  const R = 72;

  const getWedgePath = (aDeg: number, sDeg: number) => {
    if (sDeg >= 360) {
      return `M ${CX - R} ${CY} A ${R} ${R} 0 1 0 ${CX + R} ${CY} A ${R} ${R} 0 1 0 ${CX - R} ${CY}`;
    }
    if (sDeg <= 0) {
      const rad = aDeg * Math.PI / 180;
      const x = CX + R * Math.cos(rad);
      const y = CY + R * Math.sin(rad);
      return `M ${CX} ${CY} L ${x} ${y}`;
    }
    const startAngle = (aDeg - sDeg / 2 + 360) % 360;
    const endAngle = (aDeg + sDeg / 2 + 360) % 360;

    const startRad = startAngle * Math.PI / 180;
    const endRad = endAngle * Math.PI / 180;

    const x1 = CX + R * Math.cos(startRad);
    const y1 = CY + R * Math.sin(startRad);
    const x2 = CX + R * Math.cos(endRad);
    const y2 = CY + R * Math.sin(endRad);

    const largeArc = sDeg > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Compass size={15} className="text-amber-400" />
          <span>Angle & Direction Spread</span>
          <span className="text-[10px] text-neutral-400 font-mono font-normal">
            ({currentRanges.length} {currentRanges.length === 1 ? 'range' : 'ranges'})
          </span>
        </div>
        {onRemoveParam && (
          <button
            type="button"
            onClick={onRemoveParam}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
            title="Remove angle parameters"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Quick Direction Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-neutral-800/60 text-[10px]">
          <span className="text-neutral-500 font-medium mr-1">Presets:</span>
          <button
            type="button"
            onClick={applyPresetSingle}
            className={`px-2 py-0.5 rounded border transition ${
              currentRanges.length === 1
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Single Cone
          </button>
          <button
            type="button"
            onClick={applyPreset4Cardinal}
            className={`px-2 py-0.5 rounded border transition ${
              currentRanges.length === 4
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            4 Cardinals (N, E, S, W)
          </button>
          <button
            type="button"
            onClick={applyPreset2Horizontal}
            className="px-2 py-0.5 rounded border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            ↔️ Horizontal
          </button>
          <button
            type="button"
            onClick={applyPreset2Vertical}
            className="px-2 py-0.5 rounded border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            ↕️ Vertical
          </button>
        </div>

        {/* Circular Radar Canvas & Direction Range Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* SVG Direction Compass Wheel */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-2 bg-neutral-950 rounded-xl border border-neutral-800/80 relative">
            <svg
              ref={svgRef}
              viewBox="0 0 200 200"
              className="w-44 h-44 cursor-crosshair touch-none select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Outer Dial Circle */}
              <circle cx={CX} cy={CY} r={R} fill="#0a0a0a" stroke="#262626" strokeWidth="2" />
              <circle cx={CX} cy={CY} r={R * 0.5} fill="none" stroke="#171717" strokeDasharray="3 3" />

              {/* Crosshairs & Cardinal Labels */}
              <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="#262626" strokeWidth="1" />
              <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#262626" strokeWidth="1" />

              {/* Cardinal Text */}
              <text x={CX} y={CY - R + 13} fill="#a3a3a3" fontSize="9" fontWeight="bold" textAnchor="middle">N (270°)</text>
              <text x={CX + R - 13} y={CY + 3} fill="#a3a3a3" fontSize="9" fontWeight="bold" textAnchor="middle">E (0°)</text>
              <text x={CX} y={CY + R - 5} fill="#a3a3a3" fontSize="9" fontWeight="bold" textAnchor="middle">S (90°)</text>
              <text x={CX - R + 14} y={CY + 3} fill="#a3a3a3" fontSize="9" fontWeight="bold" textAnchor="middle">W (180°)</text>

              {/* Render all Direction Wedges */}
              {currentRanges.map((r, idx) => {
                if (r.enabled === false) return null;
                const style = RANGE_COLORS[idx % RANGE_COLORS.length];
                const isActive = idx === activeIdx;
                const pathD = getWedgePath(r.angleDeg, r.spreadDeg);
                const rad = r.angleDeg * Math.PI / 180;
                const handleX = CX + R * Math.cos(rad);
                const handleY = CY + R * Math.sin(rad);

                return (
                  <g key={idx} className="transition-opacity duration-150">
                    <path
                      d={pathD}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      strokeDasharray={isActive ? undefined : '4 2'}
                      opacity={isActive ? 1 : 0.6}
                    />
                    {/* Direction ray line */}
                    <line
                      x1={CX}
                      y1={CY}
                      x2={handleX}
                      y2={handleY}
                      stroke={style.stroke}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    {/* Handle node */}
                    <circle
                      cx={handleX}
                      cy={handleY}
                      r={isActive ? 6 : 4}
                      fill={style.stroke}
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Center Pivot Point */}
              <circle cx={CX} cy={CY} r="4" fill="#fbbf24" stroke="#000" strokeWidth="1" />
            </svg>

            <span className="text-[9px] text-neutral-500 font-mono mt-1">
              Click or drag wheel to point active range
            </span>
          </div>

          {/* Direction Range Configuration Panel */}
          <div className="md:col-span-7 space-y-2.5">
            {/* Range Tabs (up to 4) */}
            <div className="flex items-center justify-between gap-1 border-b border-neutral-800 pb-2 overflow-x-auto">
              <div className="flex items-center gap-1">
                {currentRanges.map((r, idx) => {
                  const style = RANGE_COLORS[idx % RANGE_COLORS.length];
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveRangeIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                        isActive
                          ? `${style.bg} ${style.border} ${style.text}`
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.stroke }} />
                      <span>Dir {idx + 1}</span>
                      <span className="text-[9px] font-mono opacity-80">{r.angleDeg}°</span>
                    </button>
                  );
                })}
              </div>

              {currentRanges.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddRange}
                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  title="Add direction range (up to 4)"
                >
                  <Plus size={12} />
                  <span>Add (Max 4)</span>
                </button>
              )}
            </div>

            {/* Active Range Parameter Controls */}
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: RANGE_COLORS[activeIdx % RANGE_COLORS.length].stroke }}
                  />
                  <input
                    type="text"
                    value={activeRange.label || `Direction Range ${activeIdx + 1}`}
                    onChange={(e) => {
                      const updated = currentRanges.map((r, i) => i === activeIdx ? { ...r, label: e.target.value } : r);
                      updateRanges(updated);
                    }}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-amber-500 px-0.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeRange.enabled !== false}
                      onChange={() => handleToggleEnable(activeIdx)}
                      className="rounded accent-amber-500 bg-neutral-950 border-neutral-800"
                    />
                    <span>Active</span>
                  </label>

                  {currentRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRange(activeIdx)}
                      className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition"
                      title="Delete this direction range"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Cardinal Direction Buttons */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleAngleChangeForActive(270)}
                  className={`py-1 rounded border text-center transition ${activeRange.angleDeg === 270 ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  ⬆️ Up (270°)
                </button>
                <button
                  type="button"
                  onClick={() => handleAngleChangeForActive(0)}
                  className={`py-1 rounded border text-center transition ${activeRange.angleDeg === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  ➡️ Right (0°)
                </button>
                <button
                  type="button"
                  onClick={() => handleAngleChangeForActive(90)}
                  className={`py-1 rounded border text-center transition ${activeRange.angleDeg === 90 ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  ⬇️ Down (90°)
                </button>
                <button
                  type="button"
                  onClick={() => handleAngleChangeForActive(180)}
                  className={`py-1 rounded border text-center transition ${activeRange.angleDeg === 180 ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  ⬅️ Left (180°)
                </button>
              </div>

              {/* Angle Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <label className="font-semibold text-neutral-300">Center Angle</label>
                  <span className="font-mono text-amber-400 font-bold">{activeRange.angleDeg}°</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAngleChangeForActive((activeRange.angleDeg - 1 + 360) % 360)}
                    className="p-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 rounded text-neutral-300 hover:text-white transition shrink-0"
                    title="Decrease angle by 1°"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={activeRange.angleDeg}
                    onChange={(e) => handleAngleChangeForActive(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleAngleChangeForActive((activeRange.angleDeg + 1) % 360)}
                    className="p-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 rounded text-neutral-300 hover:text-white transition shrink-0"
                    title="Increase angle by 1°"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Spread Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <label className="font-semibold text-neutral-300">Cone Spread Angle</label>
                  <span className="font-mono text-amber-400 font-bold">{activeRange.spreadDeg}°</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpreadChangeForActive(Math.max(0, activeRange.spreadDeg - 1))}
                    className="p-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 rounded text-neutral-300 hover:text-white transition shrink-0"
                    title="Decrease spread by 1°"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={activeRange.spreadDeg}
                    onChange={(e) => handleSpreadChangeForActive(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleSpreadChangeForActive(Math.min(360, activeRange.spreadDeg + 1))}
                    className="p-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 rounded text-neutral-300 hover:text-white transition shrink-0"
                    title="Increase spread by 1°"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono">
                  <span>0° (Laser beam)</span>
                  <span>45° (Cone)</span>
                  <span>180° (Hemisphere)</span>
                  <span>360° (Full circle)</span>
                </div>
              </div>

              {/* Weight Distribution (If multiple ranges exist) */}
              {currentRanges.length > 1 && (
                <div className="space-y-1 pt-1 border-t border-neutral-800/60">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-semibold text-neutral-400">Emission Share Weight</label>
                    <span className="font-mono text-cyan-400 font-bold">{activeRange.weight ?? 1}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={activeRange.weight ?? 1}
                    onChange={(e) => handleWeightChangeForActive(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-950 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
