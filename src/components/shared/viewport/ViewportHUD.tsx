import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid,
  Crosshair,
  Move
} from 'lucide-react';

export interface ViewportHUDProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom?: () => void;
  onFitContent?: () => void;
  onCenterContent?: () => void;
  
  // Optional Toggles
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showCrosshairs?: boolean;
  onToggleCrosshairs?: () => void;

  // Custom Controls Slots
  leadingSlot?: React.ReactNode;
  trailingSlot?: React.ReactNode;

  // Layout & Styling
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'relative';
  themeColor?: 'amber' | 'cyan' | 'purple' | 'emerald' | 'blue';
  showHelperHint?: boolean;
  className?: string;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitContent,
  onCenterContent,
  showGrid,
  onToggleGrid,
  showCrosshairs,
  onToggleCrosshairs,
  leadingSlot,
  trailingSlot,
  position = 'bottom-right',
  themeColor = 'amber',
  showHelperHint = true,
  className = ''
}) => {
  const colorMap = {
    amber: {
      activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-400',
      fitBtn: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
    },
    cyan: {
      activeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      badgeText: 'text-cyan-400',
      fitBtn: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/40'
    },
    purple: {
      activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      badgeText: 'text-purple-400',
      fitBtn: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-purple-500/40'
    },
    emerald: {
      activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-400',
      fitBtn: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
    },
    blue: {
      activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      badgeText: 'text-blue-400',
      fitBtn: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/40'
    }
  }[themeColor];

  const positionClasses = {
    'top-right': 'absolute top-4 right-4',
    'top-left': 'absolute top-4 left-4',
    'bottom-right': 'absolute bottom-4 right-4',
    'bottom-left': 'absolute bottom-4 left-4',
    'bottom-center': 'absolute bottom-4 left-1/2 -translate-x-1/2',
    'relative': 'relative'
  }[position];

  return (
    <div
      className={`z-20 flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 px-2 py-1.5 rounded-xl shadow-2xl text-xs select-none pointer-events-auto ${positionClasses} ${className}`}
    >
      {/* Leading Custom Slot */}
      {leadingSlot}

      {/* Grid Toggle */}
      {onToggleGrid && (
        <button
          type="button"
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg border transition ${
            showGrid
              ? colorMap.activeBg
              : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Pixel Grid Overlay"
        >
          <Grid size={14} />
        </button>
      )}

      {/* Crosshairs Toggle */}
      {onToggleCrosshairs && (
        <button
          type="button"
          onClick={onToggleCrosshairs}
          className={`p-1.5 rounded-lg border transition ${
            showCrosshairs
              ? colorMap.activeBg
              : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Origin Crosshairs"
        >
          <Crosshair size={14} />
        </button>
      )}

      {(onToggleGrid || onToggleCrosshairs || leadingSlot) && (
        <div className="h-4 w-px bg-neutral-800 mx-0.5" />
      )}

      {/* Helper Navigation Tooltip Hint */}
      {showHelperHint && (
        <div className="hidden sm:flex items-center gap-1 px-1.5 text-[10px] font-mono text-neutral-400">
          <Move size={11} className={colorMap.badgeText} />
          <span>Pan: RMB / Space • Zoom: Wheel</span>
        </div>
      )}

      {showHelperHint && (
        <div className="hidden sm:block h-4 w-px bg-neutral-800 mx-0.5" />
      )}

      {/* Zoom Controls */}
      <button
        type="button"
        onClick={onZoomOut}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        title="Zoom Out"
      >
        <ZoomOut size={14} />
      </button>

      <button
        type="button"
        onClick={onResetZoom}
        className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold hover:bg-neutral-800 transition ${colorMap.badgeText}`}
        title="Reset Zoom to 100%"
      >
        {Math.round(scale * 100)}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        title="Zoom In"
      >
        <ZoomIn size={14} />
      </button>

      {/* Fit Content */}
      {onFitContent && (
        <button
          type="button"
          onClick={onFitContent}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition ${colorMap.fitBtn}`}
          title="Fit Canvas in Viewport"
        >
          <Maximize2 size={12} />
          <span>Fit</span>
        </button>
      )}

      {/* Center Content / Reset */}
      {onCenterContent && (
        <button
          type="button"
          onClick={onCenterContent}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          title="Center Canvas"
        >
          <RotateCcw size={13} />
        </button>
      )}

      {/* Trailing Custom Slot */}
      {trailingSlot && (
        <>
          <div className="h-4 w-px bg-neutral-800 mx-0.5" />
          {trailingSlot}
        </>
      )}
    </div>
  );
};
