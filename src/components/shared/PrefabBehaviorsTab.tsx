import React, { useState, useMemo, useRef } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Zap,
  Trash2,
  Check,
  Play,
  Pause,
  Circle,
  Eye,
  Key,
  Move,
  Shield,
  Sparkles,
  Star,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Database,
  Camera,
  Compass,
  X
} from 'lucide-react';
import {
  MasonProject,
  PrefabData,
  BehaviorRule,
  BehaviorVariable,
  BehaviorTrigger,
  BehaviorAction,
  TriggerType,
  ActionType,
  PrefabAnimationConfig,
  PrefabNamedPoint,
  PrefabNamedPolygon,
  PrefabStateNode,
  InputMapping,
  PrefabStateTransition
} from '../../engine/masonProjectSchema';

export interface PrefabBehaviorsTabProps {
  char: PrefabData;
  updateCharacter: (updater: (prev: PrefabData) => PrefabData) => void;
  rulesList: BehaviorRule[];
  variablesList: BehaviorVariable[];
  expandedRuleIds: Set<string>;
  setExpandedRuleIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  createDefaultTrigger: (type: TriggerType, availableVars?: BehaviorVariable[]) => BehaviorTrigger;
  renderVariableSelectOptions: (targetRule?: BehaviorRule) => React.ReactNode;
  animationsList: PrefabAnimationConfig[];
  pointsList: PrefabNamedPoint[];
  polygonsList: PrefabNamedPolygon[];
  stateNodes: PrefabStateNode[];
  availableInputMappings: InputMapping[];
  stateTransitions: PrefabStateTransition[];
}

export const PrefabBehaviorsTab: React.FC<PrefabBehaviorsTabProps> = ({
  char,
  updateCharacter,
  rulesList,
  variablesList,
  expandedRuleIds,
  setExpandedRuleIds,
  createDefaultTrigger,
  renderVariableSelectOptions,
  animationsList,
  pointsList,
  polygonsList,
  stateNodes,
  availableInputMappings,
  stateTransitions
}) => {
  return (
          <div className="space-y-6">
            
            {/* Behaviors Header & Accordion Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain size={16} className="text-amber-400" />
                  Prefab Behaviors & IFTTT Rules
                </h3>
                <p className="text-xs text-neutral-400">
                  Trigger logic with conditions (Sensory sockets, State machine events, Variables, Health) and reactive action sequences. Rules are minimized by default.
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
                  onClick={() => {
                    const newRuleId = `rule_${Date.now().toString().slice(-4)}`;
                    const newRule: BehaviorRule = {
                      id: newRuleId,
                      name: `New Rule ${rulesList.length + 1}`,
                      enabled: true,
                      trigger: createDefaultTrigger('sight'),
                      actions: [
                        { id: `act_${Date.now().toString().slice(-4)}`, actionType: 'none' }
                      ]
                    };
                    updateCharacter(c => ({
                      ...c,
                      rules: [...(c.rules || []), newRule]
                    }));
                    // Open the newly created rule
                    setExpandedRuleIds(prev => new Set(prev).add(newRuleId));
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/30"
                >
                  <Plus size={14} />
                  <span>Add Behavior Rule</span>
                </button>
              </div>
            </div>

            {/* Rules List (Collapsible Accordion - Minimized by Default) */}
            {rulesList.length === 0 ? (
              <div className="p-8 text-center bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3 flex flex-col items-center justify-center">
                <Zap size={32} className="mx-auto text-amber-500/80" />
                <p className="text-sm font-bold text-neutral-300">No Behavior Rules Yet</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Add custom IFTTT rules (triggers, conditions, and action sequences) or clone rules from another prefab.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newRuleId = `rule_${Date.now().toString().slice(-4)}`;
                    const newRule: BehaviorRule = {
                      id: newRuleId,
                      name: `New Rule 1`,
                      enabled: true,
                      trigger: createDefaultTrigger('sight'),
                      actions: [
                        { id: `act_${Date.now().toString().slice(-4)}`, actionType: 'none' }
                      ]
                    };
                    updateCharacter(c => ({
                      ...c,
                      rules: [...(c.rules || []), newRule]
                    }));
                    setExpandedRuleIds(new Set([newRuleId]));
                  }}
                  className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/30"
                >
                  <Plus size={15} />
                  <span>Add First Behavior Rule</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rulesList.map((rule, rIdx) => {
                  const isExpanded = expandedRuleIds.has(rule.id);
                  const effectiveTriggers: BehaviorTrigger[] = (rule.triggers && rule.triggers.length > 0)
                    ? rule.triggers
                    : [rule.trigger || createDefaultTrigger('state')];
                  const ruleLogic = rule.triggerLogic || 'AND';

                  const triggerTypeLabels: Record<string, string> = {
                    possession: ' Possession',
                    mapped_input: ' Mapped Input',
                    raw_keyboard: ' Raw Keyboard',
                    raw_mouse: ' Raw Mouse',
                    raw_gamepad: ' Raw Gamepad',
                    sight: ' Sight (Sensory)',
                    sound: ' Acoustic Hearing',
                    proximity: ' Proximity',
                    health: ' Health',
                    state: '[Local] State Active',
                    variable_condition: ' Variable Condition',
                    timer: ' Timer',
                    dialogue_trigger: ' Dialogue',
                    collision: ' Physics Collision',
                    input_press: ' Input Press',
                    player_condition: ' Player State',
                    keyboard_key: ' Raw Keyboard',
                    listener: ' Signal Listener',
                    solid_detection: ' Solid Detection',
                    slope_detection: ' Slope Detection',
                    slope: ' Slope Detection',
                    physics_state: ' Physics & Gravity',
                    on_spawn: ' On Spawn',
                    spawn: ' On Spawn'
                  };

                  const getSingleTriggerSummary = (t: BehaviorTrigger): string => {
                    if (t.type === 'on_spawn' || t.type === 'spawn') {
                      const delay = (t as any).spawnDelayMs;
                      return `On Spawn${delay ? ` (+${delay}ms)` : ''}`;
                    }
                    if (t.type === 'raw_keyboard' || t.type === 'keyboard_key') {
                      const k = (t as any).key || 'KeyE';
                      const mods = [(t as any).requireCtrl && 'Ctrl', (t as any).requireShift && 'Shift', (t as any).requireAlt && 'Alt'].filter(Boolean);
                      const modStr = mods.length > 0 ? `+${mods.join('+')}` : '';
                      const mode = (t as any).triggerMode ? ` [${(t as any).triggerMode}]` : '';
                      return `Key: ${k}${modStr}${mode}`;
                    }
                    if (t.type === 'raw_mouse') {
                      const act = (t as any).action || 'press';
                      const btn = (t as any).button || 'left';
                      const area = (t as any).targetArea && (t as any).targetArea !== 'anywhere' ? ` on ${(t as any).targetArea}` : '';
                      if (act.startsWith('wheel')) {
                        return `Mouse: ${act === 'wheel_up' ? 'Scroll Up' : 'Scroll Down'}${area}`;
                      }
                      if (act === 'hover' || act === 'move') {
                        return `Mouse: ${act === 'hover' ? 'Hover' : 'Move'}${area}`;
                      }
                      return `Mouse: ${btn} [${act}]${area}`;
                    }
                    if (t.type === 'raw_gamepad') {
                      const inp = (t as any).inputType || 'button';
                      const pad = (t as any).gamepadIndex === 'any' || (t as any).gamepadIndex === undefined ? 'Any Pad' : `Pad ${(t as any).gamepadIndex + 1}`;
                      if (inp === 'button') {
                        return `Gamepad: ${pad} ${(t as any).button || 'button_a'} [${(t as any).buttonMode || 'press'}]`;
                      }
                      if (inp === 'stick_axis') {
                        return `Gamepad: ${pad} ${(t as any).axis || 'left_stick_x'} (${(t as any).axisDirection || 'positive'})`;
                      }
                      return `Gamepad: ${pad} ${(t as any).axis || 'left_trigger'} Trigger`;
                    }
                    if (t.type === 'state') {
                      return `State: ${t.requiredState || 'Any'}${t.stateMode && t.stateMode !== 'is_state' ? ` (${t.stateMode})` : ''}`;
                    }
                    if (t.type === 'mapped_input') {
                      const mapping = availableInputMappings.find(m => 
                        m.id === t.inputId || 
                        m.name === t.inputId || 
                        (t.inputName && (m.name === t.inputName || m.id === t.inputName || m.label === t.inputName))
                      );
                      const keysDisplay = mapping?.keys && mapping.keys.length > 0 ? mapping.keys.join('/') : (t.key || 'Key');
                      const timing = t.triggerMode && t.triggerMode !== 'hold' ? ` [${t.triggerMode}]` : '';
                      return `Input: ${mapping?.label || mapping?.name || t.inputName || t.inputId || 'Key'} (${keysDisplay})${timing}`;
                    }
                    if (t.type === 'sight') {
                      return `Sight: ${t.sensoryTag || 'head_eyes'} (${t.visionRadiusPx || 200}px)`;
                    }
                    if (t.type === 'sound') {
                      return `Hearing: ${t.sensoryTag || 'head_ears'} (${t.hearingRadiusPx || 250}px)`;
                    }
                    if (t.type === 'health') {
                      return `Health ${t.comparator === 'less_than' ? '<' : '>'} ${t.healthPercentThreshold || 50}%`;
                    }
                    if (t.type === 'variable_condition') {
                      const v = variablesList.find(vl => vl.id === t.variableId);
                      const compSymbol = t.comparator === 'equals' ? '==' : t.comparator === 'not_equals' ? '!=' : t.comparator === 'greater_than' ? '>' : t.comparator === 'less_than' ? '<' : t.comparator === 'greater_or_equal' ? '>=' : t.comparator === 'less_or_equal' ? '<=' : '==';
                      const valDisplay = v?.type === 'boolean' 
                        ? (t.value === undefined || t.value === true || t.value === 'true' || t.value === 1 ? 'true' : 'False') 
                        : String(t.value ?? 0);
                      return `${v?.name || t.variableId || 'Var'} ${compSymbol} ${valDisplay}`;
                    }
                    if (t.type === 'proximity') {
                      return `Proximity < ${t.distancePx || 100}px`;
                    }
                    if (t.type === 'timer') {
                      return `Timer: ${t.intervalMs || 1000}ms`;
                    }
                    if (t.type === 'solid_detection') {
                      return `Solid: ${t.direction || 'below'} (${t.checkMode || 'touching'})`;
                    }
                    if (t.type === 'slope_detection' || t.type === 'slope') {
                      const cond = (t as any).slopeCondition || 'on_any_slope';
                      const loc = (t as any).contactLocation || 'feet';
                      return `Slope: ${cond.replace(/_/g, ' ')} (${loc})`;
                    }
                    if (t.type === 'physics_state') {
                      return `Physics: ${t.stateKind || 'jump_peak'}`;
                    }
                    return triggerTypeLabels[t.type] || t.type;
                  };

                  const triggerSummary = effectiveTriggers.length === 1
                    ? getSingleTriggerSummary(effectiveTriggers[0])
                    : `${effectiveTriggers.length} IFs (${ruleLogic}): ${getSingleTriggerSummary(effectiveTriggers[0])}...`;

                  // Helper to update triggers array for this rule
                  const updateRuleTriggers = (newTriggers: BehaviorTrigger[], newLogic?: 'AND' | 'OR') => {
                    updateCharacter(c => ({
                      ...c,
                      rules: (c.rules || []).map(r => {
                        if (r.id === rule.id) {
                          return {
                            ...r,
                            trigger: newTriggers[0] || r.trigger,
                            triggers: newTriggers,
                            ...(newLogic !== undefined ? { triggerLogic: newLogic } : {})
                          };
                        }
                        return r;
                      })
                    }));
                  };

                  const updateSingleTriggerAt = (tIdx: number, newTrigger: BehaviorTrigger) => {
                    const next = [...effectiveTriggers];
                    next[tIdx] = newTrigger;
                    updateRuleTriggers(next);
                  };

                  const addTriggerToRule = () => {
                    const newTrig = createDefaultTrigger('solid_detection');
                    const next = [...effectiveTriggers, newTrig];
                    updateRuleTriggers(next);
                  };

                  const removeTriggerFromRule = (tIdx: number) => {
                    if (effectiveTriggers.length <= 1) return;
                    const next = effectiveTriggers.filter((_, idx) => idx !== tIdx);
                    updateRuleTriggers(next);
                  };

                  return (
                    <div
                      key={rule.id}
                      className={`bg-neutral-900 border rounded-2xl transition overflow-hidden shadow-lg ${
                        rule.enabled ? 'border-neutral-800 hover:border-neutral-700' : 'border-neutral-800/40 opacity-60'
                      }`}
                    >
                      {/* Collapsible Rule Header */}
                      <div 
                        onClick={() => {
                          setExpandedRuleIds(prev => {
                            const next = new Set(prev);
                            if (next.has(rule.id)) next.delete(rule.id);
                            else next.add(rule.id);
                            return next;
                          });
                        }}
                        className="flex items-center justify-between p-3.5 md:px-4 cursor-pointer hover:bg-neutral-800/50 transition select-none flex-wrap gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            className="p-1 rounded text-neutral-400 hover:text-white"
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>

                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded shrink-0">
                            #{rIdx + 1}
                          </span>

                          <input
                            type="text"
                            value={rule.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              updateCharacter(c => ({
                                ...c,
                                rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, name: e.target.value } : r)
                              }));
                            }}
                            className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-neutral-700 focus:border-amber-500 focus:outline-none transition max-w-[200px] md:max-w-xs truncate"
                          />
                        </div>

                        {/* Summary Badges & Controls */}
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Trigger summary pill */}
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1">
                            <Zap size={11} className="text-amber-400" />
                            <span className="truncate max-w-[150px]">{triggerSummary}</span>
                          </span>

                          {/* Action count pill */}
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono">
                            {(rule.actions || []).length} {rule.actions?.length === 1 ? 'Action' : 'Actions'}
                          </span>

                          <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer ml-1">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => {
                                updateCharacter(c => ({
                                  ...c,
                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, enabled: e.target.checked } : r)
                                }));
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500 bg-neutral-950 border-neutral-700"
                            />
                            <span className="text-[11px] hidden sm:inline">Enabled</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              updateCharacter(c => ({
                                ...c,
                                rules: (c.rules || []).filter(r => r.id !== rule.id)
                              }));
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Delete Rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details Body */}
                      {isExpanded && (
                        <div className="p-4 md:p-5 pt-1 space-y-4 border-t border-neutral-800/80 bg-neutral-900/40">
                          
                          {/* MULTI-IF TRIGGER SECTION */}
                          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Zap size={14} />
                                  IF Trigger Conditions ({effectiveTriggers.length})
                                </span>

                                {/* AND / OR LOGIC TOGGLE */}
                                <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-700">
                                  <button
                                    type="button"
                                    onClick={() => updateRuleTriggers(effectiveTriggers, 'AND')}
                                    className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                                      ruleLogic === 'AND'
                                        ? 'bg-amber-600 text-white shadow'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                                    title="All trigger conditions must be true"
                                  >
                                    AND (All)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRuleTriggers(effectiveTriggers, 'OR')}
                                    className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                                      ruleLogic === 'OR'
                                        ? 'bg-amber-600 text-white shadow'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                                    title="Any trigger condition can be true"
                                  >
                                    OR (Any)
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={addTriggerToRule}
                                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/40 border border-amber-600/30 px-2.5 py-1 rounded-lg transition hover:bg-amber-900/40"
                              >
                                <Plus size={13} />
                                <span>+ Add IF Condition</span>
                              </button>
                            </div>

                            {/* Trigger Cards List */}
                            <div className="space-y-3 pt-1">
                              {effectiveTriggers.map((trig, tIdx) => {
                                return (
                                  <div key={tIdx} className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-800 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded">
                                          IF #{tIdx + 1} {tIdx > 0 && <span className="text-neutral-400">({ruleLogic})</span>}
                                        </span>
                                        <span className="text-xs font-bold text-neutral-300">
                                          Condition Type
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <select
                                          value={trig.type}
                                          onChange={(e) => {
                                            const newType = e.target.value as TriggerType;
                                            updateSingleTriggerAt(tIdx, createDefaultTrigger(newType, variablesList));
                                          }}
                                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono"
                                        >
                                          <option value="on_spawn"> On Spawn (Instance Created / Instantiated)</option>
                                          <option value="solid_detection"> Solid Detection (Left / Right / Above / Below)</option>
                                          <option value="slope_detection"> Slope Detection (Ramps / Incline / Ascending / Facing Uphill)</option>
                                          <option value="physics_state"> Physics & Gravity (Jump Peak / Falling / Low-G)</option>
                                          <option value="state">[Local] State Active / Event</option>
                                          <option value="possession"> Player Takes Possession</option>
                                          <option value="mapped_input"> Mapped Player Input (UI Mapping)</option>
                                          <option value="raw_keyboard"> Raw Keyboard (Direct Key / Modifiers)</option>
                                          <option value="raw_mouse"> Raw Mouse (Buttons / Wheel / Hover)</option>
                                          <option value="raw_gamepad"> Raw Gamepad (Buttons / Sticks / Triggers)</option>
                                          <option value="sight"> Sight Raycast (Sensory Eyes)</option>
                                          <option value="sound"> Acoustic Hearing (Sensory Ears)</option>
                                          <option value="proximity"> Proximity Distance</option>
                                          <option value="health"> Health Threshold</option>
                                          <option value="variable_condition"> Variable Condition</option>
                                          <option value="timer"> Timer Interval</option>
                                          <option value="dialogue_trigger"> Dialogue Interaction</option>
                                          <option value="collision"> Physics Collision</option>
                                        </select>

                                        {effectiveTriggers.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeTriggerFromRule(tIdx)}
                                            className="p-1 text-neutral-500 hover:text-red-400 transition rounded"
                                            title="Remove this IF condition"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Dynamic Trigger Fields */}
                                    <div className="text-xs space-y-2">
                                      
                                      {/* 0. ON SPAWN TRIGGER */}
                                      {(trig.type === 'on_spawn' || trig.type === 'spawn') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950/70 p-3 rounded-xl border border-amber-950/60">
                                          <div>
                                            <label className="text-[10px] text-amber-400 font-bold block mb-1">
                                              Spawn Delay (ms)
                                            </label>
                                            <input
                                              type="number"
                                              min={0}
                                              step={50}
                                              value={(trig as any).spawnDelayMs ?? 0}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  spawnDelayMs: Math.max(0, Number(e.target.value))
                                                } as any);
                                              }}
                                              placeholder="0 (Immediate)"
                                              className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2.5 py-1.5 text-amber-300 font-mono text-xs"
                                            />
                                            <span className="text-[10px] text-neutral-500 mt-1 block">
                                              0ms fires immediately upon entity placement or instantiation
                                            </span>
                                          </div>
                                          <div className="flex flex-col justify-center bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
                                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs mb-1">
                                              <span></span>
                                              <span>Lifecycle Event</span>
                                            </div>
                                            <p className="text-[11px] text-neutral-300 leading-relaxed">
                                              Fires automatically once when this prefab instance is instantiated or spawned into the scene.
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* 1. SOLID DETECTION TRIGGER */}
                                      {trig.type === 'solid_detection' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Solid Direction</label>
                                            <select
                                              value={trig.direction || 'below'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  direction: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="below">Down️ Below / Ground (Solid floor under feet)</option>
                                              <option value="above">Up️ Above / Ceiling (Solid overhead obstacle)</option>
                                              <option value="left">Left️ Left Wall (Solid barrier to the left)</option>
                                              <option value="right">Right️ Right Wall (Solid barrier to the right)</option>
                                              <option value="wall_forward">{" >> "} Forward Wall (Facing direction solid)</option>
                                              <option value="wall_backward">{" << "} Backward Wall (Behind prefab)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Detection Mode</label>
                                            <select
                                              value={trig.checkMode || 'touching'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  checkMode: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="touching">Touching / Direct Contact (0-4px)</option>
                                              <option value="near">Near Distance (Within Sensor Range)</option>
                                              <option value="clear">Clear / No Solid (Free Space / Pit)</option>
                                              <option value="ledge_ahead">Ledge Ahead (Floor drops off)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Detection Distance (px)</label>
                                            <input
                                              type="number"
                                              value={trig.detectionDistancePx ?? 4}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  detectionDistancePx: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* 1.5 SLOPE DETECTION TRIGGER */}
                                      {(trig.type === 'slope_detection' || trig.type === 'slope') && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-950/70 p-3 rounded-xl border border-sky-950/60">
                                          <div>
                                            <label className="text-[10px] text-sky-400 font-bold block"> Slope Condition</label>
                                            <select
                                              value={(trig as any).slopeCondition || 'on_any_slope'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  slopeCondition: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="on_any_slope">️ Any Slope (45deg Floor or Ceiling)</option>
                                              <option value="on_floor_ramp">🦶 Standing on Floor Ramp (◢ or ◣)</option>
                                              <option value="on_ceiling_slope">🧢 Touching Ceiling Slope (◥ or ◤)</option>
                                              <option value="ascending_slope">🧗 Ascending Slope (Walking Uphill)</option>
                                              <option value="descending_slope">️ Descending Slope (Walking Downhill)</option>
                                              <option value="facing_uphill">️ Facing Uphill (Incline Ahead)</option>
                                              <option value="facing_downhill">📉 Facing Downhill (Decline Ahead)</option>
                                              <option value="slope_up_right">◢ Slope 45deg Up-Right</option>
                                              <option value="slope_up_left">◣ Slope 45deg Up-Left</option>
                                              <option value="slope_down_right">◥ Slope 45deg Down-Right</option>
                                              <option value="slope_down_left">◤ Slope 45deg Down-Left</option>
                                              <option value="no_slope">🚫 Flat Ground / Air (No Slope)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-sky-400 font-bold block">Contact / Sensor Location</label>
                                            <select
                                              value={(trig as any).contactLocation || 'feet'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  contactLocation: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="feet">🦶 Feet / Floor Contact (Default)</option>
                                              <option value="head">🧢 Head / Ceiling Contact</option>
                                              <option value="ahead">{" >> "} Ahead in Facing Direction</option>
                                              <option value="any">🌐 Anywhere (Feet, Head, or Ahead)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-sky-400 font-bold block">Detection Distance (px)</label>
                                            <input
                                              type="number"
                                              value={(trig as any).detectionDistancePx ?? 4}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  detectionDistancePx: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* 2. PHYSICS & GRAVITY STATE TRIGGER */}
                                      {trig.type === 'physics_state' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Velocity & Kinematic Event</label>
                                            <select
                                              value={trig.stateKind || 'jump_peak'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  stateKind: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="jump_peak">🏔️ Jump Peak (Apex reached / vy ≈ 0)</option>
                                              <option value="falling">🪂 Falling (Pulled down by gravity / vy &gt; 0)</option>
                                              <option value="rising">[Launch] Rising Upward (Ascending / vy &lt; 0)</option>
                                              <option value="grounded">🦶 Grounded (Standing on floor)</option>
                                              <option value="airborne">🕊️ Airborne (In mid-air)</option>
                                              <option value="wall_sliding">🧗 Wall Sliding (Clinging to wall)</option>
                                              <option value="moving_horizontally"> Moving Horizontally (|vx| &gt; 0)</option>
                                              <option value="stopped">[Stop] Stopped / Zero Velocity</option>
                                              <option value="weightless_environment">🌌 Weightless / Zero-G Environment</option>
                                              <option value="high_velocity">[Local] High Velocity (Terminal speed)</option>
                                              <option value="direction_change">🔄 Direction Turn Fired</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Velocity Threshold (px/tick)</label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={trig.velocityThreshold ?? 0.5}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  velocityThreshold: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* 3. STATE ACTIVE / EVENT TRIGGER */}
                                      {trig.type === 'state' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">State Event Condition</label>
                                            <select
                                              value={trig.stateMode || 'is_state'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  stateMode: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="is_state">While In State (Continuous Active)</option>
                                              <option value="on_enter">On State Enter (Enter Event)</option>
                                              <option value="on_exit">On State Exit (Exit Event)</option>
                                              <option value="on_transition">On Transition Fired (Transition Event)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block flex items-center justify-between">
                                              <span>{trig.stateMode === 'on_transition' ? 'Triggering Transition' : 'Target State Node'}</span>
                                              <span className="text-indigo-400 font-mono text-[9px]">{stateNodes.length} Available</span>
                                            </label>

                                            {trig.stateMode === 'on_transition' ? (
                                              <select
                                                value={trig.transitionId || stateTransitions[0]?.id || ''}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    transitionId: e.target.value
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                              >
                                                {stateTransitions.map(tr => {
                                                  const from = stateNodes.find(s => s.id === tr.fromStateId)?.name || tr.fromStateId;
                                                  const to = stateNodes.find(s => s.id === tr.toStateId)?.name || tr.toStateId;
                                                  return (
                                                    <option key={tr.id} value={tr.id}>
                                                      {from} {tr.isBidirectional ? 'LeftRight' : '->'} {to} ({tr.triggerLabel || 'Transition'})
                                                    </option>
                                                  );
                                                })}
                                              </select>
                                            ) : (
                                              <select
                                                value={trig.requiredState || stateNodes[0]?.name || 'Idle'}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    requiredState: e.target.value
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                              >
                                                {stateNodes.map(st => (
                                                  <option key={st.id} value={st.name}>
                                                    • {st.name} ({st.id}){st.isInitial ? ' [Initial]' : ''}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* 4. POSSESSION TRIGGER */}
                                      {trig.type === 'possession' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Possession Event</label>
                                            <select
                                              value={trig.event || 'on_possess'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  event: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="on_possess">On Player Possess (Spawn/Switch In)</option>
                                              <option value="on_unpossess">On Player Unpossess (Release/Switch Out)</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* 5. MAPPED INPUT TRIGGER */}
                                      {trig.type === 'mapped_input' && (
                                        <div className="bg-neutral-950/70 p-3 rounded-xl border border-amber-950/60">
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <label className="text-[10px] text-amber-400 font-bold block"> Mapped Player Input Action</label>
                                              <span className="text-[9px] text-neutral-400 font-mono">Mode configured in Input Mappings tab</span>
                                            </div>
                                            {(() => {
                                              const matched = availableInputMappings.find(m => 
                                                m.id === trig.inputId || 
                                                m.name === trig.inputId || 
                                                m.id === trig.inputName || 
                                                m.name === trig.inputName ||
                                                m.label === trig.inputName
                                              );
                                              const selVal = matched?.id || trig.inputId || availableInputMappings[0]?.id || 'inp_jump';
                                              return (
                                                <div className="space-y-1.5">
                                                  <select
                                                    value={selVal}
                                                    onChange={(e) => {
                                                      const sel = availableInputMappings.find(m => m.id === e.target.value || m.name === e.target.value);
                                                      updateSingleTriggerAt(tIdx, {
                                                        ...trig,
                                                        inputId: sel?.id || e.target.value,
                                                        inputName: sel?.name || sel?.label || e.target.value
                                                      });
                                                    }}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                                                  >
                                                    {availableInputMappings.map(m => (
                                                      <option key={m.id} value={m.id}>
                                                        {m.label || m.name} ({m.keys?.join('/') || 'No key'}) [{m.category || 'action'}] • Mode: {m.triggerMode || 'hold'}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  {matched && (
                                                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                                                      <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                                                        Keys: {matched.keys?.join(' / ') || 'None'}
                                                      </span>
                                                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                                                        Trigger Timing: {matched.triggerMode ? matched.triggerMode.toUpperCase() : 'HOLD (Continuous)'}
                                                      </span>
                                                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                                                        Category: {matched.category || 'Action'}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* 5b. RAW KEYBOARD TRIGGER */}
                                      {(trig.type === 'raw_keyboard' || trig.type === 'keyboard_key') && (
                                        <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Key Code Preset</label>
                                              <select
                                                value={trig.key || 'KeyE'}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    key: e.target.value
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                              >
                                                <optgroup label="Movement & Core">
                                                  <option value="Space">Space (Spacebar)</option>
                                                  <option value="KeyW">KeyW (W / Up)</option>
                                                  <option value="KeyA">KeyA (A / Left)</option>
                                                  <option value="KeyS">KeyS (S / Down)</option>
                                                  <option value="KeyD">KeyD (D / Right)</option>
                                                  <option value="ArrowUp">ArrowUp (↑)</option>
                                                  <option value="ArrowLeft">ArrowLeft (←)</option>
                                                  <option value="ArrowDown">ArrowDown (↓)</option>
                                                  <option value="ArrowRight">ArrowRight ({"->"})</option>
                                                </optgroup>
                                                <optgroup label="Actions & Combat">
                                                  <option value="KeyE">KeyE (Interact)</option>
                                                  <option value="KeyF">KeyF (Use / Action)</option>
                                                  <option value="KeyQ">KeyQ (Ability 1)</option>
                                                  <option value="KeyR">KeyR (Reload / Reset)</option>
                                                  <option value="KeyC">KeyC (Crouch / Slide)</option>
                                                  <option value="KeyJ">KeyJ (Attack)</option>
                                                  <option value="KeyK">KeyK (Special)</option>
                                                  <option value="KeyL">KeyL (Block / Guard)</option>
                                                  <option value="KeyZ">KeyZ (Action 1)</option>
                                                  <option value="KeyX">KeyX (Action 2)</option>
                                                  <option value="KeyV">KeyV (Melee / Roll)</option>
                                                  <option value="KeyU">KeyU (Skill)</option>
                                                  <option value="KeyI">KeyI (Inventory)</option>
                                                  <option value="KeyM">KeyM (Map)</option>
                                                </optgroup>
                                                <optgroup label="System & Keys">
                                                  <option value="Enter">Enter / Return</option>
                                                  <option value="Escape">Escape</option>
                                                  <option value="Tab">Tab</option>
                                                  <option value="Backspace">Backspace</option>
                                                  <option value="ShiftLeft">ShiftLeft</option>
                                                  <option value="ShiftRight">ShiftRight</option>
                                                  <option value="ControlLeft">ControlLeft</option>
                                                  <option value="AltLeft">AltLeft</option>
                                                </optgroup>
                                                <optgroup label="Numbers">
                                                  <option value="Digit1">1 (Digit1)</option>
                                                  <option value="Digit2">2 (Digit2)</option>
                                                  <option value="Digit3">3 (Digit3)</option>
                                                  <option value="Digit4">4 (Digit4)</option>
                                                  <option value="Digit5">5 (Digit5)</option>
                                                  <option value="Digit6">6 (Digit6)</option>
                                                  <option value="Digit7">7 (Digit7)</option>
                                                  <option value="Digit8">8 (Digit8)</option>
                                                  <option value="Digit9">9 (Digit9)</option>
                                                  <option value="Digit0">0 (Digit0)</option>
                                                </optgroup>
                                              </select>
                                            </div>

                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Custom Key Code</label>
                                              <input
                                                type="text"
                                                value={trig.key || ''}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    key: e.target.value
                                                  });
                                                }}
                                                placeholder="e.g. KeyE, F1, BracketLeft"
                                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-amber-300 font-mono mt-1 text-xs"
                                              />
                                            </div>

                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Trigger Timing</label>
                                              <select
                                                value={trig.triggerMode || 'press'}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    triggerMode: e.target.value as any
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                              >
                                                <option value="press">Press (On Key Down / Initial Hit)</option>
                                                <option value="hold">Hold (Continuous Key Down)</option>
                                                <option value="release">Release (On Key Up / Released)</option>
                                              </select>
                                            </div>
                                          </div>

                                          {/* Modifier check boxes */}
                                          <div className="flex items-center gap-4 pt-1 text-[11px] text-neutral-300">
                                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Required Modifiers:</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                                              <input
                                                type="checkbox"
                                                checked={!!trig.requireShift}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    requireShift: e.target.checked
                                                  });
                                                }}
                                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0"
                                              />
                                              <span>Shift</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                                              <input
                                                type="checkbox"
                                                checked={!!trig.requireCtrl}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    requireCtrl: e.target.checked
                                                  });
                                                }}
                                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0"
                                              />
                                              <span>Ctrl</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                                              <input
                                                type="checkbox"
                                                checked={!!trig.requireAlt}
                                                onChange={(e) => {
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    requireAlt: e.target.checked
                                                  });
                                                }}
                                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0"
                                              />
                                              <span>Alt</span>
                                            </label>
                                          </div>
                                        </div>
                                      )}

                                      {/* 5c. RAW MOUSE TRIGGER */}
                                      {trig.type === 'raw_mouse' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Mouse Action</label>
                                            <select
                                              value={trig.action || 'press'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  action: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                            >
                                              <option value="press">Click / Press (Mouse Down)</option>
                                              <option value="hold">Hold (Continuous Button Down)</option>
                                              <option value="release">Release (Mouse Button Up)</option>
                                              <option value="wheel_up">Scroll Wheel Up (Delta &lt; 0)</option>
                                              <option value="wheel_down">Scroll Wheel Down (Delta &gt; 0)</option>
                                              <option value="hover">Cursor Hovering Prefab</option>
                                              <option value="move">Mouse Movement (Any Motion)</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Mouse Button</label>
                                            <select
                                              value={trig.button || 'left'}
                                              disabled={trig.action?.startsWith('wheel') || trig.action === 'hover' || trig.action === 'move'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  button: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs disabled:opacity-40"
                                            >
                                              <option value="left">Left Button (Button 0 / Primary)</option>
                                              <option value="middle">Middle / Wheel Button (Button 1)</option>
                                              <option value="right">Right Button (Button 2 / Secondary)</option>
                                              <option value="button_4">Button 4 (Thumb / Back)</option>
                                              <option value="button_5">Button 5 (Thumb / Forward)</option>
                                              <option value="any">Any Mouse Button</option>
                                            </select>
                                          </div>

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Target Area / Scope</label>
                                            <select
                                              value={trig.targetArea || 'anywhere'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  targetArea: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                            >
                                              <option value="anywhere">Anywhere On Screen / Canvas</option>
                                              <option value="on_prefab">Directly On This Prefab Bounds</option>
                                              <option value="screen_left_half">Left Half of Screen</option>
                                              <option value="screen_right_half">Right Half of Screen</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* 5d. RAW GAMEPAD TRIGGER */}
                                      {trig.type === 'raw_gamepad' && (
                                        <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Gamepad Controller</label>
                                              <select
                                                value={trig.gamepadIndex === undefined ? 'any' : trig.gamepadIndex}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    gamepadIndex: val === 'any' ? 'any' : (Number(val) as 0 | 1 | 2 | 3)
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                              >
                                                <option value="any">Any Connected Gamepad</option>
                                                <option value="0">Gamepad #1 (Player 1 / Pad 0)</option>
                                                <option value="1">Gamepad #2 (Player 2 / Pad 1)</option>
                                                <option value="2">Gamepad #3 (Player 3 / Pad 2)</option>
                                                <option value="3">Gamepad #4 (Player 4 / Pad 3)</option>
                                              </select>
                                            </div>

                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Input Category</label>
                                              <select
                                                value={trig.inputType || 'button'}
                                                onChange={(e) => {
                                                  const cat = e.target.value as any;
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    inputType: cat,
                                                    ...(cat === 'button' ? { button: trig.button || 'button_a', buttonMode: trig.buttonMode || 'press' } : {}),
                                                    ...(cat === 'stick_axis' ? { axis: 'left_stick_x', axisDirection: 'positive', axisThreshold: 0.25 } : {}),
                                                    ...(cat === 'trigger_axis' ? { axis: 'left_trigger', axisDirection: 'greater_than', axisThreshold: 0.3 } : {})
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                              >
                                                <option value="button">Gamepad Button / D-Pad</option>
                                                <option value="stick_axis">Analog Thumbstick Axis</option>
                                                <option value="trigger_axis">Analog Trigger Axis</option>
                                              </select>
                                            </div>

                                            {(trig.inputType === 'button' || !trig.inputType) && (
                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Button Mode</label>
                                                <select
                                                  value={trig.buttonMode || 'press'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      buttonMode: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                                >
                                                  <option value="press">Press (Just Pressed / Down)</option>
                                                  <option value="hold">Hold (Continuous Pressed)</option>
                                                  <option value="release">Release (Just Released)</option>
                                                </select>
                                              </div>
                                            )}
                                          </div>

                                          {/* Sub-fields depending on Button vs Stick vs Trigger */}
                                          {(trig.inputType === 'button' || !trig.inputType) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Target Button</label>
                                                <select
                                                  value={trig.button || 'button_a'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      button: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-amber-300 font-mono mt-1 text-xs"
                                                >
                                                  <optgroup label="Face Buttons">
                                                    <option value="button_a">Button A / Cross x (South)</option>
                                                    <option value="button_b">Button B / Circle O (East)</option>
                                                    <option value="button_x">Button X / Square [] (West)</option>
                                                    <option value="button_y">Button Y / Triangle ^ (North)</option>
                                                  </optgroup>
                                                  <optgroup label="Shoulders & Triggers">
                                                    <option value="left_bumper">Left Bumper (LB / L1)</option>
                                                    <option value="right_bumper">Right Bumper (RB / R1)</option>
                                                    <option value="left_trigger">Left Trigger (LT / L2)</option>
                                                    <option value="right_trigger">Right Trigger (RT / R2)</option>
                                                  </optgroup>
                                                  <optgroup label="D-Pad">
                                                    <option value="dpad_up">D-Pad Up Up</option>
                                                    <option value="dpad_down">D-Pad Down Down</option>
                                                    <option value="dpad_left">D-Pad Left Left</option>
                                                    <option value="dpad_right">D-Pad Right Right</option>
                                                  </optgroup>
                                                  <optgroup label="Stick Clicks & System">
                                                    <option value="left_stick_click">Left Stick Click (L3)</option>
                                                    <option value="right_stick_click">Right Stick Click (R3)</option>
                                                    <option value="select_back">Select / Back / Share</option>
                                                    <option value="start_pause">Start / Menu / Options</option>
                                                    <option value="home_guide">Home / Guide Button</option>
                                                    <option value="any">Any Gamepad Button</option>
                                                  </optgroup>
                                                </select>
                                              </div>
                                            </div>
                                          )}

                                          {trig.inputType === 'stick_axis' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Analog Stick Axis</label>
                                                <select
                                                  value={trig.axis || 'left_stick_x'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      axis: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                                >
                                                  <option value="left_stick_x">Left Stick X (Horizontal LeftRight)</option>
                                                  <option value="left_stick_y">Left Stick Y (Vertical UpDown)</option>
                                                  <option value="right_stick_x">Right Stick X (Horizontal LeftRight)</option>
                                                  <option value="right_stick_y">Right Stick Y (Vertical UpDown)</option>
                                                </select>
                                              </div>

                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Tilt Direction</label>
                                                <select
                                                  value={trig.axisDirection || 'positive'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      axisDirection: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                                >
                                                  <option value="positive">Positive (Right Right / Down Down)</option>
                                                  <option value="negative">Negative (Left Left / Up Up)</option>
                                                  <option value="any_movement">Any Tilt (|tilt| &gt; deadzone)</option>
                                                </select>
                                              </div>

                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Deadzone Threshold</label>
                                                <input
                                                  type="number"
                                                  min={0.05}
                                                  max={0.95}
                                                  step={0.05}
                                                  value={trig.axisThreshold ?? 0.25}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      axisThreshold: Math.max(0.05, Math.min(0.95, Number(e.target.value)))
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-amber-300 font-mono mt-1 text-xs"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {trig.inputType === 'trigger_axis' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Analog Trigger</label>
                                                <select
                                                  value={trig.axis || 'left_trigger'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      axis: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono mt-1 text-xs"
                                                >
                                                  <option value="left_trigger">Left Trigger (LT / L2)</option>
                                                  <option value="right_trigger">Right Trigger (RT / R2)</option>
                                                </select>
                                              </div>

                                              <div>
                                                <label className="text-[10px] text-neutral-400 font-bold block">Pull Threshold (0.1 - 0.9)</label>
                                                <input
                                                  type="number"
                                                  min={0.1}
                                                  max={0.9}
                                                  step={0.05}
                                                  value={trig.axisThreshold ?? 0.3}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      axisThreshold: Math.max(0.1, Math.min(0.9, Number(e.target.value)))
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-amber-300 font-mono mt-1 text-xs"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* 6. SIGHT RAYCAST TRIGGER */}
                                      {trig.type === 'sight' && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Sensory Socket</label>
                                            <select
                                              value={trig.sensoryTag || 'head_eyes'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  sensoryTag: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="head_eyes">head_eyes (Eyes Socket)</option>
                                              <option value="torso_center">torso_center (Chest Socket)</option>
                                              {pointsList.map(pt => (
                                                <option key={pt.id} value={pt.name}>{pt.name} ({pt.id})</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Vision Radius (px)</label>
                                            <input
                                              type="number"
                                              value={trig.visionRadiusPx || 200}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  visionRadiusPx: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Cone Angle (deg)</label>
                                            <input
                                              type="number"
                                              value={trig.visionAngleDeg || 120}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  visionAngleDeg: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Target Filter</label>
                                            <select
                                              value={trig.targetFilter || 'player'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  targetFilter: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="player">Player Hero</option>
                                              <option value="enemy">Enemy Mob</option>
                                              <option value="any">Any Prefab</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* 7. ACOUSTIC SOUND TRIGGER */}
                                      {trig.type === 'sound' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Hearing Socket</label>
                                            <select
                                              value={trig.sensoryTag || 'head_ears'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  sensoryTag: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="head_ears">head_ears (Ears Socket)</option>
                                              <option value="torso_center">torso_center (Body)</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Hearing Radius (px)</label>
                                            <input
                                              type="number"
                                              value={trig.hearingRadiusPx || 250}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  hearingRadiusPx: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* 8. PROXIMITY TRIGGER */}
                                      {trig.type === 'proximity' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Distance Threshold (px)</label>
                                            <input
                                              type="number"
                                              value={trig.distancePx || 100}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  distancePx: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Comparator</label>
                                            <select
                                              value={trig.comparator || 'less_than'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  comparator: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="less_than">Closer Than (&lt;)</option>
                                              <option value="greater_than">Farther Than (&gt;)</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* 9. HEALTH THRESHOLD TRIGGER */}
                                      {trig.type === 'health' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Health Threshold (%)</label>
                                            <input
                                              type="number"
                                              min={1}
                                              max={100}
                                              value={trig.healthPercentThreshold || 30}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  healthPercentThreshold: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Comparison</label>
                                            <select
                                              value={trig.comparator || 'less_than'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  comparator: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="less_than">Health Drops Below (&lt;=)</option>
                                              <option value="greater_than">Health Above (&gt;=)</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* 10. VARIABLE CONDITION TRIGGER */}
                                      {trig.type === 'variable_condition' && (() => {
                                        const currentVarId = trig.variableId || variablesList[0]?.id || '';
                                        const selectedVar = variablesList.find(v => v.id === currentVarId);
                                        const isBool = selectedVar?.type === 'boolean';
                                        const isEnum = selectedVar?.type === 'enum';
                                        const isString = selectedVar?.type === 'string';

                                        return (
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">Variable</label>
                                              <select
                                                value={currentVarId}
                                                onChange={(e) => {
                                                  const nextVarId = e.target.value;
                                                  const nextVar = variablesList.find(v => v.id === nextVarId);
                                                  const nextIsBool = nextVar?.type === 'boolean';
                                                  updateSingleTriggerAt(tIdx, {
                                                    ...trig,
                                                    variableId: nextVarId,
                                                    comparator: 'equals',
                                                    value: nextIsBool 
                                                      ? (trig.value === false ? false : true) 
                                                      : (nextVar?.defaultValue ?? (nextVar?.type === 'number' ? 0 : ''))
                                                  });
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                              >
                                                {variablesList.map(v => (
                                                  <option key={v.id} value={v.id}>
                                                    {v.type === 'boolean' ? '🔘' : v.type === 'enum' ? '📋' : v.type === 'string' ? '🔤' : ''} {v.name} ({v.id}) [{v.type}]
                                                  </option>
                                                ))}
                                              </select>
                                            </div>

                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">Condition</label>
                                              {isBool ? (
                                                <select
                                                  value="equals"
                                                  disabled
                                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 font-mono text-xs cursor-not-allowed opacity-90"
                                                >
                                                  <option value="equals">== Equal To</option>
                                                </select>
                                              ) : isEnum || isString ? (
                                                <select
                                                  value={trig.comparator === 'not_equals' ? 'not_equals' : 'equals'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      comparator: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                                >
                                                  <option value="equals">== Equal To</option>
                                                  <option value="not_equals">!= Not Equal</option>
                                                </select>
                                              ) : (
                                                <select
                                                  value={trig.comparator || 'equals'}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      comparator: e.target.value as any
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                                >
                                                  <option value="equals">== Equal To</option>
                                                  <option value="not_equals">!= Not Equal</option>
                                                  <option value="greater_than">&gt; Greater Than</option>
                                                  <option value="greater_or_equal">&gt;= Greater or Equal</option>
                                                  <option value="less_than">&lt; Less Than</option>
                                                  <option value="less_or_equal">&lt;= Less or Equal</option>
                                                </select>
                                              )}
                                            </div>

                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">Target Value</label>
                                              {isBool ? (
                                                <div className="flex items-center h-[34px] px-3 bg-neutral-900 border border-neutral-700 rounded gap-2.5">
                                                  <input
                                                    type="checkbox"
                                                    id={`trig_bool_${rule.id}_${tIdx}`}
                                                    checked={trig.value === undefined ? true : Boolean(trig.value === true || trig.value === 'true' || trig.value === 1)}
                                                    onChange={(e) => {
                                                      updateSingleTriggerAt(tIdx, {
                                                        ...trig,
                                                        comparator: 'equals',
                                                        value: e.target.checked
                                                      });
                                                    }}
                                                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                                  />
                                                  <label htmlFor={`trig_bool_${rule.id}_${tIdx}`} className="text-xs font-mono font-bold cursor-pointer select-none text-amber-300">
                                                    {(trig.value === undefined || trig.value === true || trig.value === 'true' || trig.value === 1) ? 'TRUE (Checked)' : 'FALSE (Unchecked)'}
                                                  </label>
                                                </div>
                                              ) : isEnum && selectedVar?.options && selectedVar.options.length > 0 ? (
                                                <select
                                                  value={trig.value ?? selectedVar.options[0]}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      value: e.target.value
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                                >
                                                  {selectedVar.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              ) : isString ? (
                                                <input
                                                  type="text"
                                                  value={trig.value ?? ''}
                                                  placeholder="Target string value..."
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      value: e.target.value
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                                />
                                              ) : (
                                                <input
                                                  type="number"
                                                  value={trig.value ?? 0}
                                                  onChange={(e) => {
                                                    updateSingleTriggerAt(tIdx, {
                                                      ...trig,
                                                      value: parseFloat(e.target.value) || 0
                                                    });
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded px-2 py-1.5 text-white font-mono text-xs"
                                                />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* 11. TIMER INTERVAL TRIGGER */}
                                      {trig.type === 'timer' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Interval (ms)</label>
                                            <input
                                              type="number"
                                              step="100"
                                              value={trig.intervalMs || 2000}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  intervalMs: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Random Jitter (ms)</label>
                                            <input
                                              type="number"
                                              value={trig.randomJitterMs || 0}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  randomJitterMs: Number(e.target.value)
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* 12. COLLISION TRIGGER */}
                                      {trig.type === 'collision' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Contact Type</label>
                                            <select
                                              value={trig.contactType || 'wall_impact'}
                                              onChange={(e) => {
                                                updateSingleTriggerAt(tIdx, {
                                                  ...trig,
                                                  contactType: e.target.value as any
                                                });
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            >
                                              <option value="wall_impact">Wall / Obstacle Impact</option>
                                              <option value="ground_touch">Ground Touch (Landing)</option>
                                              <option value="hazard_touch">Hazard / Spikes Touch</option>
                                              <option value="prefab_overlap">Hero/Mob Overlap</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* RULE LOCAL VARIABLES MANAGER (RULE SCOPE STATE) */}
                          <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles size={13} className="text-amber-400" />
                                  Rule Local Variables ({(rule.localVariables || []).length})
                                </span>
                                <span className="text-[10px] text-neutral-500 hidden sm:inline font-mono">
                                  (Temporary scoped variables for dynamic modifiers & math results)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const count = (rule.localVariables || []).length + 1;
                                  const newLocalVar = {
                                    id: `local_var_${count}`,
                                    name: count === 1 ? 'run_speed' : `local_var_${count}`,
                                    defaultValue: count === 1 ? 6.0 : 0,
                                    type: 'number' as const
                                  };
                                  updateCharacter(c => ({
                                    ...c,
                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                      ...r,
                                      localVariables: [...(r.localVariables || []), newLocalVar]
                                    } : r)
                                  }));
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/40 border border-amber-600/30 px-2 py-0.5 rounded-lg transition hover:bg-amber-900/40"
                              >
                                <Plus size={12} />
                                <span>+ Add Local Var</span>
                              </button>
                            </div>

                            {/* List of rule local variables chips */}
                            {(!rule.localVariables || rule.localVariables.length === 0) ? (
                              <div className="text-[11px] text-neutral-500 italic py-0.5 flex items-center gap-1.5">
                                <span>No local variables defined for this rule yet. Click "+ Add Local Var" to create temporary variables like <code className="text-amber-400 font-mono text-[10px]">run_speed</code> or <code className="text-amber-400 font-mono text-[10px]">jump_power</code>.</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                {rule.localVariables.map((lv, lvIdx) => (
                                  <div key={lv.id || lvIdx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                                    <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0" title="Rule Local Variable">[Local]</span>
                                    <input
                                      type="text"
                                      value={lv.name}
                                      placeholder="var_name"
                                      onChange={(e) => {
                                        const newName = e.target.value;
                                        updateCharacter(c => ({
                                          ...c,
                                          rules: (c.rules || []).map(r => r.id === rule.id ? {
                                            ...r,
                                            localVariables: (r.localVariables || []).map((v, i) => i === lvIdx ? { ...v, name: newName } : v)
                                          } : r)
                                        }));
                                      }}
                                      className="bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 text-amber-200 font-mono text-xs w-full focus:outline-none"
                                    />
                                    <span className="text-neutral-500 font-mono text-[11px]">=</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={lv.defaultValue ?? 0}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateCharacter(c => ({
                                          ...c,
                                          rules: (c.rules || []).map(r => r.id === rule.id ? {
                                            ...r,
                                            localVariables: (r.localVariables || []).map((v, i) => i === lvIdx ? { ...v, defaultValue: val } : v)
                                          } : r)
                                        }));
                                      }}
                                      className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-amber-300 font-mono text-[11px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateCharacter(c => ({
                                          ...c,
                                          rules: (c.rules || []).map(r => r.id === rule.id ? {
                                            ...r,
                                            localVariables: (r.localVariables || []).filter((_, i) => i !== lvIdx)
                                          } : r)
                                        }));
                                      }}
                                      className="text-neutral-500 hover:text-red-400 p-0.5 shrink-0"
                                      title="Delete Local Variable"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* THEN ACTION CHAIN SECTION */}
                          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap size={14} />
                                THEN (Action Sequence)
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  const newAct: BehaviorAction = {
                                    id: `act_${Date.now().toString().slice(-4)}`,
                                    actionType: 'none'
                                  };
                                  updateCharacter(c => ({
                                    ...c,
                                    rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: [...(r.actions || []), newAct] } : r)
                                  }));
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                              >
                                <Plus size={13} />
                                <span>Add Action</span>
                              </button>
                            </div>

                            {/* Action Cards */}
                            <div className="space-y-2">
                              {(rule.actions || []).map((action, aIdx) => (
                                <div key={action.id || aIdx} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded">
                                        Step #{aIdx + 1}
                                      </span>
                                      {/* Action Sequence Reorder Controls (Move Up & Move Down) */}
                                      <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded p-0.5">
                                        <button
                                          type="button"
                                          disabled={aIdx === 0}
                                          onClick={() => {
                                            if (aIdx === 0) return;
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => {
                                                if (r.id === rule.id) {
                                                  const newActions = [...(r.actions || [])];
                                                  const temp = newActions[aIdx - 1];
                                                  newActions[aIdx - 1] = newActions[aIdx];
                                                  newActions[aIdx] = temp;
                                                  return { ...r, actions: newActions };
                                                }
                                                return r;
                                              })
                                            }));
                                          }}
                                          className={`p-1 rounded transition ${aIdx === 0 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800'}`}
                                          title="Move Action Up in Sequence"
                                        >
                                          <ChevronUp size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={aIdx >= (rule.actions || []).length - 1}
                                          onClick={() => {
                                            if (aIdx >= (rule.actions || []).length - 1) return;
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => {
                                                if (r.id === rule.id) {
                                                  const newActions = [...(r.actions || [])];
                                                  const temp = newActions[aIdx + 1];
                                                  newActions[aIdx + 1] = newActions[aIdx];
                                                  newActions[aIdx] = temp;
                                                  return { ...r, actions: newActions };
                                                }
                                                return r;
                                              })
                                            }));
                                          }}
                                          className={`p-1 rounded transition ${aIdx >= (rule.actions || []).length - 1 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800'}`}
                                          title="Move Action Down in Sequence"
                                        >
                                          <ChevronDown size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <select
                                        value={action.actionType || 'none'}
                                        onChange={(e) => {
                                          const newActType = e.target.value as ActionType;
                                          updateCharacter(c => ({
                                            ...c,
                                            rules: (c.rules || []).map(r => {
                                              if (r.id === rule.id) {
                                                return {
                                                  ...r,
                                                  actions: (r.actions || []).map(a => {
                                                    if (a.id === action.id) {
                                                      const isRand = newActType === 'set_random_frame';
                                                      return { 
                                                        ...a, 
                                                        actionType: newActType,
                                                        ...(newActType === 'set_traversal_angle' ? {
                                                          traversalAngleDeg: a.traversalAngleDeg ?? 45,
                                                          traversalAngleSource: a.traversalAngleSource || 'fixed',
                                                          steepSlopeBehavior: a.steepSlopeBehavior || 'block',
                                                          steepSlideSpeed: a.steepSlideSpeed ?? 3.5,
                                                          allowCeilingTraversal: a.allowCeilingTraversal ?? false
                                                        } : {}),
                                                        ...(newActType === 'set_frame' || newActType === 'set_random_frame' ? {
                                                          frameMode: isRand ? 'random_range' : (a.frameMode || 'fixed'),
                                                          targetFrameIndex: a.targetFrameIndex ?? 0,
                                                          minFrameIndex: a.minFrameIndex ?? 0,
                                                          maxFrameIndex: a.maxFrameIndex ?? 3,
                                                          pauseOnFrame: a.pauseOnFrame !== undefined ? a.pauseOnFrame : true
                                                        } : {})
                                                      };
                                                    }
                                                    return a;
                                                  })
                                                };
                                              }
                                              return r;
                                            })
                                          }));
                                        }}
                                        className="bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono"
                                      >
                                        <option value="none">🚫 None (No Action / Gate Only)</option>
                                        <option value="state_change">[Local] Transition FSM State</option>
                                        <option value="animation">🎬 Play Animation</option>
                                        <option value="set_frame">🖼️ Set Animation Frame (Static / Random in Range)</option>
                                        <option value="set_random_frame">🎲 Set Random Frame in Range</option>
                                        <option value="camera">🎥 Camera Locus (Track/Shake)</option>
                                        <option value="move"> Kinematic Move (Direction / Angle / Velocity / Stop)</option>
                                        <option value="ai_action">🤖 AI Actions / Automation (Patrol / Chase / Flee / Sine Wave)</option>
                                        <option value="hero_impulse">[Launch] Physics Impulse (Jump/Dash)</option>
                                        <option value="set_gravity">🪐 Override Biome Gravity</option>
                                        <option value="set_traversal_angle"> Set Allowed Traversal Angle (Slope & Incline)</option>
                                        <option value="attack">[Combat]️ Attack / Telegraph</option>
                                        <option value="math_operation">🧮 Math Calculator & Local Variables (Multiply / Modifiers / Arithmetic)</option>
                                        <option value="variable_modify"> Modify Variable / Math</option>
                                        <option value="audio">[Sound] Play Audio SFX</option>
                                        <option value="dialogue"> Speak Dialogue</option>
                                        <option value="emit_signal"> Emit Signal</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateCharacter(c => ({
                                            ...c,
                                            rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).filter(a => a.id !== action.id) } : r)
                                          }));
                                        }}
                                        className="p-1 text-neutral-500 hover:text-red-400"
                                        title="Remove Action"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* None (Gate Only) Action */}
                                  {(!action.actionType || action.actionType === 'none') && (
                                    <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-neutral-400 text-xs flex items-center gap-2">
                                      <span className="text-cyan-400 font-bold shrink-0">ℹ️</span>
                                      <span>No action will be executed. This rule acts purely as a conditional gate for FSM state transitions.</span>
                                    </div>
                                  )}

                                  {/* Transition FSM State Action */}
                                  {action.actionType === 'state_change' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Target State to Transition into</label>
                                        <select
                                          value={action.targetState || stateNodes[0]?.name || 'Idle'}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, targetState: e.target.value } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-indigo-300 font-mono mt-1"
                                        >
                                          {stateNodes.map(st => (
                                            <option key={st.id} value={st.name}>
                                              • {st.name} ({st.id})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Animation Action Config */}
                                  {action.actionType === 'animation' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Animation Clip</label>
                                        <select
                                          value={action.animState || 'idle'}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, animState: e.target.value } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        >
                                          {animationsList.map(a => (
                                            <option key={a.stateId} value={a.stateId}>
                                              {a.label || a.stateId}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Set Frame / Random Frame Action Config */}
                                  {(action.actionType === 'set_frame' || action.actionType === 'set_random_frame') && (() => {
                                    const getAnimFrameCount = (anim?: PrefabAnimationConfig | null): number => {
                                      if (!anim) return 1;
                                      if (Array.isArray(anim.keyframes) && anim.keyframes.length > 0) {
                                        return anim.keyframes.length;
                                      }
                                      if (typeof anim.startFrameIndex === 'number' && typeof anim.endFrameIndex === 'number') {
                                        return Math.max(1, Math.abs(anim.endFrameIndex - anim.startFrameIndex) + 1);
                                      }
                                      if (Array.isArray((anim as any).frames) && (anim as any).frames.length > 0) {
                                        return (anim as any).frames.length;
                                      }
                                      if (typeof (anim as any).frameCount === 'number' && (anim as any).frameCount > 0) {
                                        return (anim as any).frameCount;
                                      }
                                      if (typeof (anim as any).totalFrames === 'number' && (anim as any).totalFrames > 0) {
                                        return (anim as any).totalFrames;
                                      }
                                      return 1;
                                    };

                                    const currentTargetAnim = action.targetAnimationState || action.animState || animationsList[0]?.stateId || 'idle';
                                    const activeAnimObj = animationsList.find(a => a.stateId === currentTargetAnim);
                                    const frameCount = getAnimFrameCount(activeAnimObj);
                                    const currentMode = action.actionType === 'set_random_frame' ? (action.frameMode || 'random_range') : (action.frameMode || 'fixed');
                                    const isPaused = action.pauseOnFrame !== false;

                                    return (
                                      <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-cyan-950/70 text-xs pt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {/* Target Animation Clip */}
                                          <div>
                                            <label className="text-[10px] text-cyan-400 font-bold block mb-1">
                                              Target Animation Clip
                                            </label>
                                            <select
                                              value={currentTargetAnim}
                                              onChange={(e) => {
                                                const nextAnimState = e.target.value;
                                                const nextObj = animationsList.find(a => a.stateId === nextAnimState);
                                                const nextFrames = getAnimFrameCount(nextObj);
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? {
                                                      ...a,
                                                      targetAnimationState: nextAnimState,
                                                      animState: nextAnimState,
                                                      targetFrameIndex: Math.min(a.targetFrameIndex ?? 0, Math.max(0, nextFrames - 1)),
                                                      maxFrameIndex: Math.min(a.maxFrameIndex ?? Math.max(0, nextFrames - 1), Math.max(0, nextFrames - 1))
                                                    } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 focus:border-cyan-500 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                                            >
                                              <option value="*">* Active / Current Playing Animation</option>
                                              {animationsList.map(a => {
                                                const count = getAnimFrameCount(a);
                                                return (
                                                  <option key={a.stateId} value={a.stateId}>
                                                    🎬 {a.label || a.stateId} ({count} {count === 1 ? 'frame' : 'frames'})
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          </div>

                                          {/* Frame Selection Mode */}
                                          <div>
                                            <label className="text-[10px] text-cyan-400 font-bold block mb-1">
                                              Frame Selection Mode
                                            </label>
                                            <select
                                              value={currentMode}
                                              onChange={(e) => {
                                                const nextMode = e.target.value as any;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? {
                                                      ...a,
                                                      frameMode: nextMode,
                                                      minFrameIndex: a.minFrameIndex ?? 0,
                                                      maxFrameIndex: a.maxFrameIndex ?? Math.max(0, frameCount - 1)
                                                    } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 focus:border-cyan-500 rounded px-2.5 py-1.5 text-cyan-300 font-mono text-xs"
                                            >
                                              <option value="fixed">🎯 Specific Fixed Frame (Static)</option>
                                              <option value="random_range">🎲 Random Frame in Range (Min {"->"} Max)</option>
                                              <option value="random_all">[Star] Random Frame (Any in Animation Clip)</option>
                                              <option value="variable">[Var] From Prefab Variable Value</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Frame Parameters Based on Mode */}
                                        {currentMode === 'fixed' && (
                                          <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[10px] text-neutral-300 font-bold block">
                                                Target Frame Index (0-Indexed)
                                              </label>
                                              <span className="text-[10px] text-cyan-400 font-mono">
                                                Selected: Frame #{action.targetFrameIndex ?? 0} (Total {frameCount} {frameCount === 1 ? 'frame' : 'frames'})
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                min={0}
                                                max={Math.max(0, frameCount - 1)}
                                                value={action.targetFrameIndex ?? 0}
                                                onChange={(e) => {
                                                  const val = Math.min(Math.max(0, Number(e.target.value)), Math.max(0, frameCount - 1));
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? { ...a, targetFrameIndex: val } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="w-24 bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-white font-mono text-xs"
                                              />

                                              {/* Quick Frame Chips */}
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {Array.from({ length: Math.min(16, frameCount) }).map((_, fIdx) => (
                                                  <button
                                                    key={fIdx}
                                                    type="button"
                                                    onClick={() => {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, targetFrameIndex: fIdx } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                                                      (action.targetFrameIndex ?? 0) === fIdx
                                                        ? 'bg-cyan-600 text-white font-bold shadow-sm shadow-cyan-600/40'
                                                        : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                                                    }`}
                                                  >
                                                    #{fIdx}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {currentMode === 'random_range' && (
                                          <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[10px] text-neutral-300 font-bold block">
                                                Random Frame Range (Min {"->"} Max Inclusive)
                                              </label>
                                              <span className="text-[10px] text-cyan-400 font-mono">
                                                Range: [{action.minFrameIndex ?? 0} .. {action.maxFrameIndex ?? Math.max(0, frameCount - 1)}]
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-[10px] text-neutral-400 block mb-0.5">Min Frame (Start)</label>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={action.minFrameIndex ?? 0}
                                                  onChange={(e) => {
                                                    const minVal = Math.max(0, Number(e.target.value));
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? { ...a, minFrameIndex: minVal } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-white font-mono text-xs"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-neutral-400 block mb-0.5">Max Frame (End)</label>
                                                <input
                                                  type="number"
                                                  min={action.minFrameIndex ?? 0}
                                                  value={action.maxFrameIndex ?? Math.max(0, frameCount - 1)}
                                                  onChange={(e) => {
                                                    const maxVal = Math.max(0, Number(e.target.value));
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? { ...a, maxFrameIndex: maxVal } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-white font-mono text-xs"
                                                />
                                              </div>
                                            </div>
                                            <div className="text-[10px] text-cyan-400/80 flex items-center gap-1.5 pt-0.5">
                                              <span>🎲 Dynamically selects a pseudo-random integer index from {action.minFrameIndex ?? 0} to {action.maxFrameIndex ?? Math.max(0, frameCount - 1)} upon trigger execution.</span>
                                            </div>
                                          </div>
                                        )}

                                        {currentMode === 'random_all' && (
                                          <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 text-xs text-neutral-300">
                                            <div className="flex items-center gap-2">
                                              <span className="text-cyan-400 font-bold">🎲</span>
                                              <span>Will randomly select any frame from <strong>Frame #0</strong> to <strong>Frame #{Math.max(0, frameCount - 1)}</strong> ({frameCount} total frames).</span>
                                            </div>
                                          </div>
                                        )}

                                        {currentMode === 'variable' && (
                                          <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 space-y-1.5">
                                            <label className="text-[10px] text-neutral-300 font-bold block">
                                              Select Prefab Numeric Variable for Frame Index
                                            </label>
                                            <select
                                              value={action.frameVariableId || variablesList[0]?.id || ''}
                                              onChange={(e) => {
                                                const varId = e.target.value;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? { ...a, frameVariableId: varId } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono text-xs"
                                            >
                                              {variablesList.length === 0 ? (
                                                <option value="">No Variables Defined</option>
                                              ) : (
                                                variablesList.map(v => (
                                                  <option key={v.id} value={v.id}>
                                                    {v.name} ({v.id}) [{v.type}] = {String(char.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue ?? 0)}
                                                  </option>
                                                ))
                                              )}
                                            </select>
                                          </div>
                                        )}

                                        {/* Playback Freeze / Static Frame Toggle */}
                                        <div className="pt-1">
                                          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 cursor-pointer hover:bg-neutral-800/60 transition">
                                            <input
                                              type="checkbox"
                                              checked={isPaused}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? { ...a, pauseOnFrame: checked } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="rounded text-cyan-500 focus:ring-cyan-500 bg-neutral-950 border-neutral-700"
                                            />
                                            <div>
                                              <span className="text-white font-medium block">
                                                Freeze / Hold on this Frame (Static Visual View)
                                              </span>
                                              <span className="text-[10px] text-neutral-400 block">
                                                {isPaused
                                                  ? 'Sprite holds this frame permanently without advancing (perfect for randomized visual props, statues, different item variants).'
                                                  : 'Jumps directly to this frame and continues normal continuous playback.'}
                                              </span>
                                            </div>
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Camera Action Config */}
                                  {action.actionType === 'camera' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Camera Mode</label>
                                        <select
                                          value={action.cameraMode || 'track_self'}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, cameraMode: e.target.value as any } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        >
                                          <option value="track_self">Track This Prefab</option>
                                          <option value="look_ahead">Look Ahead Offset</option>
                                          <option value="shake">Screen Shake</option>
                                          <option value="fixed">Fixed Point</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Camera Zoom</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={action.cameraZoom ?? 1.0}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, cameraZoom: Number(e.target.value) } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Look Ahead X (px)</label>
                                        <input
                                          type="number"
                                          value={action.cameraLookAheadX ?? 24}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, cameraLookAheadX: Number(e.target.value) } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Smoothing Damping</label>
                                        <input
                                          type="number"
                                          step="0.05"
                                          value={action.cameraSmoothing ?? 0.15}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, cameraSmoothing: Number(e.target.value) } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Manual Kinematic Move Action Config */}
                                  {action.actionType === 'move' && (
                                    <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-amber-950/60 text-xs">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        <div>
                                          <label className="text-[10px] text-amber-400 font-bold block"> Kinematic Move Mode</label>
                                          <select
                                            value={action.moveMode || 'move_right'}
                                            onChange={(e) => {
                                              updateCharacter(c => ({
                                                ...c,
                                                rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, moveMode: e.target.value as any } : a) } : r)
                                              }));
                                            }}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                          >
                                            <option value="move_left">Left️ Move Left (Vx = -Speed)</option>
                                            <option value="move_right">Right️ Move Right (Vx = +Speed)</option>
                                            <option value="move_up">Up️ Move Up / Ascend (Vy = -Speed)</option>
                                            <option value="move_down">Down️ Move Down / Fast Fall (Vy = +Speed)</option>
                                            <option value="move_forward">{" >> "} Move Forward (Facing Direction)</option>
                                            <option value="move_backward">{" << "} Move Backward (Opposite Facing)</option>
                                            <option value="move_angle">🧭 Move at Angle (Direction Vector)</option>
                                            <option value="set_velocity">🎯 Set Velocity (Direct Vx, Vy)</option>
                                            <option value="add_velocity">📈 Add Velocity Impulse (ΔVx, ΔVy)</option>
                                            <option value="stop">[Stop] Stop / Brake (Zero All Velocity)</option>
                                            <option value="stop_x">⏹️ Stop Horizontal Only (Zero Vx)</option>
                                            <option value="stop_y">⏹️ Stop Vertical Only (Zero Vy)</option>
                                            <option value="crouch">🧘 Duck / Crouch (Modify Capsule & Halt)</option>
                                          </select>
                                        </div>

                                        {/* Speed Source (For directional/angle moves) */}
                                        {action.moveMode !== 'stop' && action.moveMode !== 'stop_x' && action.moveMode !== 'stop_y' && action.moveMode !== 'crouch' && action.moveMode !== 'set_velocity' && action.moveMode !== 'add_velocity' && (
                                          <>
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Speed Value Source</label>
                                              <select
                                                value={action.speedSource || 'fixed'}
                                                onChange={(e) => {
                                                  const src = e.target.value as 'fixed' | 'variable';
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speedSource: src, speedVariableId: src === 'variable' ? (a.speedVariableId || variablesList[0]?.id) : undefined } : a) } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-emerald-400 font-mono mt-1"
                                              >
                                                <option value="fixed"> Constant Number</option>
                                                <option value="variable">[Var] Prefab Variable</option>
                                              </select>
                                            </div>

                                            <div>
                                              {action.speedSource === 'variable' ? (
                                                <div>
                                                  <label className="text-[10px] text-neutral-400 font-bold block">Speed Variable (Prefab or Local)</label>
                                                  <select
                                                    value={action.speedVariableId || ''}
                                                    onChange={(e) => {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speedVariableId: e.target.value } : a) } : r)
                                                      }));
                                                    }}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-emerald-300 font-mono mt-1"
                                                  >
                                                    {renderVariableSelectOptions(rule)}
                                                  </select>
                                                </div>
                                              ) : (
                                                <div>
                                                  <label className="text-[10px] text-neutral-400 font-bold block">Speed (px/tick)</label>
                                                  <input
                                                    type="number"
                                                    step="0.1"
                                                    value={action.speed ?? 4.0}
                                                    onChange={(e) => {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speed: Number(e.target.value) } : a) } : r)
                                                      }));
                                                    }}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}

                                        {/* Set Facing */}
                                        {action.moveMode !== 'stop' && action.moveMode !== 'stop_x' && action.moveMode !== 'stop_y' && (
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Facing Direction</label>
                                            <select
                                              value={action.setFacing || 'match_movement'}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, setFacing: e.target.value as any } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="match_movement">🔄 Match Movement Vector</option>
                                              <option value="none">🔒 Keep Current Facing</option>
                                              <option value="left">Left️ Force Left</option>
                                              <option value="right">Right️ Force Right</option>
                                              <option value="reverse">🔄 Invert / Flip Facing</option>
                                            </select>
                                          </div>
                                        )}
                                      </div>

                                      {/* Specific Angle Settings */}
                                      {action.moveMode === 'move_angle' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                                          <div>
                                            <label className="text-[10px] text-amber-400 font-bold block">Angle (0deg = Right, 90deg = Down, 180deg = Left, 270deg = Up)</label>
                                            <input
                                              type="number"
                                              min={0}
                                              max={360}
                                              value={action.angleDeg ?? 0}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, angleDeg: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 items-end">
                                            {[
                                              { label: 'Right️ 0deg', deg: 0 },
                                              { label: '↘️ 45deg', deg: 45 },
                                              { label: 'Down️ 90deg', deg: 90 },
                                              { label: '↙️ 135deg', deg: 135 },
                                              { label: 'Left️ 180deg', deg: 180 },
                                              { label: '↖️ 225deg', deg: 225 },
                                              { label: 'Up️ 270deg', deg: 270 },
                                              { label: '↗️ 315deg', deg: 315 }
                                            ].map(preset => (
                                              <button
                                                key={preset.deg}
                                                type="button"
                                                onClick={() => {
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, angleDeg: preset.deg } : a) } : r)
                                                  }));
                                                }}
                                                className={`px-2 py-1 rounded text-[10px] font-mono border transition ${action.angleDeg === preset.deg ? 'bg-amber-900/60 border-amber-600 text-amber-200' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'}`}
                                              >
                                                {preset.label}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Direct Velocity Settings */}
                                      {(action.moveMode === 'set_velocity' || action.moveMode === 'add_velocity') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                                          <div>
                                            <label className="text-[10px] text-amber-400 font-bold block">{action.moveMode === 'set_velocity' ? 'Set Velocity X (px/tick)' : 'Add Impulse X (ΔVx)'}</label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={action.velocityX ?? 0}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, velocityX: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-amber-400 font-bold block">{action.moveMode === 'set_velocity' ? 'Set Velocity Y (px/tick)' : 'Add Impulse Y (ΔVy)'}</label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={action.velocityY ?? 0}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, velocityY: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Crouch / Duck Settings */}
                                      {action.moveMode === 'crouch' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                                          <div>
                                            <label className="text-[10px] text-amber-400 font-bold block">Capsule Height Multiplier</label>
                                            <select
                                              value={action.capsuleHeightMultiplier ?? 0.5}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, capsuleHeightMultiplier: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                            >
                                              <option value="0.75">0.75x (Slight Duck)</option>
                                              <option value="0.5">0.50x (Standard Crouch)</option>
                                              <option value="0.33">0.33x (Low Crawl)</option>
                                            </select>
                                          </div>
                                          <div className="text-[10px] text-neutral-400 flex items-center pt-3">
                                            <span>Halts horizontal movement and contracts the physics collision capsule down.</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* AI & Automation Action Config */}
                                  {action.actionType === 'ai_action' && (
                                    <div className="space-y-3 bg-neutral-950/70 p-3 rounded-xl border border-indigo-950/60 text-xs">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                          <label className="text-[10px] text-indigo-400 font-bold block">🤖 AI Routine / Automation</label>
                                          <select
                                            value={action.aiMode || 'ground_patrol'}
                                            onChange={(e) => {
                                              updateCharacter(c => ({
                                                ...c,
                                                rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, aiMode: e.target.value as any } : a) } : r)
                                              }));
                                            }}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                          >
                                            <option value="ground_patrol">[Shield] Ground Ledge Patrol (Auto Turn)</option>
                                            <option value="towards_target">🎯 Chase Target (Pursue Target)</option>
                                            <option value="away_from_target"> Flee Threat (Flee Target)</option>
                                            <option value="flight_sine">🌊 Flying Sine Wave (Aerial Patrol)</option>
                                            <option value="wander">🎲 Random Roam / Wander</option>
                                            <option value="circle_target">🔄 Orbit / Circle Target</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-[10px] text-neutral-400 font-bold block">Speed Value Source</label>
                                          <select
                                            value={action.speedSource || 'fixed'}
                                            onChange={(e) => {
                                              const src = e.target.value as 'fixed' | 'variable';
                                              updateCharacter(c => ({
                                                ...c,
                                                rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speedSource: src, speedVariableId: src === 'variable' ? (a.speedVariableId || variablesList[0]?.id) : undefined } : a) } : r)
                                              }));
                                            }}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-emerald-400 font-mono mt-1"
                                          >
                                            <option value="fixed"> Constant Number</option>
                                            <option value="variable">[Var] Prefab Variable</option>
                                          </select>
                                        </div>

                                        <div>
                                          {action.speedSource === 'variable' ? (
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Prefab Variable</label>
                                              <select
                                                value={action.speedVariableId || variablesList[0]?.id || ''}
                                                onChange={(e) => {
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speedVariableId: e.target.value } : a) } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-emerald-300 font-mono mt-1"
                                              >
                                                {variablesList.length === 0 ? (
                                                  <option value="">No Variables Defined</option>
                                                ) : (
                                                  variablesList.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                      {v.name} ({v.id}) = {String(char.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue ?? 0)}
                                                    </option>
                                                  ))
                                                )}
                                              </select>
                                            </div>
                                          ) : (
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block">Speed (px/tick)</label>
                                              <input
                                                type="number"
                                                step="0.1"
                                                value={action.speed ?? 3.5}
                                                onChange={(e) => {
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, speed: Number(e.target.value) } : a) } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-white font-mono mt-1"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Extra parameters for Sine Wave */}
                                      {action.aiMode === 'flight_sine' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                                          <div>
                                            <label className="text-[10px] text-indigo-400 font-bold block">Wave Frequency (Cycles/tick)</label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={action.sineFrequency ?? 0.05}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, sineFrequency: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-indigo-400 font-bold block">Wave Amplitude (Vertical px)</label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={action.sineAmplitude ?? 3.0}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, sineAmplitude: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Hero Impulse Config */}
                                  {action.actionType === 'hero_impulse' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Impulse Type</label>
                                        <select
                                          value={action.impulseType || 'jump'}
                                          onChange={(e) => {
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, impulseType: e.target.value as any } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                        >
                                          <option value="jump">Jump Impulse (Upward)</option>
                                          <option value="dash">Dash Evade (Horizontal)</option>
                                          <option value="wall_jump">Wall Kick Jump</option>
                                          <option value="knockback">Knockback Stagger</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Force Value Source</label>
                                        <select
                                          value={action.forceSource || 'fixed'}
                                          onChange={(e) => {
                                            const src = e.target.value as 'fixed' | 'variable';
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, forceSource: src, forceVariableId: src === 'variable' ? (a.forceVariableId || variablesList[0]?.id) : undefined } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-cyan-400 font-mono mt-1"
                                        >
                                          <option value="fixed"> Constant Force</option>
                                          <option value="variable">[Var] Prefab Variable (e.g. jump_force)</option>
                                        </select>
                                      </div>

                                      <div>
                                        {action.forceSource === 'variable' ? (
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Impulse Variable (Prefab or Local)</label>
                                            <select
                                              value={action.forceVariableId || ''}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, forceVariableId: e.target.value } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-cyan-300 font-mono mt-1"
                                            >
                                              {renderVariableSelectOptions(rule)}
                                            </select>
                                          </div>
                                        ) : (
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Impulse Force (px/tick)</label>
                                            <input
                                              type="number"
                                              value={action.force ?? 12.0}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, force: Number(e.target.value) } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Override Biome Gravity Action */}
                                  {action.actionType === 'set_gravity' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Gravity Override Mode</label>
                                        <select
                                          value={action.gravityMode || 'zero_g'}
                                          onChange={(e) => {
                                            const mode = e.target.value as any;
                                            let scale = 0.0;
                                            if (mode === 'zero_g') scale = 0.0;
                                            else if (mode === 'low_g') scale = 0.3;
                                            else if (mode === 'normal') scale = 1.0;
                                            else if (mode === 'heavy_g') scale = 1.8;
                                            else if (mode === 'inverted') scale = -1.0;
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, gravityMode: mode, gravityScale: scale } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-amber-300 font-semibold mt-1"
                                        >
                                          <option value="zero_g">🌌 Weightless / Zero-G (0.0x)</option>
                                          <option value="low_g">🌙 Low Gravity (0.3x)</option>
                                          <option value="normal">[World] Standard Gravity (1.0x)</option>
                                          <option value="heavy_g">🏋️ Heavy Gravity (1.8x)</option>
                                          <option value="inverted">🔄 Inverted Gravity (-1.0x)</option>
                                          <option value="custom">[Config]️ Custom Scale Value</option>
                                          <option value="reset_to_biome">🔄 Revert / Reset to Biome</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-neutral-400 font-bold block">Gravity Source</label>
                                        <select
                                          value={action.gravitySource || 'fixed'}
                                          onChange={(e) => {
                                            const src = e.target.value as 'fixed' | 'variable';
                                            updateCharacter(c => ({
                                              ...c,
                                              rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, gravitySource: src, gravityVariableId: src === 'variable' ? (a.gravityVariableId || variablesList[0]?.id) : undefined } : a) } : r)
                                            }));
                                          }}
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-amber-400 font-mono mt-1"
                                        >
                                          <option value="fixed"> Preset / Fixed Value</option>
                                          <option value="variable">[Var] Prefab / Local Variable</option>
                                        </select>
                                      </div>

                                      <div>
                                        {action.gravitySource === 'variable' ? (
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Gravity Variable</label>
                                            <select
                                              value={action.gravityVariableId || ''}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, gravityVariableId: e.target.value } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-amber-300 font-mono mt-1"
                                            >
                                              {renderVariableSelectOptions(rule)}
                                            </select>
                                          </div>
                                        ) : (
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block">Gravity Multiplier</label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={action.gravityScale ?? (action.gravityMode === 'zero_g' ? 0 : 1.0)}
                                              onChange={(e) => {
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? { ...r, actions: (r.actions || []).map(a => a.id === action.id ? { ...a, gravityScale: Number(e.target.value), gravityMode: 'custom' } : a) } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                                                    {/* Set Allowed Traversal Angle Action */}
                                  {action.actionType === 'set_traversal_angle' && (() => {
                                    const currentAngle = action.traversalAngleDeg ?? 45;
                                    const currentSource = action.traversalAngleSource || 'fixed';
                                    const currentBehavior = action.steepSlopeBehavior || 'block';

                                    return (
                                      <div className="space-y-3 pt-1">
                                        {/* Live Incline Angle & Status Gauge Header */}
                                        <div className="p-3 bg-neutral-950 border border-emerald-500/30 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                <Compass size={16} />
                                              </div>
                                              <div>
                                                <span className="text-xs font-bold text-emerald-300">Allowed Slope Traversal Angle</span>
                                                <p className="text-[10px] text-neutral-400">Maximum climbable ground incline angle in degrees</p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-sm font-bold font-mono text-emerald-400">{currentAngle}deg</span>
                                              <span className="block text-[9px] text-neutral-400 font-mono">
                                                {currentAngle === 0 ? 'Flat ground only' : currentAngle <= 30 ? 'Gentle slopes' : currentAngle <= 45 ? 'Standard 45deg slopes' : currentAngle <= 60 ? 'Steep 60deg slopes' : currentAngle < 90 ? 'High incline scramble' : 'Full 90deg vertical climb'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Incline Wedge SVG Gauge */}
                                          <div className="flex items-center justify-center py-1">
                                            <svg width="180" height="70" viewBox="0 0 180 70" className="overflow-visible">
                                              <path d="M 20 60 A 60 60 0 0 1 140 60" fill="none" stroke="#262626" strokeWidth="6" strokeLinecap="round" />
                                              {(() => {
                                                const clamped = Math.min(90, Math.max(0, currentAngle));
                                                const rad = (clamped * Math.PI) / 180;
                                                const endX = 80 + Math.cos(Math.PI - rad) * 60;
                                                const endY = 60 - Math.sin(rad) * 60;
                                                const d = 'M 80 60 L 140 60 A 60 60 0 0 0 ' + endX + ' ' + endY + ' Z';
                                                return (
                                                  <path d={d} fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2" />
                                                );
                                              })()}
                                              {(() => {
                                                const clamped = Math.min(90, Math.max(0, currentAngle));
                                                const rad = (clamped * Math.PI) / 180;
                                                const endX = 80 + Math.cos(Math.PI - rad) * 62;
                                                const endY = 60 - Math.sin(rad) * 62;
                                                return (
                                                  <line x1="80" y1="60" x2={endX} y2={endY} stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                                                );
                                              })()}
                                              <line x1="10" y1="60" x2="150" y2="60" stroke="#525252" strokeWidth="1.5" strokeDasharray="3,3" />
                                              <circle cx="80" cy="60" r="4" fill="#10b981" />
                                              <text x="145" y="64" fill="#a3a3a3" fontSize="9" fontFamily="monospace">0deg</text>
                                              <text x="75" y="10" fill="#a3a3a3" fontSize="9" fontFamily="monospace">90deg</text>
                                              <text x="125" y="24" fill="#a3a3a3" fontSize="8" fontFamily="monospace">45deg</text>
                                            </svg>
                                          </div>
                                        </div>

                                        {/* Quick Angle Presets */}
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-neutral-400 font-bold block">Quick Traversal Presets</label>
                                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                            {[
                                              { label: '0deg Flat', angle: 0, desc: 'Flat only' },
                                              { label: '30deg Gentle', angle: 30, desc: 'Gentle incline' },
                                              { label: '45deg Std', angle: 45, desc: 'Standard 1:1' },
                                              { label: '60deg Steep', angle: 60, desc: 'Steep incline' },
                                              { label: '75deg Peak', angle: 75, desc: 'High scramble' },
                                              { label: '90deg Climb', angle: 90, desc: 'Vertical climb' },
                                            ].map(preset => (
                                              <button
                                                key={preset.angle}
                                                type="button"
                                                onClick={() => {
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? {
                                                        ...a,
                                                        traversalAngleDeg: preset.angle,
                                                        traversalAngleSource: 'fixed'
                                                      } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className={`px-2 py-1.5 rounded-lg border text-center transition ${currentAngle === preset.angle && currentSource === "fixed" ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-sm" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"}`}
                                              >
                                                <span className="block font-mono text-xs">{preset.label}</span>
                                                <span className="block text-[8px] text-neutral-500 truncate">{preset.desc}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Degree Input & Variable Source Config */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <label className="text-[10px] text-neutral-400 font-bold block">Angle Source</label>
                                              <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? {
                                                          ...a,
                                                          traversalAngleSource: 'fixed'
                                                        } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded ${currentSource === "fixed" ? "bg-emerald-600 text-white font-bold" : "hover:text-white"}`}
                                                >
                                                  Fixed
                                                </button>
                                                <span>|</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? {
                                                          ...a,
                                                          traversalAngleSource: 'variable',
                                                          traversalAngleVariableId: a.traversalAngleVariableId || variablesList[0]?.id
                                                        } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded ${currentSource === "variable" ? "bg-emerald-600 text-white font-bold" : "hover:text-white"}`}
                                                >
                                                  Variable
                                                </button>
                                              </div>
                                            </div>

                                            {currentSource === 'fixed' ? (
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="range"
                                                    min={0}
                                                    max={90}
                                                    step={1}
                                                    value={currentAngle}
                                                    onChange={(e) => {
                                                      const val = Number(e.target.value);
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, traversalAngleDeg: val } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className="flex-1 accent-emerald-500"
                                                  />
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    max={90}
                                                    value={currentAngle}
                                                    onChange={(e) => {
                                                      const val = Math.max(0, Math.min(90, Number(e.target.value)));
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, traversalAngleDeg: val } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className="w-16 bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded px-2 py-1 text-white font-mono text-xs text-center"
                                                  />
                                                  <span className="text-neutral-400 font-mono text-xs">deg</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <div>
                                                <select
                                                  value={action.traversalAngleVariableId || ''}
                                                  onChange={(e) => {
                                                    const varId = e.target.value;
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? { ...a, traversalAngleVariableId: varId } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-emerald-300 font-mono"
                                                >
                                                  {renderVariableSelectOptions(rule)}
                                                </select>
                                              </div>
                                            )}
                                          </div>

                                          {/* Steep Slope Behavior */}
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                                              Steep Slope Incline Behavior (When Exceeding Angle)
                                            </label>
                                            <select
                                              value={currentBehavior}
                                              onChange={(e) => {
                                                const beh = e.target.value as any;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? { ...a, steepSlopeBehavior: beh } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                                            >
                                              <option value="block">[Stop] Wall Obstruction (Treat as Solid Wall)</option>
                                              <option value="slide_down">️ Slide Downhill (Slide on Steep Slopes)</option>
                                              <option value="slow_down">🐢 Slow Incline Struggle (Traverse at 35% Speed)</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Advanced Traversal Settings */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-neutral-800/60">
                                          {currentBehavior === 'slide_down' && (
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                                                Downhill Slide Speed (px/frame)
                                              </label>
                                              <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                step="0.5"
                                                value={action.steepSlideSpeed ?? 3.5}
                                                onChange={(e) => {
                                                  const val = Number(e.target.value);
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? { ...a, steepSlideSpeed: val } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono"
                                              />
                                            </div>
                                          )}

                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                                              Ceiling Incline Traversal
                                            </label>
                                            <label className="flex items-center gap-2 p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={action.allowCeilingTraversal ?? false}
                                                onChange={(e) => {
                                                  const chk = e.target.checked;
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? { ...a, allowCeilingTraversal: chk } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="rounded text-emerald-500 focus:ring-emerald-400"
                                              />
                                              <span className="text-neutral-300 text-xs">Allow traversing underside ceiling slopes</span>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

{/* Math Operation / Variable Modify Config */}
                                  {(action.actionType === 'math_operation' || action.actionType === 'variable_modify') && (() => {
                                    const currentScope = action.variableScope || (action.variableId?.startsWith('local_') || action.variableId?.startsWith('local.') || action.localVariableName ? 'local' : 'prefab');
                                    const targetVarId = action.variableId || (currentScope === 'local' ? (action.localVariableName || 'run_speed') : (variablesList[0]?.id || ''));
                                    const currentOp = action.mathOp || action.variableOp || 'multiply';
                                    const operandASource = action.operandASource || (action.operandAVariableId ? 'variable' : (action.actionType === 'variable_modify' ? 'variable' : 'variable'));
                                    const operandBSource = action.operandBSource || (action.operandBVariableId ? 'variable' : 'constant');
                                    const isUnary = ['abs', 'round', 'floor', 'ceil', 'negate', 'toggle', 'set'].includes(currentOp);
                                    const isClamp = currentOp === 'clamp';
                                    const isLerp = currentOp === 'lerp';

                                    // Helper for live preview calculations
                                    const getVarVal = (varId?: string, fallback = 0) => {
                                      if (!varId) return fallback;
                                      const lv = rule.localVariables?.find(v => v.id === varId || v.name === varId);
                                      if (lv) return Number(lv.defaultValue ?? 0);
                                      const pv = char.variables?.find(v => v.id === varId || v.name === varId);
                                      if (pv) return Number(char.behaviorVariables?.[pv.id] ?? pv.value ?? pv.defaultValue ?? 0);
                                      return fallback;
                                    };

                                    const valA = operandASource === 'variable' 
                                      ? getVarVal(action.operandAVariableId || targetVarId, 4.0) 
                                      : Number(action.operandAConstant ?? (action.actionType === 'variable_modify' ? getVarVal(targetVarId, 4.0) : 4.0));

                                    const valB = operandBSource === 'variable'
                                      ? getVarVal(action.operandBVariableId, 1.5)
                                      : Number(action.operandBConstant ?? (action.variableValue ?? 1.5));

                                    let computedResult: any = valA;
                                    let formulaStr = '';
                                    if (currentOp === 'multiply') {
                                      computedResult = valA * valB;
                                      formulaStr = `${valA} × ${valB}`;
                                    } else if (currentOp === 'add') {
                                      computedResult = valA + valB;
                                      formulaStr = `${valA} + ${valB}`;
                                    } else if (currentOp === 'subtract') {
                                      computedResult = valA - valB;
                                      formulaStr = `${valA} - ${valB}`;
                                    } else if (currentOp === 'divide') {
                                      computedResult = valB !== 0 ? valA / valB : 0;
                                      formulaStr = `${valA} ÷ ${valB}`;
                                    } else if (currentOp === 'modulo') {
                                      computedResult = valB !== 0 ? valA % valB : 0;
                                      formulaStr = `${valA} % ${valB}`;
                                    } else if (currentOp === 'power') {
                                      computedResult = Math.pow(valA, valB);
                                      formulaStr = `${valA} ^ ${valB}`;
                                    } else if (currentOp === 'min') {
                                      computedResult = Math.min(valA, valB);
                                      formulaStr = `min(${valA}, ${valB})`;
                                    } else if (currentOp === 'max') {
                                      computedResult = Math.max(valA, valB);
                                      formulaStr = `max(${valA}, ${valB})`;
                                    } else if (currentOp === 'clamp') {
                                      const cMin = Number(action.clampMin ?? 0);
                                      const cMax = Number(action.clampMax ?? 10);
                                      computedResult = Math.max(cMin, Math.min(cMax, valA));
                                      formulaStr = `clamp(${valA}, min=${cMin}, max=${cMax})`;
                                    } else if (currentOp === 'abs') {
                                      computedResult = Math.abs(valA);
                                      formulaStr = `|${valA}|`;
                                    } else if (currentOp === 'round') {
                                      computedResult = Math.round(valA);
                                      formulaStr = `round(${valA})`;
                                    } else if (currentOp === 'floor') {
                                      computedResult = Math.floor(valA);
                                      formulaStr = `floor(${valA})`;
                                    } else if (currentOp === 'ceil') {
                                      computedResult = Math.ceil(valA);
                                      formulaStr = `ceil(${valA})`;
                                    } else if (currentOp === 'negate') {
                                      computedResult = -valA;
                                      formulaStr = `-${valA}`;
                                    } else if (currentOp === 'lerp') {
                                      const t = Number(action.lerpFactorT ?? 0.5);
                                      computedResult = valA + (valB - valA) * t;
                                      formulaStr = `lerp(${valA} -> ${valB}, t=${t})`;
                                    } else if (currentOp === 'random_range') {
                                      formulaStr = `random(${valA} .. ${valB})`;
                                      computedResult = valA + (valB - valA) * 0.5;
                                    } else if (currentOp === 'set') {
                                      computedResult = valA;
                                      formulaStr = `${valA}`;
                                    } else if (currentOp === 'toggle') {
                                      formulaStr = `toggle`;
                                      computedResult = 'true/false';
                                    }

                                    const targetName = currentScope === 'local' 
                                      ? (action.localVariableName || targetVarId || 'local_var')
                                      : (char.variables?.find(v => v.id === targetVarId)?.name || targetVarId);

                                    return (
                                      <div className="p-3 bg-neutral-950/90 border border-neutral-800 rounded-xl space-y-3">
                                        {/* Scope and Target Variable Header */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {/* Variable Scope Selection */}
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                                              Target Variable Scope
                                            </label>
                                            <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const defaultLocalName = action.localVariableName || (rule.localVariables?.[0]?.name || 'run_speed');
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? {
                                                        ...a,
                                                        variableScope: 'local',
                                                        localVariableName: defaultLocalName,
                                                        variableId: defaultLocalName
                                                      } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${
                                                  currentScope === 'local' 
                                                    ? 'bg-amber-600 text-white shadow-sm' 
                                                    : 'text-neutral-400 hover:text-neutral-200'
                                                }`}
                                              >
                                                <Sparkles size={12} />
                                                <span>[Local] Local Var</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const defaultPrefabId = variablesList[0]?.id || '';
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? {
                                                        ...a,
                                                        variableScope: 'prefab',
                                                        variableId: defaultPrefabId,
                                                        localVariableName: undefined
                                                      } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${
                                                  currentScope === 'prefab' 
                                                    ? 'bg-cyan-600 text-white shadow-sm' 
                                                    : 'text-neutral-400 hover:text-neutral-200'
                                                }`}
                                              >
                                                <Database size={12} />
                                                <span>[Var] Prefab Var</span>
                                              </button>
                                            </div>
                                          </div>

                                          {/* Target Variable Identifier */}
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <label className="text-[10px] text-neutral-400 font-bold block">
                                                {currentScope === 'local' ? '[Local] Local Variable Name' : '[Var] Prefab Target Variable'}
                                              </label>
                                              {currentScope === 'local' && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const nameToAdd = action.localVariableName || 'run_speed';
                                                    if (!rule.localVariables?.some(v => v.name === nameToAdd || v.id === nameToAdd)) {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          localVariables: [...(r.localVariables || []), { id: nameToAdd, name: nameToAdd, defaultValue: 0, type: 'number' }]
                                                        } : r)
                                                      }));
                                                    }
                                                  }}
                                                  className="text-[10px] text-amber-400 hover:underline font-mono"
                                                >
                                                  + Register to Rule
                                                </button>
                                              )}
                                            </div>

                                            {currentScope === 'local' ? (
                                              <div className="flex items-center gap-1.5">
                                                <input
                                                  type="text"
                                                  placeholder="e.g. run_speed, jump_boost"
                                                  value={action.localVariableName || action.variableId || ''}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? {
                                                          ...a,
                                                          variableScope: 'local',
                                                          localVariableName: val,
                                                          variableId: val
                                                        } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded px-2.5 py-1.5 text-amber-300 font-mono text-xs"
                                                />
                                                {rule.localVariables && rule.localVariables.length > 0 && (
                                                  <select
                                                    value={action.localVariableName || action.variableId || ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? {
                                                            ...a,
                                                            variableScope: 'local',
                                                            localVariableName: val,
                                                            variableId: val
                                                          } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-neutral-400 text-xs"
                                                    title="Pick existing local variable"
                                                  >
                                                    <option value="" disabled>Existing Local Vars</option>
                                                    {rule.localVariables.map(lv => (
                                                      <option key={lv.id} value={lv.name || lv.id}>[Local] {lv.name || lv.id}</option>
                                                    ))}
                                                  </select>
                                                )}
                                              </div>
                                            ) : (
                                              <select
                                                value={action.variableId || variablesList[0]?.id || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? {
                                                        ...a,
                                                        variableScope: 'prefab',
                                                        variableId: val,
                                                        localVariableName: undefined
                                                      } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-500 rounded px-2.5 py-1.5 text-cyan-300 font-mono text-xs"
                                              >
                                                {variablesList.length === 0 && (
                                                  <option value="">No variables defined. Create them in Variables Tab!</option>
                                                )}
                                                {variablesList.map(v => (
                                                  <option key={v.id} value={v.id}>
                                                    [Var] {v.name || v.id}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        </div>

                                        {/* Operator & Math Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                          {/* Operator Select */}
                                          <div>
                                            <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                                              Mathematical Operation / Method
                                            </label>
                                            <select
                                              value={currentOp}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? {
                                                      ...a,
                                                      [action.actionType === 'variable_modify' ? 'variableOp' : 'mathOp']: val
                                                    } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-500 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                                            >
                                              <option value="set">SET (Direct Assignment)</option>
                                              <option value="add">ADD (Sum)</option>
                                              <option value="subtract">SUBTRACT (Difference)</option>
                                              <option value="multiply">MULTIPLY (Product)</option>
                                              <option value="divide">DIVIDE (Quotient)</option>
                                              <option value="modulo">MODULO (Remainder)</option>
                                              <option value="power">POWER (Exponent)</option>
                                              <option value="min">MIN (Lesser Of)</option>
                                              <option value="max">MAX (Greater Of)</option>
                                              <option value="clamp">CLAMP (Limit Range)</option>
                                              <option value="abs">ABS (Absolute Value)</option>
                                              <option value="round">ROUND (Integer)</option>
                                              <option value="floor">FLOOR (Integer Down)</option>
                                              <option value="ceil">CEIL (Integer Up)</option>
                                              <option value="negate">NEGATE (Invert Sign)</option>
                                              <option value="toggle">TOGGLE (Boolean swap)</option>
                                              <option value="lerp">LERP (Linear Interpolation)</option>
                                              <option value="random_range">RANDOM RANGE (Float)</option>
                                            </select>
                                          </div>

                                          {/* Live Preview Badge */}
                                          <div className="flex flex-col justify-end">
                                            <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded-lg flex items-center justify-between">
                                              <div>
                                                <span className="text-[9px] text-neutral-400 font-bold block uppercase">Live Preview Evaluation</span>
                                                <span className="text-[11px] text-cyan-300 font-mono font-bold">{formulaStr}</span>
                                              </div>
                                              <div className="text-right">
                                                <span className="text-[9px] text-neutral-400 font-bold block uppercase">Result</span>
                                                <span className="text-xs text-emerald-400 font-mono font-bold">
                                                  {typeof computedResult === 'number' ? computedResult.toFixed(2).replace(/\.00$/, '') : String(computedResult)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Operands Configuration */}
                                        {!isUnary && currentOp !== 'toggle' && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-neutral-800/60 pt-2.5">
                                            {/* Operand A (Only for general math_operation) */}
                                            {action.actionType === 'math_operation' && (
                                              <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[10px] text-neutral-400 font-bold">Operand A (Left Hand)</span>
                                                  <div className="flex items-center gap-1.5 bg-neutral-900 p-0.5 rounded border border-neutral-800 text-[9px]">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        updateCharacter(c => ({
                                                          ...c,
                                                          rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                            ...r,
                                                            actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandASource: 'constant' } : a)
                                                          } : r)
                                                        }));
                                                      }}
                                                      className={`px-1.5 py-0.5 rounded transition ${operandASource === 'constant' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                    >
                                                      Constant
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        updateCharacter(c => ({
                                                          ...c,
                                                          rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                            ...r,
                                                            actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandASource: 'variable', operandAVariableId: variablesList[0]?.id || '' } : a)
                                                          } : r)
                                                        }));
                                                      }}
                                                      className={`px-1.5 py-0.5 rounded transition ${operandASource === 'variable' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                    >
                                                      Variable
                                                    </button>
                                                  </div>
                                                </div>

                                                {operandASource === 'variable' ? (
                                                  <select
                                                    value={action.operandAVariableId || ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandAVariableId: val } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                                                  >
                                                    <option value="">-- Pick Variable --</option>
                                                    {variablesList.map(v => (
                                                      <option key={v.id} value={v.id}>[Var] {v.name || v.id}</option>
                                                    ))}
                                                  </select>
                                                ) : (
                                                  <input
                                                    type="number"
                                                    value={action.operandAConstant !== undefined ? action.operandAConstant : 4.0}
                                                    onChange={(e) => {
                                                      const val = parseFloat(e.target.value) || 0;
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandAConstant: val } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                                  />
                                                )}
                                              </div>
                                            )}

                                            {/* Operand B (Right Hand) */}
                                            <div className="space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-neutral-400 font-bold">Operand B (Right Hand)</span>
                                                <div className="flex items-center gap-1.5 bg-neutral-900 p-0.5 rounded border border-neutral-800 text-[9px]">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandBSource: 'constant' } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded transition ${operandBSource === 'constant' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                  >
                                                    Constant
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateCharacter(c => ({
                                                        ...c,
                                                        rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                          ...r,
                                                          actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandBSource: 'variable', operandBVariableId: variablesList[0]?.id || '' } : a)
                                                        } : r)
                                                      }));
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded transition ${operandBSource === 'variable' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                  >
                                                    Variable
                                                  </button>
                                                </div>
                                              </div>

                                              {operandBSource === 'variable' ? (
                                                <select
                                                  value={action.operandBVariableId || ''}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandBVariableId: val } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                                                >
                                                  <option value="">-- Pick Variable --</option>
                                                  {variablesList.map(v => (
                                                    <option key={v.id} value={v.id}>[Var] {v.name || v.id}</option>
                                                  ))}
                                                </select>
                                              ) : (
                                                <input
                                                  type="number"
                                                  value={action.operandBConstant !== undefined ? action.operandBConstant : (action.variableValue !== undefined ? action.variableValue : 1.5)}
                                                  onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    updateCharacter(c => ({
                                                      ...c,
                                                      rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                        ...r,
                                                        actions: (r.actions || []).map(a => a.id === action.id ? { ...a, operandBConstant: val, variableValue: val } : a)
                                                      } : r)
                                                    }));
                                                  }}
                                                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                                />
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Clamp-specific settings */}
                                        {currentOp === 'clamp' && (
                                          <div className="grid grid-cols-2 gap-3 border-t border-neutral-800/60 pt-2.5">
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">Clamp Min Value</label>
                                              <input
                                                type="number"
                                                value={action.clampMin !== undefined ? action.clampMin : 0}
                                                onChange={(e) => {
                                                  const val = parseFloat(e.target.value) || 0;
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? { ...a, clampMin: val } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-neutral-400 font-bold block mb-1">Clamp Max Value</label>
                                              <input
                                                type="number"
                                                value={action.clampMax !== undefined ? action.clampMax : 10}
                                                onChange={(e) => {
                                                  const val = parseFloat(e.target.value) || 0;
                                                  updateCharacter(c => ({
                                                    ...c,
                                                    rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                      ...r,
                                                      actions: (r.actions || []).map(a => a.id === action.id ? { ...a, clampMax: val } : a)
                                                    } : r)
                                                  }));
                                                }}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {/* LERP-specific settings */}
                                        {currentOp === 'lerp' && (
                                          <div className="border-t border-neutral-800/60 pt-2.5">
                                            <div className="flex items-center justify-between mb-1">
                                              <label className="text-[10px] text-neutral-400 font-bold">Lerp Factor (t)</label>
                                              <span className="text-[10px] text-cyan-400 font-mono font-bold">{(action.lerpFactorT !== undefined ? action.lerpFactorT : 0.5).toFixed(2)}</span>
                                            </div>
                                            <input
                                              type="range"
                                              min="0"
                                              max="1"
                                              step="0.05"
                                              value={action.lerpFactorT !== undefined ? action.lerpFactorT : 0.5}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                updateCharacter(c => ({
                                                  ...c,
                                                  rules: (c.rules || []).map(r => r.id === rule.id ? {
                                                    ...r,
                                                    actions: (r.actions || []).map(a => a.id === action.id ? { ...a, lerpFactorT: val } : a)
                                                  } : r)
                                                }));
                                              }}
                                              className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
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
