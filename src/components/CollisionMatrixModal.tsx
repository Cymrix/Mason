import React, { useState } from 'react';
import { 
  Grid, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  ShieldCheck, 
  CloudRain, 
  User, 
  Flame, 
  Zap, 
  Sparkles, 
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sliders
} from 'lucide-react';
import { 
  CollisionMatrixConfig, 
  DEFAULT_COLLISION_TAGS, 
  DEFAULT_TAG_COLORS, 
  createDefaultCollisionMatrixConfig, 
  setCollisionPair, 
  addCollisionTag, 
  removeCollisionTag, 
  canCollide 
} from '../engine/collisionMatrixSchema';
import { MasonProject } from '../engine/masonProjectSchema';

interface CollisionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MasonProject | null;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject, meta?: { actionLabel?: string }) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const CollisionMatrixModal: React.FC<CollisionMatrixModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onShowToast
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagColor, setNewTagColor] = useState('#38bdf8');
  const [hoveredPair, setHoveredPair] = useState<{ row: string; col: string } | null>(null);
  const [testTagA, setTestTagA] = useState<string>('weather');
  const [testTagB, setTestTagB] = useState<string>('player');

  if (!isOpen || !project) return null;

  const config: CollisionMatrixConfig = project.collisionMatrix || createDefaultCollisionMatrixConfig();
  const tags = config.tags || DEFAULT_COLLISION_TAGS;
  const tagColors = config.tagColors || DEFAULT_TAG_COLORS;

  const handleToggleCell = (tagA: string, tagB: string) => {
    const current = canCollide(config, tagA, tagB);
    const updated = setCollisionPair(config, tagA, tagB, !current);
    
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: updated
    }), { actionLabel: `Toggle collision ${tagA} vs ${tagB}` });
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset collision matrix to default Metroidvania rules? (Weather will pass through characters and enemies)')) return;
    const def = createDefaultCollisionMatrixConfig();
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: def
    }), { actionLabel: 'Reset collision matrix to defaults' });
    if (onShowToast) onShowToast('Reset collision matrix to default configuration', 'success');
  };

  const handleDisableAllWeather = () => {
    let next = { ...config, matrix: { ...config.matrix } };
    for (const t of tags) {
      next = setCollisionPair(next, 'weather', t, false);
    }
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: next
    }), { actionLabel: 'Disable weather collisions' });
    if (onShowToast) onShowToast('Disabled all weather collisions (rain/snow passes through everything)', 'info');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (tags.includes(cleanTag)) {
      alert(`Tag "${cleanTag}" already exists in matrix.`);
      return;
    }
    const updated = addCollisionTag(config, cleanTag, newTagColor);
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: updated
    }), { actionLabel: `Add collision tag ${cleanTag}` });
    setNewTagInput('');
    if (onShowToast) onShowToast(`Added collision tag: ${cleanTag}`, 'success');
  };

  const handleRemoveTag = (tag: string) => {
    if (['solids', 'player', 'enemy', 'weather'].includes(tag)) {
      alert(`Core tag "${tag}" is fundamental to engine physics and cannot be deleted.`);
      return;
    }
    if (!window.confirm(`Delete collision tag "${tag}"?`)) return;
    const updated = removeCollisionTag(config, tag);
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: updated
    }), { actionLabel: `Removed collision tag ${tag}` });
    if (onShowToast) onShowToast(`Removed collision tag: ${tag}`, 'info');
  };

  const isTesterColliding = canCollide(config, testTagA, testTagB);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/70 rounded-xl border border-cyan-500/40 text-cyan-400 shadow-md">
              <Grid size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Collision Tags &amp; Interaction Matrix
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {tags.length} Tags
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure physical collisions and trigger interactions between characters, terrain solids, weather FX, and particles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDisableAllWeather}
              className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Ensure rain and atmospheric weather FX pass through all entities without colliding"
            >
              <CloudRain size={13} />
              <span>Pass-Through Weather</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Reset all collision rules to standard Metroidvania defaults"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* QUICK COLLISION TESTER & EXPLANATION BANNER */}
        <div className="p-3.5 bg-neutral-950/60 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-neutral-400 font-semibold flex items-center gap-1">
              <Sliders size={13} className="text-cyan-400" />
              <span>Collision Inspector:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <select
                value={testTagA}
                onChange={(e) => setTestTagA(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1 font-mono text-xs font-bold outline-none"
              >
                {tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <span className="text-neutral-500 font-mono">vs</span>

              <select
                value={testTagB}
                onChange={(e) => setTestTagB(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1 font-mono text-xs font-bold outline-none"
              >
                {tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div className="flex items-center ml-2">
                {isTesterColliding ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Collides (Physical Block / Hit / Trigger)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 font-bold flex items-center gap-1.5">
                    <XCircle size={13} className="text-neutral-400" />
                    <span>Passes Through (No Collision)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-cyan-300/80 flex items-center gap-1.5 bg-cyan-950/30 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
            <HelpCircle size={13} className="text-cyan-400 shrink-0" />
            <span>Click any cell in the table below to toggle mutual collision on/off.</span>
          </div>
        </div>

        {/* MATRIX BODY */}
        <div className="flex-1 overflow-auto p-4 flex flex-col lg:flex-row gap-6">
          
          {/* MATRIX GRID TABLE */}
          <div className="flex-1 overflow-x-auto">
            <table className="border-collapse select-none">
              <thead>
                <tr>
                  <th className="p-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-left bg-neutral-950/40 rounded-tl-xl border border-neutral-800">
                    Tag Layer
                  </th>
                  {tags.map(colTag => (
                    <th
                      key={colTag}
                      className={`p-2 text-center border border-neutral-800 transition-colors ${
                        hoveredPair?.col === colTag ? 'bg-cyan-950/40 text-cyan-300' : 'bg-neutral-950/60 text-neutral-300'
                      }`}
                      style={{ minWidth: 64 }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: tagColors[colTag] || '#38bdf8' }}
                        />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate max-w-[70px]">
                          {colTag}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map(rowTag => (
                  <tr key={rowTag} className="border-b border-neutral-800">
                    <td
                      className={`p-2.5 border border-neutral-800 transition-colors ${
                        hoveredPair?.row === rowTag ? 'bg-cyan-950/40 text-cyan-300' : 'bg-neutral-950/80 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: tagColors[rowTag] || '#38bdf8' }}
                        />
                        <span className="text-xs font-mono font-bold tracking-wide">
                          {rowTag}
                        </span>
                      </div>
                    </td>

                    {tags.map(colTag => {
                      const collides = canCollide(config, rowTag, colTag);
                      const isHovered = (hoveredPair?.row === rowTag && hoveredPair?.col === colTag) ||
                                        (hoveredPair?.row === colTag && hoveredPair?.col === rowTag);
                      const isSelf = rowTag === colTag;

                      return (
                        <td
                          key={`${rowTag}_${colTag}`}
                          onMouseEnter={() => setHoveredPair({ row: rowTag, col: colTag })}
                          onMouseLeave={() => setHoveredPair(null)}
                          onClick={() => handleToggleCell(rowTag, colTag)}
                          className={`p-2 text-center border border-neutral-800/80 cursor-pointer transition-all ${
                            isHovered 
                              ? 'ring-2 ring-cyan-400/80 z-10 scale-105' 
                              : ''
                          } ${
                            collides
                              ? 'bg-emerald-950/40 hover:bg-emerald-900/60'
                              : isSelf
                              ? 'bg-neutral-950/90 hover:bg-neutral-800/40'
                              : 'bg-neutral-950/50 hover:bg-neutral-800/60'
                          }`}
                          title={`${rowTag} vs ${colTag}: ${collides ? 'COLLIDES (Click to disable)' : 'PASSES THROUGH (Click to enable)'}`}
                        >
                          <div className="flex items-center justify-center">
                            {collides ? (
                              <div className="w-6 h-6 rounded-md bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-600 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIDEBAR: TAGS MANAGER & NEW TAG */}
          <div className="w-full lg:w-72 space-y-4 shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-4 lg:pt-0 lg:pl-6">
            
            {/* ADD CUSTOM TAG */}
            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus size={14} className="text-cyan-400" />
                <span>Add Custom Collision Tag</span>
              </h3>

              <form onSubmit={handleAddTag} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="e.g. water_zone, ghost..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-400">Color:</span>
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newTagInput.trim()}
                    className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Add Tag
                  </button>
                </div>
              </form>
            </div>

            {/* TAGS LIST */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Configured Collision Layers ({tags.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {tags.map(t => {
                  const isCore = ['solids', 'player', 'enemy', 'weather'].includes(t);
                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: tagColors[t] || '#38bdf8' }}
                        />
                        <span className="font-mono font-semibold text-neutral-200 truncate">
                          {t}
                        </span>
                        {isCore && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded-full font-mono">
                            core
                          </span>
                        )}
                      </div>

                      {!isCore && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition"
                          title={`Delete tag ${t}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Symmetric collision matrix automatically synchronizes pairs</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-600/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
