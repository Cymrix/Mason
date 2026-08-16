import React, { useState } from 'react';
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
  Sparkles,
  Edit2,
  FolderOpen
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  fileName: string;
  updatedAt?: string;
  badge?: string;
}

interface FileSubfolderHeaderProps {
  subfolderName: string; // e.g. "maps", "biomes", "archetypes", "ui", "game"
  extension: string; // e.g. ".map", ".biome", ".arch", ".ui", ".gamestructure"
  files: FileItem[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onNewFile: (name: string) => void;
  onDuplicateFile: (fileName: string) => void;
  onSaveFile: () => void;
  onExportFile: (fileName: string) => void;
  onDeleteFile?: (fileName: string) => void;
  onRenameFile?: (oldFileName: string, newName: string) => void;
  accentColor?: string; // e.g. "cyan", "emerald", "amber", "purple", "rose"
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
  accentColor = 'cyan'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const currentFile = files.find(f => f.fileName === activeFileName) || files[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileNameInput.trim()) return;
    onNewFile(newFileNameInput.trim());
    setNewFileNameInput('');
    setIsCreatingNew(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim() || !onRenameFile) return;
    onRenameFile(currentFile.fileName, renameInput.trim());
    setIsRenaming(false);
  };

  const getAccentClass = () => {
    switch (accentColor) {
      case 'emerald': return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
      case 'amber': return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
      case 'purple': return 'text-purple-400 border-purple-500/40 bg-purple-950/30';
      case 'rose': return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
      default: return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30';
    }
  };

  return (
    <div className="h-11 bg-neutral-950/90 border-b border-neutral-800/80 px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* File Path & Dropdown Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
          <Folder size={14} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
          <span>/{subfolderName}/</span>
        </div>

        {/* Active File Switcher Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded-lg text-xs font-semibold text-neutral-200 transition shadow-sm"
          >
            <FileText size={13} className="text-neutral-400" />
            <span className="font-mono text-white max-w-[200px] truncate">
              {currentFile ? currentFile.fileName : `untitled${extension}`}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
            <ChevronDown size={12} className="text-neutral-400" />
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

                <div className="pt-1.5 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsCreatingNew(true);
                    }}
                    className="w-full py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus size={13} className="text-cyan-400" />
                    <span>Create New {extension} File</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Renaming mode or Title */}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="bg-neutral-900 border border-cyan-500 rounded-md px-2 py-0.5 text-xs text-white outline-none w-44"
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300">
              {currentFile?.name}
            </span>
            {onRenameFile && currentFile && (
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
            )}
          </div>
        )}
      </div>

      {/* Action Controls for this Subfolder File */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-xs font-semibold text-neutral-200 transition"
          title={`Create new ${extension} file`}
        >
          <Plus size={13} className="text-cyan-400" />
          <span>New {extension}</span>
        </button>

        <button
          type="button"
          onClick={() => currentFile && onDuplicateFile(currentFile.fileName)}
          className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-xs text-neutral-300 transition"
          title="Duplicate current file"
        >
          <Copy size={13} />
        </button>

        <button
          type="button"
          onClick={onSaveFile}
          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 rounded-lg text-xs font-semibold transition"
          title="Save changes to file"
        >
          <Save size={13} className="text-cyan-400" />
          <span>Save</span>
        </button>

        <button
          type="button"
          onClick={() => currentFile && onExportFile(currentFile.fileName)}
          className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-xs text-neutral-300 transition"
          title={`Download ${currentFile?.fileName || extension}`}
        >
          <Download size={13} />
        </button>

        {onDeleteFile && files.length > 1 && currentFile && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete ${currentFile.fileName}? This action cannot be undone.`)) {
                onDeleteFile(currentFile.fileName);
              }
            }}
            className="p-1.5 bg-neutral-900 hover:bg-red-950/60 border border-neutral-700/80 hover:border-red-500/40 rounded-lg text-xs text-neutral-400 hover:text-red-300 transition"
            title="Delete this file"
          >
            <Trash2 size={13} />
          </button>
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
                placeholder="e.g. Ashen Fortress Depths"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 outline-none"
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                Filename: {newFileNameInput ? `${newFileNameInput.toLowerCase().replace(/[^a-z0-9]/g, '_')}${extension}` : `example${extension}`}
              </p>
            </div>

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
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md shadow-cyan-600/30"
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
