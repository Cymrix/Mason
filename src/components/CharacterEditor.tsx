import React, { useState, useRef, useEffect } from 'react';
import { 
  MasonProject, 
  CharacterFile, 
  CharacterData, 
  CharacterSocket, 
  AnimationStateConfig,
  SensoryTagID
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  User, 
  Eye, 
  Ear, 
  ShieldAlert, 
  Footprints, 
  Sword, 
  Plus, 
  Trash2, 
  Play, 
  Sliders, 
  Check, 
  Sparkles, 
  Layers, 
  Crosshair, 
  Brain, 
  Shield, 
  Volume2, 
  Tag
} from 'lucide-react';

interface CharacterEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles?: () => void;
}

const DEFAULT_SOCKET_TYPES: { id: SensoryTagID; label: string; icon: string; color: string }[] = [
  { id: 'head_eyes', label: 'Sight Locus (Eyes)', icon: '👁️', color: '#38bdf8' },
  { id: 'head_ears', label: 'Acoustic Hearing (Ears)', icon: '👂', color: '#a855f7' },
  { id: 'torso_center', label: 'Body Hurtbox (Center)', icon: '🎯', color: '#22c55e' },
  { id: 'feet_ground', label: 'Ground Contact (Footsteps)', icon: '🦶', color: '#f59e0b' },
  { id: 'hand_weapon', label: 'Weapon Origin (Hand)', icon: '⚔️', color: '#ef4444' },
  { id: 'back_weakspot', label: 'Flank Weakspot', icon: '🎯', color: '#ec4899' }
];

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  project,
  onUpdateProject
}) => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'sockets' | 'animations' | 'linkage'>('visuals');
  const [selectedSocketId, setSelectedSocketId] = useState<string>('head_eyes');
  const [previewAnimIndex, setPreviewAnimIndex] = useState<number>(0);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // Ensure character files array
  const charFiles = project.fileSystem.characters || [];
  const activeFileName = project.activeFiles.characterFileName || charFiles[0]?.fileName || '';
  const currentFile = charFiles.find(c => c.fileName === activeFileName) || charFiles[0] || {
    id: 'char_default',
    name: 'Korrath Steelhand',
    fileName: 'korrath.character',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterData: {
      id: 'char_korrath',
      name: 'Korrath Steelhand',
      characterType: 'player_hero',
      avatarIcon: '🛡️',
      spriteWidth: 64,
      spriteHeight: 64,
      tintColor: '#06b6d4',
      baseScale: 1.0,
      sockets: [
        { tagId: 'head_eyes', label: 'Sight Locus (Eyes)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
        { tagId: 'head_ears', label: 'Acoustic Hearing (Ears)', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
        { tagId: 'torso_center', label: 'Body Hurtbox (Center)', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
        { tagId: 'feet_ground', label: 'Ground Contact (Footsteps)', offsetX: 0, offsetY: 26, visualMarkerColor: '#f59e0b' },
        { tagId: 'hand_weapon', label: 'Weapon Origin (Hand)', offsetX: 18, offsetY: 2, visualMarkerColor: '#ef4444' }
      ],
      animations: [
        { stateId: 'idle', label: 'Idle Stance', frameCount: 4, frameRateFps: 8, loop: true, spriteRow: 0 },
        { stateId: 'walk', label: 'Walk Cycle', frameCount: 8, frameRateFps: 12, loop: true, spriteRow: 1 },
        { stateId: 'run', label: 'Sprint Dash', frameCount: 6, frameRateFps: 16, loop: true, spriteRow: 2 },
        { stateId: 'attack', label: 'Blade Slash', frameCount: 5, frameRateFps: 18, loop: false, spriteRow: 3 }
      ]
    } as CharacterData
  };

  const char = currentFile.characterData;

  const updateCharacter = (updater: (prev: CharacterData) => CharacterData) => {
    onUpdateProject(p => {
      const existing = p.fileSystem.characters || [];
      const updated = existing.map(c => {
        if (c.fileName === currentFile.fileName) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            characterData: updater(c.characterData)
          };
        }
        return c;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, characters: updated }
      };
    });
  };

  // Sprite & Socket Preview Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2 + 10;

    ctx.clearRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Ground line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, centerY + 32);
    ctx.lineTo(w - 20, centerY + 32);
    ctx.stroke();

    // Draw Character Body Mockup
    const bodyW = (char.spriteWidth || 64) * (char.baseScale || 1.0) * 0.7;
    const bodyH = (char.spriteHeight || 64) * (char.baseScale || 1.0) * 0.9;

    ctx.fillStyle = char.tintColor || '#06b6d4';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(centerX - bodyW / 2, centerY - bodyH / 2, bodyW, bodyH, 12);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY - bodyH / 2 + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    // Draw Sensory Sockets / Tag Markers
    (char.sockets || []).forEach(sock => {
      const sx = centerX + sock.offsetX;
      const sy = centerY + sock.offsetY;
      const isSelected = sock.tagId === selectedSocketId;

      ctx.fillStyle = sock.visualMarkerColor || '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : '#000000';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      // Connector line to center
      if (isSelected) {
        ctx.strokeStyle = sock.visualMarkerColor || '#38bdf8';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Tag Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(sock.tagId, sx + 10, sy + 3);
    });

  }, [char, selectedSocketId]);

  // Animation preview frame ticker
  useEffect(() => {
    if (!isPlayingAnim) return;
    const activeAnim = char.animations[previewAnimIndex] || char.animations[0];
    if (!activeAnim || activeAnim.frameCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % activeAnim.frameCount);
    }, 1000 / (activeAnim.frameRateFps || 10));

    return () => clearInterval(interval);
  }, [isPlayingAnim, previewAnimIndex, char]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      <FileSubfolderHeader
        subfolderName="characters"
        extension=".character"
        files={charFiles.map(c => ({
          id: c.id,
          name: c.name,
          fileName: c.fileName,
          updatedAt: c.updatedAt
        }))}
        activeFileName={currentFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.character`;
          const newChar: CharacterFile = {
            id: `char_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            characterData: {
              id: `char_${Date.now()}`,
              name,
              characterType: 'enemy_mob',
              avatarIcon: '👹',
              spriteWidth: 64,
              spriteHeight: 64,
              tintColor: '#f59e0b',
              baseScale: 1.0,
              sockets: [
                { tagId: 'head_eyes', label: 'Sight Locus (Eyes)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
                { tagId: 'head_ears', label: 'Acoustic Ears', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
                { tagId: 'torso_center', label: 'Torso Hurtbox', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' }
              ],
              animations: [
                { stateId: 'idle', label: 'Idle Stance', frameCount: 4, frameRateFps: 8, loop: true, spriteRow: 0 }
              ]
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: safeName },
            fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), newChar] }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = charFiles.find(c => c.fileName === fName);
          if (!target) return;
          const dupeFileName = `${target.fileName.replace('.character', '')}_copy.character`;
          const dupe: CharacterFile = {
            ...target,
            id: `char_${Date.now()}`,
            name: `${target.name} (Copy)`,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: dupeFileName },
            fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), dupe] }
          }));
        }}
        onSaveFile={() => {}}
        onExportFile={(fName) => {
          const target = charFiles.find(c => c.fileName === fName);
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
            const filtered = (p.fileSystem.characters || []).filter(c => c.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, characterFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, characters: filtered }
            };
          });
        }}
        accentColor="rose"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        
        {/* Header Banner */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={char.avatarIcon || '🎭'}
              onChange={(e) => updateCharacter(c => ({ ...c, avatarIcon: e.target.value }))}
              className="w-14 h-14 rounded-2xl bg-rose-950/60 border-2 border-rose-500/50 text-center text-3xl outline-none"
            />
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => updateCharacter(c => ({ ...c, name: e.target.value }))}
                  className="font-black text-xl text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-rose-500 outline-none"
                />
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-950 text-rose-400 border border-neutral-800">
                  {currentFile.fileName}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <select
                  value={char.characterType}
                  onChange={(e) => updateCharacter(c => ({ ...c, characterType: e.target.value as any }))}
                  className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-rose-300 font-semibold"
                >
                  <option value="player_hero">Player Hero PC</option>
                  <option value="enemy_mob">Enemy Creep Mob</option>
                  <option value="boss_archon">Boss Archon</option>
                  <option value="friendly_npc">Friendly NPC</option>
                </select>
                <span className="text-xs text-neutral-400 font-mono">
                  {char.sockets?.length || 0} Sensory Sockets | {char.animations?.length || 0} Anim States
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-bold uppercase">Color Tint:</span>
              <input
                type="color"
                value={char.tintColor || '#06b6d4'}
                onChange={(e) => updateCharacter(c => ({ ...c, tintColor: e.target.value }))}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('visuals')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'visuals' ? 'bg-rose-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Visual Sprite & Scale</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sockets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'sockets' ? 'bg-rose-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Tag size={14} />
            <span>Sensory Sockets (Sight/Sound Tags)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('animations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'animations' ? 'bg-rose-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Play size={14} />
            <span>Animation Frame States</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('linkage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'linkage' ? 'bg-rose-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Brain size={14} />
            <span>Behavior & Archetype Link</span>
          </button>
        </div>

        {/* Live Canvas Preview Panel */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Crosshair size={14} className="text-rose-400" />
              Live Sensory Socket & Sprite Locus Canvas
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Selected Socket: <span className="text-rose-400 font-bold">{selectedSocketId}</span>
            </span>
          </div>

          <div className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden relative flex items-center justify-center">
            <canvas ref={canvasRef} width={800} height={192} className="w-full h-full block" />
            <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 font-mono">
              🔵 Sprite Locus ({char.spriteWidth}×{char.spriteHeight}px) &nbsp;|&nbsp; 👁️ Eyes (Sight) &nbsp;|&nbsp; 👂 Ears (Sound)
            </div>
          </div>
        </div>

        {/* TAB 1: VISUAL SPRITE & SCALE */}
        {activeTab === 'visuals' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} />
              Sprite Dimensions, Scale & Visual Customization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Sprite Width (px)</span>
                    <input
                      type="number"
                      value={char.spriteWidth}
                      onChange={(e) => updateCharacter(c => ({ ...c, spriteWidth: parseInt(e.target.value) || 32 }))}
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Sprite Height (px)</span>
                    <input
                      type="number"
                      value={char.spriteHeight}
                      onChange={(e) => updateCharacter(c => ({ ...c, spriteHeight: parseInt(e.target.value) || 32 }))}
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Base Scale Multiplier</span>
                    <span className="font-mono text-rose-400">{char.baseScale}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={char.baseScale}
                    onChange={(e) => updateCharacter(c => ({ ...c, baseScale: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300">Dialogue Greeting / Lore Voiceover</label>
                  <textarea
                    rows={3}
                    value={char.dialogueGreeting || ''}
                    onChange={(e) => updateCharacter(c => ({ ...c, dialogueGreeting: e.target.value }))}
                    placeholder="E.g. 'Turn back, traveler! The Ashen Stronghold belongs to the Archon!'"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SENSORY SOCKET TAGS */}
        {activeTab === 'sockets' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Tag size={16} />
                Sensory Socket Tags (Sight, Sound & Target Origin Points)
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newTagId = `socket_${Date.now()}`;
                  updateCharacter(c => ({
                    ...c,
                    sockets: [
                      ...(c.sockets || []),
                      { tagId: newTagId, label: 'Custom Socket Tag', offsetX: 0, offsetY: 0, visualMarkerColor: '#a855f7' }
                    ]
                  }));
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add Socket Tag</span>
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Behavior scripts use these exact socket tags to originate Sight raycasts (`head_eyes`), Acoustic hearing listeners (`head_ears`), and Footstep noise triggers (`feet_ground`).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(char.sockets || []).map((sock, idx) => {
                const isSelected = sock.tagId === selectedSocketId;
                return (
                  <div
                    key={sock.tagId + idx}
                    onClick={() => setSelectedSocketId(sock.tagId)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
                      isSelected ? 'bg-rose-950/30 border-rose-500/60 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block shrink-0 border border-white/20"
                          style={{ backgroundColor: sock.visualMarkerColor || '#38bdf8' }}
                        />
                        <input
                          type="text"
                          value={sock.tagId}
                          onChange={(e) => {
                            const newTag = e.target.value;
                            updateCharacter(c => ({
                              ...c,
                              sockets: c.sockets.map((s, i) => i === idx ? { ...s, tagId: newTag } : s)
                            }));
                          }}
                          className="font-mono font-bold text-xs bg-transparent border-b border-dashed border-neutral-700 text-rose-300 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCharacter(c => ({
                            ...c,
                            sockets: c.sockets.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="p-1 text-neutral-500 hover:text-red-400 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={sock.label}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        updateCharacter(c => ({
                          ...c,
                          sockets: c.sockets.map((s, i) => i === idx ? { ...s, label: newVal } : s)
                        }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 outline-none"
                      placeholder="Socket Label"
                    />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block">Offset X (px)</label>
                        <input
                          type="number"
                          value={sock.offsetX}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateCharacter(c => ({
                              ...c,
                              sockets: c.sockets.map((s, i) => i === idx ? { ...s, offsetX: val } : s)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block">Offset Y (px)</label>
                        <input
                          type="number"
                          value={sock.offsetY}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateCharacter(c => ({
                              ...c,
                              sockets: c.sockets.map((s, i) => i === idx ? { ...s, offsetY: val } : s)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ANIMATIONS */}
        {activeTab === 'animations' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Play size={16} />
                Animation Frame State Sheet
              </h3>
              <button
                type="button"
                onClick={() => {
                  updateCharacter(c => ({
                    ...c,
                    animations: [
                      ...(c.animations || []),
                      { stateId: `anim_${Date.now()}`, label: 'Custom Anim State', frameCount: 4, frameRateFps: 10, loop: true, spriteRow: (c.animations?.length || 0) }
                    ]
                  }));
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add Anim State</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(char.animations || []).map((anim, idx) => (
                <div key={anim.stateId + idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={anim.stateId}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateCharacter(c => ({
                          ...c,
                          animations: c.animations.map((a, i) => i === idx ? { ...a, stateId: val } : a)
                        }));
                      }}
                      className="font-mono font-bold text-xs bg-transparent border-b border-dashed border-neutral-700 text-rose-300 outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateCharacter(c => ({
                          ...c,
                          animations: c.animations.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Frames</label>
                      <input
                        type="number"
                        value={anim.frameCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map((a, i) => i === idx ? { ...a, frameCount: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">FPS Rate</label>
                      <input
                        type="number"
                        value={anim.frameRateFps}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 10;
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map((a, i) => i === idx ? { ...a, frameRateFps: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Sprite Row</label>
                      <input
                        type="number"
                        value={anim.spriteRow}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map((a, i) => i === idx ? { ...a, spriteRow: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LINKAGE */}
        {activeTab === 'linkage' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Brain size={16} />
              Driver Script & Archetype Linkage
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Brain size={14} className="text-indigo-400" />
                  Assigned Behavior Script (.behavior)
                </span>
                <select
                  value={char.assignedBehaviorFileName || ''}
                  onChange={(e) => updateCharacter(c => ({ ...c, assignedBehaviorFileName: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-bold"
                >
                  <option value="">None (Player Direct Control)</option>
                  {(project.fileSystem.behaviors || []).map(b => (
                    <option key={b.id} value={b.fileName}>
                      {b.name} ({b.fileName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={14} className="text-blue-400" />
                  Assigned Archetype Stats (.arch)
                </span>
                <select
                  value={char.assignedArchetypeFileName || ''}
                  onChange={(e) => updateCharacter(c => ({ ...c, assignedArchetypeFileName: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-bold"
                >
                  <option value="">None (Base Stats Only)</option>
                  {(project.fileSystem.archetypes || []).map(a => (
                    <option key={a.id} value={a.fileName}>
                      {a.name} ({a.fileName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
