import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Dices, 
  Search,
  Eye, 
  Flame, 
  Wrench, 
  Map, 
  Crosshair, 
  Gauge, 
  Shield, 
  Grid, 
  Compass, 
  Zap, 
  Users, 
  Layers, 
  Target,
  Tv,
  Wifi,
  Server,
  Radio,
  Gamepad2,
  Box,
  Cpu,
  Sword,
  Skull,
  Crown
} from 'lucide-react';
import { 
  GENRE_ARCHETYPES, 
  GenreArchetypeDefinition, 
  GenreArchetypeId, 
  DimensionOption, 
  MultiplayerTopologyOption, 
  CreateProjectOptions 
} from '../engine/projectArchetypes';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (options: CreateProjectOptions) => void;
  initialArchetypeId?: GenreArchetypeId;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  initialArchetypeId = 'stealth_action'
}) => {
  // Wizard Step: 1 (Genre) -> 2 (Dimension & Mechanics) -> 3 (Multiplayer) -> 4 (Project Info)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Category filter for Step 1
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Options
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<GenreArchetypeId>(initialArchetypeId);
  const activeArchetype = useMemo(() => {
    return GENRE_ARCHETYPES.find(a => a.id === selectedArchetypeId) || GENRE_ARCHETYPES[0];
  }, [selectedArchetypeId]);

  const [dimension, setDimension] = useState<DimensionOption>(activeArchetype.defaultDimension);
  const [multiplayerTopology, setMultiplayerTopology] = useState<MultiplayerTopologyOption>(activeArchetype.defaultMultiplayer);

  const [name, setName] = useState<string>(activeArchetype.suggestedTitles[0]);
  const [author, setAuthor] = useState<string>('Mason Architect');
  const [description, setDescription] = useState<string>(activeArchetype.tagline);

  // Sync defaults when archetype changes
  const handleSelectArchetype = (arch: GenreArchetypeDefinition) => {
    setSelectedArchetypeId(arch.id);
    setDimension(arch.defaultDimension);
    setMultiplayerTopology(arch.defaultMultiplayer);
    setName(arch.suggestedTitles[0]);
    setDescription(arch.tagline);
  };

  const handleRandomizeTitle = () => {
    const titles = activeArchetype.suggestedTitles;
    const next = titles[Math.floor(Math.random() * titles.length)];
    setName(next);
  };

  // Filtered archetypes for Step 1
  const filteredArchetypes = useMemo(() => {
    return GENRE_ARCHETYPES.filter(a => {
      const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
      const matchQuery = !searchQuery.trim() || 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.inspiration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.shortTag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      author: author.trim(),
      archetypeId: selectedArchetypeId,
      dimension,
      multiplayerTopology
    });
    onClose();
  };

  const renderArchetypeIcon = (iconName: string, size: number = 20) => {
    switch (iconName) {
      case 'Eye': return <Eye size={size} />;
      case 'Flame': return <Flame size={size} />;
      case 'Wrench': return <Wrench size={size} />;
      case 'Map': return <Map size={size} />;
      case 'Crosshair': return <Crosshair size={size} />;
      case 'Gauge': return <Gauge size={size} />;
      case 'Shield': return <Shield size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Grid': return <Grid size={size} />;
      case 'Compass': return <Compass size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Users': return <Users size={size} />;
      case 'Layers': return <Layers size={size} />;
      case 'Target': return <Target size={size} />;
      case 'Sword': return <Sword size={size} />;
      case 'Skull': return <Skull size={size} />;
      case 'Crown': return <Crown size={size} />;
      case 'Radio': return <Radio size={size} />;
      default: return <Gamepad2 size={size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Wizard Header & Progress Bar */}
        <div className="bg-neutral-950/80 border-b border-neutral-800 p-4 md:px-6 md:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
              {renderArchetypeIcon(activeArchetype.iconName, 22)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight">New Project Setup Wizard</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step {currentStep} of 4
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {currentStep === 1 && 'Select a playable genre archetype starter'}
                {currentStep === 2 && 'Calibrate dimension, camera projection, and control mechanics'}
                {currentStep === 3 && 'Configure networking and multiplayer topology'}
                {currentStep === 4 && 'Project identity, title, and initial seed'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-mono">
          {[
            { step: 1, label: '1. Genre' },
            { step: 2, label: '2. Dimension' },
            { step: 3, label: '3. Multiplayer' },
            { step: 4, label: '4. Identity' }
          ].map(s => {
            const isDone = currentStep > s.step;
            const isCurr = currentStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step as any)}
                className={`py-2 px-3 text-center border-b-2 font-bold transition flex items-center justify-center gap-1.5 ${
                  isCurr
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                    : isDone
                    ? 'border-emerald-500/60 text-emerald-400 hover:bg-neutral-800/40'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {isDone ? <Check size={12} className="text-emerald-400" /> : null}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* ======================================================== */}
          {/* STEP 1: CHOOSE GENRE ARCHETYPE */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'Action & Combat', 'Vehicular & Driving', 'Strategy & Tactics', 'RPG & Simulation'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                        selectedCategory === cat
                          ? 'bg-neutral-100 text-neutral-900 border-white shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search templates (e.g. Tenchu, Twisted Metal)..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Archetypes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredArchetypes.map(arch => {
                  const isSelected = selectedArchetypeId === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-neutral-950 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/90'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                                : 'bg-neutral-900 text-neutral-300 border-neutral-800 group-hover:scale-105'
                            }`}>
                              {renderArchetypeIcon(arch.iconName, 18)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {arch.name}
                                </h4>
                                {arch.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {arch.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-neutral-400">
                                {arch.shortTag} • {arch.category}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {arch.tagline}
                        </p>

                        <div className="text-[10px] text-neutral-400 font-mono bg-neutral-900/80 px-2 py-1 rounded-lg border border-neutral-800/80">
                          <span className="text-neutral-500">Inspiration: </span>
                          <span className="text-neutral-300">{arch.inspiration}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-800/60 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500">Dim:</span>
                          {arch.supportedDimensions.map(d => (
                            <span key={d} className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                              {d.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <div className="text-neutral-500">
                          {arch.supportedMultiplayer.length} MP Options
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: CHOOSE DIMENSION & REVIEW MECHANICS */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Select Visual Dimension & Camera Pipeline for {activeArchetype.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: '3d',
                      title: 'Full 3D Perspective',
                      desc: 'Three.js 3D viewport with perspective camera, 3D model meshes (.model3d), primitives, shadow maps, and freeform 3D physics.',
                      icon: <Box size={22} className="text-indigo-400" />
                    },
                    {
                      id: '2.5d',
                      title: '2.5D Isometric',
                      desc: 'Orthographic / isometric Three.js projection. Blends 3D structures with 2D billboard prefabs and tactical grid awareness.',
                      icon: <Grid size={22} className="text-purple-400" />
                    },
                    {
                      id: '2d',
                      title: '2D Pixel Art / Sidescroller',
                      desc: 'Pure 2D Metroidvania strata canvas with 7-layer parallax horizons, autotiling slope trims, and pixel-grid snapping.',
                      icon: <Map size={22} className="text-cyan-400" />
                    }
                  ].map(opt => {
                    const isSupported = activeArchetype.supportedDimensions.includes(opt.id as any);
                    const isSelected = dimension === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => isSupported && setDimension(opt.id as any)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition relative ${
                          !isSupported
                            ? 'opacity-40 bg-neutral-950 border-neutral-900 cursor-not-allowed'
                            : isSelected
                            ? 'bg-neutral-950 border-indigo-500 ring-2 ring-indigo-500/40 cursor-pointer shadow-lg'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                              {opt.icon}
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                          <h5 className="font-bold text-sm text-white">{opt.title}</h5>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">{opt.desc}</p>
                        </div>
                        {!isSupported && (
                          <span className="text-[10px] font-mono text-neutral-600 mt-2">
                            Not recommended for this archetype
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Starter Controls & Physics Preview */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Gamepad2 size={16} />
                  <span className="text-xs font-bold font-mono uppercase">Pre-Configured Starter Controls</span>
                </div>
                <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-200">
                  {activeArchetype.recommendedControls}
                </div>
              </div>

              {/* Core Key Mechanics Ready in Starter Project */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Playable Starter Mechanics Seeded in Project:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeArchetype.keyMechanics.map((mech, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/50 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-neutral-300 leading-snug">{mech}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: CHOOSE MULTIPLAYER TOPOLOGY */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Select Multiplayer Architecture for {activeArchetype.name}
                </h4>
                <p className="text-xs text-neutral-400">
                  Choose how instances interact and synchronize state. You can always recalibrate or export server code in the Multiplayer Hub (.multiplayer) later.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'singleplayer',
                    title: 'Single Player (Offline)',
                    badge: 'ZERO NETWORK OVERHEAD',
                    desc: 'Fully self-contained simulation running on client tick loop. Ideal for standalone story campaigns and puzzle games.',
                    icon: <Cpu size={20} className="text-neutral-400" />,
                    specs: '1 Player • 0ms Latency • Isolated State'
                  },
                  {
                    id: 'local_couch',
                    title: 'Local Multiplayer (Couch / Split-Screen)',
                    badge: 'SHARED / SPLIT SCREEN',
                    desc: 'Multiple local controllers sharing one screen with dynamic camera framing or multi-viewport split-screen rendering.',
                    icon: <Tv size={20} className="text-cyan-400" />,
                    specs: '2–4 Players • 0ms Latency • Shared Inputs'
                  },
                  {
                    id: 'p2p_coop',
                    title: 'Online P2P Co-Op (WebRTC)',
                    badge: 'SERVERLESS DIRECT CONNECT',
                    desc: 'Direct browser-to-browser DataChannels with host-guest handoffs. Zero server hosting cost, ideal for co-op campaigns.',
                    icon: <Wifi size={20} className="text-emerald-400" />,
                    specs: '2–8 Players • WebRTC Mesh • Host Migration'
                  },
                  {
                    id: 'dedicated_hub',
                    title: 'Dedicated Authoritative Server Hub',
                    badge: 'COMPETITIVE TICK SYNC',
                    desc: 'Central authoritative server running 60Hz tick loop with client-side prediction, entity interpolation, and lag compensation rewind.',
                    icon: <Server size={20} className="text-indigo-400" />,
                    specs: '16–64 Players • 60Hz Authoritative Tick • Anti-Cheat'
                  },
                  {
                    id: 'mmo_mesh',
                    title: 'Distributed Spatial MMO Server Mesh',
                    badge: 'MASSIVE SCALE',
                    desc: 'Multi-node server mesh with spatial zone boundaries, automatic player border handoffs, and Area-of-Interest entity filtering.',
                    icon: <Radio size={20} className="text-amber-400" />,
                    specs: '100–1000+ Players • Spatial AOI • Multi-Node Cluster'
                  }
                ].map(opt => {
                  const isSupported = activeArchetype.supportedMultiplayer.includes(opt.id as any);
                  const isSelected = multiplayerTopology === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => isSupported && setMultiplayerTopology(opt.id as any)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition relative ${
                        !isSupported
                          ? 'opacity-40 bg-neutral-950 border-neutral-900 cursor-not-allowed'
                          : isSelected
                          ? 'bg-neutral-950 border-indigo-500 ring-2 ring-indigo-500/40 cursor-pointer shadow-lg'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                              {opt.icon}
                            </div>
                            <h5 className="font-bold text-sm text-white">{opt.title}</h5>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-indigo-300 border border-neutral-800 inline-block">
                          {opt.badge}
                        </span>

                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400">
                        {opt.specs}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: PROJECT IDENTITY & SEED SUMMARY */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5">
              
              {/* Form Inputs */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-300 font-mono uppercase">Project Title</label>
                    <button
                      type="button"
                      onClick={handleRandomizeTitle}
                      className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      title="Generate a genre-specific title"
                    >
                      <Dices size={13} />
                      <span>Suggest Title</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Shadow of Kurogane"
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300 font-mono uppercase">Lead Creator / Studio</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="e.g. Mason Architect"
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300 font-mono uppercase">Synopsis & World Lore</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of the game concept..."
                    rows={3}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Seed Configuration Summary Card */}
              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                      Starter Configuration Ready
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-white border border-indigo-400/30">
                      {dimension.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {activeArchetype.name} ({multiplayerTopology.replace('_', ' ').toUpperCase()})
                  </div>
                  <p className="text-xs text-neutral-300">
                    Will seed working player controls, default map/scene geometry, and custom mechanics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition shrink-0"
                >
                  <Sparkles size={16} />
                  <span>Create & Launch Seed</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-neutral-950/80 border-t border-neutral-800 p-4 md:px-6 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition"
                >
                  Skip to Launch
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep + 1) as any)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Sparkles size={14} />
                <span>Create & Launch Project</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
