import React, { useState } from 'react';
import { Archetype } from '../engine/schema';
import { User, Shield, Zap, Footprints } from 'lucide-react';

export const ArchetypeEditor: React.FC = () => {
  const [archetypes, setArchetypes] = useState<Archetype[]>([
    {
      id: 'arch_korrath',
      name: 'Korrath Steelhand',
      backstory: 'A veteran of the fractured empires...',
      traversalTags: ['double_jump', 'dash'],
      foci: {
        action: ['foci_slash', 'foci_thrust', ''],
        ability: ['foci_grenade', '', '', ''],
        armor: 'foci_heavy_plate',
        defensive: 'foci_roll'
      },
      baseStats: { health: 100, energy: 50 }
    }
  ]);

  const [activeId, setActiveId] = useState('arch_korrath');
  const activeArchetype = archetypes.find(a => a.id === activeId);

  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-200">
      {/* Sidebar List */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase text-neutral-500 mb-2">Archetypes</h2>
        {archetypes.map(a => (
          <button 
            key={a.id}
            onClick={() => setActiveId(a.id)}
            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${activeId === a.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'hover:bg-neutral-800'}`}
          >
            {a.name}
          </button>
        ))}
        <button className="mt-4 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm text-center border border-neutral-700">
          + New Archetype
        </button>
      </div>

      {/* Editor Panel */}
      {activeArchetype ? (
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <User size={32} className="text-blue-500" /> 
              {activeArchetype.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Backstory (Prose Register)</label>
                  <textarea 
                    className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded p-3 text-sm focus:border-blue-500 outline-none resize-none"
                    value={activeArchetype.backstory}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Base Stats</label>
                  <div className="flex gap-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded p-3 flex-1 flex flex-col items-center">
                      <span className="text-red-400 font-bold text-xl">{activeArchetype.baseStats.health}</span>
                      <span className="text-xs text-neutral-500 uppercase mt-1">Health</span>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-700 rounded p-3 flex-1 flex flex-col items-center">
                      <span className="text-cyan-400 font-bold text-xl">{activeArchetype.baseStats.energy}</span>
                      <span className="text-xs text-neutral-500 uppercase mt-1">Energy</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                    <Footprints size={14}/> Traversal Capabilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeArchetype.traversalTags.map(tag => (
                      <span key={tag} className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-2 py-1 rounded text-xs font-medium">
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                    <button className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 px-2 py-1 rounded text-xs">
                      + Add Tag
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-4 flex items-center gap-2">
                  <Zap size={14}/> Fixed Foci Configuration
                </label>
                
                <div className="space-y-4">
                  {/* Action Foci */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                    <h3 className="text-xs text-neutral-400 mb-2">Action (1-3)</h3>
                    <div className="space-y-2">
                      {activeArchetype.foci.action.map((foci, i) => (
                        <div key={i} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded p-2 text-sm">
                          <span className="text-neutral-600 w-4">{i + 1}.</span>
                          <span className={foci ? 'text-neutral-200' : 'text-neutral-600 italic'}>{foci || 'Empty Slot'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ability Foci */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                    <h3 className="text-xs text-neutral-400 mb-2">Ability (1-4)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {activeArchetype.foci.ability.map((foci, i) => (
                        <div key={i} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded p-2 text-sm">
                          <span className="text-neutral-600 w-4">{i + 1}.</span>
                          <span className={foci ? 'text-neutral-200 truncate' : 'text-neutral-600 italic truncate'}>{foci || 'Empty'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Defensive / Armor */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                      <h3 className="text-xs text-neutral-400 mb-2 flex items-center gap-1"><Shield size={12}/> Armor</h3>
                      <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-sm">
                        <span className={activeArchetype.foci.armor ? 'text-neutral-200' : 'text-neutral-600 italic'}>{activeArchetype.foci.armor || 'None'}</span>
                      </div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                      <h3 className="text-xs text-neutral-400 mb-2 flex items-center gap-1"><Shield size={12}/> Defensive</h3>
                      <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-sm">
                        <span className={activeArchetype.foci.defensive ? 'text-neutral-200' : 'text-neutral-600 italic'}>{activeArchetype.foci.defensive || 'None'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
