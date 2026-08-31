import React from 'react';
import { MasonProject } from '../engine/masonProjectSchema';
import { MASON_FULL_VERSION, MASON_VERSION_DISPLAY } from '../version';
import { useAppTheme } from '../theme/ThemeContext';
import { getContrastTextColor } from '../theme/appTheme';
import { ProjectTaskBoard } from './dashboard/ProjectTaskBoard';
import { 
  Folder, 
  FileCode, 
  Clock, 
  User, 
  Edit3, 
  Sparkles, 
  Layers, 
  Compass, 
  Download, 
  Settings,
  Map,
  TreePine,
  Users,
  Sliders,
  Network,
  Palette,
  Paintbrush
} from 'lucide-react';

interface ProjectDashboardProps {
  project: MasonProject;
  onUpdateProject: (updated: MasonProject) => void;
  onLaunchModule: (moduleId: string) => void;
  onOpenExplorer: () => void;
  onOpenModulesModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenAppProfileConfigModal?: () => void;
  onExportBundle: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onUpdateProject,
  onLaunchModule,
  onOpenExplorer,
  onOpenModulesModal,
  onOpenThemeModal,
  onOpenAppProfileConfigModal,
  onExportBundle
}) => {
  const [isEditingMetadata, setIsEditingMetadata] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [author, setAuthor] = React.useState(project.author || 'Mason Architect');
  const [description, setDescription] = React.useState(project.description || '');

  const { theme, primaryDef, bgDef, getModuleColorDef } = useAppTheme();

  const handleSaveMetadata = () => {
    onUpdateProject({
      ...project,
      name,
      author,
      description
    });
    setIsEditingMetadata(false);
  };

  const mapCount = project.fileSystem?.maps?.length || 0;
  const biomeCount = project.fileSystem?.biomes?.length || 0;
  const prefabCount = project.fileSystem?.prefabs?.length || 0;
  const particleCount = project.fileSystem?.particles?.length || 0;
  const uiCount = project.fileSystem?.ui?.length || 0;
  const gameCount = project.fileSystem?.game?.length || 0;
  const spriteCount = project.fileSystem?.sprites?.length || 0;
  const imageCount = project.fileSystem?.images?.length || 0;

  const currentMapFile = project.fileSystem?.maps?.find(m => m.fileName === project.activeFiles?.mapFileName) || project.fileSystem?.maps?.[0];
  const activeMapName = currentMapFile?.name || 'World Level Map';

  const totalFiles = mapCount + biomeCount + prefabCount + particleCount + uiCount + gameCount + spriteCount + imageCount;

  // Module color definitions
  const spritesColor = getModuleColorDef('sprites');
  const mapsColor = getModuleColorDef('maps');
  const biomesColor = getModuleColorDef('biomes');
  const prefabsColor = getModuleColorDef('prefabs');
  const particlesColor = getModuleColorDef('particles');
  const uiColor = getModuleColorDef('ui');
  const gameColor = getModuleColorDef('gamestructure');

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 select-none max-w-6xl mx-auto w-full transition-colors duration-200"
      style={{ backgroundColor: bgDef.hex }}
    >
      
      {/* Project Banner & Overview */}
      <div 
        className="relative overflow-hidden rounded-3xl border p-6 md:p-8 shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: bgDef.cardHex,
          borderColor: bgDef.borderHex
        }}
      >
        {/* Dynamic Glow backdrop */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20"
          style={{ backgroundColor: primaryDef.hex }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.35)`,
                  color: primaryDef.hex
                }}
              >
                Active Mason Project
              </span>
              <span 
                className="text-xs font-mono text-neutral-400 border px-2 py-0.5 rounded"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                {MASON_VERSION_DISPLAY}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-neutral-100 tracking-tight">
              {project.name}
            </h1>

            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {project.description || '2D Metroidvania project with modular level design, 7-layer parallax biomes, prefabs, and game flow architecture.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-500" />
                <span className="text-neutral-300">{project.author || 'Mason Architect'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-neutral-500" />
                <span>Updated: {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Folder size={13} className="text-neutral-500" />
                <span style={{ color: primaryDef.hex }} className="font-bold">{totalFiles} Project Files</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenModulesModal}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl flex items-center justify-center gap-2 transition active:scale-95"
              style={{
                backgroundColor: primaryDef.hex,
                color: getContrastTextColor(primaryDef),
                boxShadow: `0 10px 20px -5px rgba(${primaryDef.rgb}, 0.35)`
              }}
            >
              <span>🧩 Open Modules Directory</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenExplorer}
                className="flex-1 px-4 py-2 rounded-2xl border text-neutral-300 text-xs font-bold flex items-center justify-center gap-2 transition hover:text-white"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                <span>📂 Files Hub</span>
              </button>

              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={onOpenThemeModal}
                  className="px-3.5 py-2 rounded-2xl border text-neutral-300 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:text-white"
                  style={{
                    backgroundColor: bgDef.hex,
                    borderColor: bgDef.borderHex
                  }}
                  title="Customize Theme & Colors"
                >
                  <Palette size={14} style={{ color: primaryDef.hex }} />
                  <span className="hidden sm:inline">Theme</span>
                </button>
              )}

              {onOpenAppProfileConfigModal && (
                <button
                  type="button"
                  onClick={onOpenAppProfileConfigModal}
                  className="px-3.5 py-2 rounded-2xl border text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:text-white bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                  title="User Profiles & App Configuration"
                >
                  <User size={14} className="text-amber-400" />
                  <span>User Profiles & Config</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="px-5 py-1.5 rounded-xl text-neutral-400 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition"
            >
              <Edit3 size={12} />
              <span>{isEditingMetadata ? 'Close Settings' : 'Edit Project Details'}</span>
            </button>
          </div>
        </div>

        {/* Project Metadata Edit Form (Collapsible) */}
        {isEditingMetadata && (
          <div 
            className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200"
            style={{ borderColor: bgDef.borderHex }}
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Lead Author / Studio</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingMetadata(false)}
                className="px-4 py-1.5 rounded-xl text-neutral-400 border hover:text-white text-xs"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetadata}
                className="px-4 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: primaryDef.hex,
                  color: getContrastTextColor(primaryDef)
                }}
              >
                Save Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Module Overview Cards - Vertical stack: Upper Right Number, Icon -> Extension -> Module Name */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5 w-full mx-auto">
        {/* Image Editor */}
        <div 
          onClick={() => onLaunchModule('sprites')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = spritesColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Image & Sprite Studio (.sprite)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-right font-mono group-hover:scale-105 transition-transform">
            <div className="text-lg font-black text-white">{spriteCount}</div>
            {imageCount > 0 && (
              <div className="text-[10px] text-amber-400 font-bold">{imageCount} png</div>
            )}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${spritesColor.rgb}, 0.2)`,
              borderColor: `rgba(${spritesColor.rgb}, 0.4)`,
              color: spritesColor.hex
            }}
          >
            <Paintbrush size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${spritesColor.rgb}, 0.15)`,
              borderColor: `rgba(${spritesColor.rgb}, 0.3)`,
              color: spritesColor.hex
            }}
          >
            .sprite
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Image Editor
          </div>
        </div>

        {/* Maps */}
        <div 
          onClick={() => onLaunchModule('maps')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = mapsColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Maps (.map)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {mapCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${mapsColor.rgb}, 0.2)`,
              borderColor: `rgba(${mapsColor.rgb}, 0.4)`,
              color: mapsColor.hex
            }}
          >
            <Map size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${mapsColor.rgb}, 0.15)`,
              borderColor: `rgba(${mapsColor.rgb}, 0.3)`,
              color: mapsColor.hex
            }}
          >
            .map
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Maps
          </div>
        </div>

        {/* Biomes */}
        <div 
          onClick={() => onLaunchModule('biomes')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = biomesColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Biomes (.biome)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {biomeCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${biomesColor.rgb}, 0.2)`,
              borderColor: `rgba(${biomesColor.rgb}, 0.4)`,
              color: biomesColor.hex
            }}
          >
            <TreePine size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${biomesColor.rgb}, 0.15)`,
              borderColor: `rgba(${biomesColor.rgb}, 0.3)`,
              color: biomesColor.hex
            }}
          >
            .biome
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Biomes
          </div>
        </div>

        {/* Prefabs */}
        <div 
          onClick={() => onLaunchModule('prefabs')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = prefabsColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Prefabs (.prefab)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {prefabCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${prefabsColor.rgb}, 0.2)`,
              borderColor: `rgba(${prefabsColor.rgb}, 0.4)`,
              color: prefabsColor.hex
            }}
          >
            <Users size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${prefabsColor.rgb}, 0.15)`,
              borderColor: `rgba(${prefabsColor.rgb}, 0.3)`,
              color: prefabsColor.hex
            }}
          >
            .prefab
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Prefabs
          </div>
        </div>

        {/* Particles */}
        <div 
          onClick={() => onLaunchModule('particles')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = particlesColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Particles (.particle)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {particleCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${particlesColor.rgb}, 0.2)`,
              borderColor: `rgba(${particlesColor.rgb}, 0.4)`,
              color: particlesColor.hex
            }}
          >
            <Sparkles size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${particlesColor.rgb}, 0.15)`,
              borderColor: `rgba(${particlesColor.rgb}, 0.3)`,
              color: particlesColor.hex
            }}
          >
            .particle
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Particles
          </div>
        </div>

        {/* UI & HUD */}
        <div 
          onClick={() => onLaunchModule('ui')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = uiColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="UI & HUD (.ui)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {uiCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${uiColor.rgb}, 0.2)`,
              borderColor: `rgba(${uiColor.rgb}, 0.4)`,
              color: uiColor.hex
            }}
          >
            <Sliders size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${uiColor.rgb}, 0.15)`,
              borderColor: `rgba(${uiColor.rgb}, 0.3)`,
              color: uiColor.hex
            }}
          >
            .ui
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            UI & HUD
          </div>
        </div>

        {/* Game Architecture */}
        <div 
          onClick={() => onLaunchModule('gamestructure')}
          className="relative p-4 rounded-2xl border transition cursor-pointer group flex flex-col items-start text-left shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = gameColor.hex)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bgDef.borderHex)}
          title="Game Architecture (.gamestructure)"
        >
          {/* Upper Right Number */}
          <div className="absolute top-3.5 right-3.5 text-lg font-black text-white font-mono group-hover:scale-105 transition-transform">
            {gameCount}
          </div>

          {/* 1. Module Icon */}
          <div 
            className="w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform mb-2 shadow-inner"
            style={{
              backgroundColor: `rgba(${gameColor.rgb}, 0.2)`,
              borderColor: `rgba(${gameColor.rgb}, 0.4)`,
              color: gameColor.hex
            }}
          >
            <Network size={20} />
          </div>

          {/* 2. Extension */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border mb-2"
            style={{
              backgroundColor: `rgba(${gameColor.rgb}, 0.15)`,
              borderColor: `rgba(${gameColor.rgb}, 0.3)`,
              color: gameColor.hex
            }}
          >
            .gamestructure
          </span>

          {/* 3. Module Name */}
          <div className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-200 truncate mt-1 w-full transition-colors">
            Game Architecture
          </div>
        </div>
      </div>

      {/* Project Kanban & Task Board Section */}
      <ProjectTaskBoard
        taskBoard={project.taskBoard}
        onUpdateTaskBoard={updatedBoard => {
          onUpdateProject({
            ...project,
            taskBoard: updatedBoard,
            updatedAt: new Date().toISOString()
          });
        }}
      />

    </div>
  );
};
