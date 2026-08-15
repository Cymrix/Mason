import React, { useState } from 'react';
import { useMapEditor } from '../hooks/useMapEditor';
import { MapCanvas } from './MapCanvas';
import { ArchetypeEditor } from './ArchetypeEditor';
import { BiomeEditor } from './BiomeEditor';
import { LayoutSwitcherModal, WorkspaceLayout } from './LayoutSwitcherModal';
import { PALETTE } from '../constants';
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  Layers, 
  Play, 
  PenTool, 
  Save, 
  Settings,
  Map as MapIcon,
  TreePine,
  Users,
  Swords,
  Box,
  Layout,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  Wand2,
  Brush
} from 'lucide-react';

export const EditorLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'biomes' | 'archetypes' | 'foci' | 'combat'>('map');
  const [layoutStyle, setLayoutStyle] = useState<WorkspaceLayout>('classic');
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);

  const {
    mapData,
    biomes,
    setBiomes,
    activeBiomeId,
    setActiveBiomeId,
    mode,
    setMode,
    activeLayer,
    setActiveLayer,
    activeTool,
    setActiveTool,
    selectedTile,
    setSelectedTile,
    isDrawing,
    setIsDrawing,
    applyTool,
    brushSize,
    setBrushSize,
    autoScatterEnabled,
    setAutoScatterEnabled,
    generateWorldTemplate
  } = useMapEditor();

  const handleInteract = (x: number, y: number) => {
    if (mode === 'paint') {
      applyTool(x, y);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ mapData, biomes }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mason_world_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSelectBiomeToPaint = (biomeId: string) => {
    setActiveBiomeId(biomeId);
    setSelectedTile(biomeId);
    setActiveLayer('procedural');
    setActiveTab('map');
  };

  const activeBiome = biomes.find(b => b.id === activeBiomeId || b.id === selectedTile) || biomes[0];

  const renderToolRail = (isVertical = true, compact = false) => (
    <div className={`flex ${isVertical ? 'flex-col gap-2' : 'flex-row gap-1.5'} items-center`}>
      <button 
        title="Brush (B)"
        onClick={() => setActiveTool('brush')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all ${
          activeTool === 'brush' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Paintbrush size={compact ? 18 : 20} strokeWidth={1.75} />
      </button>
      <button 
        title="Bucket Fill (G)"
        onClick={() => setActiveTool('bucket')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all ${
          activeTool === 'bucket' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <PaintBucket size={compact ? 18 : 20} strokeWidth={1.75} />
      </button>
      <button 
        title="Eraser (E)"
        onClick={() => setActiveTool('eraser')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all ${
          activeTool === 'eraser' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Eraser size={compact ? 18 : 20} strokeWidth={1.75} />
      </button>

      <div className={`${isVertical ? 'w-6 h-px my-1' : 'w-px h-6 mx-1'} bg-neutral-800`} />

      <button 
        title="Procedural Layer (Canvas Template)"
        onClick={() => setActiveLayer('procedural')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all relative ${
          activeLayer === 'procedural' 
            ? 'bg-amber-600/25 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Layers size={compact ? 18 : 20} strokeWidth={1.75} />
        <span className="absolute bottom-1 right-1 text-[9px] font-black bg-amber-500 text-black px-1 rounded-sm leading-none">P</span>
      </button>
      <button 
        title="Manual Placement Layer (Overrides Procedural)"
        onClick={() => setActiveLayer('manual')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all relative ${
          activeLayer === 'manual' 
            ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Layers size={compact ? 18 : 20} strokeWidth={1.75} />
        <span className="absolute bottom-1 right-1 text-[9px] font-black bg-purple-500 text-white px-1 rounded-sm leading-none">M</span>
      </button>
    </div>
  );

  const renderPaletteContent = () => (
    <div className="space-y-5">
      
      {/* Biomes Section (Core Painting Source) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <TreePine size={14} className="text-emerald-400" />
            Active Biomes ({biomes.length})
          </h3>
          <button
            onClick={() => setActiveTab('biomes')}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            Configure
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {biomes.map(biome => {
            const isSelected = selectedTile === biome.id || activeBiomeId === biome.id;
            return (
              <button
                key={biome.id}
                onClick={() => {
                  setSelectedTile(biome.id);
                  setActiveBiomeId(biome.id);
                  if (activeLayer === 'manual') setActiveLayer('procedural');
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500/40' 
                    : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-6 h-6 rounded-lg border border-white/10 shadow"
                    style={{ backgroundColor: biome.accentColor }}
                  />
                  <div className="text-left">
                    <span className="font-semibold text-xs text-neutral-200 block truncate max-w-[130px]">
                      {biome.name}
                    </span>
                    <span className="text-[10px] text-neutral-500">{biome.decorItems.length} scatter rules</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-Scatter & Brush Tuning */}
      <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Auto-Scatter Detail Decor
          </span>
          <input
            type="checkbox"
            checked={autoScatterEnabled}
            onChange={(e) => setAutoScatterEnabled(e.target.checked)}
            className="rounded accent-blue-500 cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-neutral-500 leading-tight">
          When enabled, painting with a biome automatically places its configured rocks, vegetation, and detail objects based on appearance frequency.
        </p>

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">Brush Size</span>
          <div className="flex items-center gap-1">
            {[1, 3, 5].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  brushSize === size ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Detail & Destructible Objects Palette */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Box size={14} className="text-purple-400" />
            Detail & Decor Palette
          </h3>
          <span className="text-[10px] text-neutral-500 font-mono">Manual Overrides</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Active Biome Decor Items */}
          {activeBiome?.decorItems.map(decor => (
            <button
              key={decor.id}
              onClick={() => {
                setSelectedTile(decor.id);
                setActiveLayer('manual');
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-all ${
                selectedTile === decor.id 
                  ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/40' 
                  : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <div 
                className="w-10 h-8 rounded-md shadow-inner flex items-center justify-center border border-white/10 text-sm"
                style={{ backgroundColor: decor.color }}
              >
                {decor.icon}
              </div>
              <span className="truncate w-full text-center font-medium">{decor.name}</span>
            </button>
          ))}

          {/* Legacy Objects */}
          {PALETTE.filter(t => t.type === 'object').map(tile => (
            <button
              key={tile.id}
              onClick={() => {
                setSelectedTile(tile.id);
                setActiveLayer('manual');
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-all ${
                selectedTile === tile.id 
                  ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/40' 
                  : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <div 
                className="w-10 h-8 rounded-md shadow-inner flex items-center justify-center border border-white/10"
                style={{ backgroundColor: tile.color }}
              >
                <div className="w-4 h-4 border-2 border-black/40 rounded-sm"></div>
              </div>
              <span className="truncate w-full text-center font-medium">{tile.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Procedural Generation Trigger */}
      <div className="pt-2">
        <button
          onClick={generateWorldTemplate}
          className="w-full py-2.5 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/60 hover:to-indigo-900/60 border border-blue-700/50 text-blue-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
        >
          <Wand2 size={14} className="text-blue-400" />
          Generate Macro Procedural World
        </button>
      </div>

    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center font-black text-white shadow-md shadow-blue-600/30">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-wide text-neutral-100">Mason</h1>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                  v0.4-web
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-none">Mourne Edris IDE & Game Framework</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800">
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'map' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MapIcon size={14} /> World Authoring
            </button>
            <button 
              onClick={() => setActiveTab('biomes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'biomes' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <TreePine size={14} className="text-emerald-400" /> Biomes
            </button>
            <button 
              onClick={() => setActiveTab('archetypes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'archetypes' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users size={14} /> Archetypes
            </button>
            <button 
              onClick={() => setActiveTab('foci')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'foci' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Box size={14} /> Foci Library
            </button>
            <button 
              onClick={() => setActiveTab('combat')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'combat' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Swords size={14} /> Combat Rules
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'map' && (
            <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 mr-2">
              <button 
                onClick={() => setMode('paint')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'paint' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <PenTool size={13} /> Author
              </button>
              <button 
                onClick={() => setMode('play')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'play' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Play size={13} /> Play Test
              </button>
            </div>
          )}

          {/* UI Layout Picker Button */}
          <button
            onClick={() => setIsLayoutModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition shadow-sm"
            title="Switch Workspace UI Layout"
          >
            <Layout size={14} className="text-blue-400" />
            <span className="capitalize">{layoutStyle.replace('_', ' ')} Layout</span>
          </button>

          <button 
            onClick={handleExport} 
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition" 
            title="Export World Config JSON"
          >
            <Save size={17} />
          </button>
          <button 
            onClick={() => setIsLayoutModalOpen(true)}
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            title="Workspace Options"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'map' && (
          <>
            {/* 1. CLASSIC DUAL-SIDEBAR LAYOUT */}
            {layoutStyle === 'classic' && (
              <>
                {/* Left Tool Rail */}
                <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur flex flex-col items-center py-4 shrink-0 z-10">
                  {renderToolRail(true, false)}
                </aside>

                {/* Center Canvas */}
                <main className="flex-1 bg-neutral-950 relative overflow-hidden flex flex-col">
                  {mode === 'paint' ? (
                    <MapCanvas 
                      mapData={mapData} 
                      biomes={biomes}
                      onTileInteract={handleInteract}
                      isDrawing={isDrawing}
                      setIsDrawing={setIsDrawing}
                      showGrid={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-4 text-neutral-400">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-xl">
                        <Play size={32} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-neutral-200">Play/Test Simulation Active</h3>
                        <p className="text-sm text-neutral-400 max-w-sm mt-1">
                          Full simulation scaffolding with real archetype binding stone swaps and traversal testing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute bottom-4 left-4 pointer-events-none z-20">
                    <div className="bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-300 shadow-xl flex items-center gap-3">
                      <span className="font-mono text-blue-400">{mapData.width}×{mapData.height} Grid</span>
                      <span className="text-neutral-600">•</span>
                      <span>Active Layer: <strong className="text-white capitalize">{activeLayer}</strong></span>
                      <span className="text-neutral-600">•</span>
                      <span>Active Biome: <strong className="text-emerald-400">{activeBiome?.name}</strong></span>
                    </div>
                  </div>
                </main>

                {/* Right Inspector / Palette */}
                {mode === 'paint' && (
                  <aside className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col shrink-0 z-10">
                    <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-sm text-neutral-200">Biomes & World Palette</h2>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Paint biomes, templates & detail scatter</p>
                      </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {renderPaletteContent()}
                    </div>
                    <div className="p-4 border-t border-neutral-800 bg-neutral-900/90">
                      <button className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition border border-neutral-700 shadow-sm flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-amber-400" />
                        Bake Lighting & Height Blends
                      </button>
                    </div>
                  </aside>
                )}
              </>
            )}

            {/* 2. GODOT/ENGINE FLOATING PANELS LAYOUT */}
            {layoutStyle === 'floating' && (
              <div className="relative w-full h-full overflow-hidden bg-neutral-950">
                <div className="absolute inset-0">
                  {mode === 'paint' ? (
                    <MapCanvas 
                      mapData={mapData} 
                      biomes={biomes}
                      onTileInteract={handleInteract}
                      isDrawing={isDrawing}
                      setIsDrawing={setIsDrawing}
                      showGrid={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-4 text-neutral-400">
                      <Play size={40} className="text-emerald-500" />
                      <p>Play mode active</p>
                    </div>
                  )}
                </div>

                <div className="absolute top-4 left-4 z-30 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-2 shadow-2xl">
                  {renderToolRail(false, true)}
                </div>

                {mode === 'paint' && (
                  <div className="absolute top-4 right-4 z-30 w-80 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
                    <div 
                      onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
                      className="p-3 bg-neutral-800/80 border-b border-neutral-700/60 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders size={14} className="text-blue-400" />
                        <span className="font-semibold text-xs text-neutral-200">Biomes & Palette</span>
                      </div>
                      {isPaletteCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>

                    {!isPaletteCollapsed && (
                      <>
                        <div className="p-3.5 overflow-y-auto flex-1">
                          {renderPaletteContent()}
                        </div>
                        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
                          <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition">
                            Bake Pre-publish
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. BOTTOM DOCK CONTENT BROWSER LAYOUT */}
            {layoutStyle === 'bottom_dock' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                  <aside className="w-14 border-r border-neutral-800 bg-neutral-900 flex flex-col items-center py-3 shrink-0">
                    {renderToolRail(true, true)}
                  </aside>

                  <main className="flex-1 bg-neutral-950 relative overflow-hidden">
                    <MapCanvas 
                      mapData={mapData} 
                      biomes={biomes}
                      onTileInteract={handleInteract}
                      isDrawing={isDrawing}
                      setIsDrawing={setIsDrawing}
                      showGrid={true}
                    />
                  </main>
                </div>

                {mode === 'paint' && (
                  <div className="h-56 border-t border-neutral-800 bg-neutral-900/95 backdrop-blur flex flex-col shrink-0">
                    <div className="px-4 py-2 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-neutral-300">
                        <TreePine size={14} className="text-emerald-400" />
                        <span>Biomes & Detail Asset Browser</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('biomes')}
                        className="text-[11px] text-blue-400 hover:underline"
                      >
                        Open Biome Editor →
                      </button>
                    </div>
                    
                    <div className="p-3 overflow-x-auto flex gap-4 items-center flex-1">
                      {biomes.map(biome => (
                        <button
                          key={biome.id}
                          onClick={() => {
                            setSelectedTile(biome.id);
                            setActiveBiomeId(biome.id);
                          }}
                          className={`flex flex-col items-center justify-center w-36 h-32 p-2 rounded-xl border text-xs shrink-0 transition-all ${
                            selectedTile === biome.id 
                              ? 'bg-blue-950/50 border-blue-500 text-white ring-2 ring-blue-500/40' 
                              : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <div 
                            className="w-12 h-12 rounded-xl mb-2 shadow flex items-center justify-center text-lg"
                            style={{ backgroundColor: biome.accentColor }}
                          >
                            <TreePine size={20} className="text-white" />
                          </div>
                          <span className="truncate w-full text-center text-xs font-semibold">{biome.name}</span>
                          <span className="text-[9px] text-neutral-500">{biome.decorItems.length} decor rules</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. MINIMALIST ZEN LAYOUT */}
            {layoutStyle === 'zen' && (
              <div className="relative w-full h-full overflow-hidden bg-neutral-950">
                <div className="absolute inset-0">
                  <MapCanvas 
                    mapData={mapData} 
                    biomes={biomes}
                    onTileInteract={handleInteract}
                    isDrawing={isDrawing}
                    setIsDrawing={setIsDrawing}
                    showGrid={true}
                  />
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3">
                  {renderToolRail(false, true)}
                  <div className="w-px h-5 bg-neutral-700" />
                  <div className="flex items-center gap-1.5">
                    {biomes.map(biome => (
                      <button
                        key={biome.id}
                        onClick={() => {
                          setSelectedTile(biome.id);
                          setActiveBiomeId(biome.id);
                        }}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          selectedTile === biome.id ? 'scale-125 border-white shadow-lg' : 'border-black/50 hover:scale-110'
                        }`}
                        style={{ backgroundColor: biome.accentColor }}
                        title={biome.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* BIOMES CONFIGURATION TAB */}
        {activeTab === 'biomes' && (
          <BiomeEditor 
            biomes={biomes}
            onUpdateBiomes={setBiomes}
            onSelectActiveBiomeForPainting={handleSelectBiomeToPaint}
            activePaintBiomeId={activeBiomeId}
          />
        )}

        {/* ARCHETYPES TAB */}
        {activeTab === 'archetypes' && <ArchetypeEditor />}
        
        {/* FOCI TAB */}
        {activeTab === 'foci' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-blue-400 mb-4 shadow-xl">
              <Box size={32} />
            </div>
            <h2 className="text-xl font-bold text-neutral-200">Foci Library & Deviations</h2>
            <p className="text-sm text-neutral-400 max-w-md mt-2">
              Configure each singular focus and its 9 variants (1 base + 8 deviations like napalm, bouncing orbs, cryo conversions) without changing progression gates.
            </p>
          </div>
        )}

        {/* COMBAT TAB */}
        {activeTab === 'combat' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400 mb-4 shadow-xl">
              <Swords size={32} />
            </div>
            <h2 className="text-xl font-bold text-neutral-200">8-Point Modality & RPS Resolver</h2>
            <p className="text-sm text-neutral-400 max-w-md mt-2">
              Damage pipeline: <code>attack_damage → RPS multiplier → armor deduction → final value</code> for both enemy entities and destructible terrain.
            </p>
          </div>
        )}
      </div>

      {/* Layout Selection Modal */}
      <LayoutSwitcherModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        currentLayout={layoutStyle}
        onSelectLayout={(layout) => setLayoutStyle(layout)}
      />
    </div>
  );
};
