import React, { useState } from 'react';
import { useRefinedMapEditor } from '../hooks/useRefinedMapEditor';
import { RefinedMapCanvas } from './RefinedMapCanvas';
import { RefinedBiomeEditor } from './RefinedBiomeEditor';
import { ArchetypeEditor } from './ArchetypeEditor';
import { LayoutSwitcherModal, WorkspaceLayout } from './LayoutSwitcherModal';
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
  Sparkles,
  Sliders,
  Wand2,
  Brush,
  Crosshair,
  ShieldAlert,
  Zap,
  Music,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const EditorLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'biomes' | 'archetypes' | 'foci' | 'combat'>('map');
  const [layoutStyle, setLayoutStyle] = useState<WorkspaceLayout>('classic');
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [showDamageMasks, setShowDamageMasks] = useState(true);

  const {
    biomes,
    setBiomes,
    activeBiomeId,
    setActiveBiomeId,
    activeBiome,
    mapData,
    setMapData,
    mode,
    setMode,
    paintCategory,
    setPaintCategory,
    selectedAssetId,
    setSelectedAssetId,
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    isDrawing,
    setIsDrawing,
    applyTool,
    autoScatterEnvironmental,
    setAutoScatterEnvironmental,
    autoScatterWildlife,
    setAutoScatterWildlife,
    generateBiomeWorld
  } = useRefinedMapEditor();

  const handleInteract = (x: number, y: number) => {
    if (mode === 'paint') {
      applyTool(x, y);
    }
  };

  const handleExport = () => {
    const exportData = {
      engine_version: '2.0-refined-biomes',
      tile_size_px: 64,
      map: mapData,
      biomes: biomes,
      active_biome_id: activeBiomeId
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mourne_refined_world.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSelectBiomeToPaint = (biomeId: string, tileTypeId?: string) => {
    setActiveBiomeId(biomeId);
    const targetBiome = biomes.find(b => b.id === biomeId);
    if (targetBiome) {
      setPaintCategory('tile_type');
      setSelectedAssetId(tileTypeId || targetBiome.primaryTileTypeId || targetBiome.tileTypes[0]?.id);
    }
    setActiveTab('map');
  };

  const renderToolRail = (isVertical = true, compact = false) => (
    <div className={`flex ${isVertical ? 'flex-col gap-2' : 'flex-row gap-1.5'} items-center`}>
      <button 
        title="Brush (B)"
        onClick={() => setActiveTool('brush')}
        className={`p-2.5 rounded-xl flex justify-center items-center transition-all ${
          activeTool === 'brush' 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
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
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
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
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Eraser size={compact ? 18 : 20} strokeWidth={1.75} />
      </button>
    </div>
  );

  const renderPaletteContent = () => (
    <div className="space-y-5 text-xs">
      
      {/* Biome Quick-Switcher */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-neutral-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <TreePine size={13} className="text-emerald-400" />
            Active Biome Context
          </label>
          <button
            onClick={() => setActiveTab('biomes')}
            className="text-[10px] text-emerald-400 hover:underline"
          >
            Configure Biomes →
          </button>
        </div>
        <select
          value={activeBiomeId}
          onChange={(e) => {
            setActiveBiomeId(e.target.value);
            const b = biomes.find(item => item.id === e.target.value);
            if (b && b.tileTypes.length > 0) {
              setPaintCategory('tile_type');
              setSelectedAssetId(b.tileTypes[0].id);
            }
          }}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-200 outline-none"
        >
          {biomes.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Paint Category Tabs */}
      <div>
        <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => {
              setPaintCategory('tile_type');
              if (activeBiome.tileTypes[0]) setSelectedAssetId(activeBiome.tileTypes[0].id);
            }}
            className={`py-1 rounded text-[10px] font-bold uppercase transition ${
              paintCategory === 'tile_type' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tiles
          </button>
          <button
            onClick={() => {
              setPaintCategory('environmental');
              if (activeBiome.environmentalDetails[0]) setSelectedAssetId(activeBiome.environmentalDetails[0].id);
            }}
            className={`py-1 rounded text-[10px] font-bold uppercase transition ${
              paintCategory === 'environmental' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Flora/Rock
          </button>
          <button
            onClick={() => {
              setPaintCategory('interactive');
              if (activeBiome.interactiveDetails[0]) setSelectedAssetId(activeBiome.interactiveDetails[0].id);
            }}
            className={`py-1 rounded text-[10px] font-bold uppercase transition ${
              paintCategory === 'interactive' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Interactive
          </button>
          <button
            onClick={() => {
              setPaintCategory('wildlife');
              if (activeBiome.wildlife[0]) setSelectedAssetId(activeBiome.wildlife[0].id);
            }}
            className={`py-1 rounded text-[10px] font-bold uppercase transition ${
              paintCategory === 'wildlife' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Wildlife
          </button>
        </div>
      </div>

      {/* Asset Grid for Selected Category */}
      <div>
        {paintCategory === 'tile_type' && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              64px Dual-Noise Tile Types ({activeBiome.tileTypes.length})
            </span>
            <div className="grid grid-cols-1 gap-2">
              {activeBiome.tileTypes.map(tt => (
                <button
                  key={tt.id}
                  onClick={() => setSelectedAssetId(tt.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    selectedAssetId === tt.id
                      ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-md border border-white/20 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: tt.baseMaterialA.albedoColor }}
                    />
                    <div>
                      <span className="font-semibold text-xs block text-neutral-200">{tt.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        HP {tt.health} | Noise {tt.blendMap.noiseA.scale}/{tt.blendMap.noiseB.scale}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {paintCategory === 'environmental' && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Non-Tile Flora & Rocks ({activeBiome.environmentalDetails.length})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeBiome.environmentalDetails.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedAssetId(env.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    selectedAssetId === env.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span className="text-2xl">{env.icon}</span>
                  <span className="font-medium text-[11px] truncate w-full text-center">{env.name}</span>
                  <span className="text-[9px] text-neutral-500">{env.widthTiles}x{env.heightTiles}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {paintCategory === 'interactive' && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Interactive Placements ({activeBiome.interactiveDetails.length})
            </span>
            <div className="grid grid-cols-1 gap-2">
              {activeBiome.interactiveDetails.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedAssetId(item.id)}
                  className={`p-2 rounded-xl border flex items-center gap-2.5 transition text-left ${
                    selectedAssetId === item.id
                      ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <span className="font-semibold text-xs text-neutral-200 block">{item.name}</span>
                    <span className="text-[10px] text-blue-400 font-mono">{item.interactionPrompt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {paintCategory === 'wildlife' && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Wildlife & Ambient Fauna ({activeBiome.wildlife.length})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeBiome.wildlife.map(fauna => (
                <button
                  key={fauna.id}
                  onClick={() => setSelectedAssetId(fauna.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                    selectedAssetId === fauna.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span className="text-xl">{fauna.icon}</span>
                  <span className="font-medium text-[11px] truncate w-full text-center">{fauna.name}</span>
                  <span className="text-[9px] text-cyan-400">{Math.round(fauna.spawnFrequency * 100)}% spawn</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-Scatter & Controls */}
      <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
            <TreePine size={13} className="text-emerald-400" />
            Auto-Scatter Flora/Rocks
          </span>
          <input
            type="checkbox"
            checked={autoScatterEnvironmental}
            onChange={(e) => setAutoScatterEnvironmental(e.target.checked)}
            className="rounded accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            Auto-Scatter Wildlife
          </span>
          <input
            type="checkbox"
            checked={autoScatterWildlife}
            onChange={(e) => setAutoScatterWildlife(e.target.checked)}
            className="rounded accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-neutral-400">Brush Radius</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  brushSize === size ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Procedural Generation Button */}
      <button
        onClick={generateBiomeWorld}
        className="w-full py-2.5 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 hover:from-emerald-900/60 hover:to-teal-900/60 border border-emerald-700/50 text-emerald-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
      >
        <Wand2 size={14} className="text-emerald-400" />
        Generate Procedural Biome World
      </button>

    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg flex items-center justify-center font-black text-white shadow-md shadow-emerald-600/30">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-wide text-neutral-100">Mason</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  64px-PBR
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-none">Mourne Edris IDE & Game Framework</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800">
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'map' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MapIcon size={14} /> World Canvas (64px)
            </button>
            <button 
              onClick={() => setActiveTab('biomes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'biomes' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <TreePine size={14} className="text-emerald-400" /> Biome Architect
            </button>
            <button 
              onClick={() => setActiveTab('archetypes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'archetypes' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users size={14} /> Archetypes
            </button>
            <button 
              onClick={() => setActiveTab('combat')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'combat' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Swords size={14} /> Damage & Modalities
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'map' && (
            <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 mr-2">
              <button 
                onClick={() => setMode('paint')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'paint' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <PenTool size={13} /> Author
              </button>
              <button 
                onClick={() => setMode('play')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'play' ? 'bg-teal-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Play size={13} /> Simulation
              </button>
            </div>
          )}

          <button
            onClick={() => setIsLayoutModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Layout size={14} className="text-emerald-400" />
            <span className="capitalize">{layoutStyle.replace('_', ' ')}</span>
          </button>

          <button 
            onClick={handleExport} 
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition" 
            title="Export 64px Level Manifest (JSON)"
          >
            <Save size={17} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'map' && (
          <>
            {layoutStyle === 'classic' && (
              <>
                <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur flex flex-col items-center py-4 shrink-0 z-10">
                  {renderToolRail(true, false)}
                </aside>

                <main className="flex-1 bg-neutral-950 relative overflow-hidden flex flex-col">
                  {mode === 'paint' ? (
                    <RefinedMapCanvas 
                      mapData={mapData} 
                      biomes={biomes}
                      onTileInteract={handleInteract}
                      isDrawing={isDrawing}
                      setIsDrawing={setIsDrawing}
                      showGrid={true}
                      showDamageMasks={showDamageMasks}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-4 text-neutral-400">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-xl">
                        <Play size={32} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-neutral-200">Simulation Scaffolding Active</h3>
                        <p className="text-sm text-neutral-400 max-w-sm mt-1">
                          64px world grid active. Soundtrack: <code className="text-emerald-400">{activeBiome.soundtrack.ambientExplorationTrack}</code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute bottom-4 left-4 pointer-events-none z-20">
                    <div className="bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-300 shadow-xl flex items-center gap-3">
                      <span className="font-mono text-emerald-400">{mapData.width}×{mapData.height} (64px Tiles)</span>
                      <span className="text-neutral-600">•</span>
                      <span>Biome: <strong className="text-white">{activeBiome.name}</strong></span>
                      <span className="text-neutral-600">•</span>
                      <span>Tool: <strong className="text-emerald-400 capitalize">{paintCategory} ({selectedAssetId})</strong></span>
                    </div>
                  </div>
                </main>

                <aside className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col shrink-0 z-10">
                  <div className="p-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-sm text-neutral-200">Biome Palette & Scatter</h2>
                    <p className="text-[11px] text-neutral-400 mt-0.5">2-Material Dual-Noise World Tiles</p>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                    {renderPaletteContent()}
                  </div>
                </aside>
              </>
            )}

            {layoutStyle !== 'classic' && (
              <div className="relative w-full h-full overflow-hidden bg-neutral-950 flex">
                <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur flex flex-col items-center py-4 shrink-0 z-10">
                  {renderToolRail(true, false)}
                </aside>
                <div className="flex-1 relative">
                  <RefinedMapCanvas 
                    mapData={mapData} 
                    biomes={biomes}
                    onTileInteract={handleInteract}
                    isDrawing={isDrawing}
                    setIsDrawing={setIsDrawing}
                    showGrid={true}
                    showDamageMasks={showDamageMasks}
                  />
                </div>
                <aside className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col shrink-0 z-10 p-4 overflow-y-auto">
                  {renderPaletteContent()}
                </aside>
              </div>
            )}
          </>
        )}

        {/* BIOME ARCHITECT TAB */}
        {activeTab === 'biomes' && (
          <RefinedBiomeEditor 
            biomes={biomes}
            onUpdateBiomes={setBiomes}
            onSelectForPainting={handleSelectBiomeToPaint}
            activePaintBiomeId={activeBiomeId}
          />
        )}

        {/* ARCHETYPES TAB */}
        {activeTab === 'archetypes' && <ArchetypeEditor />}

        {/* COMBAT & MODALITY */}
        {activeTab === 'combat' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
              <Swords size={32} />
            </div>
            <h2 className="text-xl font-bold text-neutral-200">8-Point Modality & Destructible Resolver</h2>
            <p className="text-sm text-neutral-400 max-w-md mt-2">
              Damage pipeline for environmental flora, destructible 64px tiles, wildlife, and combat entities.
            </p>
          </div>
        )}
      </div>

      {/* Layout Switcher Modal */}
      <LayoutSwitcherModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        currentLayout={layoutStyle}
        onSelectLayout={(layout) => setLayoutStyle(layout)}
      />
    </div>
  );
};
