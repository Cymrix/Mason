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

interface CollisionMatrixTabProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject, meta?: { actionLabel?: string }) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const CollisionMatrixTab: React.FC<CollisionMatrixTabProps> = ({
  project,
  onUpdateProject,
  onShowToast
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagColor, setNewTagColor] = useState('#38bdf8');
  const [hoveredPair, setHoveredPair] = useState<{ row: string; col: string } | null>(null);
  const [testTagA, setTestTagA] = useState<string>('weather');
  const [testTagB, setTestTagB] = useState<string>('player');

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
    if (!window.confirm('Reset collision matrix to default Metroidvania rules? (Weather will collide with terrain solids, pass through characters)')) return;
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

  const handleEnableSolidWeather = () => {
    let next = setCollisionPair(config, 'weather', 'solids', true);
    next = setCollisionPair(next, 'particles', 'solids', true);
    onUpdateProject(p => ({
      ...p,
      collisionMatrix: next
    }), { actionLabel: 'Enable solid terrain weather collisions' });
    if (onShowToast) onShowToast('Weather and particles set to collide with solid tiles', 'success');
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
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="p-4 bg-neutral-900/90 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/70 rounded-xl border border-cyan-500/40 text-cyan-400 shadow-md">
            <Grid size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Collision Tags &amp; Interaction Matrix
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {tags.length} Tags
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure physical collisions, hitboxes, and trigger interactions between characters, terrain solids, weather FX, and particles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          <button
            type="button"
            onClick={handleEnableSolidWeather}
            className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            title="Rain and snow will hit solid tiles and splash"
          >
            <CloudRain size={13} />
            <span>Rain Collides with Solids</span>
          </button>

          <button
            type="button"
            onClick={handleDisableAllWeather}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            title="Ensure rain and atmospheric weather FX pass through all entities without colliding"
          >
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
        </div>
      </div>

      {/* QUICK COLLISION TESTER & EXPLANATION BANNER */}
      <div className="p-3.5 bg-neutral-900/60 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
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
                <th className="p-2.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-left bg-neutral-950/40 rounded-tl-xl border border-neutral-800">
                  Tag Layer
                </th>
                {tags.map(colTag => (
                  <th
                    key={colTag}
                    className={`p-2.5 text-center border border-neutral-800 transition-colors ${
                      hoveredPair?.col === colTag ? 'bg-cyan-950/40 text-cyan-300' : 'bg-neutral-950/60 text-neutral-300'
                    }`}
                    style={{ minWidth: 70 }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: tagColors[colTag] || '#38bdf8' }}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate max-w-[75px]">
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
                            ? 'bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-400' 
                            : 'bg-neutral-900/30 hover:bg-neutral-800/50 text-neutral-650'
                        }`}
                        title={`${rowTag} ✕ ${colTag}: ${collides ? 'COLLIDES (Click to disable)' : 'IGNORED (Click to enable)'}`}
                      >
                        <div className="flex items-center justify-center">
                          {collides ? (
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-sm">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-neutral-800/30 border border-neutral-750/30 flex items-center justify-center text-neutral-600">
                              <span className="text-[10px] font-mono select-none">-</span>
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

        {/* SIDEBAR: TAG DEFINITIONS & MANAGER */}
        <div className="w-full lg:w-72 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 shrink-0 shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Collision Tags Pool</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">
              Entities, particles, and tiles match against these tags during the physics simulation tick.
            </p>
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} className="space-y-2 p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Add Custom Tag
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0"
                title="Tag Color"
              />
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. hazard, water..."
                className="flex-1 bg-neutral-900 border border-neutral-750 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm shadow-cyan-950"
            >
              <Plus size={13} />
              <span>Register Tag</span>
            </button>
          </form>

          {/* Tags List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px] pr-1">
            {tags.map(t => {
              const isCore = ['solids', 'player', 'enemy', 'weather'].includes(t);
              const color = tagColors[t] || '#38bdf8';

              return (
                <div
                  key={t}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono font-bold text-neutral-200 truncate">
                      {t}
                    </span>
                    {isCore && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-neutral-800 text-neutral-400">
                        Core
                      </span>
                    )}
                  </div>

                  {!isCore && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded transition"
                      title="Delete tag from matrix"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-[10px] text-cyan-300/80 leading-relaxed">
            💡 <strong>Engine Tip:</strong> When setting particle emitters in the Particle Editor, select the corresponding Collision Tag to control which game entities it physically collides with.
          </div>
        </div>

      </div>

    </div>
  );
};
