import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Repeat,
  Sparkles
} from 'lucide-react';
import { AnimationFrame, LoopMode } from '../types';
import { compositeFrame } from '../utils/canvasUtils';

interface AnimationTimelineProps {
  frames: AnimationFrame[];
  activeFrameIndex: number;
  width: number;
  height: number;
  fps: number;
  loopMode: LoopMode;
  onionSkinEnabled: boolean;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onMoveFrame: (fromIndex: number, toIndex: number) => void;
  onChangeFps: (fps: number) => void;
  onChangeLoopMode: (mode: LoopMode) => void;
  onToggleOnionSkin: () => void;
}

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  frames,
  activeFrameIndex,
  width,
  height,
  fps,
  loopMode,
  onionSkinEnabled,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onMoveFrame,
  onChangeFps,
  onChangeLoopMode,
  onToggleOnionSkin
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackFrameIndex, setPlaybackFrameIndex] = useState<number>(0);
  const isPingPongForwardRef = useRef<boolean>(true);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const intervalMs = Math.max(16, Math.round(1000 / fps));
    const timer = setInterval(() => {
      setPlaybackFrameIndex((prev) => {
        if (loopMode === 'pingpong') {
          if (isPingPongForwardRef.current) {
            if (prev >= frames.length - 1) {
              isPingPongForwardRef.current = false;
              return Math.max(0, frames.length - 2);
            }
            return prev + 1;
          } else {
            if (prev <= 0) {
              isPingPongForwardRef.current = true;
              return Math.min(frames.length - 1, 1);
            }
            return prev - 1;
          }
        } else if (loopMode === 'once') {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        } else {
          return (prev + 1) % frames.length;
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, fps, frames.length, loopMode]);

  const previewFrame = isPlaying ? frames[playbackFrameIndex] : frames[activeFrameIndex];

  return (
    <div className="h-28 bg-neutral-900 border-t border-neutral-800 flex items-center px-3 gap-3 select-none shrink-0 z-10">
      {/* Playback Controls & FPS */}
      <div className="flex items-center gap-2 pr-3 border-r border-neutral-800 shrink-0">
        <button
          type="button"
          id="timeline-play-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Animation (Space)' : 'Play Animation (Space)'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-lg ${
            isPlaying
              ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-950/60'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950/60'
          }`}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span className="uppercase font-bold">FPS</span>
            <span className="font-mono text-emerald-400 font-bold">{fps}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min="1"
              max="60"
              value={fps}
              onChange={(e) => onChangeFps(parseInt(e.target.value))}
              className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        <button
          type="button"
          id="timeline-loop-btn"
          onClick={() => {
            const nextMode: LoopMode =
              loopMode === 'loop' ? 'pingpong' : loopMode === 'pingpong' ? 'once' : 'loop';
            onChangeLoopMode(nextMode);
          }}
          title={`Loop Mode: ${loopMode.toUpperCase()}`}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
            loopMode === 'loop'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
              : loopMode === 'pingpong'
              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
          }`}
        >
          <Repeat size={11} />
          <span className="capitalize">{loopMode}</span>
        </button>
      </div>

      {/* Frame Strip Container */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
        {frames.map((frame, index) => {
          const isActive = !isPlaying && index === activeFrameIndex;
          const isCurrentPlayback = isPlaying && index === playbackFrameIndex;

          return (
            <div
              key={frame.id}
              id={`timeline-frame-${index}`}
              onClick={() => {
                setIsPlaying(false);
                onSelectFrame(index);
              }}
              className={`relative h-20 min-w-[72px] rounded-xl border flex flex-col items-center justify-between p-1 cursor-pointer transition-all ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-400'
                  : isCurrentPlayback
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-400'
                  : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-750'
              }`}
            >
              {/* Frame Composite Thumbnail Canvas */}
              <div className="w-full h-12 bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center relative">
                <canvas
                  ref={(canvasEl) => {
                    if (canvasEl) {
                      canvasEl.width = 48;
                      canvasEl.height = 48;
                      const ctx = canvasEl.getContext('2d');
                      if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 48, 48);
                        const comp = compositeFrame(frame, width, height);
                        ctx.drawImage(comp, 0, 0, 48, 48);
                      }
                    }
                  }}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Frame Number & Actions */}
              <div className="w-full flex items-center justify-between px-1 text-[10px]">
                <span className="font-mono font-bold text-neutral-300">#{index + 1}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFrame(index);
                    }}
                    title="Duplicate Frame"
                    className="p-0.5 rounded text-neutral-400 hover:text-white"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (frames.length > 1) onDeleteFrame(index);
                    }}
                    disabled={frames.length <= 1}
                    title="Delete Frame"
                    className="p-0.5 rounded text-rose-400 hover:text-rose-200 disabled:opacity-20"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Frame Button */}
        <button
          type="button"
          id="timeline-add-frame-btn"
          onClick={onAddFrame}
          title="Add New Animation Frame"
          className="h-20 min-w-[56px] rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 bg-neutral-800/40 hover:bg-neutral-800/80 text-neutral-400 hover:text-emerald-400 flex flex-col items-center justify-center gap-1 transition"
        >
          <Plus size={18} />
          <span className="text-[10px] font-bold">New</span>
        </button>
      </div>

      {/* Mini Live Preview Player */}
      <div className="h-20 w-24 bg-neutral-950 border border-neutral-800 rounded-xl p-1 flex flex-col items-center justify-between shrink-0">
        <div className="w-full h-12 flex items-center justify-center overflow-hidden">
          {previewFrame && (
            <canvas
              ref={(canvasEl) => {
                if (canvasEl) {
                  canvasEl.width = 48;
                  canvasEl.height = 48;
                  const ctx = canvasEl.getContext('2d');
                  if (ctx) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.clearRect(0, 0, 48, 48);
                    const comp = compositeFrame(previewFrame, width, height);
                    ctx.drawImage(comp, 0, 0, 48, 48);
                  }
                }
              }}
              className="max-h-full max-w-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>
        <span className="text-[9px] text-neutral-400 font-mono">
          {isPlaying ? `Playing (${fps} FPS)` : `Frame ${activeFrameIndex + 1}/${frames.length}`}
        </span>
      </div>
    </div>
  );
};
