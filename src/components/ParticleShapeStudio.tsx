/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Sparkles,
  Grid,
  Crosshair,
  RotateCw,
  Sun,
  Palette
} from 'lucide-react';
import { 
  CustomCompositeShape, 
  CompositeShapeLayer, 
  CompositePrimitiveType 
} from '../engine/masonProjectSchema';

export const DEFAULT_COMPOSITE_SHAPES: CustomCompositeShape[] = [
  {
    id: 'bubble_specular',
    name: 'Translucent Bubble & Glint',
    baseSize: 64,
    layers: [
      {
        id: 'layer_glow',
        name: 'Soft Ambient Aura',
        type: 'circle',
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        radius: 20,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.25,
        isStroke: false,
        glowBlurRadius: 12,
        blendMode: 'lighter',
        visible: true
      },
      {
        id: 'layer_outer',
        name: 'Outer Membrane Ring',
        type: 'ring',
        x: 0,
        y: 0,
        width: 36,
        height: 36,
        radius: 18,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.85,
        isStroke: true,
        strokeWidth: 2,
        glowBlurRadius: 4,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'layer_glint',
        name: 'Specular Glint',
        type: 'circle',
        x: -7,
        y: -7,
        width: 10,
        height: 10,
        radius: 5,
        rotationDeg: 0,
        colorMode: 'fixed',
        fixedColor: '#ffffff',
        alpha: 0.9,
        isStroke: false,
        glowBlurRadius: 2,
        blendMode: 'source-over',
        visible: true
      }
    ]
  },
  {
    id: 'starburst_core',
    name: 'Celestial Starburst Core',
    baseSize: 64,
    layers: [
      {
        id: 'sb_outer_glow',
        name: 'Additive Bloom Core',
        type: 'circle',
        x: 0,
        y: 0,
        width: 28,
        height: 28,
        radius: 14,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.5,
        isStroke: false,
        glowBlurRadius: 14,
        blendMode: 'lighter',
        visible: true
      },
      {
        id: 'sb_star',
        name: '4-Point Star Rays',
        type: 'star',
        x: 0,
        y: 0,
        width: 38,
        height: 38,
        radius: 19,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.95,
        isStroke: false,
        glowBlurRadius: 6,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'sb_diamond_inner',
        name: 'White-Hot Diamond Core',
        type: 'diamond',
        x: 0,
        y: 0,
        width: 14,
        height: 14,
        radius: 7,
        rotationDeg: 45,
        colorMode: 'fixed',
        fixedColor: '#ffffff',
        alpha: 0.95,
        isStroke: false,
        glowBlurRadius: 4,
        blendMode: 'source-over',
        visible: true
      }
    ]
  },
  {
    id: 'magic_cross',
    name: 'Holy Cross Spark',
    baseSize: 64,
    layers: [
      {
        id: 'mc_h_bar',
        name: 'Horizontal Beam',
        type: 'rounded_rect',
        x: 0,
        y: 0,
        width: 38,
        height: 6,
        radius: 3,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.9,
        isStroke: false,
        glowBlurRadius: 8,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'mc_v_bar',
        name: 'Vertical Beam',
        type: 'rounded_rect',
        x: 0,
        y: 0,
        width: 6,
        height: 38,
        radius: 3,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.9,
        isStroke: false,
        glowBlurRadius: 8,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'mc_core_glint',
        name: 'Center Diamond Glint',
        type: 'diamond',
        x: 0,
        y: 0,
        width: 12,
        height: 12,
        radius: 6,
        rotationDeg: 0,
        colorMode: 'fixed',
        fixedColor: '#ffffff',
        alpha: 1,
        isStroke: false,
        glowBlurRadius: 4,
        blendMode: 'source-over',
        visible: true
      }
    ]
  },
  {
    id: 'energy_shield',
    name: 'Hex Guard Shield',
    baseSize: 64,
    layers: [
      {
        id: 'es_outer_ring',
        name: 'Shield Barrier Halo',
        type: 'ring',
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        radius: 20,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.75,
        isStroke: true,
        strokeWidth: 2,
        glowBlurRadius: 6,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'es_core_box',
        name: 'Rotated Matrix Core',
        type: 'rounded_rect',
        x: 0,
        y: 0,
        width: 22,
        height: 22,
        radius: 4,
        rotationDeg: 45,
        colorMode: 'inherit',
        alpha: 0.6,
        isStroke: false,
        glowBlurRadius: 8,
        blendMode: 'lighter',
        visible: true
      },
      {
        id: 'es_center_dot',
        name: 'Center Focus Node',
        type: 'circle',
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        radius: 4,
        rotationDeg: 0,
        colorMode: 'fixed',
        fixedColor: '#ffffff',
        alpha: 0.95,
        isStroke: false,
        glowBlurRadius: 3,
        blendMode: 'source-over',
        visible: true
      }
    ]
  },
  {
    id: 'target_reticle',
    name: 'Arcane Target Reticle',
    baseSize: 64,
    layers: [
      {
        id: 'tr_ring',
        name: 'Outer Scope Ring',
        type: 'ring',
        x: 0,
        y: 0,
        width: 34,
        height: 34,
        radius: 17,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.85,
        isStroke: true,
        strokeWidth: 2,
        glowBlurRadius: 4,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'tr_hline',
        name: 'H-Sight Line',
        type: 'line',
        x: 0,
        y: 0,
        width: 42,
        height: 2,
        rotationDeg: 0,
        colorMode: 'inherit',
        alpha: 0.75,
        isStroke: true,
        strokeWidth: 1.5,
        glowBlurRadius: 2,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'tr_vline',
        name: 'V-Sight Line',
        type: 'line',
        x: 0,
        y: 0,
        width: 42,
        height: 2,
        rotationDeg: 90,
        colorMode: 'inherit',
        alpha: 0.75,
        isStroke: true,
        strokeWidth: 1.5,
        glowBlurRadius: 2,
        blendMode: 'source-over',
        visible: true
      },
      {
        id: 'tr_dot',
        name: 'Bullseye Pip',
        type: 'circle',
        x: 0,
        y: 0,
        width: 6,
        height: 6,
        radius: 3,
        rotationDeg: 0,
        colorMode: 'fixed',
        fixedColor: '#ffffff',
        alpha: 1,
        isStroke: false,
        glowBlurRadius: 2,
        blendMode: 'source-over',
        visible: true
      }
    ]
  }
];

const TEST_COLORS = [
  { label: 'Amber Flame', hex: '#f59e0b' },
  { label: 'Cyan Plasma', hex: '#06b6d4' },
  { label: 'Emerald Spark', hex: '#10b981' },
  { label: 'Ruby Laser', hex: '#ef4444' },
  { label: 'Arcane Violet', hex: '#8b5cf6' },
  { label: 'Pure White', hex: '#ffffff' }
];

interface ParticleShapeStudioProps {
  currentShapes?: CustomCompositeShape[];
  activeShapeId?: string;
  appliedShapeId?: string;
  onApplyShapeToEmitter: (shape: CustomCompositeShape) => void;
  onUpdateShapes: (shapes: CustomCompositeShape[], activeId?: string) => void;
}

export const ParticleShapeStudio: React.FC<ParticleShapeStudioProps> = ({
  currentShapes,
  activeShapeId,
  appliedShapeId,
  onApplyShapeToEmitter,
  onUpdateShapes
}) => {
  const [shapes, setShapes] = useState<CustomCompositeShape[]>(() => {
    if (currentShapes && currentShapes.length > 0) return currentShapes;
    return DEFAULT_COMPOSITE_SHAPES;
  });

  const [selectedShapeId, setSelectedShapeId] = useState<string>(() => {
    if (activeShapeId && shapes.some(s => s.id === activeShapeId)) return activeShapeId;
    return shapes[0]?.id || DEFAULT_COMPOSITE_SHAPES[0].id;
  });

  const activeShape = shapes.find(s => s.id === selectedShapeId) || shapes[0] || DEFAULT_COMPOSITE_SHAPES[0];

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() => {
    return activeShape?.layers[0]?.id || null;
  });

  const [testColor, setTestColor] = useState<string>('#f59e0b');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync internal state when external props update
  useEffect(() => {
    if (currentShapes && currentShapes.length > 0) {
      setShapes(currentShapes);
    }
  }, [currentShapes]);

  useEffect(() => {
    if (activeShapeId && shapes.some(s => s.id === activeShapeId)) {
      setSelectedShapeId(activeShapeId);
    }
  }, [activeShapeId]);

  // Keep selectedLayerId valid when switching shapes
  useEffect(() => {
    if (!activeShape.layers.some(l => l.id === selectedLayerId)) {
      setSelectedLayerId(activeShape.layers[0]?.id || null);
    }
  }, [selectedShapeId, activeShape]);

  // Render preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Checkerboard background
    const checkerSize = 10;
    for (let x = 0; x < width; x += checkerSize) {
      for (let y = 0; y < height; y += checkerSize) {
        ctx.fillStyle = ((x / checkerSize + y / checkerSize) % 2 === 0) ? '#121215' : '#18181d';
        ctx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    // 2. Draw Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = step; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 3. Draw Crosshairs & Origin
    if (showCrosshairs) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, center);
      ctx.lineTo(width, center);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center mark
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(center, center, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Shape Layers
    const baseRef = activeShape.baseSize || 64;
    const zoomScale = (width * 0.75) / baseRef;

    ctx.save();
    ctx.translate(center, center);
    ctx.scale(zoomScale, zoomScale);

    activeShape.layers.forEach((layer) => {
      if (layer.visible === false) return;

      ctx.save();
      ctx.translate(layer.x || 0, layer.y || 0);
      if (layer.rotationDeg) {
        ctx.rotate((layer.rotationDeg * Math.PI) / 180);
      }
      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode;
      }

      const layerAlpha = layer.alpha !== undefined ? layer.alpha : 1.0;
      ctx.globalAlpha = layerAlpha;

      const layerColor = layer.colorMode === 'fixed' && layer.fixedColor ? layer.fixedColor : testColor;
      ctx.fillStyle = layerColor;
      ctx.strokeStyle = layerColor;
      if (layer.strokeWidth) {
        ctx.lineWidth = layer.strokeWidth;
      }

      if (layer.glowBlurRadius && layer.glowBlurRadius > 0) {
        ctx.shadowBlur = layer.glowBlurRadius;
        ctx.shadowColor = layer.glowColor || layerColor;
      } else {
        ctx.shadowBlur = 0;
      }

      const w = layer.width || 16;
      const h = layer.height || 16;
      const r = layer.radius !== undefined ? layer.radius : w / 2;

      ctx.beginPath();
      if (layer.type === 'circle') {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      } else if (layer.type === 'rect') {
        if (layer.isStroke) ctx.strokeRect(-w / 2, -h / 2, w, h);
        else ctx.fillRect(-w / 2, -h / 2, w, h);
      } else if (layer.type === 'rounded_rect') {
        const cr = Math.min(layer.radius || 4, w / 2, h / 2);
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(-w / 2, -h / 2, w, h, cr);
        } else {
          ctx.rect(-w / 2, -h / 2, w, h);
        }
      } else if (layer.type === 'ring') {
        ctx.lineWidth = layer.strokeWidth || 2;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (layer.type === 'line') {
        ctx.lineWidth = layer.strokeWidth || 2;
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(w / 2, 0);
        ctx.stroke();
      } else if (layer.type === 'star') {
        const spikes = 4;
        const outerR = r;
        const innerR = outerR * 0.4;
        for (let s = 0; s < spikes * 2; s++) {
          const rad = (s * Math.PI) / spikes;
          const currentR = s % 2 === 0 ? outerR : innerR;
          const sx = Math.cos(rad) * currentR;
          const sy = Math.sin(rad) * currentR;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      } else if (layer.type === 'diamond') {
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, 0);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(-w / 2, 0);
        ctx.closePath();
      } else if (layer.type === 'ellipse') {
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      }

      if (layer.type !== 'rect' && layer.type !== 'ring' && layer.type !== 'line') {
        if (layer.isStroke) {
          ctx.stroke();
        } else {
          ctx.fill();
        }
      }

      // Highlight selected layer with selection bounds
      if (showBoundingBoxes && layer.id === selectedLayerId) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        const bw = (layer.type === 'circle' || layer.type === 'ring') ? r * 2 + 4 : w + 4;
        const bh = (layer.type === 'circle' || layer.type === 'ring') ? r * 2 + 4 : h + 4;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [activeShape, selectedLayerId, testColor, showGrid, showCrosshairs, showBoundingBoxes]);

  // State mutators
  const updateCurrentShape = (updater: (prev: CustomCompositeShape) => CustomCompositeShape) => {
    const updated = shapes.map(s => s.id === activeShape.id ? updater(s) : s);
    setShapes(updated);
    onUpdateShapes(updated, activeShape.id);
  };

  const selectedLayer = activeShape.layers.find(l => l.id === selectedLayerId) || null;

  const updateSelectedLayer = (patch: Partial<CompositeShapeLayer>) => {
    if (!selectedLayerId) return;
    updateCurrentShape(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === selectedLayerId ? { ...l, ...patch } : l)
    }));
  };

  const handleAddLayer = (type: CompositePrimitiveType) => {
    const newId = `layer_${Date.now()}`;
    const newLayer: CompositeShapeLayer = {
      id: newId,
      name: `New ${type.replace('_', ' ')}`,
      type,
      x: 0,
      y: 0,
      width: type === 'line' ? 32 : 24,
      height: type === 'line' ? 2 : 24,
      radius: 12,
      rotationDeg: 0,
      colorMode: 'inherit',
      alpha: 1.0,
      isStroke: type === 'ring' || type === 'line',
      strokeWidth: 2,
      glowBlurRadius: 4,
      blendMode: 'source-over',
      visible: true
    };

    updateCurrentShape(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
    setSelectedLayerId(newId);
  };

  const handleRemoveLayer = (id: string) => {
    updateCurrentShape(prev => {
      const remaining = prev.layers.filter(l => l.id !== id);
      return { ...prev, layers: remaining };
    });
    if (selectedLayerId === id) {
      const remaining = activeShape.layers.filter(l => l.id !== id);
      setSelectedLayerId(remaining[0]?.id || null);
    }
  };

  const handleDuplicateLayer = (layer: CompositeShapeLayer) => {
    const newId = `layer_${Date.now()}`;
    const copy: CompositeShapeLayer = {
      ...layer,
      id: newId,
      name: `${layer.name} (Copy)`,
      x: layer.x + 2,
      y: layer.y + 2
    };
    const index = activeShape.layers.findIndex(l => l.id === layer.id);
    const updated = [...activeShape.layers];
    updated.splice(index + 1, 0, copy);
    updateCurrentShape(prev => ({ ...prev, layers: updated }));
    setSelectedLayerId(newId);
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeShape.layers.length) return;
    const copy = [...activeShape.layers];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIndex, 0, item);
    updateCurrentShape(prev => ({ ...prev, layers: copy }));
  };

  const handleCreateNewShape = () => {
    const newShapeId = `shape_${Date.now()}`;
    const newShape: CustomCompositeShape = {
      id: newShapeId,
      name: `Custom Shape ${shapes.length + 1}`,
      baseSize: 64,
      layers: [
        {
          id: `layer_${Date.now()}`,
          name: 'Core Circle',
          type: 'circle',
          x: 0,
          y: 0,
          width: 28,
          height: 28,
          radius: 14,
          rotationDeg: 0,
          colorMode: 'inherit',
          alpha: 1.0,
          isStroke: false,
          glowBlurRadius: 6,
          blendMode: 'source-over',
          visible: true
        }
      ]
    };
    const updated = [...shapes, newShape];
    setShapes(updated);
    setSelectedShapeId(newShapeId);
    setSelectedLayerId(newShape.layers[0].id);
    onUpdateShapes(updated, newShapeId);
  };

  const handleDuplicateShape = () => {
    const newShapeId = `shape_${Date.now()}`;
    const newShape: CustomCompositeShape = {
      ...activeShape,
      id: newShapeId,
      name: `${activeShape.name} (Copy)`,
      layers: activeShape.layers.map(l => ({ ...l, id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 5)}` }))
    };
    const updated = [...shapes, newShape];
    setShapes(updated);
    setSelectedShapeId(newShapeId);
    setSelectedLayerId(newShape.layers[0]?.id || null);
    onUpdateShapes(updated, newShapeId);
  };

  const handleDeleteShape = () => {
    if (shapes.length <= 1) return;
    const remaining = shapes.filter(s => s.id !== activeShape.id);
    setShapes(remaining);
    setSelectedShapeId(remaining[0].id);
    setSelectedLayerId(remaining[0].layers[0]?.id || null);
    onUpdateShapes(remaining, remaining[0].id);
  };

  const isAppliedToCurrentEmitter = appliedShapeId === activeShape.id;

  return (
    <div className="space-y-4">
      {/* Studio Header Toolbar */}
      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Primitive Shape Studio
                <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 text-[9px] rounded font-mono">
                  Stack Primitives &amp; Effects
                </span>
              </h3>
              <p className="text-[10px] text-neutral-400">
                Compose custom multi-layer particle textures with real-time bloom, glints, cutouts &amp; alpha blending.
              </p>
            </div>
          </div>

          {/* Apply to Emitter Button */}
          <button
            type="button"
            onClick={() => onApplyShapeToEmitter(activeShape)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
              isAppliedToCurrentEmitter 
                ? 'bg-emerald-600 text-white' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isAppliedToCurrentEmitter ? (
              <>
                <Check size={14} />
                <span>Active On Emitter</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Apply to Emitter</span>
              </>
            )}
          </button>
        </div>

        {/* Shape Switcher / Namer */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-neutral-900">
          <div className="sm:col-span-6">
            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Preset / Shape Library</label>
            <select
              value={selectedShapeId}
              onChange={(e) => setSelectedShapeId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {shapes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.layers.length} layers)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6 flex items-end gap-1">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-neutral-400 block mb-1">Shape Name</label>
              <input
                type="text"
                value={activeShape.name}
                onChange={(e) => updateCurrentShape(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="Shape name..."
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNewShape}
              title="New Shape"
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs transition"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={handleDuplicateShape}
              title="Duplicate Shape"
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs transition"
            >
              <Copy size={14} />
            </button>
            {shapes.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteShape}
                title="Delete Shape"
                className="p-2 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-red-400 rounded-lg text-xs transition"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: Preview + Layers + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT COLUMN: Interactive Canvas Preview & Test Swatches */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <Sun size={13} className="text-amber-400" />
                Live Texture Raster (64x64)
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle Grid"
                  className={`p-1 rounded ${showGrid ? 'bg-amber-600/30 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <Grid size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCrosshairs(!showCrosshairs)}
                  title="Toggle Center Crosshairs"
                  className={`p-1 rounded ${showCrosshairs ? 'bg-amber-600/30 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <Crosshair size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  title="Toggle Layer Selection Bounds"
                  className={`p-1 rounded ${showBoundingBoxes ? 'bg-sky-600/30 text-sky-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <RotateCw size={13} />
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative p-1 bg-black/60 rounded-xl border border-neutral-800/80 shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="w-56 h-56 rounded-lg cursor-crosshair"
              />
            </div>

            {/* Tint Color Swatches */}
            <div className="w-full mt-3 pt-2.5 border-t border-neutral-900">
              <label className="text-[10px] font-bold text-neutral-400 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1">
                  <Palette size={11} className="text-amber-400" />
                  Preview Particle Tint
                </span>
                <span className="font-mono text-neutral-500 text-[9px]">{testColor}</span>
              </label>
              <div className="flex items-center gap-1.5">
                {TEST_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setTestColor(c.hex)}
                    title={c.label}
                    className={`flex-1 h-6 rounded-md border transition ${
                      testColor === c.hex 
                        ? 'border-white ring-1 ring-white/50 scale-105' 
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={testColor}
                  onChange={(e) => setTestColor(e.target.value)}
                  className="w-6 h-6 rounded-md bg-transparent cursor-pointer border border-neutral-700"
                  title="Custom tint"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets Gallery */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
              Template Archetypes
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_COMPOSITE_SHAPES.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const newId = `shape_${Date.now()}`;
                    const cloned: CustomCompositeShape = {
                      ...preset,
                      id: newId,
                      name: `${preset.name} (Custom)`
                    };
                    const updated = [...shapes, cloned];
                    setShapes(updated);
                    setSelectedShapeId(newId);
                    setSelectedLayerId(cloned.layers[0]?.id || null);
                    onUpdateShapes(updated, newId);
                  }}
                  className="p-2 bg-neutral-900/90 hover:bg-neutral-800/80 border border-neutral-800/80 rounded-lg text-left transition flex flex-col gap-0.5"
                >
                  <span className="text-[11px] font-bold text-neutral-200 truncate">{preset.name}</span>
                  <span className="text-[9px] text-neutral-500">{preset.layers.length} primitive layers</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Layers Stack + Layer Inspector */}
        <div className="lg:col-span-7 space-y-3">
          {/* Add Layer Primitive Toolbar */}
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
              + Add Primitive Shape
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {[
                { type: 'circle', label: 'Circle', icon: '⭕' },
                { type: 'rect', label: 'Box', icon: '◻️' },
                { type: 'rounded_rect', label: 'Rounded', icon: '🔲' },
                { type: 'ring', label: 'Ring', icon: '💍' },
                { type: 'line', label: 'Line', icon: '➖' },
                { type: 'star', label: 'Star', icon: '✦' },
                { type: 'diamond', label: 'Diamond', icon: '🔷' },
                { type: 'ellipse', label: 'Ellipse', icon: '⬭' },
              ].map(prim => (
                <button
                  key={prim.type}
                  type="button"
                  onClick={() => handleAddLayer(prim.type as CompositePrimitiveType)}
                  className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-lg flex flex-col items-center gap-0.5 text-neutral-300 transition"
                >
                  <span className="text-xs">{prim.icon}</span>
                  <span className="text-[9px] truncate w-full text-center">{prim.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Stack */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <Layers size={13} className="text-amber-400" />
                Layer Stack (Drawn Bottom to Top)
              </span>
              <span className="text-[9px] text-neutral-500 font-mono">
                {activeShape.layers.length} Layers
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeShape.layers.map((layer, index) => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/60 text-white'
                        : 'bg-neutral-900 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCurrentShape(prev => ({
                            ...prev,
                            layers: prev.layers.map(l => l.id === layer.id ? { ...l, visible: l.visible === false ? true : false } : l)
                          }));
                        }}
                        className={`p-1 rounded ${layer.visible === false ? 'text-neutral-600' : 'text-amber-400 hover:text-amber-300'}`}
                      >
                        {layer.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold truncate">{layer.name}</span>
                          <span className="px-1 py-0.2 bg-neutral-800 text-neutral-400 text-[9px] rounded font-mono">
                            {layer.type}
                          </span>
                          {layer.blendMode && layer.blendMode !== 'source-over' && (
                            <span className="px-1 py-0.2 bg-purple-900/50 text-purple-300 text-[8px] rounded font-mono">
                              {layer.blendMode}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-neutral-500 flex items-center gap-2">
                          <span>Pos: ({layer.x}, {layer.y})</span>
                          <span>Size: {layer.width}x{layer.height}</span>
                          {layer.glowBlurRadius ? <span>Glow: {layer.glowBlurRadius}px</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveLayer(index, 'up')}
                        className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-800"
                        title="Move Down (Backwards in render order)"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={index === activeShape.layers.length - 1}
                        onClick={() => handleMoveLayer(index, 'down')}
                        className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-800"
                        title="Move Up (Forwards in render order)"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateLayer(layer)}
                        className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800"
                        title="Duplicate Layer"
                      >
                        <Copy size={12} />
                      </button>
                      {activeShape.layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLayer(layer.id)}
                          className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40"
                          title="Delete Layer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Layer Properties Inspector */}
          {selectedLayer ? (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Layer Inspector: {selectedLayer.name}
                </span>
                <input
                  type="text"
                  value={selectedLayer.name}
                  onChange={(e) => updateSelectedLayer({ name: e.target.value })}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-amber-500 w-36 text-right"
                  placeholder="Layer name..."
                />
              </div>

              {/* Geometry Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
                  Geometry &amp; Offsets (Relative to Center)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Offset X ({selectedLayer.x}px)</label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={selectedLayer.x}
                      onChange={(e) => updateSelectedLayer({ x: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Offset Y ({selectedLayer.y}px)</label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={selectedLayer.y}
                      onChange={(e) => updateSelectedLayer({ y: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Width ({selectedLayer.width}px)</label>
                    <input
                      type="range"
                      min={2}
                      max={64}
                      value={selectedLayer.width}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSelectedLayer({ 
                          width: val,
                          ...(selectedLayer.type === 'circle' || selectedLayer.type === 'ring' ? { height: val, radius: val / 2 } : {})
                        });
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Height ({selectedLayer.height}px)</label>
                    <input
                      type="range"
                      min={2}
                      max={64}
                      value={selectedLayer.height}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSelectedLayer({ 
                          height: val,
                          ...(selectedLayer.type === 'circle' || selectedLayer.type === 'ring' ? { width: val, radius: val / 2 } : {})
                        });
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Rotation ({selectedLayer.rotationDeg}°)</label>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selectedLayer.rotationDeg}
                      onChange={(e) => updateSelectedLayer({ rotationDeg: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  {(selectedLayer.type === 'rounded_rect' || selectedLayer.type === 'star') && (
                    <div>
                      <label className="text-[9px] text-neutral-400 block mb-0.5">Corner Radius ({selectedLayer.radius || 4}px)</label>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={selectedLayer.radius || 4}
                        onChange={(e) => updateSelectedLayer({ radius: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Stroke vs Fill</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => updateSelectedLayer({ isStroke: false })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold ${
                          !selectedLayer.isStroke ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        Solid Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedLayer({ isStroke: true })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold ${
                          selectedLayer.isStroke ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        Stroke
                      </button>
                    </div>
                  </div>
                </div>

                {selectedLayer.isStroke && (
                  <div className="w-full sm:w-1/2 pt-1">
                    <label className="text-[9px] text-neutral-400 block mb-0.5">Stroke Thickness ({selectedLayer.strokeWidth || 2}px)</label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={selectedLayer.strokeWidth || 2}
                      onChange={(e) => updateSelectedLayer({ strokeWidth: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Shading & Effects Section */}
              <div className="space-y-2 pt-2 border-t border-neutral-900">
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
                  Color, Bloom &amp; Blend Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-1">Color Mode</label>
                    <select
                      value={selectedLayer.colorMode}
                      onChange={(e) => updateSelectedLayer({ colorMode: e.target.value as 'inherit' | 'fixed' })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="inherit">Inherit Particle Tint</option>
                      <option value="fixed">Fixed Hex Color</option>
                    </select>
                    {selectedLayer.colorMode === 'fixed' && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="color"
                          value={selectedLayer.fixedColor || '#ffffff'}
                          onChange={(e) => updateSelectedLayer({ fixedColor: e.target.value })}
                          className="w-6 h-6 rounded bg-transparent cursor-pointer border border-neutral-700"
                        />
                        <span className="font-mono text-[10px] text-neutral-300">
                          {selectedLayer.fixedColor || '#ffffff'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-1">
                      Layer Opacity ({Math.round((selectedLayer.alpha ?? 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((selectedLayer.alpha ?? 1) * 100)}
                      onChange={(e) => updateSelectedLayer({ alpha: Number(e.target.value) / 100 })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-1">Blend Mode / Composite</label>
                    <select
                      value={selectedLayer.blendMode || 'source-over'}
                      onChange={(e) => updateSelectedLayer({ blendMode: e.target.value as any })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="source-over">source-over (Normal Stack)</option>
                      <option value="lighter">lighter (Additive Glow / Energy)</option>
                      <option value="destination-out">destination-out (Hole Cutout / Mask)</option>
                      <option value="screen">screen (Luminescent Soft)</option>
                      <option value="multiply">multiply (Shading / Tint)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-1">
                      Shadow / Glow Blur ({selectedLayer.glowBlurRadius || 0}px)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      value={selectedLayer.glowBlurRadius || 0}
                      onChange={(e) => updateSelectedLayer({ glowBlurRadius: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 block mb-1">Custom Glow Color (Optional)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedLayer.glowColor || selectedLayer.fixedColor || '#f59e0b'}
                        onChange={(e) => updateSelectedLayer({ glowColor: e.target.value })}
                        className="w-6 h-6 rounded bg-transparent cursor-pointer border border-neutral-700"
                      />
                      {selectedLayer.glowColor && (
                        <button
                          type="button"
                          onClick={() => updateSelectedLayer({ glowColor: undefined })}
                          className="text-[9px] text-neutral-400 hover:text-white underline"
                        >
                          Clear (Auto)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-neutral-500 text-xs">
              Select a layer from the stack above or add a new primitive to edit its properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
