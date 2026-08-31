import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  Copy, 
  Save, 
  Download, 
  Trash2, 
  ChevronDown, 
  Check, 
  Edit2,
  Link2,
  Link2Off,
  Maximize2,
  Cloud,
  Upload
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  fileName: string;
  updatedAt?: string;
  badge?: string;
}

interface FileSubfolderHeaderProps {
  subfolderName: string; // e.g. "maps", "biomes", "prefabs", "behaviors", "ui", "game", "sprites"
  extension: string; // e.g. ".map", ".biome", ".prefab", ".ui", ".gamestructure", ".sprite"
  files: FileItem[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onNewFile: (name: string, dimensions?: { width: number; height: number }) => void;
  onDuplicateFile: (fileName: string) => void;
  onSaveFile: () => void;
  onExportFile: (fileName: string) => void;
  onDeleteFile?: (fileName: string) => void;
  onRenameFile?: (oldFileName: string, newName: string) => void;
  onBackToDashboard?: () => void;
  onImportFile?: () => void;
  onImportCloudFile?: () => void;
  onImportLocalFile?: () => void;
  isDirty?: boolean;
  accentColor?: string; // e.g. "cyan", "emerald", "amber", "purple", "rose"
  centerContent?: React.ReactNode;
  extraActions?: React.ReactNode;
  showDimensions?: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
}

export const FileSubfolderHeader: React.FC<FileSubfolderHeaderProps> = ({
  subfolderName,
  extension,
  files,
  activeFileName,
  onSelectFile,
  onNewFile,
  onDuplicateFile,
  onSaveFile,
  onExportFile,
  onDeleteFile,
  onRenameFile,
  onBackToDashboard,
  onImportFile,
  onImportCloudFile,
  onImportLocalFile,
  isDirty = false,
  accentColor = 'cyan',
  centerContent,
  extraActions,
  showDimensions,
  defaultWidth = 32,
  defaultHeight = 32
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Dimensions state for sprite / custom size creation
  const hasDimensions = showDimensions || extension === '.sprite';
  const [canvasWidth, setCanvasWidth] = useState<number>(defaultWidth);
  const [canvasHeight, setCanvasHeight] = useState<number>(defaultHeight);
  const [isAspectLinked, setIsAspectLinked] = useState<boolean>(true);

  const safeFiles = files || [];
  const currentFile = safeFiles.find(f => f.fileName === activeFileName) || safeFiles[0] || {
    id: 'default',
    name: activeFileName || 'file',
    fileName: activeFileName || 'file'
  };

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [activeFileName]);

  const handleOpenCreateModal = () => {
    setCanvasWidth(defaultWidth);
    setCanvasHeight(defaultHeight);
    setIsAspectLinked(true);
    setNewFileNameInput('');
    setIsCreatingNew(true);
  };

  const handleWidthChange = (val: number) => {
    const clamped = Math.max(1, Math.min(8192, val));
    setCanvasWidth(clamped);
    if (isAspectLinked) {
      setCanvasHeight(clamped);
    }
  };

  const handleHeightChange = (val: number) => {
    const clamped = Math.max(1, Math.min(8192, val));
    setCanvasHeight(clamped);
    if (isAspectLinked) {
      setCanvasWidth(clamped);
    }
  };

  const handlePresetSelect = (size: number) => {
    setCanvasWidth(size);
    setCanvasHeight(size);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileNameInput.trim()) return;
    if (hasDimensions) {
      onNewFile(newFileNameInput.trim(), {
        width: Math.max(1, Math.min(8192, canvasWidth || 32)),
        height: Math.max(1, Math.min(8192, canvasHeight || 32))
      });
    } else {
      onNewFile(newFileNameInput.trim());
    }
    setNewFileNameInput('');
    setIsCreatingNew(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim() || !onRenameFile) return;
    onRenameFile(currentFile.fileName, renameInput.trim());
    setIsRenaming(false);
  };

  return (
    <div className="h-9 bg-neutral-950/95 border-b border-neutral-800/80 px-3 flex items-center justify-between shrink-0 select-none z-20 gap-2">
      {/* Left: Path & Dropdown Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
          <Folder size={12} className={accentColor === 'emerald' ? 'text-emerald-400' : accentColor === 'rose' ? 'text-rose-400' : accentColor === 'purple' ? 'text-purple-400' : 'text-cyan-400'} />
          <span>/{subfolderName}/</span>
        </div>

        {/* Active File Switcher Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded text-xs font-semibold text-neutral-200 transition shadow-sm"
          >
            <FileText size={12} className="text-neutral-400" />
            <span className="font-mono text-white max-w-[120px] sm:max-w-[160px] truncate">
              {currentFile ? currentFile.fileName : `untitled${extension}`}
            </span>
            <span className="text-[9px] px-1 py-0.1 bg-neutral-800 text-neutral-400 rounded">
              {files.length}
            </span>
            <ChevronDown size={11} className="text-neutral-400" />
          </button>

          {/* Subfolder Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in duration-100">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-1.5">
                  <span>Available Files in /{subfolderName}/</span>
                  <span className="font-mono text-cyan-400">{extension}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
                  {files.map(f => {
                    const isActive = f.fileName === activeFileName;
                    return (
                      <button
                        key={f.id || f.fileName}
                        type="button"
                        onClick={() => {
                          onSelectFile(f.fileName);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left text-xs transition flex items-center justify-between ${
                          isActive 
                            ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 font-semibold' 
                            : 'text-neutral-300 hover:bg-neutral-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText size={13} className={isActive ? 'text-cyan-400' : 'text-neutral-500'} />
                          <div className="truncate">
                            <div className="font-mono text-xs">{f.fileName}</div>
                            <div className="text-[10px] text-neutral-400 truncate">{f.name}</div>
                          </div>
                        </div>
                        {isActive && <Check size={14} className="text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-neutral-800 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleOpenCreateModal();
                    }}
                    className="w-full py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus size={13} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
                    <span>Create New {extension} File</span>
                  </button>

                  {(onImportFile || onImportCloudFile || onImportLocalFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onImportFile) {
                          onImportFile();
                        } else if (onImportCloudFile) {
                          onImportCloudFile();
                        } else if (onImportLocalFile) {
                          onImportLocalFile();
                        }
                      }}
                      className="w-full py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Upload size={13} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
                      <span>Import...</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Renaming mode or inline edit */}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="bg-neutral-900 border border-cyan-500 rounded-md px-2 py-0.5 text-xs text-white outline-none w-32 sm:w-40"
              placeholder="New Display Name"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="px-2 py-0.5 bg-neutral-800 text-neutral-400 hover:text-white rounded text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          onRenameFile && currentFile && (
            <button
              type="button"
              onClick={() => {
                setRenameInput(currentFile.name);
                setIsRenaming(true);
              }}
              className="p-1 text-neutral-500 hover:text-neutral-300 rounded hover:bg-neutral-800 transition"
              title="Rename File"
            >
              <Edit2 size={11} />
            </button>
          )
        )}
      </div>

      {/* Center: Center Content (e.g. Entity Name, Avatar & Badges) */}
      {centerContent && (
        <div className="flex-1 flex items-center justify-center min-w-0 px-2 overflow-hidden">
          {centerContent}
        </div>
      )}

      {/* Right: Extra Custom Actions + Action Controls for this Subfolder File */}
      <div className="flex items-center gap-1.5 shrink-0">
        {extraActions && (
          <div className="flex items-center gap-1.5 mr-0.5">
            {extraActions}
            <div className="h-3.5 w-px bg-neutral-800 hidden sm:block"></div>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded text-xs font-semibold text-neutral-200 transition"
          title={`Create new ${extension} file`}
        >
          <Plus size={12} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
          <span className="hidden sm:inline">New {extension}</span>
          <span className="sm:hidden">New</span>
        </button>

        <button
          type="button"
          onClick={() => currentFile && onDuplicateFile(currentFile.fileName)}
          className="p-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded text-xs text-neutral-300 transition"
          title="Duplicate current file"
        >
          <Copy size={12} />
        </button>

        <button
          type="button"
          onClick={onSaveFile}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition shadow-sm ${
            isDirty 
              ? "bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.9)] animate-pulse scale-105" 
              : "bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200"
          }`}
          title={isDirty ? "Unsaved changes! Click to save" : "Save changes to file"}
        >
          <Save size={13} className={isDirty ? "text-white" : "text-cyan-400"} />
          <span className="hidden sm:inline">Save</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => currentFile && onExportFile(currentFile.fileName)}
          className="p-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded text-xs text-neutral-300 transition"
          title={`Download ${currentFile?.fileName || extension}`}
        >
          <Download size={12} />
        </button>

        {onDeleteFile && currentFile && (
          isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/60 rounded p-0.5 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] text-red-300 font-semibold px-1">Delete {extension}?</span>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  onDeleteFile(currentFile.fileName);
                }}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition shadow"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1 bg-neutral-900 hover:bg-red-950/60 border border-neutral-700/80 hover:border-red-500/40 rounded text-xs text-neutral-400 hover:text-red-300 transition"
              title={`Delete ${currentFile.fileName}`}
            >
              <Trash2 size={12} />
            </button>
          )
        )}
      </div>

      {/* Create New File Modal Prompt */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateSubmit}
            className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Create New {extension} File</h3>
                  <p className="text-[11px] text-neutral-400">Will be saved to <code className="text-cyan-400 font-mono">/{subfolderName}/</code></p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">File Display Name</label>
              <input
                type="text"
                autoFocus
                value={newFileNameInput}
                onChange={(e) => setNewFileNameInput(e.target.value)}
                placeholder={extension === '.sprite' ? 'e.g. Hero Walk Cycle' : 'e.g. Ashen Fortress Depths'}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 outline-none"
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                Filename: {newFileNameInput ? `${newFileNameInput.toLowerCase().replace(/[^a-z0-9]/g, '_')}${extension}` : `example${extension}`}
              </p>
            </div>

            {hasDimensions && (
              <div className="space-y-2.5 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Maximize2 size={13} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
                    <span>Canvas Dimensions</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {canvasWidth} × {canvasHeight} px ({(canvasWidth * canvasHeight).toLocaleString()} px)
                  </span>
                </div>

                {/* Quick Size Presets */}
                <div className="flex flex-wrap gap-1">
                  {[16, 24, 32, 48, 64, 128, 256].map((size) => {
                    const isSelected = canvasWidth === size && canvasHeight === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handlePresetSelect(size)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                          isSelected
                            ? accentColor === 'emerald'
                              ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold'
                              : 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-bold'
                            : 'bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {size}×{size}
                      </button>
                    );
                  })}
                </div>

                {/* Width & Height Number Inputs + Link Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={8192}
                      value={canvasWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="pt-4 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setIsAspectLinked(!isAspectLinked)}
                      className={`p-1.5 rounded-lg border transition ${
                        isAspectLinked
                          ? accentColor === 'emerald'
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                            : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                      title={isAspectLinked ? 'Aspect Ratio Linked (Width = Height)' : 'Aspect Ratio Unlinked'}
                    >
                      {isAspectLinked ? <Link2 size={14} /> : <Link2Off size={14} />}
                    </button>
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Height (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={8192}
                      value={canvasHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFileNameInput.trim()}
                className={`px-4 py-1.5 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md ${
                  accentColor === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                }`}
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
