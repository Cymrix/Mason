import React from 'react';
import { MasonProject } from '../engine/masonProjectSchema';
import { getModuleById } from '../engine/modulesRegistry';

// Child module views
import { UIThemeModule } from './UIThemeModule';
import { RefinedBiomeEditor } from './RefinedBiomeEditor';
import { GameStructureModule } from './GameStructureModule';
import { BiomeMacroMapModal } from './BiomeMacroMapModal';
import { PrefabEditor } from './PrefabEditor';
import { ParticlesEditor } from './ParticlesEditor';
import { SpriteEditorWrapper } from './SpriteEditorWrapper';
import { Model3DStudio } from './Model3DStudio';
import { ModelTemplateFabricator } from './ModelTemplateFabricator';
import { Scene3DStudio } from './Scene3DStudio';
import { TerrainStudio } from './TerrainStudio';
import { MultiplayerStudio } from './MultiplayerStudio';
import { createDefaultModel3DFile, createDefaultScene3DFile, createDefaultTerrainFile, createDefaultMultiplayerFile } from '../engine/masonProjectSchema';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { buildMapFromBiomeMatrix, BiomeAllocationMatrix, MetroidvaniaLayoutStyle } from '../engine/metroidvaniaGenerator';

interface ModuleRunnerContainerProps {
  moduleId: string;
  project: MasonProject;
  onUpdateProject: (updated: MasonProject | ((prev: MasonProject) => MasonProject), options?: any) => void;
  onBackToProjectInfo: () => void;
  onOpenModulesModal: () => void;
  onOpenExplorer: () => void;
  onNavigateToModule?: (moduleId: string, fileOptions?: { behaviorFileName?: string; prefabFileName?: string; spriteFileName?: string }) => void;
  onRefreshFromLinked?: () => void;
  isSyncingLinked?: boolean;
  isOutOfSync?: boolean;
}

export const ModuleRunnerContainer: React.FC<ModuleRunnerContainerProps> = ({
  moduleId,
  project,
  onUpdateProject,
  onBackToProjectInfo,
  onOpenModulesModal,
  onOpenExplorer,
  onNavigateToModule,
  onRefreshFromLinked,
  isSyncingLinked = false,
  isOutOfSync = false
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
        {moduleId === 'sprites' && null}
        {moduleId === 'prefabs' && (
          <PrefabEditor
            project={project}
            onUpdateProject={onUpdateProject}
            onOpenFiles={onOpenExplorer}
            onBackToDashboard={onBackToProjectInfo}
            onNavigateToModule={onNavigateToModule}
            onRefreshFromLinked={onRefreshFromLinked}
            isSyncingLinked={isSyncingLinked}
            isOutOfSync={isOutOfSync}
          />
        )}
        {moduleId === 'particles' && (
          <ParticlesEditor
            project={project}
            onUpdateProject={(updater, opts) => onUpdateProject(updater, opts)}
            onOpenFiles={onOpenExplorer}
            onBackToDashboard={onBackToProjectInfo}
            onRefreshFromLinked={onRefreshFromLinked}
            isSyncingLinked={isSyncingLinked}
            isOutOfSync={isOutOfSync}
          />
        )}
        {moduleId === 'ui' && (
          <UIThemeModule
            project={project}
            onUpdateProject={onUpdateProject}
            onOpenFiles={onOpenExplorer}
            onBackToDashboard={onBackToProjectInfo}
            onRefreshFromLinked={onRefreshFromLinked}
            isSyncingLinked={isSyncingLinked}
            isOutOfSync={isOutOfSync}
          />
        )}
        {moduleId === 'biomes' && (
          <RefinedBiomeEditor
            project={project}
            onUpdateProject={(updater, opts) => onUpdateProject(updater, opts)}
            biomes={biomesList}
            onUpdateBiomes={handleUpdateBiomes}
            onBackToDashboard={onBackToProjectInfo}
            availableMaps={project?.fileSystem?.maps?.map(m => ({ fileName: m.fileName, name: m.name })) || []}
            onRefreshFromLinked={onRefreshFromLinked}
            isSyncingLinked={isSyncingLinked}
            isOutOfSync={isOutOfSync}
          />
        )}
        {moduleId === 'gamestructure' && (
          <GameStructureModule
            project={project}
            onUpdateProject={(updater, opts) => onUpdateProject(updater, opts)}
            onNavigateToModule={(modId) => {
              onOpenModulesModal();
            }}
            onBackToDashboard={onBackToProjectInfo}
            onRefreshFromLinked={onRefreshFromLinked}
            isSyncingLinked={isSyncingLinked}
            isOutOfSync={isOutOfSync}
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
        {moduleId === 'models3d' && (
          <Model3DStudio
            project={project}
            activeModelFile={project.fileSystem.models3d?.find(m => m.fileName === project.activeFiles.model3dFileName) || project.fileSystem.models3d?.[0] || createDefaultModel3DFile()}
            onSaveModelFile={(file) => {
              const now = new Date().toISOString();
              onUpdateProject(p => {
                const existing = p.fileSystem.models3d || [];
                const updatedList = existing.some(m => m.fileName === file.fileName)
                  ? existing.map(m => m.fileName === file.fileName ? { ...file, updatedAt: now } : m)
                  : [...existing, { ...file, updatedAt: now }];
                return {
                  ...p,
                  updatedAt: now,
                  fileSystem: {
                    ...p.fileSystem,
                    models3d: updatedList
                  }
                };
              }, { actionLabel: `Saved 3D Model ${file.name}` });
            }}
            onSwitchModelFile={(fileName) => {
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, model3dFileName: fileName }
              }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: `Switched to 3D Model ${fileName}` });
            }}
            onCreateNewModel={(name) => {
              const id = `model_${Date.now().toString(36)}`;
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const fileName = `${safeName}.model3d`;
              const newModel = createDefaultModel3DFile(id, name, fileName);
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, model3dFileName: fileName },
                fileSystem: {
                  ...p.fileSystem,
                  models3d: [...(p.fileSystem.models3d || []), newModel]
                }
              }), { actionLabel: `Created 3D Model ${name}` });
            }}
          />
        )}
        {moduleId === 'fabricator' && (
          <ModelTemplateFabricator
            project={project}
            onSaveToProject={(file) => {
              const now = new Date().toISOString();
              onUpdateProject(p => {
                const existing = p.fileSystem.models3d || [];
                const updatedList = existing.some(m => m.fileName === file.fileName)
                  ? existing.map(m => m.fileName === file.fileName ? { ...file, updatedAt: now } : m)
                  : [...existing, { ...file, updatedAt: now }];
                return {
                  ...p,
                  updatedAt: now,
                  activeFiles: { ...p.activeFiles, model3dFileName: file.fileName },
                  fileSystem: {
                    ...p.fileSystem,
                    models3d: updatedList
                  }
                };
              }, { actionLabel: `Fabricated 3D Model ${file.name}` });
            }}
            onOpenInStudio={(fileName) => {
              onNavigateToModule?.('models3d');
            }}
            onBack={onBackToProjectInfo}
          />
        )}
        {moduleId === 'scenes' && (
          <Scene3DStudio
            project={project}
            activeSceneFile={project.fileSystem.scenes3d?.find(s => s.fileName === project.activeFiles.scene3dFileName) || project.fileSystem.scenes3d?.[0] || createDefaultScene3DFile()}
            onSaveSceneFile={(file) => {
              const now = new Date().toISOString();
              onUpdateProject(p => {
                const existing = p.fileSystem.scenes3d || [];
                const updatedList = existing.some(s => s.fileName === file.fileName)
                  ? existing.map(s => s.fileName === file.fileName ? { ...file, updatedAt: now } : s)
                  : [...existing, { ...file, updatedAt: now }];
                return {
                  ...p,
                  updatedAt: now,
                  fileSystem: {
                    ...p.fileSystem,
                    scenes3d: updatedList
                  }
                };
              }, { actionLabel: `Saved 3D Scene ${file.name}` });
            }}
            onSwitchSceneFile={(fileName) => {
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, scene3dFileName: fileName }
              }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: `Switched to 3D Scene ${fileName}` });
            }}
            onCreateNewScene={(name) => {
              const id = `scene_${Date.now().toString(36)}`;
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const fileName = `${safeName}.scene3d`;
              const newScene = createDefaultScene3DFile(id, name, fileName);
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, scene3dFileName: fileName },
                fileSystem: {
                  ...p.fileSystem,
                  scenes3d: [...(p.fileSystem.scenes3d || []), newScene]
                }
              }), { actionLabel: `Created 3D Scene ${name}` });
            }}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}
        {moduleId === 'terrain' && (
          <TerrainStudio
            project={project}
            activeTerrainFile={project.fileSystem.terrain?.find(t => t.fileName === project.activeFiles.terrainFileName) || project.fileSystem.terrain?.[0] || createDefaultTerrainFile()}
            onSaveTerrainFile={(file) => {
              const now = new Date().toISOString();
              onUpdateProject(p => {
                const existing = p.fileSystem.terrain || [];
                const updatedList = existing.some(t => t.fileName === file.fileName)
                  ? existing.map(t => t.fileName === file.fileName ? { ...file, updatedAt: now } : t)
                  : [...existing, { ...file, updatedAt: now }];
                return {
                  ...p,
                  updatedAt: now,
                  fileSystem: {
                    ...p.fileSystem,
                    terrain: updatedList
                  }
                };
              }, { actionLabel: `Saved Terrain ${file.name}` });
            }}
            onSwitchTerrainFile={(fileName) => {
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, terrainFileName: fileName }
              }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: `Switched to Terrain ${fileName}` });
            }}
            onCreateNewTerrain={(name) => {
              const id = `terrain_${Date.now().toString(36)}`;
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const fileName = `${safeName}.terrain`;
              const newTerrain = createDefaultTerrainFile(id, name, fileName);
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, terrainFileName: fileName },
                fileSystem: {
                  ...p.fileSystem,
                  terrain: [...(p.fileSystem.terrain || []), newTerrain]
                }
              }), { actionLabel: `Created Terrain ${name}` });
            }}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}
        {moduleId === 'multiplayer' && (
          <MultiplayerStudio
            project={project}
            activeMultiplayerFile={project.fileSystem.multiplayer?.find(m => m.fileName === project.activeFiles.multiplayerFileName) || project.fileSystem.multiplayer?.[0] || createDefaultMultiplayerFile()}
            onSaveMultiplayerFile={(file) => {
              const now = new Date().toISOString();
              onUpdateProject(p => {
                const existing = p.fileSystem.multiplayer || [];
                const updatedList = existing.some(m => m.fileName === file.fileName)
                  ? existing.map(m => m.fileName === file.fileName ? { ...file, updatedAt: now } : m)
                  : [...existing, { ...file, updatedAt: now }];
                return {
                  ...p,
                  updatedAt: now,
                  fileSystem: {
                    ...p.fileSystem,
                    multiplayer: updatedList
                  }
                };
              }, { actionLabel: `Saved Multiplayer ${file.name}` });
            }}
            onSwitchMultiplayerFile={(fileName) => {
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, multiplayerFileName: fileName }
              }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: `Switched to Multiplayer ${fileName}` });
            }}
            onCreateNewMultiplayer={(name) => {
              const id = `net_${Date.now().toString(36)}`;
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const fileName = `${safeName}.multiplayer`;
              const newNet = createDefaultMultiplayerFile(id, name, fileName);
              onUpdateProject(p => ({
                ...p,
                activeFiles: { ...p.activeFiles, multiplayerFileName: fileName },
                fileSystem: {
                  ...p.fileSystem,
                  multiplayer: [...(p.fileSystem.multiplayer || []), newNet]
                }
              }), { actionLabel: `Created Multiplayer Network ${name}` });
            }}
            onBackToDashboard={onBackToProjectInfo}
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
