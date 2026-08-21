import React from 'react';
import { MasonProject } from '../engine/masonProjectSchema';
import { getModuleById } from '../engine/modulesRegistry';

// Child module views
import { UIThemeModule } from './UIThemeModule';
import { RefinedBiomeEditor } from './RefinedBiomeEditor';
import { GameStructureModule } from './GameStructureModule';
import { BiomeMacroMapModal } from './BiomeMacroMapModal';
import { CharacterEditor } from './CharacterEditor';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { buildMapFromBiomeMatrix, BiomeAllocationMatrix, MetroidvaniaLayoutStyle } from '../engine/metroidvaniaGenerator';

interface ModuleRunnerContainerProps {
  moduleId: string;
  project: MasonProject;
  onUpdateProject: (updated: MasonProject | ((prev: MasonProject) => MasonProject)) => void;
  onBackToProjectInfo: () => void;
  onOpenModulesModal: () => void;
  onOpenExplorer: () => void;
  onNavigateToModule?: (moduleId: string, fileOptions?: { characterFileName?: string }) => void;
}

export const ModuleRunnerContainer: React.FC<ModuleRunnerContainerProps> = ({
  moduleId,
  project,
  onUpdateProject,
  onBackToProjectInfo,
  onOpenModulesModal,
  onOpenExplorer,
  onNavigateToModule
}) => {
  const modDef = getModuleById(moduleId);

  if (!modDef) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
        <p>Module "{moduleId}" not found.</p>
        <button
          type="button"
          onClick={onBackToProjectInfo}
          className="mt-4 px-4 py-2 bg-neutral-800 rounded-xl text-white text-xs font-bold"
        >
          Back to Project Dashboard
        </button>
      </div>
    );
  }

  const biomesList: RefinedBiome[] = project.fileSystem.biomes.map(b => b.biomeData);
  const currentMapFile = project.fileSystem.maps.find(m => m.fileName === project.activeFiles.mapFileName) || project.fileSystem.maps[0];

  const handleUpdateBiomes = (updatedBiomes: RefinedBiome[]) => {
    onUpdateProject({
      ...project,
      fileSystem: {
        ...project.fileSystem,
        biomes: updatedBiomes.map(b => {
          const existing = project.fileSystem.biomes.find(f => f.biomeData.id === b.id);
          return {
            id: b.id,
            name: b.name,
            fileName: existing?.fileName || `${b.id}.biome`,
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            biomeData: b
          };
        })
      }
    });
  };

  const handleApplyMacroToLevel = (matrix: BiomeAllocationMatrix, layoutStyle: MetroidvaniaLayoutStyle) => {
    if (!currentMapFile) return;
    const generated = buildMapFromBiomeMatrix(matrix, biomesList, layoutStyle);
    
    onUpdateProject({
      ...project,
      fileSystem: {
        ...project.fileSystem,
        maps: project.fileSystem.maps.map(m => {
          if (m.fileName === currentMapFile.fileName) {
            return {
              ...m,
              width: generated.width,
              height: generated.height,
              cells: generated.cells,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        })
      }
    });
    onBackToProjectInfo();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950 select-none">
      {/* Interactive Full-Engine Direct View */}
      <div className="w-full h-full flex flex-col overflow-hidden">
        {moduleId === 'characters' && (
          <CharacterEditor
            project={project}
            onUpdateProject={onUpdateProject}
            onOpenFiles={onOpenExplorer}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}
        {moduleId === 'ui' && (
          <UIThemeModule
            project={project}
            onUpdateProject={onUpdateProject}
            onOpenFiles={onOpenExplorer}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}
        {moduleId === 'biomes' && (
          <RefinedBiomeEditor
            biomes={biomesList}
            onUpdateBiomes={handleUpdateBiomes}
            onBackToDashboard={onBackToProjectInfo}
            availableMaps={project?.fileSystem?.maps?.map(m => ({ fileName: m.fileName, name: m.name })) || []}
          />
        )}
        {moduleId === 'gamestructure' && (
          <GameStructureModule
            project={project}
            onUpdateProject={(updater) => onUpdateProject(updater(project))}
            onNavigateToModule={(modId) => {
              onOpenModulesModal();
            }}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}
        {moduleId === 'macro' && (
          <BiomeMacroMapModal
            isOpen={true}
            onClose={onBackToProjectInfo}
            biomes={biomesList}
            currentWidth={currentMapFile?.width || 32}
            currentHeight={currentMapFile?.height || 24}
            onApplyToLevel={handleApplyMacroToLevel}
          />
        )}
        {moduleId === 'maps' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-300 gap-4">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-center max-w-md">
              <h3 className="font-bold text-base text-white">Map & Tilemap Editor</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Edit levels, rooms, and terrain strata in the main level canvas.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToProjectInfo}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
            >
              Return to Main Editor Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
