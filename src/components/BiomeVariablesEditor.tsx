import React, { useState } from 'react';
import { RefinedBiome, BiomeVariable } from '../engine/refinedBiomeSchema';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Globe, 
  MapPin, 
  Copy, 
  Check, 
  Sliders, 
  X,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';

interface BiomeVariablesEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
}

export const BiomeVariablesEditor: React.FC<BiomeVariablesEditorProps> = ({
  biome,
  onUpdateBiome
}) => {
  const variablesList: BiomeVariable[] = biome.variables || [];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<{
    id: string;
    name: string;
    category: string;
    type: 'number' | 'string' | 'boolean' | 'enum';
    scope: 'local_biome' | 'global_interbiome';
    options?: string;
    defaultValue: any;
    minValue?: number;
    maxValue?: number;
    description: string;
    isEditing: boolean;
  }>({
    id: '',
    name: '',
    category: 'environment',
    type: 'number',
    scope: 'local_biome',
    defaultValue: 50,
    description: '',
    isEditing: false
  });

  const generateVarId = () => `bvar_${Date.now().toString().slice(-6)}`;

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveVariable = () => {
    if (!editingVar.name.trim()) return;

    const parsedOptions = editingVar.type === 'enum' && editingVar.options
      ? editingVar.options.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newVar: BiomeVariable = {
      id: editingVar.id || generateVarId(),
      name: editingVar.name.trim(),
      category: editingVar.category || 'environment',
      type: editingVar.type,
      scope: editingVar.scope,
      options: parsedOptions,
      defaultValue: editingVar.defaultValue,
      currentValue: editingVar.defaultValue,
      minValue: editingVar.minValue,
      maxValue: editingVar.maxValue,
      description: editingVar.description
    };

    onUpdateBiome(b => {
      const existing = b.variables || [];
      if (editingVar.isEditing) {
        return {
          ...b,
          variables: existing.map(v => v.id === newVar.id ? newVar : v)
        };
      } else {
        return {
          ...b,
          variables: [...existing, newVar]
        };
      }
    });

    setIsModalOpen(false);
  };

  const handleDeleteVariable = (varId: string) => {
    onUpdateBiome(b => ({
      ...b,
      variables: (b.variables || []).filter(v => v.id !== varId)
    }));
  };

  const handleUpdateCurrentValue = (varId: string, value: any) => {
    onUpdateBiome(b => ({
      ...b,
      variables: (b.variables || []).map(v => v.id === varId ? { ...v, currentValue: value } : v)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Database size={16} className="text-rose-400" />
            Variables & Parameters ({variablesList.length})
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage local environmental factors and <strong>Interbiome Global Variables</strong> that persist and sync across multiple levels, biomes, and interactive props.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVar({
              id: generateVarId(),
              name: '',
              category: 'environment',
              type: 'number',
              scope: 'local_biome',
              defaultValue: 50,
              description: '',
              isEditing: false
            });
            setIsModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-600/30"
        >
          <Plus size={14} />
          <span>Add Biome Variable</span>
        </button>
      </div>

      {/* Empty State */}
      {variablesList.length === 0 ? (
        <div className="text-center py-14 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-500 text-xs space-y-3">
          <Database size={32} className="mx-auto text-neutral-600" />
          <p className="font-bold text-neutral-300">No Custom Biome Variables Configured</p>
          <p className="max-w-md mx-auto text-neutral-500">
            Define environmental stats such as temperature, toxic spore levels, weather triggers, or interbiome flags to control states and prop responses.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingVar({
                id: generateVarId(),
                name: 'Ambient Heat Index',
                category: 'hazard',
                type: 'number',
                scope: 'local_biome',
                defaultValue: 30,
                minValue: 0,
                maxValue: 100,
                description: 'Environmental temperature level',
                isEditing: false
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30 inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create First Biome Variable</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variablesList.map(v => {
            const isInterbiome = v.scope === 'global_interbiome';
            const currentVal = v.currentValue !== undefined ? v.currentValue : v.defaultValue;

            return (
              <div 
                key={v.id}
                className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition shadow-lg"
              >
                {/* Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                        isInterbiome ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      }`}>
                        {isInterbiome ? '🌐 Interbiome Global' : '📍 Local Biome'}
                      </span>
                      <span className="text-[9px] text-neutral-500 font-mono">
                        {v.category} • {v.type}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate mt-1">
                      {v.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyId(v.id)}
                      className="p-1 text-neutral-400 hover:text-white rounded"
                      title="Copy Variable ID"
                    >
                      {copiedId === v.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVar({
                          id: v.id,
                          name: v.name,
                          category: v.category,
                          type: v.type,
                          scope: v.scope,
                          options: v.options?.join(', '),
                          defaultValue: v.defaultValue,
                          minValue: v.minValue,
                          maxValue: v.maxValue,
                          description: v.description || '',
                          isEditing: true
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-neutral-400 hover:text-white rounded"
                      title="Edit Variable"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVariable(v.id)}
                      className="p-1 text-neutral-500 hover:text-red-400 rounded"
                      title="Delete Variable"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ID & Description */}
                <div className="space-y-1">
                  <div className="text-[10px] text-neutral-500 font-mono flex items-center justify-between">
                    <span>ID: <code className="text-rose-400 font-semibold">{v.id}</code></span>
                    {v.minValue !== undefined && v.maxValue !== undefined && (
                      <span>Range: [{v.minValue}, {v.maxValue}]</span>
                    )}
                  </div>
                  {v.description && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{v.description}</p>
                  )}
                </div>

                {/* Live Current Value Editor */}
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="font-bold uppercase tracking-wider text-neutral-400">Live Simulation Value</span>
                    <span className="font-mono text-neutral-500">Default: {String(v.defaultValue)}</span>
                  </div>

                  {v.type === 'boolean' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrentValue(v.id, !currentVal)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                        currentVal 
                          ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${currentVal ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
                      <span>{currentVal ? 'TRUE / ACTIVE' : 'FALSE / INACTIVE'}</span>
                    </button>
                  ) : v.type === 'number' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={v.minValue ?? 0}
                          max={v.maxValue ?? 100}
                          value={Number(currentVal) || 0}
                          onChange={(e) => handleUpdateCurrentValue(v.id, parseFloat(e.target.value))}
                          className="flex-1 accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          value={Number(currentVal) || 0}
                          onChange={(e) => handleUpdateCurrentValue(v.id, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs text-right font-mono text-white"
                        />
                      </div>
                    </div>
                  ) : v.type === 'enum' && v.options && v.options.length > 0 ? (
                    <select
                      value={String(currentVal)}
                      onChange={(e) => handleUpdateCurrentValue(v.id, e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      {v.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(currentVal ?? '')}
                      onChange={(e) => handleUpdateCurrentValue(v.id, e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingVar.isEditing ? 'Edit Biome Variable' : 'Declare New Biome Variable'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Variable Name</label>
                <input
                  type="text"
                  value={editingVar.name}
                  onChange={(e) => setEditingVar(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                  placeholder="e.g. Toxic Spore Index, Forge Fire Lit"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Category</label>
                  <select
                    value={editingVar.category}
                    onChange={(e) => setEditingVar(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                  >
                    <option value="environment">🌿 Environment</option>
                    <option value="hazard">⚠️ Hazard / Toxicity</option>
                    <option value="weather">🌪️ Weather & Atmosphere</option>
                    <option value="progression">🔓 Progression Unlock</option>
                    <option value="custom">⚙️ Custom / Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Data Type</label>
                  <select
                    value={editingVar.type}
                    onChange={(e) => {
                      const nextType = e.target.value as any;
                      setEditingVar(prev => ({
                        ...prev,
                        type: nextType,
                        defaultValue: nextType === 'boolean' ? false : nextType === 'number' ? 0 : ''
                      }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="number">Number (Float/Int)</option>
                    <option value="boolean">Boolean (True/False)</option>
                    <option value="string">String (Text)</option>
                    <option value="enum">Enum (Option List)</option>
                  </select>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase">Variable Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVar(prev => ({ ...prev, scope: 'local_biome' }))}
                    className={`p-2 rounded-xl text-left border transition ${
                      editingVar.scope === 'local_biome'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">📍 Local Biome</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">Scoped to this biome ecosystem</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingVar(prev => ({ ...prev, scope: 'global_interbiome' }))}
                    className={`p-2 rounded-xl text-left border transition ${
                      editingVar.scope === 'global_interbiome'
                        ? 'bg-indigo-950/70 border-indigo-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">🌐 Interbiome Global</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">Persists across all maps & biomes</div>
                  </button>
                </div>
              </div>

              {/* Default Value Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Default Initial Value</label>
                {editingVar.type === 'boolean' ? (
                  <select
                    value={String(editingVar.defaultValue)}
                    onChange={(e) => setEditingVar(prev => ({ ...prev, defaultValue: e.target.value === 'true' }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                  >
                    <option value="false">False (Inactive)</option>
                    <option value="true">True (Active)</option>
                  </select>
                ) : editingVar.type === 'number' ? (
                  <input
                    type="number"
                    value={editingVar.defaultValue}
                    onChange={(e) => setEditingVar(prev => ({ ...prev, defaultValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    value={editingVar.defaultValue}
                    onChange={(e) => setEditingVar(prev => ({ ...prev, defaultValue: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                )}
              </div>

              {/* Range Limits for Numbers */}
              {editingVar.type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Min Value</label>
                    <input
                      type="number"
                      value={editingVar.minValue ?? 0}
                      onChange={(e) => setEditingVar(prev => ({ ...prev, minValue: parseFloat(e.target.value) }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Max Value</label>
                    <input
                      type="number"
                      value={editingVar.maxValue ?? 100}
                      onChange={(e) => setEditingVar(prev => ({ ...prev, maxValue: parseFloat(e.target.value) }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={editingVar.description}
                  onChange={(e) => setEditingVar(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white resize-none"
                  placeholder="Explain the purpose of this variable..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariable}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                {editingVar.isEditing ? 'Save Changes' : 'Create Variable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
