import React, { useState } from 'react';
import { 
  RefinedBiome, 
  BiomeStateNode, 
  BiomeStateTransition, 
  BiomeStateMachine 
} from '../engine/refinedBiomeSchema';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  X, 
  ArrowRight,
  Zap,
  Tag
} from 'lucide-react';

interface BiomeStatesEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
}

export const BiomeStatesEditor: React.FC<BiomeStatesEditorProps> = ({
  biome,
  onUpdateBiome
}) => {
  const stateMachine: BiomeStateMachine = biome.stateMachine || {
    defaultStateId: 'state_default',
    states: [
      {
        id: 'state_default',
        name: 'Default State',
        description: 'Baseline operational state for this biome.',
        color: biome.regionColor || '#06b6d4',
        isDefault: true
      }
    ],
    transitions: []
  };

  const statesList: BiomeStateNode[] = stateMachine.states || [];
  const transitionsList: BiomeStateTransition[] = stateMachine.transitions || [];

  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  const [editingState, setEditingState] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
    isDefault: boolean;
    isEditing: boolean;
  }>({
    id: '',
    name: '',
    description: '',
    color: '#06b6d4',
    isDefault: false,
    isEditing: false
  });

  const [editingTransition, setEditingTransition] = useState<{
    id: string;
    fromStateId: string;
    toStateId: string;
    triggerLabel: string;
    behaviorRuleId?: string;
    conditionType?: 'none' | 'behavior';
    isEditing: boolean;
  }>({
    id: '',
    fromStateId: statesList[0]?.id || '',
    toStateId: statesList[1]?.id || statesList[0]?.id || '',
    triggerLabel: 'None',
    behaviorRuleId: undefined,
    conditionType: 'none',
    isEditing: false
  });

  // Helper to check if a biome transition condition is unset or 'none'
  const isBiomeTransitionUnset = (tr: BiomeStateTransition | { triggerLabel?: string; behaviorRuleId?: string; conditionType?: string }): boolean => {
    if (!tr.behaviorRuleId || tr.behaviorRuleId === 'none') return true;
    if (tr.conditionType === 'none') return true;
    if (!tr.triggerLabel) return true;
    const t = tr.triggerLabel.trim().toLowerCase();
    return t === '' || t === 'none' || t === 'unset' || t === 'no condition';
  };

  const updateStateMachine = (updater: (prev: BiomeStateMachine) => BiomeStateMachine) => {
    onUpdateBiome(b => {
      const current = b.stateMachine || stateMachine;
      return {
        ...b,
        stateMachine: updater(current)
      };
    });
  };

  const handleSaveState = () => {
    if (!editingState.name.trim()) return;

    const stateId = editingState.id.trim() || `state_${editingState.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

    const newState: BiomeStateNode = {
      id: stateId,
      name: editingState.name.trim(),
      description: editingState.description,
      color: editingState.color,
      isDefault: editingState.isDefault
    };

    updateStateMachine(sm => {
      let updatedStates = [...sm.states];
      if (editingState.isEditing) {
        updatedStates = updatedStates.map(s => s.id === newState.id ? { ...s, ...newState } : s);
      } else {
        // Prevent duplicate IDs
        if (updatedStates.some(s => s.id === newState.id)) {
          newState.id = `${newState.id}_${Date.now().toString().slice(-4)}`;
        }
        updatedStates.push(newState);
      }

      if (newState.isDefault) {
        updatedStates = updatedStates.map(s => ({
          ...s,
          isDefault: s.id === newState.id
        }));
      }

      return {
        ...sm,
        states: updatedStates,
        defaultStateId: newState.isDefault ? newState.id : sm.defaultStateId
      };
    });

    setIsStateModalOpen(false);
  };

  const handleDeleteState = (stateId: string) => {
    updateStateMachine(sm => ({
      ...sm,
      states: sm.states.filter(s => s.id !== stateId),
      transitions: sm.transitions.filter(t => t.fromStateId !== stateId && t.toStateId !== stateId),
      defaultStateId: sm.defaultStateId === stateId ? (sm.states.find(s => s.id !== stateId)?.id || '') : sm.defaultStateId
    }));
  };

  const handleSaveTransition = () => {
    if (!editingTransition.fromStateId || !editingTransition.toStateId) return;

    const isUnset = isBiomeTransitionUnset(editingTransition);
    const newTr: BiomeStateTransition = {
      id: editingTransition.id || `btr_${Date.now().toString().slice(-6)}`,
      fromStateId: editingTransition.fromStateId,
      toStateId: editingTransition.toStateId,
      triggerLabel: isUnset ? 'None' : (editingTransition.triggerLabel || 'None'),
      behaviorRuleId: isUnset ? undefined : editingTransition.behaviorRuleId,
      conditionType: isUnset ? 'none' : 'behavior'
    };

    updateStateMachine(sm => {
      let updatedTr = [...sm.transitions];
      if (editingTransition.isEditing) {
        updatedTr = updatedTr.map(t => t.id === newTr.id ? newTr : t);
      } else {
        updatedTr.push(newTr);
      }
      return { ...sm, transitions: updatedTr };
    });

    setIsTransitionModalOpen(false);
  };

  const handleDeleteTransition = (trId: string) => {
    updateStateMachine(sm => ({
      ...sm,
      transitions: sm.transitions.filter(t => t.id !== trId)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            States & Transitions ({statesList.length} States • {transitionsList.length} Transitions)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Create discrete states to trigger biome behavior rules, entity spawns, and world events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTransition({
                id: `btr_${Date.now().toString().slice(-6)}`,
                fromStateId: statesList[0]?.id || '',
                toStateId: statesList[1]?.id || statesList[0]?.id || '',
                triggerLabel: 'None',
                behaviorRuleId: undefined,
                conditionType: 'none',
                isEditing: false
              });
              setIsTransitionModalOpen(true);
            }}
            disabled={statesList.length < 2}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-neutral-700 shadow-sm"
          >
            <ArrowRight size={14} />
            <span>+ Add Transition</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingState({
                id: `state_${Date.now().toString().slice(-6)}`,
                name: 'New Biome State',
                description: '',
                color: '#06b6d4',
                isDefault: statesList.length === 0,
                isEditing: false
              });
              setIsStateModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30"
          >
            <Plus size={14} />
            <span>+ Add State Node</span>
          </button>
        </div>
      </div>

      {/* 1. STATE NODES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-400" />
            Configured State Nodes ({statesList.length})
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            State IDs can be targeted by Biome Behavior Rules & Triggers
          </span>
        </div>

        {statesList.length === 0 ? (
          <div className="text-center py-10 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
            No states defined yet. Click <strong>+ Add State Node</strong> to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {statesList.map(st => {
              const isDefault = st.isDefault || stateMachine.defaultStateId === st.id;

              return (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 transition space-y-3 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: st.color || '#06b6d4' }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{st.name}</h4>
                          <div className="text-[10px] text-cyan-400 font-mono truncate flex items-center gap-1">
                            <Tag size={10} />
                            <span>{st.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingState({
                              id: st.id,
                              name: st.name,
                              description: st.description || '',
                              color: st.color || '#06b6d4',
                              isDefault: Boolean(st.isDefault || stateMachine.defaultStateId === st.id),
                              isEditing: true
                            });
                            setIsStateModalOpen(true);
                          }}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
                          title="Edit State"
                        >
                          <Edit3 size={13} />
                        </button>
                        {statesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteState(st.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800 transition"
                            title="Delete State"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {st.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {st.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                    {isDefault ? (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800 font-bold text-cyan-300">
                        DEFAULT STATE
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          updateStateMachine(sm => ({
                            ...sm,
                            defaultStateId: st.id,
                            states: sm.states.map(s => ({
                              ...s,
                              isDefault: s.id === st.id
                            }))
                          }));
                        }}
                        className="text-neutral-500 hover:text-cyan-400 transition"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TRANSITIONS & TRIGGERS PANEL */}
      <div className="space-y-3 pt-4 border-t border-neutral-800">
        <div className="flex items-center justify-between text-xs text-neutral-300 font-bold">
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" />
            State Transitions & Trigger Conditions ({transitionsList.length})
          </span>
          <span className="text-[11px] text-neutral-500 font-normal">
            Defines how the biome shifts from one state to another automatically
          </span>
        </div>

        {transitionsList.length === 0 ? (
          <div className="text-center py-8 bg-neutral-900/30 rounded-2xl border border-neutral-800/80 text-neutral-500 text-xs">
            No state transitions configured yet. Click <strong>+ Add Transition</strong> to link states together via biome behavior rules.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transitionsList.map(tr => {
              const fromNode = statesList.find(s => s.id === tr.fromStateId);
              const toNode = statesList.find(s => s.id === tr.toStateId);
              const isUnset = isBiomeTransitionUnset(tr);

              return (
                <div
                  key={tr.id}
                  className={`rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-md gap-3 border ${
                    isUnset 
                      ? 'bg-red-950/20 border-red-500/50 text-red-200' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: fromNode?.color || '#06b6d4' }} 
                      />
                      <span className="font-bold text-cyan-300 font-mono text-xs truncate max-w-[120px]">
                        {fromNode?.name || tr.fromStateId}
                      </span>
                    </div>

                    <ArrowRight size={13} className={`${isUnset ? 'text-red-400 font-bold' : 'text-neutral-500'} shrink-0`} />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: toNode?.color || '#a855f7' }} 
                      />
                      <span className="font-bold text-purple-300 font-mono text-xs truncate max-w-[120px]">
                        {toNode?.name || tr.toStateId}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 pl-2 border-l border-neutral-800">
                      {isUnset ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-950 px-2 py-0.5 rounded-md font-mono text-red-300 border border-red-500/60 truncate max-w-full font-bold">
                          ⚠️ None (No Condition)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-neutral-950 px-2 py-0.5 rounded-md font-mono text-amber-300 border border-neutral-800 truncate max-w-full font-semibold">
                          ⚡ Behavior: {tr.triggerLabel || tr.behaviorRuleId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTransition({
                          id: tr.id,
                          fromStateId: tr.fromStateId,
                          toStateId: tr.toStateId,
                          triggerLabel: tr.triggerLabel || 'None',
                          behaviorRuleId: tr.behaviorRuleId,
                          conditionType: isBiomeTransitionUnset(tr) ? 'none' : 'behavior',
                          isEditing: true
                        });
                        setIsTransitionModalOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                      title="Edit Transition"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTransition(tr.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      title="Delete Transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* State Edit / Create Modal */}
      {isStateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingState.isEditing ? 'Edit Biome State' : 'Create Biome State'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">State Name</label>
                <input
                  type="text"
                  value={editingState.name}
                  onChange={(e) => setEditingState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-cyan-500"
                  placeholder="e.g. Volcanic Eruption Phase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">State ID (Identifier for Rules)</label>
                <input
                  type="text"
                  value={editingState.id}
                  disabled={editingState.isEditing}
                  onChange={(e) => setEditingState(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  className="w-full bg-neutral-950 border border-neutral-700 disabled:opacity-60 rounded-lg p-2 text-white font-mono text-cyan-300"
                  placeholder="e.g. state_eruption"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Color Badge</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editingState.color}
                    onChange={(e) => setEditingState(prev => ({ ...prev, color: e.target.value }))}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-neutral-700"
                  />
                  <span className="font-mono text-neutral-300 text-xs">{editingState.color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editingState.description}
                  onChange={(e) => setEditingState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-white resize-none outline-none focus:border-cyan-500"
                  placeholder="Optional description of when this state activates..."
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 bg-neutral-950 border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-700 transition">
                <input
                  type="checkbox"
                  checked={editingState.isDefault}
                  onChange={(e) => setEditingState(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded accent-cyan-500 w-4 h-4"
                />
                <div>
                  <div className="font-bold text-white text-xs">Set as Initial Default State</div>
                  <div className="text-[10px] text-neutral-400">Biome initializes in this state when a map loads</div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsStateModalOpen(false)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveState}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/30"
              >
                {editingState.isEditing ? 'Save State' : 'Create State'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingTransition.isEditing ? 'Edit State Transition' : 'Create State Transition'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">From State</label>
                  <select
                    value={editingTransition.fromStateId}
                    onChange={(e) => setEditingTransition(prev => ({ ...prev, fromStateId: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                  >
                    {statesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">To State</label>
                  <select
                    value={editingTransition.toStateId}
                    onChange={(e) => setEditingTransition(prev => ({ ...prev, toStateId: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                  >
                    {statesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Behavior Condition Selector - ONLY 'none' and available biome behaviors */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Transition Behavior Condition</label>
                <select
                  value={editingTransition.behaviorRuleId || 'none'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'none') {
                      setEditingTransition(prev => ({
                        ...prev,
                        triggerLabel: 'None',
                        behaviorRuleId: undefined,
                        conditionType: 'none'
                      }));
                    } else {
                      const found = (biome.behaviorRules || []).find(r => r.id === val);
                      const bName = found ? (found.name || `Rule #${val}`) : val;
                      setEditingTransition(prev => ({
                        ...prev,
                        triggerLabel: bName,
                        behaviorRuleId: val,
                        conditionType: 'behavior'
                      }));
                    }
                  }}
                  className={`w-full bg-neutral-950 border rounded-lg p-2.5 text-white font-mono text-xs ${
                    isBiomeTransitionUnset(editingTransition) ? 'border-red-500/60 text-red-300' : 'border-amber-500/60 text-amber-200'
                  }`}
                >
                  <option value="none">❌ None (No Condition - Highlighted Red)</option>
                  {(biome.behaviorRules || []).map(r => (
                    <option key={r.id} value={r.id}>
                      ⚡ Biome Behavior: {r.name || r.id}
                    </option>
                  ))}
                </select>
                {(biome.behaviorRules || []).length === 0 && (
                  <p className="text-[10px] text-neutral-500 italic mt-1">
                    No biome behavior rules created yet. Add a rule in the Biome Behaviors tab to link it as a transition trigger.
                  </p>
                )}
              </div>

              {/* Unset Red Notice */}
              {isBiomeTransitionUnset(editingTransition) && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">⚠️</span>
                  <span>Condition is currently unset (None). This transition will display in <strong>RED</strong> until a biome behavior rule condition is linked.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTransition}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/30"
              >
                {editingTransition.isEditing ? 'Save Transition' : 'Create Transition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
