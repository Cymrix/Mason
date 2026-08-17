import React, { useState, useEffect, useRef } from 'react';
import { 
  MasonProject, 
  BehaviorFile, 
  BehaviorData,
  BehaviorRule,
  BehaviorTrigger,
  BehaviorAction,
  SensoryTagConfig,
  HeroInputConfig,
  BossPhaseConfig,
  SentryTargetingConfig,
  NPCInteractionConfig,
  TriggerType,
  ActionType,
  DEFAULT_BEHAVIORS
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Brain, 
  Camera, 
  Footprints, 
  Eye, 
  Volume2, 
  Crosshair, 
  Plus, 
  Trash2, 
  Check, 
  Tag, 
  Sliders, 
  Zap, 
  Activity, 
  UserCheck, 
  ArrowRight, 
  Radio, 
  ShieldAlert, 
  Sparkles,
  RotateCcw,
  Target,
  Gamepad2,
  Crown,
  MessageSquare,
  Flame,
  Layers,
  Sparkle,
  Compass
} from 'lucide-react';

interface BehaviorEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles?: () => void;
}

export const BehaviorEditor: React.FC<BehaviorEditorProps> = ({
  project,
  onUpdateProject
}) => {
  // Ensure behavior files exist
  const behaviorFiles = project.fileSystem.behaviors || [];
  const activeFileName = project.activeFiles.behaviorFileName || behaviorFiles[0]?.fileName || '';
  const currentBehaviorFile = behaviorFiles.find(b => b.fileName === activeFileName) || behaviorFiles[0] || {
    id: 'beh_default',
    name: 'Default Behavior',
    fileName: 'default.behavior',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    behaviorData: DEFAULT_BEHAVIORS[0]
  };

  const beh = currentBehaviorFile.behaviorData;

  const [activeTab, setActiveTab] = useState<string>('rules');

  // Auto-switch tab if activeTab is not valid for the current category
  useEffect(() => {
    if (beh.category === 'hero' && !['hero_input', 'rules', 'foci', 'sockets', 'assignments'].includes(activeTab)) {
      setActiveTab('hero_input');
    } else if (beh.category === 'boss' && !['boss_phases', 'rules', 'movement', 'foci', 'sockets', 'assignments'].includes(activeTab)) {
      setActiveTab('boss_phases');
    } else if (beh.category === 'sentry' && !['sentry_targeting', 'rules', 'sockets', 'assignments'].includes(activeTab)) {
      setActiveTab('sentry_targeting');
    } else if (beh.category === 'npc' && !['npc_interaction', 'rules', 'sockets', 'assignments'].includes(activeTab)) {
      setActiveTab('npc_interaction');
    } else if (beh.category === 'mob' && !['rules', 'movement', 'foci', 'sockets', 'assignments'].includes(activeTab)) {
      setActiveTab('rules');
    }
  }, [beh.category]);

  const updateBehavior = (updater: (prev: BehaviorData) => BehaviorData) => {
    onUpdateProject(p => {
      const existingBehs = p.fileSystem.behaviors || [];
      const updated = existingBehs.map(b => {
        if (b.fileName === currentBehaviorFile.fileName) {
          return {
            ...b,
            updatedAt: new Date().toISOString(),
            behaviorData: updater(b.behaviorData)
          };
        }
        return b;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, behaviors: updated }
      };
    });
  };

  // Live Canvas Simulation Ref
  const simCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let posX = canvas.width / 2;
    let posY = canvas.height / 2 + 10;
    let dir = 1;
    let time = 0;
    let jumpY = 0;
    let isJumping = false;
    let scanAngle = 0;

    const renderSim = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Ground Line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, canvas.height - 30);
      ctx.lineTo(canvas.width - 10, canvas.height - 30);
      ctx.stroke();

      // Entity Movement logic based on Category
      if (beh.category === 'hero') {
        posX += dir * 2.2;
        if (posX > canvas.width - 80) dir = -1;
        if (posX < 80) dir = 1;
        
        // Simulate jump pulse
        if (Math.sin(time * 2) > 0.8) {
          jumpY = Math.sin(time * 4) * -24;
        } else {
          jumpY = 0;
        }
        posY = canvas.height - 44 + jumpY;

        // Draw Player Footstep Acoustic Sound Waves (Acoustic Noise emitted to enemy ears!)
        const footNoise = beh.heroInput?.footstepNoiseLevel || 35;
        const waveRadius = (time * 50) % (footNoise * 2.5 + 40);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(posX, canvas.height - 30, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Player Locus Body
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(posX, posY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Facing direction indicator
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(posX + dir * 18, posY);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('PLAYER HERO', posX - 32, posY - 20);

      } else if (beh.category === 'boss') {
        posX = canvas.width / 2 + Math.sin(time * 0.8) * 30;
        posY = canvas.height - 52;

        // Draw Enrage Aura
        const activePhases = beh.bossPhases || [];
        const isEnraged = activePhases.some(p => p.enrageAura);
        const auraR = 36 + Math.sin(time * 6) * 6;

        ctx.fillStyle = isEnraged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.15)';
        ctx.strokeStyle = isEnraged ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(posX, posY, auraR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Boss Body
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(posX, posY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arena Lock Bounds
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(canvas.width / 2 - 180, canvas.height / 2 - 60, 360, 120);
        ctx.setLineDash([]);

        ctx.fillStyle = '#fca5a5';
        ctx.font = '10px monospace';
        ctx.fillText('BOSS ARCHON (Arena Lock)', posX - 55, posY - 30);

      } else if (beh.category === 'sentry') {
        posX = canvas.width / 2;
        posY = canvas.height - 44;

        // Scan Sweep Angle Beam
        const sweepAngleDeg = beh.sentryTargeting?.scanSweepAngleDeg || 120;
        scanAngle = Math.sin(time * 1.5) * ((sweepAngleDeg / 2) * Math.PI / 180) - Math.PI / 2;
        const beamRadius = beh.sentryTargeting?.acquisitionRadiusPx || 180;

        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.arc(posX, posY, Math.min(beamRadius, 140), scanAngle - 0.25, scanAngle + 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Turret Base & Barrel
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(posX, posY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#c084fc';
        ctx.font = '10px monospace';
        ctx.fillText('SENTRY TURRET SCAN', posX - 48, posY - 22);

      } else if (beh.category === 'npc') {
        posX = canvas.width / 2;
        posY = canvas.height - 44;

        // Proximity Ring
        const proxR = beh.npcInteraction?.interactionRadiusPx || 50;
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(posX, posY, proxR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // NPC Body
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(posX, posY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Prompt Bubble
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        ctx.fillRect(posX - 40, posY - 45, 80, 20);
        ctx.strokeRect(posX - 40, posY - 45, 80, 20);

        ctx.fillStyle = '#fef08a';
        ctx.font = '9px sans-serif';
        ctx.fillText('[E] Talk to NPC', posX - 32, posY - 31);

      } else {
        // Creep Mob (Standard Sight/Sound)
        posX += dir * 1.5;
        if (posX > canvas.width - 60) dir = -1;
        if (posX < 60) dir = 1;
        posY = canvas.height - 44;

        const sightRule = (beh.rules || []).find(r => r.enabled && r.trigger.type === 'sight');
        const soundRule = (beh.rules || []).find(r => r.enabled && r.trigger.type === 'sound');

        if (soundRule && soundRule.trigger.type === 'sound') {
          const earsSock = (beh.sensoryTags || []).find(t => t.tagId === soundRule.trigger.sensoryTag) || { offsetX: 0, offsetY: -20 };
          const hearingR = Math.min(soundRule.trigger.hearingRadiusPx || 200, 160);
          const pulseR = (time * 40) % hearingR;

          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(posX + earsSock.offsetX, posY + earsSock.offsetY, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (sightRule && sightRule.trigger.type === 'sight') {
          const eyesSock = (beh.sensoryTags || []).find(t => t.tagId === sightRule.trigger.sensoryTag) || { offsetX: 10, offsetY: -16 };
          const visionR = Math.min(sightRule.trigger.visionRadiusPx || 200, 160);
          const visionAngle = ((sightRule.trigger.visionAngleDeg || 120) * Math.PI) / 180;

          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(posX + eyesSock.offsetX, posY + eyesSock.offsetY);
          const startA = (dir === 1 ? 0 : Math.PI) - visionAngle / 2;
          const endA = (dir === 1 ? 0 : Math.PI) + visionAngle / 2;
          ctx.arc(posX + eyesSock.offsetX, posY + eyesSock.offsetY, visionR, startA, endA);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(posX, posY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderSim);
    };

    renderSim();
    return () => cancelAnimationFrame(animId);
  }, [beh]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      <FileSubfolderHeader
        subfolderName="behaviors"
        extension=".behavior"
        files={behaviorFiles.map(b => ({
          id: b.id,
          name: b.name,
          fileName: b.fileName,
          updatedAt: b.updatedAt
        }))}
        activeFileName={currentBehaviorFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, behaviorFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.behavior`;
          const base = DEFAULT_BEHAVIORS[0];
          const newBeh: BehaviorFile = {
            id: `beh_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            behaviorData: {
              ...base,
              id: `beh_${Date.now()}`,
              name,
              title: `${name} Script`
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, behaviorFileName: safeName },
            fileSystem: { ...p.fileSystem, behaviors: [...(p.fileSystem.behaviors || []), newBeh] }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = behaviorFiles.find(b => b.fileName === fName);
          if (!target) return;
          const dupeFileName = `${target.fileName.replace('.behavior', '')}_copy.behavior`;
          const dupe: BehaviorFile = {
            ...target,
            id: `beh_${Date.now()}`,
            name: `${target.name} (Copy)`,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, behaviorFileName: dupeFileName },
            fileSystem: { ...p.fileSystem, behaviors: [...(p.fileSystem.behaviors || []), dupe] }
          }));
        }}
        onSaveFile={() => {}}
        onExportFile={(fName) => {
          const target = behaviorFiles.find(b => b.fileName === fName);
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
            const filtered = (p.fileSystem.behaviors || []).filter(b => b.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, behaviorFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, behaviors: filtered }
            };
          });
        }}
        accentColor="indigo"
      />

      {/* Main Inspector Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        
        {/* Header Hero Banner */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400 text-2xl shadow-lg shrink-0">
              {beh.category === 'hero' ? '⚡' : beh.category === 'boss' ? '👑' : beh.category === 'sentry' ? '🎯' : beh.category === 'npc' ? '💬' : '🧠'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={beh.name}
                  onChange={(e) => updateBehavior(b => ({ ...b, name: e.target.value }))}
                  className="font-black text-xl text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-indigo-500 outline-none"
                />
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-950 text-indigo-400 border border-neutral-800">
                  {currentBehaviorFile.fileName}
                </span>
              </div>
              <input
                type="text"
                value={beh.title}
                onChange={(e) => updateBehavior(b => ({ ...b, title: e.target.value }))}
                className="text-xs text-neutral-400 bg-transparent border-none outline-none mt-1 w-full"
                placeholder="Behavior Title"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-bold text-neutral-400 uppercase block">Actor Category</label>
              <select
                value={beh.category}
                onChange={(e) => {
                  const newCat = e.target.value as any;
                  updateBehavior(b => {
                    const updated = { ...b, category: newCat };
                    if (newCat === 'hero' && !updated.heroInput) {
                      updated.heroInput = {
                        controlScheme: 'keyboard_wasd',
                        jumpBufferMs: 120,
                        coyoteTimeMs: 100,
                        variableJumpHeight: true,
                        maxAirJumps: 2,
                        dashCooldownMs: 800,
                        dashIFrameMs: 250,
                        allowAirDash: true,
                        dashSpeedMultiplier: 2.2,
                        wallClingFriction: 0.6,
                        wallJumpForceX: 8.5,
                        wallJumpForceY: 10.0,
                        airControlPercent: 85,
                        footstepNoiseLevel: 35,
                        landingNoiseLevel: 65
                      };
                    } else if (newCat === 'boss' && (!updated.bossPhases || updated.bossPhases.length === 0)) {
                      updated.bossPhases = [
                        { phaseNumber: 1, hpPercentTrigger: 100, phaseTitle: 'Phase I', speedMultiplier: 1.0, telegraphWindupMs: 600, unlockedAttackTypes: ['melee_slash'], enrageAura: false, summonMinionCount: 0 },
                        { phaseNumber: 2, hpPercentTrigger: 60, phaseTitle: 'Phase II Enrage', speedMultiplier: 1.3, telegraphWindupMs: 400, unlockedAttackTypes: ['melee_slash', 'fire_projectile'], enrageAura: true, summonMinionCount: 2 }
                      ];
                    } else if (newCat === 'sentry' && !updated.sentryTargeting) {
                      updated.sentryTargeting = { scanSweepAngleDeg: 120, aimSpeedDegPerSec: 90, acquisitionRadiusPx: 300, burstFireCount: 3, burstIntervalMs: 200 };
                    } else if (newCat === 'npc' && !updated.npcInteraction) {
                      updated.npcInteraction = { interactionRadiusPx: 50, promptText: 'Press [E] to Speak', npcRole: 'dialogue_quest', wanderRadiusPx: 30, returnToPostDelayMs: 3000 };
                    }
                    return updated;
                  });
                }}
                className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white capitalize font-bold outline-none"
              >
                <option value="hero">⚡ Player Hero</option>
                <option value="mob">👹 Creep / Mob</option>
                <option value="boss">👑 Boss Archon</option>
                <option value="sentry">🎯 Sentry Turret</option>
                <option value="npc">💬 Friendly NPC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Category-Specific Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
          
          {/* Category-Specific Primary Tab */}
          {beh.category === 'hero' && (
            <button
              type="button"
              onClick={() => setActiveTab('hero_input')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'hero_input' ? 'bg-cyan-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Gamepad2 size={14} />
              <span>Player Controls & Kinematics</span>
            </button>
          )}

          {beh.category === 'boss' && (
            <button
              type="button"
              onClick={() => setActiveTab('boss_phases')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'boss_phases' ? 'bg-rose-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Crown size={14} />
              <span>Multi-Phase Enrage Engine ({beh.bossPhases?.length || 0})</span>
            </button>
          )}

          {beh.category === 'sentry' && (
            <button
              type="button"
              onClick={() => setActiveTab('sentry_targeting')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'sentry_targeting' ? 'bg-purple-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Target size={14} />
              <span>Sentry Aim & Scan Sweep</span>
            </button>
          )}

          {beh.category === 'npc' && (
            <button
              type="button"
              onClick={() => setActiveTab('npc_interaction')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'npc_interaction' ? 'bg-amber-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Dialogue & Interaction Prompt</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'rules' ? 'bg-indigo-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Zap size={14} />
            <span>IFTTT Rule Engine ({beh.rules?.length || 0})</span>
          </button>

          {(beh.category === 'mob' || beh.category === 'boss') && (
            <button
              type="button"
              onClick={() => setActiveTab('movement')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'movement' ? 'bg-emerald-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Footprints size={14} />
              <span>Kinematic Controller</span>
            </button>
          )}

          {(beh.category === 'hero' || beh.category === 'mob' || beh.category === 'boss') && (
            <button
              type="button"
              onClick={() => setActiveTab('foci')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'foci' ? 'bg-cyan-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Camera size={14} />
              <span>Camera Locus</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('sockets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'sockets' ? 'bg-indigo-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Tag size={14} />
            <span>Sensory Sockets ({beh.sensoryTags?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'assignments' ? 'bg-amber-600 text-white shadow' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Assignments</span>
          </button>
        </div>

        {/* Live Category Physics & Vector Simulator Panel */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Crosshair size={14} className="text-indigo-400" />
              Live Sensory Vectors & Physics Motion Simulator ({beh.category.toUpperCase()})
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Active Rules: {beh.rules?.filter(r => r.enabled).length || 0}
            </span>
          </div>

          <div className="w-full h-44 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden relative">
            <canvas ref={simCanvasRef} width={800} height={176} className="w-full h-full block" />
            <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 font-mono">
              {beh.category === 'hero' && '⚡ Player Kinematics | 🔊 Footstep Acoustic Wave (footstepNoiseLevel)'}
              {beh.category === 'boss' && '👑 Boss Archon Enrage Aura | 🔒 Arena Camera Lock Box'}
              {beh.category === 'sentry' && '🎯 Sentry Sweep Light Cone Arc | 🎯 Target Acquisition Radius'}
              {beh.category === 'npc' && '💬 NPC Proximity Ring | 📜 [E] Interact Speech Trigger'}
              {beh.category === 'mob' && '🔵 Entity Locus | 👁️ Sight Cone (head_eyes) | 👂 Hearing Radius (head_ears)'}
            </div>
          </div>
        </div>

        {/* TAB 1: PLAYER HERO CONTROLS & TRAVERSAL KINEMATICS */}
        {activeTab === 'hero_input' && beh.category === 'hero' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 size={16} />
                Player Control Scheme & Traversal Physics Kinematics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Jump & Buffer Kinematics */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} />
                  Jump Grace Window & Air Traversal
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Jump Buffer Window (ms)</label>
                    <input
                      type="number"
                      value={beh.heroInput?.jumpBufferMs || 120}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, jumpBufferMs: val } }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono mt-1"
                    />
                    <span className="text-[9px] text-neutral-500">Registers jump before ground landing</span>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Coyote Time (ms)</label>
                    <input
                      type="number"
                      value={beh.heroInput?.coyoteTimeMs || 100}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, coyoteTimeMs: val } }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono mt-1"
                    />
                    <span className="text-[9px] text-neutral-500">Grace jump after stepping off ledge</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                  <span className="text-xs text-neutral-300 font-bold">Max Air Jump Count</span>
                  <select
                    value={beh.heroInput?.maxAirJumps || 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, maxAirJumps: val } }));
                    }}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-cyan-300 font-bold"
                  >
                    <option value={1}>1 (Single Jump)</option>
                    <option value={2}>2 (Double Jump - Aether Wings)</option>
                    <option value={3}>3 (Triple Jump)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-bold">Variable Jump Height (Key Hold)</span>
                  <input
                    type="checkbox"
                    checked={beh.heroInput?.variableJumpHeight ?? true}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, variableJumpHeight: val } }));
                    }}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                </div>
              </div>

              {/* Dash & Dodge Roll */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} />
                  Dash Burst & Invincibility Frames (i-Frames)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Dash Cooldown (ms)</label>
                    <input
                      type="number"
                      value={beh.heroInput?.dashCooldownMs || 800}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, dashCooldownMs: val } }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">i-Frame Invincibility (ms)</label>
                    <input
                      type="number"
                      value={beh.heroInput?.dashIFrameMs || 250}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, dashIFrameMs: val } }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                  <span className="text-xs text-neutral-300 font-bold">Allow Mid-Air Dash</span>
                  <input
                    type="checkbox"
                    checked={beh.heroInput?.allowAirDash ?? true}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, allowAirDash: val } }));
                    }}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                </div>
              </div>

              {/* Acoustic Noise Emission Profile (Triggers nearby enemy ears!) */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4 md:col-span-2">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 size={14} />
                  Acoustic Footstep & Impact Noise Emission (Triggers Enemy `head_ears` Sensory Tags!)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400 font-bold">Sprint Footstep Noise Level</span>
                      <span className="font-mono text-emerald-400">{beh.heroInput?.footstepNoiseLevel || 35} dB</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={beh.heroInput?.footstepNoiseLevel || 35}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, footstepNoiseLevel: val } }));
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400 font-bold">Landing Impact Thud Noise</span>
                      <span className="font-mono text-emerald-400">{beh.heroInput?.landingNoiseLevel || 65} dB</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={beh.heroInput?.landingNoiseLevel || 65}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateBehavior(b => ({ ...b, heroInput: { ...b.heroInput!, landingNoiseLevel: val } }));
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: MULTI-PHASE BOSS ENGINE */}
        {activeTab === 'boss_phases' && beh.category === 'boss' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Crown size={16} />
                Multi-Phase Archon Enrage Engine
              </h3>
              <button
                type="button"
                onClick={() => {
                  const currentPhases = beh.bossPhases || [];
                  const newNum = currentPhases.length + 1;
                  const newPhase: BossPhaseConfig = {
                    phaseNumber: newNum,
                    hpPercentTrigger: Math.max(10, 100 - newNum * 30),
                    phaseTitle: `Phase ${newNum}: Enrage Awakening`,
                    speedMultiplier: 1.0 + newNum * 0.2,
                    telegraphWindupMs: 300,
                    unlockedAttackTypes: ['melee_slash', 'fire_projectile'],
                    enrageAura: true,
                    summonMinionCount: newNum
                  };
                  updateBehavior(b => ({ ...b, bossPhases: [...currentPhases, newPhase] }));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus size={14} />
                <span>Add Boss Phase</span>
              </button>
            </div>

            <div className="space-y-4">
              {(beh.bossPhases || []).map((phase, pIdx) => (
                <div key={pIdx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                    <input
                      type="text"
                      value={phase.phaseTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateBehavior(b => ({
                          ...b,
                          bossPhases: b.bossPhases?.map((p, i) => i === pIdx ? { ...p, phaseTitle: val } : p)
                        }));
                      }}
                      className="font-bold text-xs text-rose-300 bg-transparent outline-none border-b border-dashed border-neutral-700"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-neutral-400">Triggers at &lt;= {phase.hpPercentTrigger}% HP</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateBehavior(b => ({ ...b, bossPhases: b.bossPhases?.filter((_, i) => i !== pIdx) }));
                        }}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">HP % Trigger</label>
                      <input
                        type="number"
                        value={phase.hpPercentTrigger}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateBehavior(b => ({
                            ...b,
                            bossPhases: b.bossPhases?.map((p, i) => i === pIdx ? { ...p, hpPercentTrigger: val } : p)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Speed Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={phase.speedMultiplier}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.0;
                          updateBehavior(b => ({
                            ...b,
                            bossPhases: b.bossPhases?.map((p, i) => i === pIdx ? { ...p, speedMultiplier: val } : p)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block">Telegraph Windup (ms)</label>
                      <input
                        type="number"
                        value={phase.telegraphWindupMs}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateBehavior(b => ({
                            ...b,
                            bossPhases: b.bossPhases?.map((p, i) => i === pIdx ? { ...p, telegraphWindupMs: val } : p)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-[10px] text-neutral-400 font-bold">Enrage Aura</span>
                      <input
                        type="checkbox"
                        checked={phase.enrageAura}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateBehavior(b => ({
                            ...b,
                            bossPhases: b.bossPhases?.map((p, i) => i === pIdx ? { ...p, enrageAura: val } : p)
                          }));
                        }}
                        className="accent-rose-500 w-4 h-4 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SENTRY TARGETING */}
        {activeTab === 'sentry_targeting' && beh.category === 'sentry' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Target size={16} />
              Sentry Turret Aim & Scanning Sweep Config
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <label className="text-neutral-400 font-bold block">Scan Sweep Angle (°)</label>
                <input
                  type="number"
                  value={beh.sentryTargeting?.scanSweepAngleDeg || 120}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 90;
                    updateBehavior(b => ({ ...b, sentryTargeting: { ...b.sentryTargeting!, scanSweepAngleDeg: val } }));
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <label className="text-neutral-400 font-bold block">Target Acquisition Radius (px)</label>
                <input
                  type="number"
                  value={beh.sentryTargeting?.acquisitionRadiusPx || 320}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    updateBehavior(b => ({ ...b, sentryTargeting: { ...b.sentryTargeting!, acquisitionRadiusPx: val } }));
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NPC INTERACTION */}
        {activeTab === 'npc_interaction' && beh.category === 'npc' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} />
              NPC Interaction & Prompt Config
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <label className="text-neutral-400 font-bold block">Interaction Range Radius (px)</label>
                <input
                  type="number"
                  value={beh.npcInteraction?.interactionRadiusPx || 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 20;
                    updateBehavior(b => ({ ...b, npcInteraction: { ...b.npcInteraction!, interactionRadiusPx: val } }));
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <label className="text-neutral-400 font-bold block">Interact Prompt Text</label>
                <input
                  type="text"
                  value={beh.npcInteraction?.promptText || 'Press [E] to Speak'}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateBehavior(b => ({ ...b, npcInteraction: { ...b.npcInteraction!, promptText: val } }));
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: IFTTT RULES ENGINE */}
        {activeTab === 'rules' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} />
                "If This Then That" Conditional Rule Stack
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newRule: BehaviorRule = beh.category === 'hero' ? {
                    id: `rule_${Date.now()}`,
                    name: 'IF Press Jump -> THEN Jump Impulse & Sound',
                    enabled: true,
                    trigger: { type: 'input_press', button: 'jump' },
                    actions: [{ id: `act_${Date.now()}`, actionType: 'hero_impulse', impulseType: 'jump', force: 11.5 }]
                  } : {
                    id: `rule_${Date.now()}`,
                    name: 'IF Sight (Eyes) -> THEN Chase',
                    enabled: true,
                    trigger: { type: 'sight', sensoryTag: 'head_eyes', visionRadiusPx: 200, visionAngleDeg: 120, requireLineOfSight: true, targetFilter: 'player' },
                    actions: [{ id: `act_${Date.now()}`, actionType: 'move', moveMode: 'towards_target', speed: 5.0 }]
                  };
                  updateBehavior(b => ({ ...b, rules: [...(b.rules || []), newRule] }));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus size={14} />
                <span>Add IFTTT Rule</span>
              </button>
            </div>

            <div className="space-y-4">
              {(beh.rules || []).map((rule, ruleIdx) => (
                <div key={rule.id + ruleIdx} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  
                  {/* Rule Header */}
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateBehavior(b => ({
                            ...b,
                            rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, enabled: val } : r)
                          }));
                        }}
                        className="accent-indigo-500 rounded w-4 h-4"
                      />
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateBehavior(b => ({
                            ...b,
                            rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, name: val } : r)
                          }));
                        }}
                        className="font-bold text-xs text-white bg-transparent border-b border-dashed border-neutral-700 outline-none focus:border-indigo-500 flex-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateBehavior(b => ({
                          ...b,
                          rules: b.rules.filter((_, i) => i !== ruleIdx)
                        }));
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* IF (TRIGGER) & THEN (ACTIONS) GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* IF TRIGGER CARD */}
                    <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye size={13} />
                          IF Trigger Condition
                        </span>
                        <select
                          value={rule.trigger.type}
                          onChange={(e) => {
                            const newType = e.target.value as TriggerType;
                            let newTrigger: BehaviorTrigger = rule.trigger;
                            if (newType === 'input_press') {
                              newTrigger = { type: 'input_press', button: 'jump' };
                            } else if (newType === 'player_condition') {
                              newTrigger = { type: 'player_condition', condition: 'is_grounded' };
                            } else if (newType === 'sight') {
                              newTrigger = { type: 'sight', sensoryTag: 'head_eyes', visionRadiusPx: 220, visionAngleDeg: 120, requireLineOfSight: true, targetFilter: 'player' };
                            } else if (newType === 'sound') {
                              newTrigger = { type: 'sound', sensoryTag: 'head_ears', hearingRadiusPx: 280, minNoiseLevel: 20 };
                            } else if (newType === 'proximity') {
                              newTrigger = { type: 'proximity', sensoryTag: 'torso_center', distancePx: 64, comparator: 'less_than' };
                            } else if (newType === 'health') {
                              newTrigger = { type: 'health', healthPercentThreshold: 30, comparator: 'less_than' };
                            } else if (newType === 'collision') {
                              newTrigger = { type: 'collision', contactType: 'cliff_edge' };
                            }
                            updateBehavior(b => ({
                              ...b,
                              rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: newTrigger } : r)
                            }));
                          }}
                          className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white capitalize font-bold outline-none"
                        >
                          {beh.category === 'hero' && <option value="input_press">🎮 Input Button Press</option>}
                          {beh.category === 'hero' && <option value="player_condition">🏃 Player Condition State</option>}
                          <option value="sight">👁️ Sight / Vision Cone</option>
                          <option value="sound">👂 Sound / Acoustic Wave</option>
                          <option value="proximity">📐 Proximity Distance</option>
                          <option value="health">❤️ Health % Condition</option>
                          <option value="collision">🧱 Collision / Cliff Edge</option>
                        </select>
                      </div>

                      {/* Input Press Fields */}
                      {rule.trigger.type === 'input_press' && (
                        <div className="space-y-2 text-xs">
                          <label className="text-[10px] text-neutral-400 font-bold block">Input Button</label>
                          <select
                            value={rule.trigger.button}
                            onChange={(e) => {
                              const btn = e.target.value as any;
                              updateBehavior(b => ({
                                ...b,
                                rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, button: btn } as any } : r)
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono"
                          >
                            <option value="jump">Jump (Space / A)</option>
                            <option value="dash">Dash (Shift / B)</option>
                            <option value="attack_primary">Primary Attack (J / X)</option>
                            <option value="attack_heavy">Heavy Attack (K / Y)</option>
                            <option value="interact">Interact (E / RB)</option>
                            <option value="skill_1">Ability Skill 1</option>
                            <option value="skill_2">Ability Skill 2</option>
                            <option value="block">Guard Block</option>
                          </select>
                        </div>
                      )}

                      {/* Player Condition Fields */}
                      {rule.trigger.type === 'player_condition' && (
                        <div className="space-y-2 text-xs">
                          <label className="text-[10px] text-neutral-400 font-bold block">Required Condition</label>
                          <select
                            value={rule.trigger.condition}
                            onChange={(e) => {
                              const cond = e.target.value as any;
                              updateBehavior(b => ({
                                ...b,
                                rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, condition: cond } as any } : r)
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono"
                          >
                            <option value="is_grounded">Grounded on Terrain</option>
                            <option value="is_airborne">Airborne Mid-Air</option>
                            <option value="is_wall_sliding">Wall Sliding Friction</option>
                            <option value="low_stamina">Low Stamina Warning</option>
                            <option value="low_health">Low Health Critical</option>
                          </select>
                        </div>
                      )}

                      {/* Sight Trigger Fields */}
                      {rule.trigger.type === 'sight' && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-neutral-400 font-bold block">Vision Radius (px)</label>
                              <input
                                type="number"
                                value={rule.trigger.visionRadiusPx}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 100;
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, visionRadiusPx: val } as any } : r)
                                  }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 font-bold block">Cone Angle (°)</label>
                              <input
                                type="number"
                                value={rule.trigger.visionAngleDeg}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 90;
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, visionAngleDeg: val } as any } : r)
                                  }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sound Trigger Fields */}
                      {rule.trigger.type === 'sound' && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-neutral-400 font-bold block">Hearing Radius (px)</label>
                              <input
                                type="number"
                                value={rule.trigger.hearingRadiusPx}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 100;
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, hearingRadiusPx: val } as any } : r)
                                  }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 font-bold block">Noise Threshold</label>
                              <input
                                type="number"
                                value={rule.trigger.minNoiseLevel}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 10;
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, trigger: { ...r.trigger, minNoiseLevel: val } as any } : r)
                                  }));
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* THEN ACTIONS CARD */}
                    <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowRight size={13} />
                          THEN Trigger Actions ({rule.actions?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newAct: BehaviorAction = {
                              id: `act_${Date.now()}`,
                              actionType: beh.category === 'hero' ? 'hero_impulse' : 'move',
                              impulseType: 'jump',
                              force: 11.0,
                              moveMode: 'towards_target',
                              speed: 5.0
                            };
                            updateBehavior(b => ({
                              ...b,
                              rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, actions: [...(r.actions || []), newAct] } : r)
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                        >
                          + Action
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(rule.actions || []).map((act, actIdx) => (
                          <div key={act.id + actIdx} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <select
                                value={act.actionType}
                                onChange={(e) => {
                                  const val = e.target.value as ActionType;
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? {
                                      ...r,
                                      actions: r.actions.map((a, ai) => ai === actIdx ? { ...a, actionType: val } : a)
                                    } : r)
                                  }));
                                }}
                                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white capitalize font-bold"
                              >
                                {beh.category === 'hero' && <option value="hero_impulse">⚡ Hero Velocity Impulse</option>}
                                <option value="move">Kinematic Movement</option>
                                <option value="attack">Combat Attack</option>
                                <option value="state_change">Change FSM State</option>
                                <option value="emit_signal">Emit Sound / Alert Signal</option>
                                <option value="animation">Play Animation State</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  updateBehavior(b => ({
                                    ...b,
                                    rules: b.rules.map((r, i) => i === ruleIdx ? {
                                      ...r,
                                      actions: r.actions.filter((_, ai) => ai !== actIdx)
                                    } : r)
                                  }));
                                }}
                                className="text-neutral-500 hover:text-red-400 p-0.5"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Hero Impulse Action Fields */}
                            {act.actionType === 'hero_impulse' && (
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={act.impulseType || 'jump'}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    updateBehavior(b => ({
                                      ...b,
                                      rules: b.rules.map((r, i) => i === ruleIdx ? {
                                        ...r,
                                        actions: r.actions.map((a, ai) => ai === actIdx ? { ...a, impulseType: val } : a)
                                      } : r)
                                    }));
                                  }}
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-cyan-300 font-mono"
                                >
                                  <option value="jump">Vertical Jump Impulse</option>
                                  <option value="dash">Horizontal Dash Burst</option>
                                  <option value="wall_jump">Wall Kick Jump</option>
                                  <option value="ground_slam">Ground Slam Drop</option>
                                </select>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={act.force || 10}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updateBehavior(b => ({
                                      ...b,
                                      rules: b.rules.map((r, i) => i === ruleIdx ? {
                                        ...r,
                                        actions: r.actions.map((a, ai) => ai === actIdx ? { ...a, force: val } : a)
                                      } : r)
                                    }));
                                  }}
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                  placeholder="Impulse Force"
                                />
                              </div>
                            )}

                            {act.actionType === 'move' && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={act.moveMode || 'towards_target'}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    updateBehavior(b => ({
                                      ...b,
                                      rules: b.rules.map((r, i) => i === ruleIdx ? {
                                        ...r,
                                        actions: r.actions.map((a, ai) => ai === actIdx ? { ...a, moveMode: val } : a)
                                      } : r)
                                    }));
                                  }}
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-emerald-300 font-mono flex-1"
                                >
                                  <option value="towards_target">Move Towards Target</option>
                                  <option value="away_from_target">Hover / Move Away (Kite)</option>
                                  <option value="ground_patrol">Ground Ledge Patrol</option>
                                  <option value="flying_sine">Flying Sine Wave</option>
                                  <option value="jump">Jump / Leap</option>
                                  <option value="stop">Stop Motion</option>
                                </select>
                              </div>
                            )}

                            {act.actionType === 'attack' && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={act.attackType || 'melee_slash'}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    updateBehavior(b => ({
                                      ...b,
                                      rules: b.rules.map((r, i) => i === ruleIdx ? {
                                        ...r,
                                        actions: r.actions.map((a, ai) => ai === actIdx ? { ...a, attackType: val } : a)
                                      } : r)
                                    }));
                                  }}
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-rose-300 font-mono flex-1"
                                >
                                  <option value="melee_slash">Melee Blade Slash</option>
                                  <option value="fire_projectile">Fire Crystal Projectile</option>
                                  <option value="charge_dash">Telegraphed Charge Dash</option>
                                  <option value="guard">Shield Guard</option>
                                </select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SENSORY SOCKET TAGS */}
        {activeTab === 'sockets' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Tag size={16} />
                Sensory Socket Tag Registry
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newTag: SensoryTagConfig = {
                    tagId: `tag_${Date.now()}`,
                    label: 'Custom Sensory Socket',
                    offsetX: 0,
                    offsetY: 0
                  };
                  updateBehavior(b => ({ ...b, sensoryTags: [...(b.sensoryTags || []), newTag] }));
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add Sensory Tag</span>
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Sensory tags allow behavior scripts to bind to physical locations on character sprites (e.g. `head_eyes` for optical vision, `head_ears` for acoustic listening, `feet_ground` for footstep sound emission).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(beh.sensoryTags || []).map((tag, idx) => (
                <div key={tag.tagId + idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={tag.tagId}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateBehavior(b => ({
                          ...b,
                          sensoryTags: b.sensoryTags.map((t, i) => i === idx ? { ...t, tagId: val } : t)
                        }));
                      }}
                      className="font-mono font-bold text-xs text-indigo-300 bg-transparent border-b border-dashed border-neutral-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateBehavior(b => ({
                          ...b,
                          sensoryTags: b.sensoryTags.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={tag.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateBehavior(b => ({
                        ...b,
                        sensoryTags: b.sensoryTags.map((t, i) => i === idx ? { ...t, label: val } : t)
                      }));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CAMERA FOCI */}
        {activeTab === 'foci' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Camera size={16} />
              Camera Target Locus & Focus Deadzones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300">Focus Target Mode</label>
                  <select
                    value={beh.foci.focusType}
                    onChange={(e) => updateBehavior(b => ({ ...b, foci: { ...b.foci, focusType: e.target.value as any } }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="player_tracker">Smooth Player Tracker</option>
                    <option value="static_anchor">Static Room Anchor</option>
                    <option value="boss_lock">Boss Arena Lock Locus</option>
                    <option value="deadzone_box">Dynamic Deadzone Box</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Camera Zoom Multiplier</span>
                    <span className="font-mono text-cyan-400">{beh.foci.cameraZoom}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={beh.foci.cameraZoom}
                    onChange={(e) => updateBehavior(b => ({ ...b, foci: { ...b.foci, cameraZoom: parseFloat(e.target.value) } }))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Look-Ahead Offset X (px)</span>
                  <input
                    type="number"
                    value={beh.foci.lookAheadOffsetX || 0}
                    onChange={(e) => updateBehavior(b => ({ ...b, foci: { ...b.foci, lookAheadOffsetX: parseInt(e.target.value) || 0 } }))}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                  />
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Look-Ahead Offset Y (px)</span>
                  <input
                    type="number"
                    value={beh.foci.lookAheadOffsetY || 0}
                    onChange={(e) => updateBehavior(b => ({ ...b, foci: { ...b.foci, lookAheadOffsetY: parseInt(e.target.value) || 0 } }))}
                    className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MOVEMENT CONTROLLER */}
        {activeTab === 'movement' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Footprints size={16} />
              Kinematic Physics & Movement Controllers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300">Movement Paradigm</label>
                  <select
                    value={beh.movement.movementType}
                    onChange={(e) => updateBehavior(b => ({ ...b, movement: { ...b.movement, movementType: e.target.value as any } }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="ground_patrol">Ground Patrol / Ledge Walker</option>
                    <option value="flying_sine">Flying Sine Wave Hoverer</option>
                    <option value="leaper_jumper">Ground Leaper / Jumper</option>
                    <option value="turret_aim">Fixed Turret Rotator</option>
                    <option value="charge_dash">Telegraphed Charge Dasher</option>
                    <option value="hover_chaser">Direct Vector Hover Chaser</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Move Speed</span>
                    <input
                      type="number"
                      step="0.1"
                      value={beh.movement.moveSpeed}
                      onChange={(e) => updateBehavior(b => ({ ...b, movement: { ...b.movement, moveSpeed: parseFloat(e.target.value) || 0 } }))}
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Acceleration</span>
                    <input
                      type="number"
                      step="0.5"
                      value={beh.movement.acceleration}
                      onChange={(e) => updateBehavior(b => ({ ...b, movement: { ...b.movement, acceleration: parseFloat(e.target.value) || 0 } }))}
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={16} />
              Character & Archetype Assignment Matrix
            </h3>

            <p className="text-xs text-neutral-400">
              Assign this behavior script (`{currentBehaviorFile.fileName}`) to characters in the Character Creator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(project.fileSystem.characters || []).map(charFile => {
                const charData = charFile.characterData;
                const isAssigned = charData.assignedBehaviorFileName === currentBehaviorFile.fileName;

                return (
                  <div
                    key={charFile.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      isAssigned ? 'bg-amber-950/20 border-amber-500/50 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl shrink-0">
                        {charData.avatarIcon || '🎭'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{charData.name}</h4>
                        <span className="text-[10px] text-neutral-500 font-mono">{charFile.fileName}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProject(p => {
                          const updatedChars = (p.fileSystem.characters || []).map(c => {
                            if (c.fileName === charFile.fileName) {
                              return {
                                ...c,
                                characterData: {
                                  ...c.characterData,
                                  assignedBehaviorFileName: isAssigned ? '' : currentBehaviorFile.fileName
                                }
                              };
                            }
                            return c;
                          });
                          return {
                            ...p,
                            fileSystem: { ...p.fileSystem, characters: updatedChars }
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isAssigned ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check size={13} />
                          <span>Assigned</span>
                        </>
                      ) : (
                        <span>Assign Script</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
