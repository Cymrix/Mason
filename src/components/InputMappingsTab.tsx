import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Keyboard, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Search, 
  Key, 
  X, 
  Sliders, 
  Sparkles, 
  Check, 
  Radio, 
  Copy,
  Info
} from 'lucide-react';
import { 
  MasonProject, 
  InputMapping, 
  UNIFIED_INPUT_TEMPLATE,
  GameStructureFile
} from '../engine/masonProjectSchema';

interface InputMappingsTabProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject, meta?: { actionLabel?: string }) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface RecordingTarget {
  mappingIdx: number;
  targetType: 'keys' | 'gamepadButtons';
  actionLabel: string;
}

export const InputMappingsTab: React.FC<InputMappingsTabProps> = ({
  project,
  onUpdateProject,
  onShowToast
}) => {
  const gameFiles = project.fileSystem?.game || [];
  const activeFileName = project.activeFiles?.gameStructureFileName || gameFiles[0]?.fileName;
  const currentStructureFile: GameStructureFile | undefined = gameFiles.find(g => g.fileName === activeFileName) || gameFiles[0];

  // Resolve current active input mappings from game structure file, project level, or first UI file, with fallback to UNIFIED_INPUT_TEMPLATE
  const activeUiFile = project.fileSystem?.ui?.find(u => u.fileName === project.activeFiles?.uiFileName) || project.fileSystem?.ui?.[0];
  
  const currentMappings: InputMapping[] = 
    currentStructureFile?.structureData?.inputMappings || 
    project.inputMappings || 
    activeUiFile?.uiConfig?.inputMappings || 
    UNIFIED_INPUT_TEMPLATE;

  const [inputSearchQuery, setInputSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [recordingTarget, setRecordingTarget] = useState<RecordingTarget | null>(null);
  const [recordedValues, setRecordedValues] = useState<string[]>([]);
  const [currentlyHeldKeys, setCurrentlyHeldKeys] = useState<Set<string>>(new Set());

  // Helper updater to save input mappings across game structure and synchronize with project/UI files
  const updateMappings = (newMappings: InputMapping[], actionLabel?: string) => {
    onUpdateProject(p => {
      // 1. Update Game Structure files
      const updatedGameFiles = (p.fileSystem?.game || []).map(g => {
        if (g.fileName === currentStructureFile?.fileName || (!currentStructureFile && g === p.fileSystem?.game?.[0])) {
          return {
            ...g,
            updatedAt: new Date().toISOString(),
            structureData: {
              ...g.structureData,
              inputMappings: newMappings
            }
          };
        }
        return g;
      });

      // 2. Also synchronize to UI files for complete backwards compatibility
      const updatedUiFiles = (p.fileSystem?.ui || []).map(u => ({
        ...u,
        updatedAt: new Date().toISOString(),
        uiConfig: {
          ...u.uiConfig,
          inputMappings: newMappings
        }
      }));

      return {
        ...p,
        inputMappings: newMappings,
        fileSystem: {
          ...p.fileSystem,
          game: updatedGameFiles,
          ui: updatedUiFiles
        }
      };
    }, { actionLabel: actionLabel || 'Update input mappings' });
  };

  // Keyboard and Gamepad Recording Listener
  useEffect(() => {
    if (!recordingTarget) return;

    const heldSet = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Tab', 'Space', 'Enter', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      const keyName = e.code || e.key;
      heldSet.add(keyName);
      setCurrentlyHeldKeys(new Set(heldSet));

      const comboStr = Array.from(heldSet).join(' + ');
      setRecordedValues(prev => {
        if (prev.includes(comboStr)) return prev;
        return [...prev, comboStr];
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyName = e.code || e.key;
      heldSet.delete(keyName);
      setCurrentlyHeldKeys(new Set(heldSet));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gamepad Polling Loop
    let animFrameId: number;
    const GAMEPAD_BUTTON_NAMES: Record<number, string> = {
      0: 'ButtonSouth / A',
      1: 'ButtonEast / B',
      2: 'ButtonWest / X',
      3: 'ButtonNorth / Y',
      4: 'LeftBumper / LB',
      5: 'RightBumper / RB',
      6: 'LeftTrigger / LT',
      7: 'RightTrigger / RT',
      8: 'Select / Back',
      9: 'Start / Pause',
      10: 'LeftStickClick',
      11: 'RightStickClick',
      12: 'DPadUp',
      13: 'DPadDown',
      14: 'DPadLeft',
      15: 'DPadRight'
    };

    const pressedGpSet = new Set<string>();

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads) {
        for (const gp of gamepads) {
          if (gp && gp.buttons) {
            gp.buttons.forEach((btn, idx) => {
              const name = GAMEPAD_BUTTON_NAMES[idx] || `Button_${idx}`;
              if (btn.pressed) {
                if (!pressedGpSet.has(name)) {
                  pressedGpSet.add(name);
                  setRecordedValues(prev => prev.includes(name) ? prev : [...prev, name]);
                }
              } else {
                pressedGpSet.delete(name);
              }
            });
          }
        }
      }
      animFrameId = requestAnimationFrame(pollGamepad);
    };

    animFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameId);
    };
  }, [recordingTarget]);

  // Extract all distinct categories
  const allCategories = Array.from(new Set(['all', 'movement', 'combat', 'interaction', 'navigation', ...currentMappings.map(m => m.category || 'custom')]));

  // Available UI menus for target mapping
  const availableUiScreens = [
    { id: 'pause_menu', label: 'In-Game Pause System Menu' },
    { id: 'initial_menu', label: 'Title / Main Menu Screen' },
    { id: 'menu_inventory', label: 'Inventory & Equipment Screen' },
    { id: 'menu_world_map', label: 'World Map Tracker' },
    { id: 'menu_lore_compendium', label: 'Lore & Beastiary Screen' }
  ];

  const handleAddBinding = () => {
    const newBinding: InputMapping = {
      id: `inp_${Date.now()}`,
      name: `custom_action_${currentMappings.length + 1}`,
      label: 'New Action Binding',
      category: activeCategory !== 'all' ? activeCategory : 'custom',
      triggerMode: 'press',
      actionType: 'gameplay_action',
      keys: ['KeyF'],
      gamepadButtons: ['ButtonSouth / A']
    };
    updateMappings([...currentMappings, newBinding], 'Add input action binding');
    if (onShowToast) onShowToast('Added new input binding', 'success');
  };

  const handleDuplicateBinding = (idx: number) => {
    const source = currentMappings[idx];
    if (!source) return;
    const dupe: InputMapping = {
      ...source,
      id: `inp_${Date.now()}`,
      name: `${source.name}_copy`,
      label: `${source.label} (Copy)`
    };
    const next = [...currentMappings];
    next.splice(idx + 1, 0, dupe);
    updateMappings(next, `Duplicate binding ${source.label}`);
    if (onShowToast) onShowToast(`Duplicated "${source.label}"`, 'info');
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all keyboard and gamepad input mappings to standard Metroidvania defaults?')) return;
    updateMappings([...UNIFIED_INPUT_TEMPLATE], 'Reset input mappings to defaults');
    if (onShowToast) onShowToast('Reset input mappings to default layout', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      
      {/* Top Controls Toolbar */}
      <div className="p-4 bg-neutral-900/90 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Player Input Mappings &amp; Controls Matrix
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentMappings.length} Actions
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure cross-platform keyboard, mouse, and gamepad bindings with customizable interaction modes and UI menu triggers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleAddBinding}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
          >
            <Plus size={14} />
            <span>Add Binding</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            title="Reset to default Metroidvania keyboard & controller layout"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {allCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition shrink-0 ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={inputSearchQuery}
            onChange={(e) => setInputSearchQuery(e.target.value)}
            placeholder="Search action, key, or category..."
            className="w-full bg-neutral-950 border border-neutral-750 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Mappings Table List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-3">
          {currentMappings
            .map((inp, idx) => ({ inp, idx }))
            .filter(({ inp }) => {
              if (activeCategory !== 'all' && (inp.category || '').toLowerCase() !== activeCategory.toLowerCase()) return false;
              if (inputSearchQuery) {
                const q = inputSearchQuery.toLowerCase();
                return (
                  (inp.name || '').toLowerCase().includes(q) || 
                  (inp.label || '').toLowerCase().includes(q) || 
                  (inp.category || '').toLowerCase().includes(q) ||
                  (inp.keys || []).some(k => k.toLowerCase().includes(q)) ||
                  (inp.gamepadButtons || []).some(b => b.toLowerCase().includes(q))
                );
              }
              return true;
            })
            .map(({ inp, idx }) => {
              const isUiTrigger = inp.actionType === 'open_ui';

              return (
                <div
                  key={inp.id || idx}
                  className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3.5 hover:border-neutral-700/80 transition shadow-sm"
                >
                  {/* Top Row: Label, Event Name, Category, Trigger Mode, UI Target */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Display Label */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Display Label</label>
                      <input
                        type="text"
                        value={inp.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], label: val };
                          updateMappings(next);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. Jump / Leap"
                      />
                    </div>

                    {/* Action Identifier Name */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Action Identifier</label>
                      <input
                        type="text"
                        value={inp.name}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], name: val };
                          updateMappings(next);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. jump, pause_menu"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Category</label>
                      <input
                        type="text"
                        value={inp.category || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], category: val };
                          updateMappings(next);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                        placeholder="movement, combat, ui..."
                      />
                    </div>

                    {/* Trigger Mode */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Trigger Mode</label>
                      <select
                        value={inp.triggerMode || 'press'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], triggerMode: val };
                          updateMappings(next);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="press">Press (On Down)</option>
                        <option value="hold">Hold (Continuous)</option>
                        <option value="tap">Tap (Instant Trigger)</option>
                        <option value="release">Release (On Up)</option>
                        <option value="toggle">Toggle (Flip State)</option>
                        <option value="double_tap">Double Tap (Quick Dash)</option>
                        <option value="combo">Combo Sequence</option>
                      </select>
                    </div>

                    {/* Action Target */}
                    <div className="md:col-span-2 flex items-center justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Action Target</label>
                        <select
                          value={inp.actionType || (inp.name === 'pause_menu' || inp.name === 'inventory' || inp.name === 'map_tracker' ? 'open_ui' : 'gameplay_action')}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            const next = [...currentMappings];
                            next[idx] = { 
                              ...next[idx], 
                              actionType: val,
                              targetUiMenuId: val === 'open_ui' ? (next[idx].targetUiMenuId || 'pause_menu') : undefined
                            };
                            updateMappings(next);
                          }}
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-emerald-500 font-medium"
                        >
                          <option value="gameplay_action">⚔️ Gameplay Event</option>
                          <option value="open_ui">🖥️ Open UI / Menu</option>
                        </select>
                      </div>

                      {/* Quick Duplicate & Delete */}
                      <div className="flex items-center gap-1 pt-4">
                        <button
                          type="button"
                          onClick={() => handleDuplicateBinding(idx)}
                          className="p-1.5 text-neutral-500 hover:text-cyan-400 rounded-lg hover:bg-neutral-800 transition"
                          title="Duplicate Binding"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentMappings.filter((_, i) => i !== idx);
                            updateMappings(next, `Delete binding ${inp.label}`);
                            if (onShowToast) onShowToast(`Deleted binding "${inp.label}"`, 'info');
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                          title="Delete Binding"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UI Menu Selector if actionType is open_ui */}
                  {isUiTrigger && (
                    <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <span className="text-amber-200/90 font-medium flex items-center gap-1.5">
                        <Sliders size={13} className="text-amber-400" />
                        Target Screen to Open:
                      </span>
                      <select
                        value={inp.targetUiMenuId || 'pause_menu'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], targetUiMenuId: val };
                          updateMappings(next);
                        }}
                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                      >
                        {availableUiScreens.map(scr => (
                          <option key={scr.id} value={scr.id}>{scr.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Bottom Row: Keyboard Keys & Gamepad Buttons Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-neutral-800/60">
                    {/* Keyboard Bindings */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Keyboard size={13} className="text-emerald-400" />
                          Keyboard Keys
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordedValues(inp.keys || []);
                            setRecordingTarget({
                              mappingIdx: idx,
                              targetType: 'keys',
                              actionLabel: inp.label
                            });
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-1"
                        >
                          <Radio size={10} className="animate-pulse" />
                          <span>Record Keys</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-2 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                        {(inp.keys || []).map((k, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2 py-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono flex items-center gap-1 shadow-sm"
                          >
                            <Key size={10} className="text-emerald-400" />
                            <span>{k}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...currentMappings];
                                next[idx] = {
                                  ...next[idx],
                                  keys: next[idx].keys.filter((_, i) => i !== kIdx)
                                };
                                updateMappings(next);
                              }}
                              className="text-neutral-500 hover:text-red-400 ml-0.5"
                              title="Remove key"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        {(!inp.keys || inp.keys.length === 0) && (
                          <span className="text-[10px] text-neutral-600 italic">No keyboard keys bound</span>
                        )}
                      </div>
                    </div>

                    {/* Gamepad Bindings */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Gamepad2 size={13} className="text-cyan-400" />
                          Gamepad Buttons
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordedValues(inp.gamepadButtons || []);
                            setRecordingTarget({
                              mappingIdx: idx,
                              targetType: 'gamepadButtons',
                              actionLabel: inp.label
                            });
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1"
                        >
                          <Radio size={10} className="animate-pulse" />
                          <span>Record Gamepad</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-2 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                        {(inp.gamepadButtons || []).map((btn, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1 shadow-sm"
                          >
                            <span>{btn}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...currentMappings];
                                next[idx] = {
                                  ...next[idx],
                                  gamepadButtons: (next[idx].gamepadButtons || []).filter((_, i) => i !== bIdx)
                                };
                                updateMappings(next);
                              }}
                              className="text-neutral-500 hover:text-red-400 ml-0.5"
                              title="Remove gamepad button"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        {(!inp.gamepadButtons || inp.gamepadButtons.length === 0) && (
                          <span className="text-[10px] text-neutral-600 italic">No controller buttons bound</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RECORDING MODAL DIALOG */}
      {recordingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                {recordingTarget.targetType === 'keys' ? (
                  <Keyboard size={18} className="text-emerald-400" />
                ) : (
                  <Gamepad2 size={18} className="text-cyan-400" />
                )}
                <span>Record {recordingTarget.targetType === 'keys' ? 'Keyboard Keys' : 'Gamepad Buttons'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecordingTarget(null);
                  setRecordedValues([]);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Press any key or controller button on your keyboard or gamepad for action: <strong className="text-white">{recordingTarget.actionLabel}</strong>.
            </p>

            {/* Currently Pressed Indicator */}
            <div className="p-6 bg-neutral-950 border border-dashed border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <Radio size={24} className="text-emerald-400 animate-pulse" />
              <div className="text-sm font-bold text-white">
                {recordedValues.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {recordedValues.map((v, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono text-xs">
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-500 italic">Listening for input...</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordedValues([])}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-xs font-semibold"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = [...currentMappings];
                  if (next[recordingTarget.mappingIdx]) {
                    if (recordingTarget.targetType === 'keys') {
                      next[recordingTarget.mappingIdx].keys = recordedValues;
                    } else {
                      next[recordingTarget.mappingIdx].gamepadButtons = recordedValues;
                    }
                    updateMappings(next, `Rebound "${recordingTarget.actionLabel}"`);
                    if (onShowToast) onShowToast(`Rebound "${recordingTarget.actionLabel}"`, 'success');
                  }
                  setRecordingTarget(null);
                  setRecordedValues([]);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Save Bindings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
