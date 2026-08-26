import React, { useState, useMemo } from 'react';
import { MasonProject, ImageFile, SpriteExportMetadata } from '../engine/masonProjectSchema';
import { sanitizeAndRepairProjectImageLinks, relinkImageToSprite } from '../utils/spriteUtils';
import {
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Link,
  Link2Off,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  FileImage,
  ArrowRight,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export interface PendingExportData {
  dataUrl: string;
  defaultFileName: string;
  defaultDisplayName: string;
  exportSettings?: SpriteExportMetadata;
  exportType?: string;
  width?: number;
  height?: number;
}

interface VirtualExportImageModalProps {
  project: MasonProject;
  activeSpriteFileName: string;
  exportData: PendingExportData;
  onSaveExport: (
    targetFileName: string,
    displayName: string,
    dataUrl: string,
    exportSettings?: SpriteExportMetadata
  ) => void;
  onClose: () => void;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const VirtualExportImageModal: React.FC<VirtualExportImageModalProps> = ({
  project,
  activeSpriteFileName,
  exportData,
  onSaveExport,
  onClose,
  onUpdateProject,
  onShowToast
}) => {
  const allImages = project.fileSystem.images || [];
  const allSprites = project.fileSystem.sprites || [];
  const activeSprite = allSprites.find(s => s.fileName === activeSpriteFileName);

  // Derive intelligent clean base name from active sprite (fixing "untitled" fallback!)
  const activeSpriteCleanBase = useMemo(() => {
    if (!activeSprite) return 'exported_image';
    const raw = activeSprite.name || activeSprite.fileName.replace(/\.sprite$/i, '');
    return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'exported_image';
  }, [activeSprite]);

  // Initial target mode & selection
  const [saveMode, setSaveMode] = useState<'existing' | 'new'>(() => {
    return allImages.length > 0 ? 'existing' : 'new';
  });

  // Find if an image is already linked to this active sprite to default-select it!
  const defaultSelectedFileName = useMemo(() => {
    const linkedList = activeSprite?.linkedImageFileNames || [];
    const directMatch = allImages.find(img =>
      img.sourceSpriteFileName === activeSpriteFileName ||
      linkedList.includes(img.fileName) ||
      img.fileName === `${activeSpriteCleanBase}.png`
    );
    return directMatch ? directMatch.fileName : (allImages[0]?.fileName || '');
  }, [allImages, activeSpriteFileName, activeSprite?.linkedImageFileNames, activeSpriteCleanBase]);

  const [selectedTargetFileName, setSelectedTargetFileName] = useState<string>(defaultSelectedFileName);

  // State for "Create New File" mode
  const [newFileNameInput, setNewFileNameInput] = useState<string>(() => {
    if (exportData.defaultFileName && !exportData.defaultFileName.toLowerCase().includes('untitled')) {
      return exportData.defaultFileName;
    }
    const ext = exportData.defaultFileName.toLowerCase().endsWith('.gif') ? '.gif' : '.png';
    return `${activeSpriteCleanBase}${ext}`;
  });

  const [newDisplayNameInput, setNewDisplayNameInput] = useState<string>(() => {
    if (exportData.defaultDisplayName && !exportData.defaultDisplayName.toLowerCase().includes('untitled')) {
      return exportData.defaultDisplayName;
    }
    return activeSprite?.name || 'Exported Image';
  });

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'linked_current' | 'linked_other' | 'unlinked'>('all');

  // Relink dropdown active image state
  const [relinkingImageFileName, setRelinkingImageFileName] = useState<string | null>(null);

  // Filtered images list
  const filteredImages = useMemo(() => {
    return allImages.filter(img => {
      const matchesSearch = img.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const isLinkedToCurrent = img.sourceSpriteFileName === activeSpriteFileName ||
        (activeSprite?.linkedImageFileNames || []).includes(img.fileName);
      const isLinkedToOther = !!img.sourceSpriteFileName && img.sourceSpriteFileName !== activeSpriteFileName;
      const isUnlinked = !img.sourceSpriteFileName && !(allSprites.some(s => (s.linkedImageFileNames || []).includes(img.fileName)));

      if (filterType === 'linked_current') return isLinkedToCurrent;
      if (filterType === 'linked_other') return isLinkedToOther;
      if (filterType === 'unlinked') return isUnlinked;
      return true;
    });
  }, [allImages, searchTerm, filterType, activeSpriteFileName, activeSprite?.linkedImageFileNames, allSprites]);

  // Quick name preset chips
  const quickPresets = [
    { label: `${activeSpriteCleanBase}.png`, name: activeSprite?.name || 'Color Image' },
    { label: `${activeSpriteCleanBase}_spritesheet.png`, name: `${activeSprite?.name || 'Sprite'} Spritesheet` },
    { label: `${activeSpriteCleanBase}_height.png`, name: `${activeSprite?.name || 'Sprite'} Height Map` },
    { label: `${activeSpriteCleanBase}_roughness.png`, name: `${activeSprite?.name || 'Sprite'} Roughness Map` },
    { label: `${activeSpriteCleanBase}.gif`, name: `${activeSprite?.name || 'Sprite'} Animation` },
  ];

  // Handle Sanitize & Repair Links
  const handleRepairLinks = () => {
    const { updatedProject, repairedCount } = sanitizeAndRepairProjectImageLinks(project);
    onUpdateProject(() => updatedProject);
    if (repairedCount > 0) {
      onShowToast(`Repaired ${repairedCount} broken image link${repairedCount > 1 ? 's' : ''}!`, 'success');
    } else {
      onShowToast('All project image links are healthy and in sync!', 'info');
    }
  };

  // Handle manual relinking of an image
  const handleRelink = (imageFileName: string, newSpriteFileName: string | null) => {
    const updatedProj = relinkImageToSprite(project, imageFileName, newSpriteFileName);
    onUpdateProject(() => updatedProj);
    setRelinkingImageFileName(null);
    const spriteObj = allSprites.find(s => s.fileName === newSpriteFileName);
    if (newSpriteFileName) {
      onShowToast(`Linked "${imageFileName}" to "${spriteObj?.name || newSpriteFileName}"`, 'success');
    } else {
      onShowToast(`Unlinked "${imageFileName}"`, 'info');
    }
  };

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (saveMode === 'existing') {
      if (!selectedTargetFileName) {
        onShowToast('Please select a target image file to overwrite.', 'error');
        return;
      }
      const targetImg = allImages.find(i => i.fileName === selectedTargetFileName);
      const displayName = targetImg ? targetImg.name : selectedTargetFileName.replace(/\.(png|gif)$/i, '');

      onSaveExport(selectedTargetFileName, displayName, exportData.dataUrl, exportData.exportSettings);
    } else {
      let cleanFile = newFileNameInput.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      if (!cleanFile.endsWith('.png') && !cleanFile.endsWith('.gif')) {
        cleanFile = `${cleanFile}.png`;
      }
      if (!cleanFile) {
        onShowToast('Please enter a valid target file name.', 'error');
        return;
      }
      const displayName = newDisplayNameInput.trim() || cleanFile.replace(/\.(png|gif)$/i, '');

      onSaveExport(cleanFile, displayName, exportData.dataUrl, exportData.exportSettings);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileImage size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Virtual Image Destination Picker
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                  /images/ Storage
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Exporting from <span className="font-semibold text-emerald-300">"{activeSprite?.name || activeSpriteFileName}"</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepairLinks}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Repair broken links between sprites and images"
            >
              <RefreshCw size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">Sync Links</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Export Payload Preview Card */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={exportData.dataUrl}
                alt="Export preview"
                className="max-w-full max-h-full object-contain [image-rendering:pixelated]"
              />
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-white">
                  {exportData.exportType || 'Rendered Image Export'}
                </span>
                <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono font-bold text-emerald-400">
                  {exportData.width || 32} × {exportData.height || 32} px
                </span>
                <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono text-cyan-400">
                  PNG Data
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Choose an existing file in <code className="text-neutral-300 bg-neutral-900 px-1 rounded">/images/</code> to update, or save as a new image file in project storage.
              </p>
            </div>
          </div>

          {/* Target Mode Selector Tabs */}
          <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => setSaveMode('existing')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                saveMode === 'existing'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ImageIcon size={14} />
              <span>Overwrite Existing Target Image ({allImages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSaveMode('new')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                saveMode === 'new'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Plus size={14} />
              <span>Create New Image File</span>
            </button>
          </div>

          {/* MODE 1: Select Existing Target File */}
          {saveMode === 'existing' && (
            <div className="space-y-3">
              {allImages.length === 0 ? (
                <div className="p-8 bg-neutral-950/60 border border-dashed border-neutral-800 rounded-xl text-center space-y-2">
                  <ImageIcon size={28} className="mx-auto text-neutral-600" />
                  <p className="text-xs font-semibold text-neutral-300">No images in /images/ folder yet.</p>
                  <p className="text-[11px] text-neutral-500">Switch to "Create New Image File" mode to save this export.</p>
                  <button
                    type="button"
                    onClick={() => setSaveMode('new')}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Create New File</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-2.5 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search image files by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-white placeholder-neutral-500 transition"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 overflow-x-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                          filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('linked_current')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                          filterType === 'linked_current' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Active Sprite
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('unlinked')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                          filterType === 'unlinked' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Unlinked
                      </button>
                    </div>
                  </div>

                  {/* Image Target Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {filteredImages.map(img => {
                      const isSelected = selectedTargetFileName === img.fileName;
                      const isLinkedToCurrent = img.sourceSpriteFileName === activeSpriteFileName ||
                        (activeSprite?.linkedImageFileNames || []).includes(img.fileName);
                      
                      const linkedSpriteObj = img.sourceSpriteFileName
                        ? allSprites.find(s => s.fileName === img.sourceSpriteFileName)
                        : allSprites.find(s => (s.linkedImageFileNames || []).includes(img.fileName));

                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedTargetFileName(img.fileName)}
                          className={`group relative p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                              : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                          }`}
                        >
                          {/* Selected Check Indicator */}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-neutral-950' : 'border-neutral-700 text-transparent'
                          }`}>
                            <CheckCircle2 size={12} strokeWidth={3} />
                          </div>

                          {/* Image Thumbnail */}
                          <div className="w-12 h-12 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:6px_6px] bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                            {img.dataUrl ? (
                              <img
                                src={img.dataUrl}
                                alt={img.name}
                                className="max-w-full max-h-full object-contain [image-rendering:pixelated]"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-neutral-600" />
                            )}
                          </div>

                          {/* Info & Link Badges */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">
                                {img.name}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                                {img.fileName}
                              </span>
                            </div>

                            {/* Link Badge */}
                            <div className="flex items-center gap-1.5">
                              {isLinkedToCurrent ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9.5px] font-medium text-emerald-300">
                                  <Link size={10} />
                                  <span>Linked to active sprite</span>
                                </span>
                              ) : linkedSpriteObj ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9.5px] font-medium text-cyan-300 truncate max-w-[170px]">
                                  <Link size={10} />
                                  <span className="truncate">Linked: {linkedSpriteObj.name}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[9.5px] font-medium text-amber-300">
                                  <Link2Off size={10} />
                                  <span>Unlinked Image</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Relink Menu Toggle Button */}
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRelinkingImageFileName(relinkingImageFileName === img.fileName ? null : img.fileName);
                              }}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[10px] font-semibold transition"
                              title="Relink this image to a sprite"
                            >
                              Relink
                            </button>

                            {/* Relink Dropdown */}
                            {relinkingImageFileName === img.fileName && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-7 z-50 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                                  Relink to Sprite Project
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-0.5 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRelink(img.fileName, null)}
                                    className="w-full text-left px-2 py-1 rounded hover:bg-amber-950/60 text-amber-300 text-[11px] font-semibold transition flex items-center justify-between"
                                  >
                                    <span>Unlinked (None)</span>
                                    <Link2Off size={11} />
                                  </button>
                                  {allSprites.map(s => (
                                    <button
                                      key={s.fileName}
                                      type="button"
                                      onClick={() => handleRelink(img.fileName, s.fileName)}
                                      className={`w-full text-left px-2 py-1 rounded hover:bg-emerald-950/60 text-[11px] transition flex items-center justify-between ${
                                        img.sourceSpriteFileName === s.fileName ? 'text-emerald-400 font-bold bg-emerald-950/30' : 'text-neutral-200'
                                      }`}
                                    >
                                      <span className="truncate">{s.name}</span>
                                      <span className="text-[9px] font-mono text-neutral-500">{s.fileName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MODE 2: Create New Image File */}
          {saveMode === 'new' && (
            <div className="space-y-4 bg-neutral-950/60 border border-neutral-800 rounded-xl p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>New Target Image File Name</span>
                  <span className="text-emerald-400 font-mono">*</span>
                </label>
                <input
                  type="text"
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="e.g. hero_spritesheet.png"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-mono text-emerald-300 placeholder-neutral-600 transition"
                />
                <p className="text-[10px] text-neutral-400">
                  Will be saved under <code className="text-emerald-400 font-mono">/images/{newFileNameInput || '...'}</code> and linked to <code className="text-emerald-400 font-mono">{activeSpriteFileName}</code>.
                </p>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white">
                  Display Title / Label
                </label>
                <input
                  type="text"
                  value={newDisplayNameInput}
                  onChange={(e) => setNewDisplayNameInput(e.target.value)}
                  placeholder="e.g. Hero Character Spritesheet"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-white placeholder-neutral-600 transition"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-neutral-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNewFileNameInput(preset.label);
                        setNewDisplayNameInput(preset.name);
                      }}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-emerald-950/80 border border-neutral-750 hover:border-emerald-500/60 rounded-lg text-[10.5px] font-mono text-neutral-300 hover:text-emerald-300 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sync Integrity Notice */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-start gap-2.5">
            <Info size={15} className="text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Exporting to an image file automatically pairs its metadata with <span className="font-semibold text-emerald-300">{activeSprite?.name || activeSpriteFileName}</span>. Any future edits or slicing options will stay bi-directionally synchronized across project modules.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 flex items-center gap-2"
            >
              <span>Save &amp; Overwrite Target</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
