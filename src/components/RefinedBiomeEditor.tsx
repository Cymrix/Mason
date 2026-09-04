import React, { useState, useRef, useMemo } from 'react';
import { 
  RefinedBiome, 
  BiomeTileType, 
  EnvironmentalDetail, 
  InteractivePlacementDetail, 
  BiomeWildlife,
  BiomeSoundtrack,
  TraversalModifierTag,
  DamageType
} from '../engine/refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from '../engine/refinedBiomes';
import { DEFAULT_PARALLAX_LAYERS } from '../engine/parallaxConfig';
import { BlobTilesetPreview } from './BlobTilesetPreview';
import { ParallaxLayersEditor } from './ParallaxLayersEditor';
import { BiomePropsEditor } from './BiomePropsEditor';
import { BiomeStatesEditor } from './BiomeStatesEditor';
import { BiomeVariablesEditor } from './BiomeVariablesEditor';
import { BiomeBehaviorsEditor } from './BiomeBehaviorsEditor';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { MasonProject, BiomeFile } from '../engine/masonProjectSchema';
import { 
  exportBiomeFile, 
  saveActiveMasonProject, 
  createNewBiomeInProject 
} from '../utils/masonStorage';
import { addToastLog } from '../utils/toastLogStore';
import { 
  performFileCheckout, 
  performFileCheckIn, 
  performFileForceUnlock,
  performFileSaveAs 
} from '../utils/fileCheckoutStore';
import { 
  TreePine, 
  Layers, 
  Sparkles, 
  Music, 
  Volume2, 
  Compass, 
  Shield, 
  ShieldAlert,
  Flame, 
  Plus, 
  Copy, 
  Sliders, 
  Footprints, 
  Box, 
  Eye, 
  Check, 
  Zap, 
  Skull, 
  Disc,
  Play,
  RotateCcw,
  Shuffle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Palette,
  X,
  ZoomIn,
  Maximize2,
  Database,
  Brain,
  Activity
} from 'lucide-react';

interface RefinedBiomeEditorProps {
  project?: MasonProject;
  onUpdateProject?: (updater: (prev: MasonProject) => MasonProject, options?: any) => void;
  biomes?: RefinedBiome[];
  onUpdateBiomes?: (biomes: RefinedBiome[]) => void;
  onSelectForPainting?: (biomeId: string, tileTypeId?: string) => void;
  activePaintBiomeId?: string;
  onBackToDashboard?: () => void;
  availableMaps?: { fileName: string; name: string }[];
  onRefreshFromLinked?: () => void;
  isSyncingLinked?: boolean;
  isOutOfSync?: boolean;
}

const TRAVERSAL_TAG_LIST: { tag: TraversalModifierTag; label: string }[] = [
  { tag: 'climbable', label: 'Climbable' },
  { tag: 'sticky', label: 'Sticky' },
  { tag: 'bouncy', label: 'Bouncy' },
  { tag: 'slippery', label: 'Slippery' },
  { tag: 'hazard', label: 'Hazard' },
  { tag: 'sinkable', label: 'Sinkable' }
];

import { getSavedModuleTab, saveModuleTab } from '../utils/moduleTabStore';

interface ImageUploadThumbnailFieldProps {
  label: string;
  sublabel?: string;
  badge?: string;
  imageUrl?: string;
  fallbackColor?: string;
  fallbackText?: string;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
  onPreviewModal?: (title: string, url: string) => void;
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'blue' | 'purple';
  accept?: string;
}

const ImageUploadThumbnailField: React.FC<ImageUploadThumbnailFieldProps> = ({
  label,
  sublabel,
  badge,
  imageUrl,
  fallbackColor,
  fallbackText = 'Procedural',
  onUpload,
  onClear,
  onPreviewModal,
  accentColor = 'cyan',
  accept = 'image/*'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpload(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const accentBorder = {
    cyan: 'border-cyan-500/50 group-hover:border-cyan-400',
    amber: 'border-amber-500/50 group-hover:border-amber-400',
    emerald: 'border-emerald-500/50 group-hover:border-emerald-400',
    blue: 'border-blue-500/50 group-hover:border-blue-400',
    purple: 'border-purple-500/50 group-hover:border-purple-400'
  }[accentColor];

  const accentText = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
  }[accentColor];

  const accentBg = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }[accentColor];

  return (
    <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-neutral-200 truncate">{label}</span>
          {badge && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase border ${accentBg} shrink-0`}>
              {badge}
            </span>
          )}
        </div>
        {imageUrl && (
          <div className="flex items-center gap-2 shrink-0">
            {onPreviewModal && (
              <button
                type="button"
                onClick={() => onPreviewModal(label, imageUrl)}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                title="View Full Size Image"
              >
                <Eye size={11} /> Zoom
              </button>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              title="Remove Image"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
        )}
      </div>

      {sublabel && (
        <p className="text-[10px] text-neutral-400">{sublabel}</p>
      )}

      {/* Thumbnail + Action Controls */}
      <div className="flex items-center gap-3 pt-0.5">
        {/* Visual Thumbnail Box with Checkerboard Background */}
        <div
          onClick={() => {
            if (imageUrl && onPreviewModal) {
              onPreviewModal(label, imageUrl);
            } else {
              fileInputRef.current?.click();
            }
          }}
          className={`relative group w-12 h-12 rounded-lg border overflow-hidden cursor-pointer shrink-0 transition-all shadow-inner flex items-center justify-center ${
            imageUrl 
              ? `${accentBorder} shadow-black/60 ring-1 ring-white/5` 
              : 'border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-900/60'
          }`}
          style={{
            backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
            backgroundSize: '10px 10px',
            backgroundColor: fallbackColor || '#18181b'
          }}
          title={imageUrl ? 'Click to inspect thumbnail in high-resolution zoom modal' : 'Click to select and upload image'}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={label}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <ZoomIn size={14} className="drop-shadow" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-500 group-hover:text-neutral-300 transition-colors p-1 text-center">
              <ImageIcon size={16} className="mb-0.5 opacity-70" />
              <span className="text-[8px] font-mono leading-tight">{fallbackText}</span>
            </div>
          )}
        </div>

        {/* Upload & Info Section */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded-md text-[11px] font-medium flex items-center gap-1.5 text-neutral-200 transition active:scale-95 shadow-sm">
              <Upload size={12} className={accentText} />
              <span>{imageUrl ? 'Replace' : 'Upload'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {imageUrl ? (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                <Check size={11} className="text-emerald-400 shrink-0" />
                Custom Texture Active
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500 font-mono truncate">
                Procedural Fallback
              </span>
            )}
          </div>

          <div className="text-[9px] text-neutral-500 truncate">
            {imageUrl ? 'Active in Blob Autotile engine' : 'Default algorithmic noise shader'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RefinedBiomeEditor: React.FC<RefinedBiomeEditorProps> = ({
  project,
  onUpdateProject,
  biomes: propBiomes,
  onUpdateBiomes: propOnUpdateBiomes,
  onSelectForPainting,
  activePaintBiomeId,
  onBackToDashboard,
  availableMaps = [],
  onRefreshFromLinked,
  isSyncingLinked = false,
  isOutOfSync = false
}) => {
  // Biome files derived from project or fallback to biomes prop
  const biomeFiles: BiomeFile[] = useMemo(() => {
    if (project?.fileSystem?.biomes && project.fileSystem.biomes.length > 0) {
      return project.fileSystem.biomes;
    }
    const sourceBiomes = propBiomes && propBiomes.length > 0 ? propBiomes : INITIAL_REFINED_BIOMES;
    return sourceBiomes.map(b => ({
      id: b.id,
      name: b.name,
      fileName: `${b.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}.biome`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      biomeData: b
    }));
  }, [project?.fileSystem?.biomes, propBiomes]);

  // Local fallback active file name if project.activeFiles is not supplied
  const [localActiveFileName, setLocalActiveFileName] = useState<string>(
    project?.activeFiles?.biomeFileName || biomeFiles[0]?.fileName || 'mourne_ashen_steppes.biome'
  );

  const activeFileName = project?.activeFiles?.biomeFileName || localActiveFileName;

  const currentBiomeFile: BiomeFile = useMemo(() => {
    return biomeFiles.find(f => f.fileName === activeFileName) || biomeFiles[0] || {
      id: 'mourne_ashen_steppes',
      name: 'Ashen Steppes',
      fileName: 'mourne_ashen_steppes.biome',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      biomeData: INITIAL_REFINED_BIOMES[0]
    };
  }, [biomeFiles, activeFileName]);

  const selectedBiome = currentBiomeFile.biomeData;

  const savedSnapshotRef = useRef<string>(JSON.stringify(selectedBiome));
  useEffect(() => {
    savedSnapshotRef.current = JSON.stringify(selectedBiome);
  }, [currentBiomeFile.fileName, currentBiomeFile.id]);

  const isBiomeDirty = useMemo(() => {
    return savedSnapshotRef.current !== JSON.stringify(selectedBiome);
  }, [selectedBiome]);

  const [activeSubTab, setActiveSubTabState] = useState<
    'tile_types' | 'environmental' | 'interactive' | 'wildlife' | 'soundtrack' | 'parallax' | 'biome_states' | 'biome_variables' | 'biome_behaviors'
  >(() => getSavedModuleTab('biomes', 'tile_types') as any);

  const setActiveSubTab = (tab: 'tile_types' | 'environmental' | 'interactive' | 'wildlife' | 'soundtrack' | 'parallax' | 'biome_states' | 'biome_variables' | 'biome_behaviors') => {
    setActiveSubTabState(tab);
    saveModuleTab('biomes', tab);
  };
  const [selectedTileTypeIndex, setSelectedTileTypeIndex] = useState<number>(0);
  const [previewModalImage, setPreviewModalImage] = useState<{ title: string; url: string } | null>(null);

  // Toast notification state for Biome Editor
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    addToastLog(text, type);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const selectedTileType = selectedBiome?.tileTypes?.[selectedTileTypeIndex] || selectedBiome?.tileTypes?.[0];

  const handleUpdateCurrentBiome = (updater: (prev: RefinedBiome) => RefinedBiome) => {
    const updatedBiome = updater(selectedBiome);
    
    if (project && onUpdateProject) {
      onUpdateProject(p => ({
        ...p,
        fileSystem: {
          ...p.fileSystem,
          biomes: p.fileSystem.biomes.map(bf => {
            if (bf.fileName === currentBiomeFile.fileName) {
              return {
                ...bf,
                name: updatedBiome.name,
                updatedAt: new Date().toISOString(),
                biomeData: updatedBiome
              };
            }
            return bf;
          })
        }
      }));
    } else if (propOnUpdateBiomes && propBiomes) {
      const updatedList = propBiomes.map(b => b.id === selectedBiome.id ? updatedBiome : b);
      propOnUpdateBiomes(updatedList);
    }
  };

  const handleUpdateCurrentTileType = (updater: (prev: BiomeTileType) => BiomeTileType) => {
    handleUpdateCurrentBiome(b => {
      const updatedTypes = [...b.tileTypes];
      updatedTypes[selectedTileTypeIndex] = updater(selectedTileType);
      return { ...b, tileTypes: updatedTypes };
    });
  };

  // Helper for uploading local image files as Data URLs
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onLoaded(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTileType = () => {
    const newId = `tile_type_${Date.now()}`;
    const newType: BiomeTileType = {
      id: newId,
      name: 'New Material Strata',
      category: 'natural',
      mapColor: '#38bdf8',
      baseMaterialA: {
        albedoColor: '#475569',
        heightMapScale: 0.5,
        roughness: 0.8,
        normalStrength: 1.0
      },
      baseMaterialBAlbedoColor: '#64748b',
      blendMap: {
        noiseA: {
          scale: 32,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
          offset: { x: 0, y: 0 },
          weight: 0.6
        },
        noiseB: {
          scale: 12,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
          offset: { x: 20, y: 30 },
          weight: 0.4
        },
        blendThreshold: 0.5,
        blendContrast: 1.2,
        invert: false
      },
      tileDetails: {
        top: { thicknessPx: 6, noiseEdge: true },
        bottom: { thicknessPx: 4, noiseEdge: false },
        leftSide: { thicknessPx: 3, noiseEdge: false },
        rightSide: { thicknessPx: 3, noiseEdge: false },
        innerCorner: {},
        slope: { thicknessPx: 4, noiseEdge: false }
      },
      isDestructible: true,
      materialType: 'hard',
      bevelProbability: 0,
      health: 100,
      defense_type: 'kinetic',
      armor_deduction: 5,
      damage_affinities: { kinetic: 1.0, thermal: 1.0 },
      shares_damage_overlay: true,
      traversal_tags: [],
      speed_modifier: 1.0
    };

    handleUpdateCurrentBiome(b => ({
      ...b,
      tileTypes: [...b.tileTypes, newType]
    }));
    setSelectedTileTypeIndex(selectedBiome.tileTypes.length);
  };

  // Subfolder Header Callbacks
  const handleSelectBiomeFile = (fileName: string) => {
    setSelectedTileTypeIndex(0);
    setLocalActiveFileName(fileName);
    if (project && onUpdateProject) {
      onUpdateProject(p => ({
        ...p,
        activeFiles: {
          ...p.activeFiles,
          biomeFileName: fileName
        }
      }), { preserveUpdatedAt: true, skipBackups: true, actionLabel: 'Select Biome File' } as any);
    }
  };

  const handleNewBiomeFile = (name: string) => {
    if (project && onUpdateProject) {
      const { project: updatedProj, newFile } = createNewBiomeInProject(project, name);
      onUpdateProject(() => updatedProj);
      setSelectedTileTypeIndex(0);
      setLocalActiveFileName(newFile.fileName);
    } else {
      const newId = `biome_${Date.now()}`;
      const primaryTileId = `tile_${newId}_primary`;
      const newBiome: RefinedBiome = {
        id: newId,
        name,
        description: `Custom authored biome: ${name}`,
        regionColor: '#10b981',
        ambientBackgroundColor: '#0f172a',
        atmosphereFogColor: '#1e293b',
        atmosphereFogDensity: 0.2,
        primaryTileTypeId: primaryTileId,
        tileTypes: [
          {
            id: primaryTileId,
            name: 'Primary Terrain Strata',
            category: 'natural',
            mapColor: '#10b981',
            baseMaterialA: {
              albedoColor: '#059669',
              heightMapScale: 0.6,
              roughness: 0.7,
              normalStrength: 1.0
            },
            baseMaterialBAlbedoColor: '#34d399',
            blendMap: {
              noiseA: { scale: 32, octaves: 2, persistence: 0.5, lacunarity: 2.0, offset: { x: 0, y: 0 }, weight: 0.6 },
              noiseB: { scale: 16, octaves: 2, persistence: 0.5, lacunarity: 2.0, offset: { x: 10, y: 10 }, weight: 0.4 },
              blendThreshold: 0.5,
              blendContrast: 1.2,
              invert: false
            },
            tileDetails: {
              top: { color: '#6ee7b7', thicknessPx: 6, noiseEdge: true },
              bottom: { color: '#047857', thicknessPx: 4, noiseEdge: false },
              leftSide: { thicknessPx: 3, noiseEdge: false },
              rightSide: { thicknessPx: 3, noiseEdge: false },
              innerCorner: {},
              slope: { thicknessPx: 4, noiseEdge: false }
            },
            isDestructible: true,
            materialType: 'hard',
            bevelProbability: 0,
            health: 100,
            defense_type: 'kinetic',
            armor_deduction: 5,
            damage_affinities: { kinetic: 1.0, thermal: 1.0 },
            shares_damage_overlay: true,
            traversal_tags: [],
            speed_modifier: 1.0
          }
        ],
        environmentalDetails: [],
        interactiveDetails: [],
        wildlife: [],
        soundtrack: {
          ambientExplorationTrack: 'synth_droning_echoes.mp3',
          combatTrack: 'heavy_percussion_tension.mp3',
          reverbDecaySeconds: 1.2,
          windIntensity: 0.3
        },
        noiseRules: {
          macroScale: 48,
          elevationRange: [0.0, 1.0],
          moistureRange: [0.0, 1.0]
        },
        parallaxLayers: DEFAULT_PARALLAX_LAYERS.mourne_ashen_steppes ? JSON.parse(JSON.stringify(DEFAULT_PARALLAX_LAYERS.mourne_ashen_steppes)) : []
      };

      if (propOnUpdateBiomes && propBiomes) {
        propOnUpdateBiomes([...propBiomes, newBiome]);
      }
      setSelectedTileTypeIndex(0);
    }
  };

  const handleDuplicateBiomeFile = (fileName: string) => {
    const targetFile = biomeFiles.find(f => f.fileName === fileName) || currentBiomeFile;
    const dupeName = `${targetFile.name} (Copy)`;
    const safeName = `${targetFile.fileName.replace('.biome', '')}_copy.biome`;
    const dupeBiome: RefinedBiome = {
      ...JSON.parse(JSON.stringify(targetFile.biomeData)),
      id: `biome_${Date.now()}`,
      name: dupeName
    };

    if (project && onUpdateProject) {
      const newFile: BiomeFile = {
        id: dupeBiome.id,
        name: dupeName,
        fileName: safeName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        biomeData: dupeBiome
      };
      onUpdateProject(p => ({
        ...p,
        activeFiles: {
          ...p.activeFiles,
          biomeFileName: safeName
        },
        fileSystem: {
          ...p.fileSystem,
          biomes: [...p.fileSystem.biomes, newFile]
        }
      }));
      setLocalActiveFileName(safeName);
      setSelectedTileTypeIndex(0);
    } else if (propOnUpdateBiomes && propBiomes) {
      propOnUpdateBiomes([...propBiomes, dupeBiome]);
      setSelectedTileTypeIndex(0);
    }
  };

  const handleSaveBiomeFile = () => {
    if (project && onUpdateProject) {
      const now = new Date().toISOString();
      const updatedBiomeFile: BiomeFile = {
        ...currentBiomeFile,
        name: selectedBiome.name || currentBiomeFile.name,
        updatedAt: now,
        biomeData: selectedBiome
      };
      onUpdateProject(prev => ({
        ...prev,
        updatedAt: now,
        fileSystem: {
          ...prev.fileSystem,
          biomes: (prev.fileSystem.biomes || []).map(b => b.fileName === currentBiomeFile.fileName ? { ...updatedBiomeFile, checkout: b.checkout || currentBiomeFile.checkout } : b)
        }
      }), { actionLabel: `Saved biome ${currentBiomeFile.fileName}`, syncLinked: true } as any);
      savedSnapshotRef.current = JSON.stringify(selectedBiome);
      const targetName = project?.storageLocation?.displayName || project?.storageLocation?.targetFolderName || 'target folder';
      showToast(`Saved biome "${selectedBiome.name || currentBiomeFile.name}" (${currentBiomeFile.fileName}) to ${targetName}`, 'success');
    } else if (project) {
      saveActiveMasonProject(project, `Saved biome ${currentBiomeFile.fileName}`);
      savedSnapshotRef.current = JSON.stringify(selectedBiome);
      showToast(`Saved biome "${selectedBiome.name || currentBiomeFile.name}" (${currentBiomeFile.fileName})`, 'success');
    }
  };

  const handleExportBiomeFile = (fileName: string) => {
    const targetFile = biomeFiles.find(f => f.fileName === fileName) || currentBiomeFile;
    exportBiomeFile(targetFile);
  };

  const handleDeleteBiomeFile = (fileName: string) => {
    if (biomeFiles.length <= 1) {
      alert('Cannot delete the last remaining biome. Projects must contain at least one regional biome.');
      return;
    }
    const targetFile = biomeFiles.find(f => f.fileName === fileName) || currentBiomeFile;
    const isDeletingActive = targetFile.fileName === (localActiveFileName || currentBiomeFile.fileName);

    const remainingFiles = biomeFiles.filter(f => f.fileName !== targetFile.fileName);
    const nextActive = remainingFiles[0]?.fileName || '';

    if (project && onUpdateProject) {
      onUpdateProject(p => ({
        ...p,
        activeFiles: {
          ...p.activeFiles,
          biomeFileName: isDeletingActive ? nextActive : (p.activeFiles.biomeFileName || nextActive)
        },
        fileSystem: {
          ...p.fileSystem,
          biomes: p.fileSystem.biomes.filter(f => f.fileName !== targetFile.fileName)
        }
      }));
    } else if (propOnUpdateBiomes && propBiomes) {
      propOnUpdateBiomes(propBiomes.filter(b => b.id !== targetFile.id));
    }

    if (isDeletingActive) {
      setLocalActiveFileName(nextActive);
      setSelectedTileTypeIndex(0);
    }
  };

  const handleRenameBiomeFile = (oldFileName: string, newName: string) => {
    const safeName = `${newName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.biome`;
    if (project && onUpdateProject) {
      onUpdateProject(p => ({
        ...p,
        activeFiles: {
          ...p.activeFiles,
          biomeFileName: p.activeFiles.biomeFileName === oldFileName ? safeName : p.activeFiles.biomeFileName
        },
        fileSystem: {
          ...p.fileSystem,
          biomes: p.fileSystem.biomes.map(f => {
            if (f.fileName === oldFileName) {
              return {
                ...f,
                name: newName,
                fileName: safeName,
                updatedAt: new Date().toISOString(),
                biomeData: {
                  ...f.biomeData,
                  name: newName
                }
              };
            }
            return f;
          })
        }
      }));
    } else {
      handleUpdateCurrentBiome(b => ({ ...b, name: newName }));
    }
    setLocalActiveFileName(safeName);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      
      {/* 1. Standardized Subfolder File Header Bar */}
      <FileSubfolderHeader
        subfolderName="biomes"
        extension=".biome"
        accentColor="emerald"
        onBackToDashboard={onBackToDashboard}
        onRefreshFromLinked={onRefreshFromLinked}
        isSyncingLinked={isSyncingLinked}
        isOutOfSync={isOutOfSync}
        storageType={project?.storageLocation?.type}
        files={biomeFiles.map(b => ({
          id: b.id,
          name: b.name,
          fileName: b.fileName,
          updatedAt: b.updatedAt,
          badge: b.biomeData.regionColor,
          checkout: b.checkout
        }))}
        activeFileName={currentBiomeFile.fileName}
        checkout={currentBiomeFile.checkout}
        isDirty={isBiomeDirty}
        onCheckOutFile={(fName, note) => {
          const { project: updated } = performFileCheckout(project, 'biomes', fName, note);
          onUpdateProject(() => updated, { actionLabel: `Check out ${fName}` });
        }}
        onCheckInFile={(fName, pushChanges, note) => {
          if (pushChanges) {
            handleSaveBiomeFile();
          }
          const { project: updated } = performFileCheckIn(project, 'biomes', fName, { note });
          onUpdateProject(() => updated, { actionLabel: `Check in ${fName}` });
        }}
        onForceUnlockFile={(fName) => {
          const { project: updated } = performFileForceUnlock(project, 'biomes', fName);
          onUpdateProject(() => updated, { actionLabel: `Force unlock ${fName}` });
        }}
        onSelectFile={handleSelectBiomeFile}
        onNewFile={handleNewBiomeFile}
        onDuplicateFile={handleDuplicateBiomeFile}
        onSaveFile={handleSaveBiomeFile}
        onSaveAsFile={(newFileName) => {
          if (!project) return;
          const { project: updated } = performFileSaveAs(project, 'biomes', currentBiomeFile.fileName, newFileName, selectedBiome);
          onUpdateProject(() => updated, { actionLabel: `Saved biome as ${newFileName}` });
        }}
        onExportFile={handleExportBiomeFile}
        onDeleteFile={handleDeleteBiomeFile}
        onRenameFile={handleRenameBiomeFile}
        centerContent={
          <div className="flex items-center gap-2 max-w-full truncate">
            <TreePine size={14} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              value={selectedBiome.name}
              onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, name: e.target.value }))}
              className="bg-transparent text-xs sm:text-sm font-bold text-white border-b border-dashed border-neutral-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition py-0.5 max-w-[140px] sm:max-w-[220px] text-center truncate"
              title="Click to edit biome name"
            />
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] text-neutral-300 shrink-0">
              <span>Tint:</span>
              <input
                type="color"
                value={selectedBiome.regionColor}
                onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, regionColor: e.target.value }))}
                className="w-3.5 h-3.5 rounded cursor-pointer bg-transparent border border-neutral-700 ml-0.5"
                title="Biome map tint color"
              />
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] text-neutral-300 shrink-0">
              <span>Gravity:</span>
              <select
                value={selectedBiome.gravityScale ?? 1.0}
                onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, gravityScale: parseFloat(e.target.value) || 0 }))}
                className="bg-transparent text-amber-300 font-mono text-[10px] outline-none cursor-pointer"
                title="Biome Base Gravity Multiplier (0.0x = Weightless, 0.3x = Moon, 1.0x = Standard)"
              >
                <option value="0">🌌 0.0x (Weightless)</option>
                <option value="0.3">🌙 0.3x (Low-G / Moon)</option>
                <option value="0.7">💨 0.7x (Floaty)</option>
                <option value="1">🌍 1.0x (Standard)</option>
                <option value="1.5">🏋️ 1.5x (Dense)</option>
                <option value="2">⚡ 2.0x (Heavy)</option>
                <option value="-1">🔄 -1.0x (Inverted)</option>
              </select>
            </div>
          </div>
        }
      />

      {/* 2. Sub-Navigation Tabs */}
      <div className="px-3 py-1.5 border-b border-neutral-800 flex items-center gap-1 shrink-0 bg-neutral-900/40 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('tile_types')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'tile_types' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Layers size={13} />
          <span>Tiles</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'tile_types' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.tileTypes?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('environmental')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'environmental' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <TreePine size={13} />
          <span>Details</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'environmental' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.environmentalDetails?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('interactive')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'interactive' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Box size={13} />
          <span>Props</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'interactive' ? 'bg-amber-700/80 text-amber-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.interactiveDetails?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('wildlife')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'wildlife' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Zap size={13} />
          <span>Wildlife</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'wildlife' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.wildlife?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('soundtrack')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'soundtrack' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Music size={13} />
          <span>Soundtrack</span>
        </button>
        <button
          onClick={() => setActiveSubTab('parallax')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'parallax' ? 'bg-cyan-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Layers size={13} className={activeSubTab === 'parallax' ? 'text-white' : 'text-cyan-400'} />
          <span>Parallax</span>
        </button>
        <button
          onClick={() => setActiveSubTab('biome_states')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'biome_states' ? 'bg-cyan-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Activity size={13} className={activeSubTab === 'biome_states' ? 'text-white' : 'text-cyan-400'} />
          <span>States</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'biome_states' ? 'bg-cyan-700/80 text-cyan-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.stateMachine?.states?.length || 1}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('biome_variables')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'biome_variables' ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Database size={13} className={activeSubTab === 'biome_variables' ? 'text-white' : 'text-rose-400'} />
          <span>Variables</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'biome_variables' ? 'bg-rose-700/80 text-rose-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.variables?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('biome_behaviors')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'biome_behaviors' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
          }`}
        >
          <Brain size={13} className={activeSubTab === 'biome_behaviors' ? 'text-white' : 'text-amber-400'} />
          <span>Behaviors</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${activeSubTab === 'biome_behaviors' ? 'bg-amber-700/80 text-amber-100' : 'bg-neutral-800/80 text-neutral-400'}`}>
            {selectedBiome?.behaviorRules?.length || 0}
          </span>
        </button>
      </div>

      {/* 3. Full-Width Workspace Content */}
      <main className="flex-1 overflow-hidden bg-neutral-950 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: TILE TYPES & ASSET UPLOADS & BLOB PREVIEW */}
          {activeSubTab === 'tile_types' && (
            <div className="space-y-6">
              
              {/* TileType Horizontal Selector Bar */}
              <div className="flex items-center justify-between bg-neutral-900/70 border border-neutral-800 p-2.5 rounded-xl">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2">Biome Tile Types:</span>
                  {selectedBiome.tileTypes.map((tt, idx) => (
                    <button
                      key={tt.id}
                      onClick={() => setSelectedTileTypeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                        selectedTileTypeIndex === idx
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded border border-white/20" style={{ backgroundColor: tt.mapColor || tt.baseMaterialA.albedoColor || '#38bdf8' }} />
                      <span>{tt.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAddTileType}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow shrink-0"
                >
                  <Plus size={13} /> Add TileType
                </button>
              </div>

              {/* TileType Detail Config */}
              {selectedTileType && (
                <div className="space-y-6">
                  
                  {/* Top Bar: Name & Map Color for Procedural Painting */}
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block">Tile Type Name</label>
                        <input
                          type="text"
                          value={selectedTileType.name}
                          onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, name: e.target.value }))}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:border-cyan-500 outline-none w-64"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                          <Palette size={11} className="text-cyan-400" />
                          <span>Map & Palette Color</span>
                        </label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1">
                          <input
                            type="color"
                            value={selectedTileType.mapColor || '#38bdf8'}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, mapColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-neutral-300">{selectedTileType.mapColor || '#38bdf8'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400">Category:</span>
                      <select
                        value={selectedTileType.category}
                        onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, category: e.target.value as any }))}
                        className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white ml-2"
                      >
                        <option value="natural">Natural (Rock / Loam / Ice)</option>
                        <option value="structure">Structure (Masonry / Fortress)</option>
                        <option value="hazard">Hazard (Volcanic / Spore)</option>
                        <option value="synthetic">Synthetic (Empire Tech)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 1: Texture Uploads & Edge Trim Specification */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Panel 1: Base Materials A & B and Height/Roughness Texture Uploads */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-400" />
                          2 Base Materials (Texture Uploads)
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Base materials are identical in heightmap/roughness, differing only in Albedo A and B.
                        </p>
                      </div>

                      {/* Base Material A Upload */}
                      <div className="space-y-1.5">
                        <ImageUploadThumbnailField
                          label="Base Material A (Primary Albedo)"
                          badge="Albedo A"
                          imageUrl={selectedTileType.baseMaterialA.albedoTextureUrl}
                          fallbackColor={selectedTileType.baseMaterialA.albedoColor}
                          fallbackText={selectedTileType.baseMaterialA.albedoColor ? 'Color' : 'No Image'}
                          accentColor="cyan"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: url }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: undefined }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                        <div className="flex items-center justify-between bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
                          <span className="text-neutral-400 font-medium">Albedo A Fallback/Solid Color:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedTileType.baseMaterialA.albedoColor || '#334155'}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  baseMaterialA: { ...tt.baseMaterialA, albedoColor: val }
                                }));
                              }}
                              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                            />
                            <span className="font-mono text-[11px] text-neutral-300">
                              {selectedTileType.baseMaterialA.albedoColor || 'None (No Image)'}
                            </span>
                            {selectedTileType.baseMaterialA.albedoColor && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    baseMaterialA: { ...tt.baseMaterialA, albedoColor: undefined }
                                  }));
                                }}
                                className="text-[10px] text-neutral-500 hover:text-red-400 font-mono underline ml-1"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Base Material B Upload */}
                      <div className="space-y-1.5">
                        <ImageUploadThumbnailField
                          label="Base Material B (Secondary Albedo)"
                          badge="Albedo B"
                          imageUrl={selectedTileType.baseMaterialBTextureUrl}
                          fallbackColor={selectedTileType.baseMaterialBAlbedoColor}
                          fallbackText={selectedTileType.baseMaterialBAlbedoColor ? 'Color' : 'No Image'}
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialBTextureUrl: url
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialBTextureUrl: undefined
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                        <div className="flex items-center justify-between bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
                          <span className="text-neutral-400 font-medium">Albedo B Fallback/Solid Color:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedTileType.baseMaterialBAlbedoColor || '#64748b'}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  baseMaterialBAlbedoColor: val
                                }));
                              }}
                              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                            />
                            <span className="font-mono text-[11px] text-neutral-300">
                              {selectedTileType.baseMaterialBAlbedoColor || 'None (No Image)'}
                            </span>
                            {selectedTileType.baseMaterialBAlbedoColor && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    baseMaterialBAlbedoColor: undefined
                                  }));
                                }}
                                className="text-[10px] text-neutral-500 hover:text-red-400 font-mono underline ml-1"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Heightmap Upload & Depth Scale */}
                      <div className="space-y-2">
                        <ImageUploadThumbnailField
                          label="Shared Heightmap (Relief Depth)"
                          badge="Heightmap"
                          imageUrl={selectedTileType.heightMapTextureUrl}
                          fallbackColor="#1e293b"
                          fallbackText="Grayscale"
                          accentColor="amber"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              heightMapTextureUrl: url
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              heightMapTextureUrl: undefined
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-400">Shadow Relief Scale:</span>
                            <span className="font-mono text-amber-400 font-bold">{selectedTileType.baseMaterialA.heightMapScale}</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.baseMaterialA.heightMapScale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, heightMapScale: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Roughness Map Upload & Slider */}
                      <div className="space-y-2">
                        <ImageUploadThumbnailField
                          label="Shared Roughness Map (Matte vs Gloss)"
                          badge="Roughness"
                          imageUrl={selectedTileType.roughnessMapTextureUrl}
                          fallbackColor="#1e293b"
                          fallbackText="Roughness"
                          accentColor="purple"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              roughnessMapTextureUrl: url
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              roughnessMapTextureUrl: undefined
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-400">Roughness Factor:</span>
                            <span className="font-mono text-purple-400 font-bold">{selectedTileType.baseMaterialA.roughness}</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.baseMaterialA.roughness}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, roughness: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Panel 2: Edge Overlays (Top, Bottom, Left, Right) & Combat / Tags */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Footprints size={14} className="text-emerald-400" />
                          Edge Overlays (Uploadable Trims)
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Composites top grass/snow, side rims, and bottom ledges onto the blob tileset.
                        </p>
                      </div>

                                            {/* Top Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Top Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Top Edge Overlay Trim"
                          badge="Top"
                          imageUrl={selectedTileType.tileDetails.top.overlayTextureUrl}
                          
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Bottom Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Bottom Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Bottom Edge Trim"
                          badge="Bottom"
                          imageUrl={selectedTileType.tileDetails.bottom.overlayTextureUrl}
                          
                          accentColor="purple"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Left Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Left Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Left Wall Trim"
                          badge="Left"
                          imageUrl={selectedTileType.tileDetails.leftSide.overlayTextureUrl}
                          
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Right Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Right Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Right Wall Trim"
                          badge="Right"
                          imageUrl={selectedTileType.tileDetails.rightSide.overlayTextureUrl}
                          
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Top Slope Overlay (Floor) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Top Slope Overlay <span className="text-neutral-500 font-normal">(Floor Ramps ◢ / ◣)</span></span></div>
                        <ImageUploadThumbnailField
                          label="Top Slope Trim (Floor)"
                          badge="Top Slope"
                          sublabel="Upload a 45° Up-Right slope (◢). Mirrored horizontally for Up-Left (◣)."
                          imageUrl={selectedTileType.tileDetails.slopeTop?.overlayTextureUrl || (selectedTileType.tileDetails as any).slope?.overlayTextureUrl}
                          
                          accentColor="amber"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: url, thicknessPx: (tt.tileDetails as any).slope?.thicknessPx ?? 4, noiseEdge: true },
                                slopeTop: { ...((tt.tileDetails as any).slopeTop || {}), overlayTextureUrl: url, thicknessPx: 4, noiseEdge: true }
                              }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: undefined },
                                slopeTop: { ...((tt.tileDetails as any).slopeTop || {}), overlayTextureUrl: undefined }
                              }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Bottom Slope Overlay (Ceiling) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Bottom Slope Overlay <span className="text-neutral-500 font-normal">(Ceiling ◥ / ◤)</span></span></div>
                        <ImageUploadThumbnailField
                          label="Bottom Slope Trim (Ceiling)"
                          badge="Bot Slope"
                          sublabel="Upload a 45° Ceil Down-Right slope (◥). Mirrored horizontally for Ceil Down-Left (◤)."
                          imageUrl={selectedTileType.tileDetails.slopeBottom?.overlayTextureUrl}
                          
                          accentColor="amber"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slopeBottom: { ...((tt.tileDetails as any).slopeBottom || {}), overlayTextureUrl: url, thicknessPx: 4, noiseEdge: true }
                              }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slopeBottom: { ...((tt.tileDetails as any).slopeBottom || {}), overlayTextureUrl: undefined }
                              }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Block Inner Corner Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Block Inner Corner Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Block Inner Corner Trim"
                          badge="Block Inner"
                          sublabel="Concave inside corner between adjacent solid blocks."
                          imageUrl={selectedTileType.tileDetails.innerCorner?.overlayTextureUrl}
                          
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Slope Inner Corner Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Slope Inner Corner Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Slope Inner Corner Trim"
                          badge="Slope Inner"
                          sublabel="Concave corner transition where slopes meet adjacent ground or walls."
                          imageUrl={selectedTileType.tileDetails.slopeInnerCorner?.overlayTextureUrl}
                          
                          accentColor="cyan"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slopeInnerCorner: { ...((tt.tileDetails as any).slopeInnerCorner || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slopeInnerCorner: { ...((tt.tileDetails as any).slopeInnerCorner || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Generates Physics Collider */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-200">
                            <input
                              type="checkbox"
                              checked={selectedTileType.generatesCollider !== false}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, generatesCollider: e.target.checked }))}
                              className="rounded accent-emerald-500 cursor-pointer w-4 h-4"
                            />
                            <span className="flex items-center gap-1.5">
                              <ShieldAlert size={14} className={selectedTileType.generatesCollider !== false ? 'text-emerald-400' : 'text-neutral-500'} />
                              <span>Generates Physics Collider</span>
                            </span>
                          </label>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            selectedTileType.generatesCollider !== false ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          }`}>
                            {selectedTileType.generatesCollider !== false ? 'SOLID COLLIDER' : 'NO COLLIDER (PASS-THROUGH)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Uncheck to disable collision box. Useful for open air, background pass-through tiles, invisible triggers, or lighting-only/roughness tiles.
                        </p>
                      </div>

                      {/* Destructibility & Traversal */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300">
                            <input
                              type="checkbox"
                              checked={selectedTileType.isDestructible}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, isDestructible: e.target.checked }))}
                              className="rounded accent-red-500 cursor-pointer"
                            />
                            <span>Destructible Tile</span>
                          </label>

                          {selectedTileType.isDestructible && (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span className="text-neutral-500">HP:</span>
                              <input
                                type="number"
                                value={selectedTileType.health}
                                onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, health: parseInt(e.target.value) || 0 }))}
                                className="w-14 bg-neutral-900 border border-neutral-700 text-right px-1.5 py-0.5 rounded text-red-400 font-bold"
                              />
                            </div>
                          )}
                        </div>

                        {/* Traversal Tags */}
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-neutral-400 block mb-1">Traversal Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {TRAVERSAL_TAG_LIST.map(({ tag, label }) => {
                              const hasTag = selectedTileType.traversal_tags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    const newTags = hasTag
                                      ? selectedTileType.traversal_tags.filter(t => t !== tag)
                                      : [...selectedTileType.traversal_tags, tag];
                                    handleUpdateCurrentTileType(tt => ({ ...tt, traversal_tags: newTags }));
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                                    hasTag
                                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Soft Material & 45° Corner Bevels (Sand / Silt / Snow) */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 font-bold text-amber-200">
                            <span>Material Type (Physics/Wear)</span>
                          </label>
                          <select
                            value={selectedTileType.materialType || 'hard'}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, materialType: e.target.value as any }))}
                            className="text-xs bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="hard">Hard</option>
                            <option value="soft">Soft</option>
                            <option value="water">Water</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Determines the gameplay mechanics for this material (e.g. footsteps, sinking, rendering layers).
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 font-bold text-teal-200">
                            <span>Auto-Bevel Slopes Probability</span>
                          </label>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${(selectedTileType.bevelProbability ?? 0) > 0 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-neutral-900 text-neutral-500'}`}>
                            {Math.round((selectedTileType.bevelProbability ?? 0) * 100)}%
                          </span>
                        </div>
                        <div className="pt-2 pb-1 px-1">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedTileType.bevelProbability ?? 0}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, bevelProbability: parseFloat(e.target.value) }))}
                            className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Determines the chance that exposed outer corners automatically bevel into smooth 45° diagonal ramps instead of sharp 90° block edges. 0% = always square, 100% = always sloped.
                        </p>

                        {(selectedTileType.bevelProbability ?? 0) > 0 && (
                          <div className="p-2 bg-teal-950/20 border border-teal-800/40 rounded flex items-center gap-2 text-[11px] text-teal-300/90 font-mono">
                            <span className="text-teal-400 font-bold">✓ Active:</span>
                            <span>16px micro-grid contouring enabled (◤ ◥ ◣ ◢ diagonal corner transitions)</span>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* Row 2: Live Dual-Noise Blend Controls (Left) & Real-Time Preview Workspace (Right) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Side: Dual-Overlapping Noise Blend Map Controls */}
                    <div className="xl:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Sliders size={14} className="text-blue-400" />
                          Dual Overlapping Noise Blend Map
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Seamlessly blends Base A and Base B. Tweak noise parameters here and observe real-time updates on the preview canvas to the right.
                        </p>
                      </div>

                      {/* Noise A Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200">Noise Layer 1 (Base A)</span>
                          <span className="text-blue-400 font-mono text-xs font-bold">{selectedTileType.blendMap.noiseA.scale}px Texel Size</span>
                        </div>

                        {/* Texel Size / Scale Slider (4px to 512px) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Texel Wavelength Scale</span>
                            <span className="font-mono text-neutral-300">{selectedTileType.blendMap.noiseA.scale}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="512"
                            step="4"
                            value={selectedTileType.blendMap.noiseA.scale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseA: { ...tt.blendMap.noiseA, scale: parseInt(e.target.value) || 4 }
                              }
                            }))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Weight Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Layer 1 Weight Influence</span>
                            <span className="font-mono text-blue-300 font-bold">{(selectedTileType.blendMap.noiseA.weight ?? 0.5).toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.blendMap.noiseA.weight ?? 0.5}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseA: { ...tt.blendMap.noiseA, weight: parseFloat(e.target.value) }
                              }
                            }))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Seed Input & Randomizer */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                          <span className="text-[10px] font-bold text-neutral-400">Noise Seed 1:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="99999"
                              value={selectedTileType.blendMap.noiseA.seed ?? 1337}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: {
                                  ...tt.blendMap,
                                  noiseA: { ...tt.blendMap.noiseA, seed: parseInt(e.target.value) || 0 }
                                }
                              }))}
                              className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono text-blue-300 outline-none text-right"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSeed = Math.floor(Math.random() * 9999);
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  blendMap: {
                                    ...tt.blendMap,
                                    noiseA: { ...tt.blendMap.noiseA, seed: newSeed }
                                  }
                                }));
                              }}
                              className="p-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-white transition"
                              title="Randomize Noise 1 Seed"
                            >
                              <Shuffle size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Noise B Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200">Noise Layer 2 (Base B)</span>
                          <span className="text-indigo-400 font-mono text-xs font-bold">{selectedTileType.blendMap.noiseB.scale}px Texel Size</span>
                        </div>

                        {/* Texel Size / Scale Slider (4px to 512px) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Texel Wavelength Scale</span>
                            <span className="font-mono text-neutral-300">{selectedTileType.blendMap.noiseB.scale}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="512"
                            step="4"
                            value={selectedTileType.blendMap.noiseB.scale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseB: { ...tt.blendMap.noiseB, scale: parseInt(e.target.value) || 4 }
                              }
                            }))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Weight Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Layer 2 Weight Influence</span>
                            <span className="font-mono text-indigo-300 font-bold">{(selectedTileType.blendMap.noiseB.weight ?? 0.5).toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.blendMap.noiseB.weight ?? 0.5}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseB: { ...tt.blendMap.noiseB, weight: parseFloat(e.target.value) }
                              }
                            }))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Seed Input & Randomizer */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                          <span className="text-[10px] font-bold text-neutral-400">Noise Seed 2:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="99999"
                              value={selectedTileType.blendMap.noiseB.seed ?? 4242}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: {
                                  ...tt.blendMap,
                                  noiseB: { ...tt.blendMap.noiseB, seed: parseInt(e.target.value) || 0 }
                                }
                              }))}
                              className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono text-indigo-300 outline-none text-right"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSeed = Math.floor(Math.random() * 9999);
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  blendMap: {
                                    ...tt.blendMap,
                                    noiseB: { ...tt.blendMap.noiseB, seed: newSeed }
                                  }
                                }));
                              }}
                              className="p-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-white transition"
                              title="Randomize Noise 2 Seed"
                            >
                              <Shuffle size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Blend Threshold & Contrast */}
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                            <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                              <span>Threshold</span>
                              <span className="text-white font-mono">{selectedTileType.blendMap.blendThreshold}</span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="0.95"
                              step="0.05"
                              value={selectedTileType.blendMap.blendThreshold}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, blendThreshold: parseFloat(e.target.value) }
                              }))}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                            <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                              <span>Contrast</span>
                              <span className="text-white font-mono">{selectedTileType.blendMap.blendContrast}</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="10.0"
                              step="0.1"
                              value={selectedTileType.blendMap.blendContrast}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, blendContrast: parseFloat(e.target.value) }
                              }))}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Invert Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!selectedTileType.blendMap.invert}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, invert: e.target.checked }
                              }))}
                              className="rounded accent-blue-500 cursor-pointer"
                            />
                            <span className="text-neutral-300 font-medium">Invert Noise Mask (Base A ↔ B)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Real-time Blob Tileset Preview */}
                    <div className="xl:col-span-7 min-w-0">
                      <BlobTilesetPreview
                        tileType={selectedTileType}
                        onUpdateTileType={(updated) => handleUpdateCurrentTileType(() => updated)}
                      />
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: ENVIRONMENTAL NON-TILE DETAILS (Trees, Rocks, Bushes, Flora) */}
          {activeSubTab === 'environmental' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    <TreePine size={16} className="text-emerald-400" />
                    Environmental Flora & Scatter Details ({selectedBiome.environmentalDetails.length})
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Trees, foliage, crystals, and boulders placed across the world. Configurable dimensions, auto-scatter density, and destructibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newDetail: EnvironmentalDetail = {
                      id: `env_${Date.now()}`,
                      name: 'Wild Flora Bush',
                      category: 'bush',
                      icon: '🌿',
                      color: '#10b981',
                      widthTiles: 1,
                      heightTiles: 1,
                      spawnFrequency: 0.15,
                      isDestructible: false,
                      health: 40,
                      armor: 0
                    };
                    handleUpdateCurrentBiome(b => ({
                      ...b,
                      environmentalDetails: [...b.environmentalDetails, newDetail]
                    }));
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30"
                >
                  <Plus size={14} /> Add Flora / Detail
                </button>
              </div>

              {selectedBiome.environmentalDetails.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                  No flora or environmental details added to this biome yet. Click <strong>+ Add Flora / Detail</strong> above to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedBiome.environmentalDetails.map((detail, idx) => (
                    <div key={detail.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3.5 shadow-lg relative group">
                      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="text"
                            value={detail.icon}
                            onChange={(e) => {
                              const updated = [...selectedBiome.environmentalDetails];
                              updated[idx] = { ...detail, icon: e.target.value };
                              handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                            }}
                            className="w-8 h-8 text-xl bg-neutral-950 border border-neutral-800 rounded-lg text-center outline-none shrink-0"
                            title="Emoji Icon"
                          />
                          <div className="min-w-0">
                            <input
                              type="text"
                              value={detail.name}
                              onChange={(e) => {
                                const updated = [...selectedBiome.environmentalDetails];
                                updated[idx] = { ...detail, name: e.target.value };
                                handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                              }}
                              className="font-bold text-xs text-neutral-200 bg-transparent border-b border-dashed border-neutral-700 focus:border-emerald-500 outline-none w-full truncate"
                            />
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <select
                                value={detail.category}
                                onChange={(e) => {
                                  const updated = [...selectedBiome.environmentalDetails];
                                  updated[idx] = { ...detail, category: e.target.value as any };
                                  handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                                }}
                                className="text-[10px] text-emerald-400 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 outline-none font-mono"
                              >
                                <option value="tree">🌲 Tree</option>
                                <option value="bush">🌿 Bush / Foliage</option>
                                <option value="rock">🪨 Rock / Boulder</option>
                                <option value="ruin">🏛️ Ruin / Pillar</option>
                                <option value="crystal">💎 Crystal Spire</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={detail.color}
                            onChange={(e) => {
                              const updated = [...selectedBiome.environmentalDetails];
                              updated[idx] = { ...detail, color: e.target.value };
                              handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                            }}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border border-neutral-700"
                            title="Tint Color"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCurrentBiome(b => ({
                                ...b,
                                environmentalDetails: b.environmentalDetails.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                            title="Delete Flora"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Scatter Frequency */}
                      <div className="space-y-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-400 text-[11px]">Procedural Scatter Density</span>
                          <span className="font-mono text-emerald-400 font-bold">{(detail.spawnFrequency * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.01"
                          max="0.5"
                          step="0.01"
                          value={detail.spawnFrequency}
                          onChange={(e) => {
                            const updated = [...selectedBiome.environmentalDetails];
                            updated[idx] = { ...detail, spawnFrequency: parseFloat(e.target.value) };
                            handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                          }}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      {/* Destructible Toggle */}
                      <div className="pt-1">
                        <label className="flex items-center justify-between cursor-pointer p-2 bg-neutral-950 rounded-xl border border-neutral-800/80">
                          <span className="text-xs text-neutral-300">Destructible by Player</span>
                          <input
                            type="checkbox"
                            checked={detail.isDestructible}
                            onChange={(e) => {
                              const updated = [...selectedBiome.environmentalDetails];
                              updated[idx] = { ...detail, isDestructible: e.target.checked };
                              handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                            }}
                            className="rounded accent-emerald-500 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE PROPS & TRIGGER ZONES */}
          {activeSubTab === 'interactive' && (
            <BiomePropsEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
              availableMaps={availableMaps}
            />
          )}

          {/* TAB 4: WILDLIFE */}
          {activeSubTab === 'wildlife' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Wildlife & Creatures</h3>
                  <p className="text-xs text-neutral-400">
                    Ambient, interactable, and neutral wildlife specific to this biome ecosystem.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBiome.wildlife.map((beast) => (
                  <div key={beast.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{beast.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-neutral-200">{beast.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono capitalize">{beast.behavior.replace('_', ' ')}</div>
                      </div>
                    </div>
                    {beast.interactionAction && (
                      <div className="text-xs bg-neutral-950 p-2 rounded text-emerald-300">
                        Action: {beast.interactionAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SOUNDTRACK & AUDIO */}
          {activeSubTab === 'soundtrack' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Music size={16} className="text-indigo-400" />
                  Adaptive Soundtrack & Audio Rules
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Exploration Theme:</span>
                    <span className="font-mono text-indigo-300">{selectedBiome.soundtrack.ambientExplorationTrack}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Combat Encounter Theme:</span>
                    <span className="font-mono text-red-300">{selectedBiome.soundtrack.combatTrack}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Boss Arena Theme:</span>
                    <span className="font-mono text-amber-300">{selectedBiome.soundtrack.bossEngagementTrack}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PARALLAX BACKGROUNDS (-5 TO +1) */}
          {activeSubTab === 'parallax' && (
            <ParallaxLayersEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
            />
          )}

          {/* TAB 7: BIOME STATES */}
          {activeSubTab === 'biome_states' && (
            <BiomeStatesEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
            />
          )}

          {/* TAB 8: BIOME VARIABLES */}
          {activeSubTab === 'biome_variables' && (
            <BiomeVariablesEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
            />
          )}

          {/* TAB 9: BIOME BEHAVIORS */}
          {activeSubTab === 'biome_behaviors' && (
            <BiomeBehaviorsEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
              availableMaps={availableMaps}
              availableParticles={project?.fileSystem?.particles}
            />
          )}

        </div>

      </main>

      {/* Full-Resolution Image Inspection Lightbox Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm text-neutral-100">{previewModalImage.title} Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div 
              className="w-full h-72 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-inner p-4"
              style={{
                backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
                backgroundSize: '16px 16px'
              }}
            >
              <img
                src={previewModalImage.url}
                alt={previewModalImage.title}
                className="max-h-full max-w-full object-contain drop-shadow-2xl rounded"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span className="font-mono text-[11px] text-neutral-400">Crisp Pixelated • Alpha Transparency Preview</span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition text-xs shadow"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert for Biome Module */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div 
            className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/60 text-red-200 shadow-red-950/50'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200 shadow-neutral-950/50'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && <AlertTriangle size={16} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && <Database size={16} className="text-emerald-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};
