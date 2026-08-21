import React, { useState } from 'react';
import { 
  RefinedBiome, 
  BiomeBehaviorRule, 
  BiomeBehaviorTrigger, 
  BiomeBehaviorAction, 
  BiomeTriggerType, 
  BiomeActionType 
} from '../engine/refinedBiomeSchema';
import { 
  Brain, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Zap, 
  Globe, 
  MapPin, 
  Activity, 
  Sparkles, 
  Volume2, 
  Layers, 
  Box, 
  ArrowRight, 
  ShieldAlert, 
  Compass,
  Radio,
  Sliders,
  CheckCircle,
  Flag
} from 'lucide-react';

interface BiomeBehaviorsEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
  availableMaps?: { fileName: string; name: string }[];
}

export const BiomeBehaviorsEditor: React.FC<BiomeBehaviorsEditorProps> = ({
  biome,
  onUpdateBiome,
  availableMaps = []
}) => {
  const rulesList: BiomeBehaviorRule[] = biome.behaviorRules || [];
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(
    new Set(rulesList.slice(0, 2).map(r => r.id))
  );

  const toggleExpand = (ruleId: string) => {
    setExpandedRuleIds(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const handleUpdateRule = (ruleId: string, updater: (prev: BiomeBehaviorRule) => BiomeBehaviorRule) => {
    onUpdateBiome(b => ({
      ...b,
      behaviorRules: (b.behaviorRules || []).map(r => r.id === ruleId ? updater(r) : r)
    }));
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdateBiome(b => ({
      ...b,
      behaviorRules: (b.behaviorRules || []).filter(r => r.id !== ruleId)
    }));
  };

  const handleAddRule = () => {
    const newId = `brule_${Date.now().toString().slice(-6)}`;
    const newRule: BiomeBehaviorRule = {
      id: newId,
      name: `Biome Logic Rule ${rulesList.length + 1}`,
      enabled: true,
      scope: 'local_biome',
      description: 'Triggered when environmental conditions or player prop interactions occur.',
      trigger: {
        type: 'on_variable_value',
        variableId: biome.variables?.[0]?.id || '',
        comparator: '>=',
        targetValue: 50
      },
      actions: [
        {
          id: `bact_${Date.now().toString().slice(-4)}`,
          actionType: 'environmental_effect',
          effectType: 'screen_shake',
          intensity: 0.5,
          durationMs: 2000
        }
      ]
    };

    onUpdateBiome(b => ({
      ...b,
      behaviorRules: [...(b.behaviorRules || []), newRule]
    }));

    setExpandedRuleIds(prev => new Set(prev).add(newId));
  };

  const handleAddAction = (ruleId: string) => {
    const newAction: BiomeBehaviorAction = {
      id: `bact_${Date.now().toString().slice(-4)}`,
      actionType: 'set_variable',
      variableId: biome.variables?.[0]?.id || '',
      variableOp: 'set',
      variableValue: 100
    };

    handleUpdateRule(ruleId, r => ({
      ...r,
      actions: [...r.actions, newAction]
    }));
  };

  const handleDeleteAction = (ruleId: string, actionId: string) => {
    handleUpdateRule(ruleId, r => ({
      ...r,
      actions: r.actions.filter(a => a.id !== actionId)
    }));
  };

  const handleUpdateAction = (
    ruleId: string, 
    actionId: string, 
    updater: (prev: BiomeBehaviorAction) => BiomeBehaviorAction
  ) => {
    handleUpdateRule(ruleId, r => ({
      ...r,
      actions: r.actions.map(a => a.id === actionId ? updater(a) : a)
    }));
  };

  const statesList = biome.stateMachine?.states || [];
  const variablesList = biome.variables || [];
  const propsList = biome.interactiveDetails || [];

  return (
    <div className="space-y-6">
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Brain size={16} className="text-amber-400" />
            Biome Behaviors & Interbiome Event Logic ({rulesList.length} Rules)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Create IFTTT event flows wired to <strong>On Variable Value</strong>, <strong>On Map Load</strong>, <strong>On Biome State</strong>, and <strong>Prop Interactions</strong>. Rules can be <em>interbiome</em> to propagate changes across maps.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setExpandedRuleIds(new Set(rulesList.map(r => r.id)))}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-neutral-700"
          >
            <ChevronDown size={13} />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            onClick={() => setExpandedRuleIds(new Set())}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-neutral-700"
          >
            <ChevronRight size={13} />
            <span>Collapse All</span>
          </button>
          <button
            type="button"
            onClick={handleAddRule}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/30"
          >
            <Plus size={14} />
            <span>+ Add Behavior Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Accordion List */}
      {rulesList.length === 0 ? (
        <div className="text-center py-14 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-500 text-xs space-y-3">
          <Zap size={32} className="mx-auto text-amber-500/80" />
          <p className="font-bold text-neutral-300">No Biome Behavior Rules Configured</p>
          <p className="max-w-md mx-auto text-neutral-500">
            Define triggers for map load entry, variable threshold surges, biome state shifts, and prop interactions that execute action sequences across maps.
          </p>
          <button
            type="button"
            onClick={handleAddRule}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/30 inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create First Behavior Rule</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rulesList.map((rule) => {
            const isExpanded = expandedRuleIds.has(rule.id);
            const isInterbiome = rule.scope === 'global_interbiome';

            // Trigger description summary
            const triggerSummary = (() => {
              const t = rule.trigger;
              if (t.type === 'on_variable_value') {
                const v = variablesList.find(vl => vl.id === t.variableId);
                return `Variable: ${v?.name || t.variableId || 'Variable'} ${t.comparator || '>='} ${t.targetValue ?? 50}`;
              }
              if (t.type === 'on_map_load') {
                return `Map Load: ${t.mapFileName || 'Any Level'}`;
              }
              if (t.type === 'on_biome_state') {
                const s = statesList.find(sl => sl.id === t.biomeStateId);
                return `State Active: ${s?.name || t.biomeStateId || 'Biome State'}`;
              }
              if (t.type === 'on_prop_interact') {
                const p = propsList.find(pl => pl.id === t.propId);
                return `Prop Activated: ${p?.name || t.propId || 'Interactive Prop'}`;
              }
              if (t.type === 'on_time_tick') {
                return `Periodic Timer: every ${t.intervalSeconds || 10}s`;
              }
              if (t.type === 'on_enter_biome') {
                return `Player Enters Biome Zone`;
              }
              return `Manual / Custom Trigger`;
            })();

            return (
              <div
                key={rule.id}
                className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg hover:border-neutral-700 transition"
              >
                {/* Rule Accordion Header */}
                <div
                  onClick={() => toggleExpand(rule.id)}
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none bg-neutral-900/60 hover:bg-neutral-900 border-b border-neutral-800/60 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      className="p-1 text-neutral-400 hover:text-white rounded"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={rule.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, name: e.target.value }))}
                          className="font-bold text-xs text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-amber-500 outline-none truncate"
                        />
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          isInterbiome ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        }`}>
                          {isInterbiome ? '🌐 Interbiome Global' : '📍 Local Biome'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate flex items-center gap-1.5">
                        <span className="text-amber-400 font-semibold">IF:</span>
                        <span>{triggerSummary}</span>
                        <span className="text-neutral-600">→</span>
                        <span className="text-emerald-400 font-semibold">THEN:</span>
                        <span>{rule.actions.length} Action{rule.actions.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <label className="flex items-center gap-1.5 cursor-pointer bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, enabled: e.target.checked }))}
                        className="rounded accent-amber-500 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-bold text-neutral-300">{rule.enabled ? 'ACTIVE' : 'DISABLED'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                      title="Delete Rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Rule Body (Expanded) */}
                {isExpanded && (
                  <div className="p-5 space-y-5 bg-neutral-950/40">
                    
                    {/* Top Row: Description & Scope Switch */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Rule Description</label>
                        <input
                          type="text"
                          value={rule.description || ''}
                          onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, description: e.target.value }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300"
                          placeholder="Describe when and why this rule executes..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">Execution Scope</label>
                        <select
                          value={rule.scope}
                          onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, scope: e.target.value as any }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                        >
                          <option value="local_biome">📍 Local Biome Logic</option>
                          <option value="global_interbiome">🌐 Interbiome Global (Affects all maps)</option>
                        </select>
                      </div>
                    </div>

                    {/* TRIGGER CONFIGURATION SECTION */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap size={14} />
                          Trigger Condition (IF)
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Type: {rule.trigger.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        
                        {/* Trigger Type Selector */}
                        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase">Trigger Event</label>
                          <select
                            value={rule.trigger.type}
                            onChange={(e) => {
                              const nextType = e.target.value as BiomeTriggerType;
                              handleUpdateRule(rule.id, r => ({
                                ...r,
                                trigger: {
                                  ...r.trigger,
                                  type: nextType,
                                  variableId: nextType === 'on_variable_value' ? (r.trigger.variableId || variablesList[0]?.id || '') : r.trigger.variableId,
                                  mapFileName: nextType === 'on_map_load' ? (r.trigger.mapFileName || availableMaps[0]?.fileName || '') : r.trigger.mapFileName,
                                  biomeStateId: nextType === 'on_biome_state' ? (r.trigger.biomeStateId || statesList[0]?.id || '') : r.trigger.biomeStateId
                                }
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-semibold"
                          >
                            <option value="on_variable_value">🔢 On Variable Value</option>
                            <option value="on_map_load">🗺️ On Map Load</option>
                            <option value="on_biome_state">⚡ On Biome State</option>
                            <option value="on_prop_interact">📦 On Prop Interact</option>
                            <option value="on_time_tick">⏱️ On Periodic Timer</option>
                            <option value="on_enter_biome">🚶 On Enter Biome</option>
                            <option value="manual_trigger">📡 Manual Trigger</option>
                          </select>
                        </div>

                        {/* TRIGGER 1: ON VARIABLE VALUE */}
                        {rule.trigger.type === 'on_variable_value' && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-rose-400 uppercase">Variable</label>
                              <select
                                value={rule.trigger.variableId || ''}
                                onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, variableId: e.target.value } }))}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                              >
                                {variablesList.map(v => (
                                  <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-400 uppercase">Comparator</label>
                              <select
                                value={rule.trigger.comparator || '>='}
                                onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, comparator: e.target.value as any } }))}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                              >
                                <option value=">=">&gt;= Greater or Equal</option>
                                <option value="<=">&lt;= Less or Equal</option>
                                <option value=">">&gt; Greater Than</option>
                                <option value="<">&lt; Less Than</option>
                                <option value="==">== Equals</option>
                                <option value="!=">!= Not Equal</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-400 uppercase">Target Value</label>
                              <input
                                type="number"
                                value={rule.trigger.targetValue ?? 50}
                                onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, targetValue: parseFloat(e.target.value) || 0 } }))}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                              />
                            </div>
                          </>
                        )}

                        {/* TRIGGER 2: ON MAP LOAD */}
                        {rule.trigger.type === 'on_map_load' && (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-bold text-cyan-400 uppercase">Target Map (.map)</label>
                            <select
                              value={rule.trigger.mapFileName || ''}
                              onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, mapFileName: e.target.value } }))}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-cyan-300 font-mono"
                            >
                              <option value="any_map">🌐 Any Map in Project</option>
                              {availableMaps.map(m => (
                                <option key={m.fileName} value={m.fileName}>{m.fileName} ({m.name})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* TRIGGER 3: ON BIOME STATE */}
                        {rule.trigger.type === 'on_biome_state' && (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-bold text-purple-400 uppercase">Active Biome State Node</label>
                            <select
                              value={rule.trigger.biomeStateId || ''}
                              onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, biomeStateId: e.target.value } }))}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-purple-300 font-semibold"
                            >
                              {statesList.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* TRIGGER 4: ON PROP INTERACT */}
                        {rule.trigger.type === 'on_prop_interact' && (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-bold text-amber-400 uppercase">Triggering Biome Prop</label>
                            <select
                              value={rule.trigger.propId || ''}
                              onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, propId: e.target.value } }))}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-amber-300 font-semibold"
                            >
                              {propsList.map(p => (
                                <option key={p.id} value={p.id}>{p.icon} {p.name} ({p.id})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* TRIGGER 5: ON TIME TICK */}
                        {rule.trigger.type === 'on_time_tick' && (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Tick Interval (Seconds)</label>
                            <input
                              type="number"
                              min="1"
                              value={rule.trigger.intervalSeconds ?? 10}
                              onChange={(e) => handleUpdateRule(rule.id, r => ({ ...r, trigger: { ...r.trigger, intervalSeconds: parseInt(e.target.value) || 1 } }))}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS SEQUENCE SECTION */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={14} />
                          Action Sequence (THEN)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddAction(rule.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow"
                        >
                          <Plus size={12} />
                          <span>Add Action</span>
                        </button>
                      </div>

                      {rule.actions.length === 0 ? (
                        <div className="text-xs text-neutral-500 italic py-2">
                          No actions defined for this rule. Click "Add Action" to execute logic when triggered.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {rule.actions.map((action, aIdx) => (
                            <div
                              key={action.id || aIdx}
                              className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                                    {aIdx + 1}
                                  </span>
                                  <select
                                    value={action.actionType}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, actionType: e.target.value as BiomeActionType }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-bold"
                                  >
                                    <option value="set_variable">🔢 Set Biome Variable</option>
                                    <option value="change_biome_state">⚡ Change Biome State</option>
                                    <option value="environmental_effect">🌪️ Environmental / Screen FX</option>
                                    <option value="change_map">🚀 Change Map / Level Warp</option>
                                    <option value="spawn_entity">👾 Spawn Entity / Fauna</option>
                                    <option value="audio_cue">🎵 Play Audio Cue / Soundtrack</option>
                                    <option value="unlock_progression_flag">🔓 Unlock Progression Flag</option>
                                    <option value="broadcast_interbiome_signal">📡 Broadcast Interbiome Signal</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAction(rule.id, action.id)}
                                  className="p-1 text-neutral-500 hover:text-red-400 rounded"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* ACTION PAYLOADS */}
                              {/* 1. SET VARIABLE */}
                              {action.actionType === 'set_variable' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                  <select
                                    value={action.variableId || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, variableId: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                                  >
                                    <option value="">-- Variable --</option>
                                    {variablesList.map(v => (
                                      <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                                    ))}
                                  </select>
                                  <select
                                    value={action.variableOp || 'set'}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, variableOp: e.target.value as any }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                  >
                                    <option value="set">= Set To</option>
                                    <option value="add">+ Add</option>
                                    <option value="subtract">- Subtract</option>
                                    <option value="toggle">🔄 Toggle Boolean</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={String(action.variableValue ?? '')}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, variableValue: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                                    placeholder="Value"
                                  />
                                </div>
                              )}

                              {/* 2. CHANGE BIOME STATE */}
                              {action.actionType === 'change_biome_state' && (
                                <div className="pt-1">
                                  <select
                                    value={action.targetStateId || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, targetStateId: e.target.value }))}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-purple-300 font-semibold"
                                  >
                                    <option value="">-- Target Biome State --</option>
                                    {statesList.map(s => (
                                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* 3. ENVIRONMENTAL FX */}
                              {action.actionType === 'environmental_effect' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                  <select
                                    value={action.effectType || 'screen_shake'}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, effectType: e.target.value as any }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-amber-300 font-semibold"
                                  >
                                    <option value="screen_shake">💥 Screen Shake</option>
                                    <option value="weather_change">🌪️ Surge Weather</option>
                                    <option value="fog_surge">🌫️ Dense Fog Surge</option>
                                    <option value="lightning_flash">⚡ Lightning Flash</option>
                                    <option value="corrupt_pulse">🔮 Corruption Pulse</option>
                                  </select>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-neutral-500">Intensity:</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0.1"
                                      max="1.0"
                                      value={action.intensity ?? 0.5}
                                      onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, intensity: parseFloat(e.target.value) || 0.5 }))}
                                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-neutral-500">Duration (ms):</span>
                                    <input
                                      type="number"
                                      value={action.durationMs ?? 2000}
                                      onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, durationMs: parseInt(e.target.value) || 1000 }))}
                                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 4. CHANGE MAP */}
                              {action.actionType === 'change_map' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  <select
                                    value={action.targetMapFileName || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, targetMapFileName: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                                  >
                                    <option value="">-- Destination Map --</option>
                                    {availableMaps.map(m => (
                                      <option key={m.fileName} value={m.fileName}>{m.fileName} ({m.name})</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={action.targetSpawnPoint || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, targetSpawnPoint: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                    placeholder="Arrival Spawn ID (optional)"
                                  />
                                </div>
                              )}

                              {/* 5. SPAWN ENTITY */}
                              {action.actionType === 'spawn_entity' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                  <select
                                    value={action.spawnCategory || 'wildlife'}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, spawnCategory: e.target.value as any }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                  >
                                    <option value="wildlife">🦋 Wildlife Fauna</option>
                                    <option value="enemy">👾 Enemy Hostile</option>
                                    <option value="npc">🗣️ Friendly NPC</option>
                                    <option value="item">🎁 Item Drop</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={action.spawnEntityId || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, spawnEntityId: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                                    placeholder="Entity ID / Creature Name"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={action.spawnCount ?? 1}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, spawnCount: parseInt(e.target.value) || 1 }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                                    placeholder="Count"
                                  />
                                </div>
                              )}

                              {/* 6. AUDIO CUE */}
                              {action.actionType === 'audio_cue' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={action.soundTrackName || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, soundTrackName: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                                    placeholder="Soundtrack / SFX Audio File"
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-neutral-500">Volume:</span>
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={action.volume ?? 0.8}
                                      onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, volume: parseFloat(e.target.value) }))}
                                      className="flex-1 accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-[10px] font-mono text-neutral-300">{Math.round((action.volume ?? 0.8) * 100)}%</span>
                                  </div>
                                </div>
                              )}

                              {/* 7. UNLOCK PROGRESSION FLAG */}
                              {action.actionType === 'unlock_progression_flag' && (
                                <div className="pt-1">
                                  <input
                                    type="text"
                                    value={action.flagId || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, flagId: e.target.value }))}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                                    placeholder="Progression Flag ID (e.g. flag_ancient_forge_unlocked)"
                                  />
                                </div>
                              )}

                              {/* 8. BROADCAST INTERBIOME SIGNAL */}
                              {action.actionType === 'broadcast_interbiome_signal' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={action.signalName || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, signalName: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                                    placeholder="Signal Name (e.g. sig_volcano_awakened)"
                                  />
                                  <input
                                    type="text"
                                    value={action.signalPayload || ''}
                                    onChange={(e) => handleUpdateAction(rule.id, action.id, a => ({ ...a, signalPayload: e.target.value }))}
                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                    placeholder="Signal Payload String"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
