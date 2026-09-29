import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  Hand,
  CloudRain,
  Eye,
  Layers,
  Wind
} from 'lucide-react';
import {
  ParticleSystemData,
  ParticleSystemFile,
  DEFAULT_PARTICLE_SYSTEMS
} from '../../engine/masonProjectSchema';
import { EnvironmentalEffectConfig } from '../../engine/refinedBiomeSchema';
import { ParticleEngine } from '../../engine/ParticleEngine';
import { ViewportHUD } from './viewport/ViewportHUD';

interface AtmosphericParticlePreviewerProps {
  effects: EnvironmentalEffectConfig[];
  availableParticles: ParticleSystemFile[];
  selectedEffectId?: string;
  onSelectEffect?: (effectId: string) => void;
  className?: string;
}

export const AtmosphericParticlePreviewer: React.FC<AtmosphericParticlePreviewerProps> = ({
  effects,
  availableParticles,
  selectedEffectId,
  onSelectEffect,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [bgTheme, setBgTheme] = useState<'grid' | 'dungeon' | 'magma' | 'void' | 'cave' | 'forest'>('grid');
  const [floorCollisionEnabled, setFloorCollisionEnabled] = useState<boolean>(true);
  const [floorWorldY, setFloorWorldY] = useState<number>(390);
  const [showCollisionWireframe, setShowCollisionWireframe] = useState<boolean>(false);
  const [emitterPos, setEmitterPos] = useState<{ x: number; y: number }>({ x: 320, y: 180 });

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasTool, setCanvasTool] = useState<'select' | 'pan'>('select');
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDraggingEmitter, setIsDraggingEmitter] = useState<boolean>(false);
  const [isHoveringEmitter, setIsHoveringEmitter] = useState<boolean>(false);
  const [isDraggingFloor, setIsDraggingFloor] = useState<boolean>(false);
  const [isHoveringFloor, setIsHoveringFloor] = useState<boolean>(false);

  // Active layer filter ('all' = composite all active effects, or specific effect id)
  const [activeFilterId, setActiveFilterId] = useState<string>('all');

  // Telemetry
  const [fps, setFps] = useState<number>(60);
  const [activeParticleCount, setActiveParticleCount] = useState<number>(0);

  // Canvas & Engine Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine>(new ParticleEngine());
  const isFirstFrameRef = useRef<boolean>(true);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());
  const lastEmitMapRef = useRef<{ [key: string]: number }>({});
  const emitAccumulatorMapRef = useRef<{ [key: string]: number }>({});
  const lastBurstMapRef = useRef<{ [key: string]: number }>({});
  const nextBurstMapRef = useRef<{ [key: string]: number }>({});
  const lastEmitterPosRef = useRef<{ x: number; y: number } | null>(null);

  // Synchronize mutable refs for 60fps loop
  const effectsRef = useRef<EnvironmentalEffectConfig[]>(effects);
  effectsRef.current = effects;

  const availableParticlesRef = useRef<ParticleSystemFile[]>(availableParticles);
  availableParticlesRef.current = availableParticles;

  const activeFilterIdRef = useRef<string>(activeFilterId);
  activeFilterIdRef.current = activeFilterId;

  const emitterPosRef = useRef(emitterPos);
  emitterPosRef.current = emitterPos;

  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const bgThemeRef = useRef(bgTheme);
  bgThemeRef.current = bgTheme;

  const floorCollisionEnabledRef = useRef(floorCollisionEnabled);
  floorCollisionEnabledRef.current = floorCollisionEnabled;

  const floorWorldYRef = useRef(floorWorldY);
  floorWorldYRef.current = floorWorldY;

  const isDraggingFloorRef = useRef(isDraggingFloor);
  isDraggingFloorRef.current = isDraggingFloor;

  const isHoveringFloorRef = useRef(isHoveringFloor);
  isHoveringFloorRef.current = isHoveringFloor;

  const isDraggingEmitterRef = useRef(isDraggingEmitter);
  isDraggingEmitterRef.current = isDraggingEmitter;

  const isHoveringEmitterRef = useRef(isHoveringEmitter);
  isHoveringEmitterRef.current = isHoveringEmitter;

  const showCollisionWireframeRef = useRef(showCollisionWireframe);
  showCollisionWireframeRef.current = showCollisionWireframe;

  // Space key listener for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
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

  // Update engine particle definitions
  useEffect(() => {
    if (engineRef.current && availableParticles) {
      engineRef.current.setProjectParticles(availableParticles.map(p => p.particleData));
    }
  }, [availableParticles]);

  // Helper to resolve ParticleSystemData for an effect
  const resolveParticleData = (effect: EnvironmentalEffectConfig): ParticleSystemData => {
    if (effect.particleSystemId) {
      const match = availableParticlesRef.current.find(
        p => p.id === effect.particleSystemId || p.particleData?.id === effect.particleSystemId
      );
      if (match?.particleData) {
        return match.particleData;
      }
    }
    // Fallback default atmospheric preset
    return DEFAULT_PARTICLE_SYSTEMS[0];
  };

  // Trigger manual burst
  const handleTriggerBurst = () => {
    const activeEffects = effectsRef.current.filter(e => e.isEnabled !== false);
    const targetEffects = activeFilterIdRef.current === 'all'
      ? activeEffects
      : activeEffects.filter(e => e.id === activeFilterIdRef.current);

    if (targetEffects.length === 0) {
      // Spawn fallback burst
      const fallback = DEFAULT_PARTICLE_SYSTEMS[0];
      engineRef.current.spawnParticles(30, fallback, emitterPosRef.current);
      return;
    }

    targetEffects.forEach(effect => {
      const data = resolveParticleData(effect);
      const countMin = data.emitter.burstCountMin ?? data.emitter.burstCount ?? 25;
      const countMax = data.emitter.burstCountMax ?? data.emitter.burstCount ?? 25;
      const count = Math.max(10, Math.floor(countMin + Math.random() * Math.max(0, countMax - countMin)));
      engineRef.current.spawnParticles(count, data, emitterPosRef.current);
    });
  };

  // Reset simulation
  const handleResetSimulation = () => {
    engineRef.current.particles = [];
    emitAccumulatorMapRef.current = {};
    lastEmitMapRef.current = {};
    lastBurstMapRef.current = {};
    nextBurstMapRef.current = {};
    setActiveParticleCount(0);
  };

  // Pre-warm atmospheric simulation
  const handlePrewarmSimulation = () => {
    const activeEffects = effectsRef.current.filter(e => e.isEnabled !== false);
    const targetEffects = activeFilterIdRef.current === 'all'
      ? activeEffects
      : activeEffects.filter(e => e.id === activeFilterIdRef.current);

    if (targetEffects.length === 0) return;

    engineRef.current.particles = [];
    const emittersToPrewarm = targetEffects.map(effect => {
      const system = resolveParticleData(effect);
      return {
        id: effect.id,
        system,
        originX: emitterPosRef.current.x,
        originY: emitterPosRef.current.y
      };
    });

    engineRef.current.setEmitters(emittersToPrewarm);
    const maxDuration = Math.max(
      ...targetEffects.map(effect => {
        const data = resolveParticleData(effect);
        return data.emitter.prewarmDuration ?? 3.5;
      }),
      2.5
    );
    engineRef.current.prewarm(maxDuration);
  };

  // Auto pre-warm on initial mount or when switching active atmospheric layer filter
  useEffect(() => {
    handlePrewarmSimulation();
  }, [activeFilterId, effects.length]);

  // Main 60fps simulation render loop
  useEffect(() => {
    let animId: number;

    const renderLoop = (now: number) => {
      if (isFirstFrameRef.current || lastFrameTimeRef.current === 0 || now < lastFrameTimeRef.current) {
        lastFrameTimeRef.current = now;
        isFirstFrameRef.current = false;
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.0333);
      lastFrameTimeRef.current = now;

      // Update telemetry
      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 250) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current)));
        if (engineRef.current) {
          setActiveParticleCount(engineRef.current.particles.length);
        }
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

      const curEmitterPos = emitterPosRef.current;
      const curPanOffset = panOffsetRef.current;
      const curZoom = zoomRef.current;
      const curFloorCollisionEnabled = floorCollisionEnabledRef.current;
      const curFloorWorldY = floorWorldYRef.current;
      const isDragFloor = isDraggingFloorRef.current;
      const isHovFloor = isHoveringFloorRef.current;
      const curWireframe = showCollisionWireframeRef.current;

      // Determine active target atmospheric effects
      const activeEffects = effectsRef.current.filter(e => e.isEnabled !== false);
      const targetEffects = activeFilterIdRef.current === 'all'
        ? activeEffects
        : activeEffects.filter(e => e.id === activeFilterIdRef.current);

      if (isPlaying) {
        targetEffects.forEach(effect => {
          const data = resolveParticleData(effect);
          const effectKey = effect.id;

          // Continuous emission
          if (data.emitter.isContinuous) {
            const rateMin = data.emitter.emissionRateMin ?? data.emitter.emissionRate ?? 20;
            const rateMax = data.emitter.emissionRateMax ?? data.emitter.emissionRate ?? 20;
            const currentRate = rateMin + Math.random() * (rateMax - rateMin);

            if (currentRate > 0) {
              emitAccumulatorMapRef.current[effectKey] = (emitAccumulatorMapRef.current[effectKey] || 0) + dt * currentRate;
              const toSpawn = Math.floor(emitAccumulatorMapRef.current[effectKey]);
              if (toSpawn > 0) {
                const maxPerFrame = Math.max(1, Math.ceil(currentRate * 0.1));
                const count = Math.min(toSpawn, maxPerFrame);
                engineRef.current.spawnParticles(count, data, curEmitterPos);
                emitAccumulatorMapRef.current[effectKey] = Math.max(0, emitAccumulatorMapRef.current[effectKey] - toSpawn);
              }
            }
          }

          // Periodic bursts
          const burstEnabled = data.emitter.burstEnabled === true ||
            (data.emitter.burstEnabled === undefined &&
              (data.emitter.burstInterval ?? 0) > 0 &&
              (data.emitter.burstCount ?? 0) > 0 &&
              !data.emitter.isContinuous);

          if (burstEnabled) {
            const intervalMin = data.emitter.burstIntervalMin ?? data.emitter.burstInterval ?? 1.5;
            const intervalMax = data.emitter.burstIntervalMax ?? data.emitter.burstInterval ?? 1.5;

            if (!nextBurstMapRef.current[effectKey]) {
              nextBurstMapRef.current[effectKey] = Math.max(0.05, intervalMin + Math.random() * Math.max(0, intervalMax - intervalMin));
            }

            const lastBurst = lastBurstMapRef.current[effectKey] || now;
            if (now - lastBurst >= (nextBurstMapRef.current[effectKey] || 1.5) * 1000) {
              const countMin = data.emitter.burstCountMin ?? data.emitter.burstCount ?? 25;
              const countMax = data.emitter.burstCountMax ?? data.emitter.burstCount ?? 25;
              const count = Math.floor(countMin + Math.random() * Math.max(0, countMax - countMin));
              if (count > 0) {
                engineRef.current.spawnParticles(count, data, curEmitterPos);
              }
              lastBurstMapRef.current[effectKey] = now;
              nextBurstMapRef.current[effectKey] = Math.max(0.05, intervalMin + Math.random() * Math.max(0, intervalMax - intervalMin));
            }
          }
        });
      }

      let edx = 0;
      let edy = 0;
      if (lastEmitterPosRef.current) {
        edx = curEmitterPos.x - lastEmitterPosRef.current.x;
        edy = curEmitterPos.y - lastEmitterPosRef.current.y;
      }
      lastEmitterPosRef.current = { x: curEmitterPos.x, y: curEmitterPos.y };

      // Update simulation physics
      const primaryData = targetEffects.length > 0 ? resolveParticleData(targetEffects[0]) : DEFAULT_PARTICLE_SYSTEMS[0];
      const effectivePhysics = {
        ...(primaryData.physics || {}),
        collideWithMapSolids: curFloorCollisionEnabled && (primaryData.physics?.collideWithMapSolids ?? true)
      };

      engineRef.current.setViewport(width, height, curPanOffset, curZoom);
      engineRef.current.update(dt, effectivePhysics, curFloorWorldY, 0, {
        x: curEmitterPos.x,
        y: curEmitterPos.y,
        dx: edx,
        dy: edy
      });

      // Render Stage Environment
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(curPanOffset.x, curPanOffset.y);
      ctx.scale(curZoom, curZoom);

      const scaledWidth = width / curZoom;
      const scaledHeight = height / curZoom;
      const startX = -curPanOffset.x / curZoom;
      const startY = -curPanOffset.y / curZoom;

      // Render Background Theme
      const curBg = bgThemeRef.current;
      if (curBg === 'dungeon') {
        ctx.fillStyle = '#1e1b18';
      } else if (curBg === 'magma') {
        ctx.fillStyle = '#1c0d0d';
      } else if (curBg === 'void') {
        ctx.fillStyle = '#050508';
      } else if (curBg === 'cave') {
        ctx.fillStyle = '#0f172a';
      } else if (curBg === 'forest') {
        ctx.fillStyle = '#0b1912';
      } else {
        ctx.fillStyle = '#090d16';
      }
      ctx.fillRect(startX - 200, startY - 200, scaledWidth + 400, scaledHeight + 400);

      // World Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1 / curZoom;
      const gridSize = 64;

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

      // Solid Floor Geometry
      if (curFloorCollisionEnabled) {
        const floorLeft = startX - 200;
        const floorRight = startX + scaledWidth + 200;
        const floorBottom = Math.max(curFloorWorldY + 3000, startY + scaledHeight + 200);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(floorLeft, curFloorWorldY, floorRight - floorLeft, floorBottom - curFloorWorldY);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(floorLeft, curFloorWorldY, floorRight - floorLeft, 14 / curZoom);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = (isDragFloor || isHovFloor ? 3 : 2) / curZoom;
        ctx.beginPath();
        ctx.moveTo(floorLeft, curFloorWorldY);
        ctx.lineTo(floorRight, curFloorWorldY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 6 / curZoom;
        ctx.beginPath();
        ctx.moveTo(floorLeft, curFloorWorldY);
        ctx.lineTo(floorRight, curFloorWorldY);
        ctx.stroke();

        const centerX = startX + scaledWidth / 2;
        const handleW = 64 / curZoom;
        const handleH = 6 / curZoom;
        ctx.fillStyle = isDragFloor ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(centerX - handleW / 2, curFloorWorldY - handleH / 2, handleW, handleH);

        ctx.font = `${Math.max(9, 11 / curZoom)}px Inter, sans-serif`;
        ctx.fillStyle = '#94a3b8';
        const floorLabel = `SOLID FLOOR PLANE (WORLD Y: ${curFloorWorldY} | MAP COLLISION ACTIVE)`;
        ctx.fillText(floorLabel, startX + 16 / curZoom, curFloorWorldY + 20 / curZoom);
      }

      // Draw Emitter Handle
      if (isPlaying) {
        const isHovEm = isHoveringEmitterRef.current;
        const isDragEm = isDraggingEmitterRef.current;
        const ringRadius = (isDragEm ? 16 : isHovEm ? 15 : 12) / curZoom;

        if (isHovEm || isDragEm) {
          ctx.fillStyle = isDragEm ? 'rgba(56, 189, 248, 0.22)' : 'rgba(52, 211, 153, 0.22)';
          ctx.beginPath();
          ctx.arc(curEmitterPos.x, curEmitterPos.y, ringRadius + 4 / curZoom, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = isDragEm ? '#38bdf8' : isHovEm ? '#34d399' : '#10b981';
        ctx.lineWidth = (isDragEm || isHovEm ? 2.5 : 2) / curZoom;
        ctx.beginPath();
        ctx.arc(curEmitterPos.x, curEmitterPos.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        const tickLen = 4 / curZoom;
        ctx.beginPath();
        ctx.moveTo(curEmitterPos.x - ringRadius - tickLen, curEmitterPos.y);
        ctx.lineTo(curEmitterPos.x - ringRadius + tickLen, curEmitterPos.y);
        ctx.moveTo(curEmitterPos.x + ringRadius - tickLen, curEmitterPos.y);
        ctx.lineTo(curEmitterPos.x + ringRadius + tickLen, curEmitterPos.y);
        ctx.moveTo(curEmitterPos.x, curEmitterPos.y - ringRadius - tickLen);
        ctx.lineTo(curEmitterPos.x, curEmitterPos.y - ringRadius + tickLen);
        ctx.moveTo(curEmitterPos.x, curEmitterPos.y + ringRadius - tickLen);
        ctx.lineTo(curEmitterPos.x, curEmitterPos.y + ringRadius + tickLen);
        ctx.stroke();

        ctx.fillStyle = isDragEm ? '#38bdf8' : isHovEm ? '#34d399' : '#10b981';
        ctx.beginPath();
        ctx.arc(curEmitterPos.x, curEmitterPos.y, (isDragEm ? 5 : isHovEm ? 4.5 : 4) / curZoom, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Render Particles in World Space
      engineRef.current.render(ctx, curPanOffset, curZoom, primaryData, curWireframe, curEmitterPos);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

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

  // Mouse wheel zoom handler centered at cursor position
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
    const nextPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
    const nextPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

    setZoom(nextZoom);
    setPanOffset({ x: nextPanX, y: nextPanY });
  };

  // Mouse down interaction handler
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mouseX, mouseY, worldX, worldY } = getCanvasCoords(e);

    // Right-click, Middle-click, Pan Tool active or Space key pressed -> Pan viewport
    if (e.button === 2 || e.button === 1 || isSpacePressed || canvasTool === 'pan') {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Check if clicking close to emitter center anchor
    const distToEmitter = Math.hypot(worldX - emitterPos.x, worldY - emitterPos.y);
    if (distToEmitter < 24 / zoom) {
      setIsDraggingEmitter(true);
    } else if (floorCollisionEnabled && Math.abs(worldY - floorWorldY) < 14 / zoom) {
      setIsDraggingFloor(true);
    } else {
      // Click-to-burst at clicked world coordinates
      const activeEffects = effectsRef.current.filter(e => e.isEnabled !== false);
      const targetEffects = activeFilterIdRef.current === 'all'
        ? activeEffects
        : activeEffects.filter(e => e.id === activeFilterIdRef.current);
      const primaryData = targetEffects.length > 0 ? resolveParticleData(targetEffects[0]) : DEFAULT_PARTICLE_SYSTEMS[0];
      const countMin = primaryData.emitter.burstCountMin ?? primaryData.emitter.burstCount ?? 20;
      const countMax = primaryData.emitter.burstCountMax ?? primaryData.emitter.burstCount ?? 20;
      const countToSpawn = Math.round(countMin + Math.random() * (countMax - countMin));
      engineRef.current.spawnParticles(countToSpawn || 25, primaryData, { x: worldX, y: worldY });
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

    const { worldX, worldY } = getCanvasCoords(e);

    if (isDraggingEmitter) {
      setEmitterPos({ x: Math.round(worldX), y: Math.round(worldY) });
      return;
    }

    if (isDraggingFloor) {
      setFloorWorldY(Math.round(worldY));
      return;
    }

    // Check hover state for emitter drag handle
    const distToEmitter = Math.hypot(worldX - emitterPos.x, worldY - emitterPos.y);
    const isNearEmitter = distToEmitter < 24 / zoom;
    if (isNearEmitter !== isHoveringEmitter) {
      setIsHoveringEmitter(isNearEmitter);
    }

    if (floorCollisionEnabled) {
      const isNear = Math.abs(worldY - floorWorldY) < 12 / zoom;
      if (isNear !== isHoveringFloor) {
        setIsHoveringFloor(isNear);
      }
    } else if (isHoveringFloor) {
      setIsHoveringFloor(false);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingEmitter(false);
    setIsDraggingFloor(false);
    setIsPanning(false);
  };

  const enabledEffects = useMemo(() => effects.filter(e => e.isEnabled !== false), [effects]);

  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl flex flex-col ${className}`}>
      {/* Top Header Bar & Simulation Controls (identical to Particle Module) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-neutral-950/90 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Manual Burst Button */}
          <button
            type="button"
            onClick={handleTriggerBurst}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
            title="Fire a manual particle burst"
          >
            <Zap size={13} className="text-amber-400" />
            <span>Burst</span>
          </button>

          {/* Pre-warm Simulation */}
          <button
            type="button"
            onClick={handlePrewarmSimulation}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 hover:border-cyan-500 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition"
            title="Pre-warm simulation ahead of time to steady state"
          >
            <Sparkles size={13} className="text-cyan-400" />
            <span>Pre-warm</span>
          </button>

          {/* Reset Simulation */}
          <button
            type="button"
            onClick={handleResetSimulation}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition"
            title="Clear active particles and reset"
          >
            <RotateCcw size={14} />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1 hidden sm:block" />

          {/* Layer Filter Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
              <Layers size={12} className="text-cyan-400" />
              <span>Preview:</span>
            </span>
            <select
              value={activeFilterId}
              onChange={(e) => {
                setActiveFilterId(e.target.value);
                if (e.target.value !== 'all' && onSelectEffect) {
                  onSelectEffect(e.target.value);
                }
              }}
              className="bg-neutral-900 border border-neutral-700 text-xs rounded-lg px-2.5 py-1 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
            >
              <option value="all">🌟 All Active Atmospheric Layers ({enabledEffects.length})</option>
              {effects.map((eff, i) => (
                <option key={eff.id} value={eff.id}>
                  {eff.isEnabled !== false ? '✨' : '⚪'} {eff.name || `Effect Layer #${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles & Background Theme Picker */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Wireframe Hull */}
          <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showCollisionWireframe}
              onChange={(e) => setShowCollisionWireframe(e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 accent-cyan-500"
            />
            <span className="text-[11px]">Wireframe Hull</span>
          </label>

          {/* Solid Floor Toggle */}
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={floorCollisionEnabled}
                onChange={(e) => setFloorCollisionEnabled(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 w-3.5 h-3.5 accent-amber-500"
              />
              <span className="text-[11px]">Solid Floor</span>
            </label>
            {floorCollisionEnabled && (
              <div
                className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800"
                title="Solid floor plane Y position (drag line on canvas to adjust)"
              >
                <span className="text-neutral-500 font-semibold">Y:</span>
                <input
                  type="number"
                  value={floorWorldY}
                  onChange={(e) => setFloorWorldY(Number(e.target.value))}
                  className="w-11 bg-transparent text-amber-400 font-bold focus:outline-none text-right"
                />
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 rounded-lg p-0.5 border border-neutral-800">
            {[
              { id: 'grid', label: 'Grid' },
              { id: 'dungeon', label: 'Dungeon' },
              { id: 'magma', label: 'Magma' },
              { id: 'void', label: 'Void' },
              { id: 'cave', label: 'Grotto' },
              { id: 'forest', label: 'Forest' }
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

      {/* Interactive Canvas Stage with Zoom & Pan */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-neutral-950 min-h-[380px] sm:min-h-[440px]">
        <canvas
          ref={canvasRef}
          width={640}
          height={440}
          onWheel={handleCanvasWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            setIsDraggingEmitter(false);
            setIsDraggingFloor(false);
            setIsPanning(false);
            setIsHoveringFloor(false);
            setIsHoveringEmitter(false);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full h-full max-w-[720px] max-h-[500px] rounded-2xl border border-neutral-800/80 shadow-2xl object-contain ${
            isDraggingFloor || isHoveringFloor
              ? 'cursor-row-resize'
              : isDraggingEmitter
              ? 'cursor-grabbing'
              : isHoveringEmitter
              ? 'cursor-grab active:cursor-grabbing'
              : isPanning || canvasTool === 'pan'
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-crosshair'
          }`}
        />

        {/* Viewport HUD Controls */}
        <ViewportHUD
          scale={zoom}
          onZoomIn={() => setZoom(z => Math.min(4.0, parseFloat((z + 0.15).toFixed(2))))}
          onZoomOut={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.15).toFixed(2))))}
          onResetZoom={() => {
            setZoom(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          onCenterContent={() => {
            setEmitterPos({ x: 320, y: 180 });
            setFloorWorldY(390);
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

        {/* Telemetry Overlay HUD */}
        <div className="absolute bottom-6 left-6 pointer-events-none select-none flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-400 z-20">
          <div className="flex items-center gap-1.5 w-16 shrink-0 tabular-nums">
            <Gauge size={13} className="text-amber-400 shrink-0" />
            <span><span className="text-white font-bold inline-block min-w-[16px] text-right">{fps}</span> FPS</span>
          </div>
          <div className="w-px h-3 bg-neutral-800 shrink-0" />
          <div className="flex items-center gap-1.5 w-24 shrink-0 tabular-nums">
            <Sparkles size={13} className="text-cyan-400 shrink-0" />
            <span className="inline-flex items-center">
              <span className="text-white font-bold inline-block min-w-[20px] text-right">{activeParticleCount}</span>
              <span className="text-neutral-500 mx-1">live</span>
            </span>
          </div>
          <div className="w-px h-3 bg-neutral-800 shrink-0" />
          <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
            ⚡ Baked Raster Sprites
          </div>
          <div className="w-px h-3 bg-neutral-800 hidden md:block" />
          <div className="text-[10px] text-neutral-500 hidden md:block">
            Wheel zoom • Right-click / Space drag pan • Drag 🎯 emitter
          </div>
        </div>
      </div>
    </div>
  );
};
