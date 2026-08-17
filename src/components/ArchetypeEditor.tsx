import React, { useState } from 'react';
import { 
  MasonProject, 
  ArchetypeFile, 
  ArchetypeData,
  DEFAULT_ARCHETYPES
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  User, 
  Shield, 
  Zap, 
  Footprints, 
  Activity, 
  Swords, 
  Flame, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Sliders,
  Brain,
  Camera,
  Eye
} from 'lucide-react';

interface ArchetypeEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
}

export const ArchetypeEditor: React.FC<ArchetypeEditorProps> = ({
  project,
  onUpdateProject
}) => {
  const activeFileName = project.activeFiles.archetypeFileName || project.fileSystem.archetypes?.[0]?.fileName;
  const currentArchFile = project.fileSystem.archetypes.find(a => a.fileName === activeFileName) || project.fileSystem.archetypes[0];

  const arch = currentArchFile.archetypeData;

  const updateArchetype = (updater: (prev: ArchetypeData) => ArchetypeData) => {
    onUpdateProject(p => {
      const updated = p.fileSystem.archetypes.map(a => {
        if (a.fileName === currentArchFile.fileName) {
          return {
            ...a,
            updatedAt: new Date().toISOString(),
            archetypeData: updater(a.archetypeData)
          };
        }
        return a;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, archetypes: updated }
      };
    });
  };

  const handleToggleTraversalTag = (tag: string) => {
    updateArchetype(a => {
      const exists = a.traversalTags.includes(tag);
      return {
        ...a,
        traversalTags: exists ? a.traversalTags.filter(t => t !== tag) : [...a.traversalTags, tag]
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      {/* Subfolder File Header */}
      <FileSubfolderHeader
        subfolderName="archetypes"
        extension=".arch"
        files={project.fileSystem.archetypes.map(a => ({
          id: a.id,
          name: a.name,
          fileName: a.fileName,
          updatedAt: a.updatedAt
        }))}
        activeFileName={currentArchFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, archetypeFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.arch`;
          const base = DEFAULT_ARCHETYPES[0];
          const newArch: ArchetypeFile = {
            id: `arch_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archetypeData: {
              ...base,
              id: `arch_${Date.now()}`,
              name,
              title: `${name} (Initiate)`
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, archetypeFileName: safeName },
            fileSystem: {
              ...p.fileSystem,
              archetypes: [...p.fileSystem.archetypes, newArch]
            }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = project.fileSystem.archetypes.find(a => a.fileName === fName);
          if (!target) return;
          const dupeName = `${target.name} (Copy)`;
          const dupeFileName = `${target.fileName.replace('.arch', '')}_copy.arch`;
          const dupe: ArchetypeFile = {
            ...target,
            id: `arch_${Date.now()}`,
            name: dupeName,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, archetypeFileName: dupeFileName },
            fileSystem: {
              ...p.fileSystem,
              archetypes: [...p.fileSystem.archetypes, dupe]
            }
          }));
        }}
        onSaveFile={() => {}}
        onExportFile={(fName) => {
          const target = project.fileSystem.archetypes.find(a => a.fileName === fName);
          if (target) {
            const jsonStr = JSON.stringify(target, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = target.fileName;
            a.click();
          }
        }}
        onDeleteFile={(fName) => {
          onUpdateProject(p => {
            const filtered = p.fileSystem.archetypes.filter(a => a.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, archetypeFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, archetypes: filtered }
            };
          });
        }}
        accentColor="cyan"
      />

      {/* Main Archetype Inspector */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Hero Header Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-lg shrink-0"
              style={{ backgroundColor: `${arch.themeColor}20`, borderColor: arch.themeColor }}
            >
              {arch.avatarIcon || '🛡️'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={arch.name}
                  onChange={(e) => updateArchetype(a => ({ ...a, name: e.target.value }))}
                  className="font-black text-xl text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-cyan-500 outline-none"
                />
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-950 text-cyan-400 border border-neutral-800">
                  {currentArchFile.fileName}
                </span>
              </div>
              <input
                type="text"
                value={arch.title}
                onChange={(e) => updateArchetype(a => ({ ...a, title: e.target.value }))}
                className="text-xs text-neutral-400 bg-transparent border-none outline-none mt-1 w-full"
                placeholder="Hero Title / Role"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Damage Affinity</label>
              <select
                value={arch.damageAffinity}
                onChange={(e) => updateArchetype(a => ({ ...a, damageAffinity: e.target.value as any }))}
                className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white capitalize font-semibold"
              >
                <option value="slashing">Slashing</option>
                <option value="blunt">Blunt</option>
                <option value="piercing">Piercing</option>
                <option value="fire">Fire</option>
                <option value="frost">Frost</option>
                <option value="lightning">Lightning</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>
        </div>

        {/* Base Attributes Grid */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            Base Attributes & Physical Metrics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-red-400">Health</span>
              <input
                type="number"
                value={arch.baseStats.health}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, health: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-400">Energy</span>
              <input
                type="number"
                value={arch.baseStats.energy}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, energy: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400">Stamina</span>
              <input
                type="number"
                value={arch.baseStats.stamina}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, stamina: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400">Poise</span>
              <input
                type="number"
                value={arch.baseStats.poise}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, poise: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400">Move Speed</span>
              <input
                type="number"
                step="0.1"
                value={arch.baseStats.moveSpeed}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, moveSpeed: parseFloat(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-400">Jump Force</span>
              <input
                type="number"
                step="0.1"
                value={arch.baseStats.jumpForce}
                onChange={(e) => updateArchetype(a => ({ ...a, baseStats: { ...a.baseStats, jumpForce: parseFloat(e.target.value) || 0 } }))}
                className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Behavior & AI Driver Attachment */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Brain size={14} className="text-indigo-400" />
              Attached Behavior, Camera Focus & Enemy AI Driver
            </h3>
            <span className="text-[10px] text-indigo-400 font-mono">
              {arch.assignedBehaviorFileName || 'Unassigned / Player Direct'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-neutral-950 p-4 border border-neutral-800 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Brain size={20} />
            </div>

            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase block">
                Assigned Behavior Controller (.behavior)
              </label>
              <select
                value={arch.assignedBehaviorFileName || ''}
                onChange={(e) => updateArchetype(a => ({ ...a, assignedBehaviorFileName: e.target.value }))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold outline-none focus:border-indigo-500"
              >
                <option value="">None (Player Direct Control / Default Hero)</option>
                {(project.fileSystem.behaviors || []).map(b => (
                  <option key={b.id} value={b.fileName}>
                    {b.name} ({b.fileName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Traversal Tags & Movement Mechanics */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Footprints size={14} className="text-cyan-400" />
            Traversal Abilities & Movement Modifiers
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'double_jump', name: 'Aether Double Jump', desc: 'Leap second time in air' },
              { id: 'air_dash', name: 'Horizontal Air Dash', desc: 'Burst through laser traps' },
              { id: 'wall_cling', name: 'Vertical Wall Cling', desc: 'Slide & wall kick masonry' },
              { id: 'grapple_hook', name: 'Titan Hook', desc: 'Grapple to ceiling rings' }
            ].map(tag => {
              const active = arch.traversalTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTraversalTag(tag.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    active 
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-md' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{tag.name}</span>
                    {active && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">{tag.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Backstory & Narrative Prose */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Backstory & Narrative Register
          </h3>
          <textarea
            value={arch.backstory}
            onChange={(e) => updateArchetype(a => ({ ...a, backstory: e.target.value }))}
            className="w-full h-28 bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-200 leading-relaxed outline-none focus:border-cyan-500"
            placeholder="Author character origins, lore affinity, and combat history..."
          />
        </div>
      </div>
    </div>
  );
};
