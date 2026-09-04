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
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { FileCheckoutInfo } from '../engine/masonProjectSchema';
import { 
  getCurrentSessionId, 
  getShortSessionId, 
  isCurrentSessionCheckout, 
  isOtherSessionCheckout 
} from '../utils/fileCheckoutStore';

export interface FileItem {
  id: string;
  name: string;
  fileName: string;
  updatedAt?: string;
  badge?: string;
  checkout?: FileCheckoutInfo;
}

interface FileSubfolderHeaderProps {
  subfolderName: string; // e.g. "maps", "biomes", "prefabs", "behaviors", "ui", "game", "sprites", "particles"
  extension: string; // e.g. ".map", ".biome", ".prefab", ".ui", ".gamestructure", ".sprite", ".particle"
  files: FileItem[];
  activeFileName: string;
  checkout?: FileCheckoutInfo;
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
  onRefreshFromLinked?: () => void;
  onCheckOutFile?: (fileName: string, note?: string) => void;
  onCheckInFile?: (fileName: string, pushChanges: boolean, note?: string) => void;
  onForceUnlockFile?: (fileName: string) => void;
  isSyncingLinked?: boolean;
  isOutOfSync?: boolean;
  storageType?: string;
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
  checkout,
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
  onRefreshFromLinked,
  onCheckOutFile,
  onCheckInFile,
  onForceUnlockFile,
  isSyncingLinked = false,
  isOutOfSync = false,
  storageType,
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

  // Check-Out / Check-In Modal States
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [checkOutNoteInput, setCheckOutNoteInput] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInPushChanges, setCheckInPushChanges] = useState(true);
  const [checkInNoteInput, setCheckInNoteInput] = useState('');
  const [isConfirmingForceUnlock, setIsConfirmingForceUnlock] = useState(false);

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

  // Derive checkout status
  const activeCheckout: FileCheckoutInfo | undefined = currentFile?.checkout || checkout;
  const isCheckedOut = !!(activeCheckout && activeCheckout.isCheckedOut);
  const isMine = isCurrentSessionCheckout(activeCheckout);
  const isLockedByOther = isOtherSessionCheckout(activeCheckout);
  const currentSessionId = getCurrentSessionId();
  const checkoutShortSid = activeCheckout?.sessionId ? getShortSessionId(activeCheckout.sessionId) : '';

  useEffect(() => {
    setIsConfirmingDelete(false);
    setIsConfirmingForceUnlock(false);
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
    if (!renameInput.trim() || !onRenameFile || !currentFile) return;
    onRenameFile(currentFile.fileName, renameInput.trim());
    setIsRenaming(false);
  };

  const handleConfirmCheckOut = () => {
    if (onCheckOutFile && currentFile) {
      onCheckOutFile(currentFile.fileName, checkOutNoteInput.trim() || undefined);
    }
    setIsCheckOutModalOpen(false);
    setCheckOutNoteInput('');
  };

  const handleConfirmCheckIn = () => {
    if (onCheckInFile && currentFile) {
      onCheckInFile(currentFile.fileName, checkInPushChanges, checkInNoteInput.trim() || undefined);
    }
    setIsCheckInModalOpen(false);
    setCheckInNoteInput('');
  };

  const handleConfirmForceUnlock = () => {
    if (onForceUnlockFile && currentFile) {
      onForceUnlockFile(currentFile.fileName);
    }
    setIsConfirmingForceUnlock(false);
  };

  return (
    <div className="flex flex-col w-full shrink-0">
      {/* Top Header Bar */}
      <div className={`h-11 border-b px-3 flex items-center justify-between gap-2 z-20 select-none transition-colors ${
        isLockedByOther 
          ? "bg-red-950/40 border-red-700/60 shadow-[inset_0_1px_0_rgba(239,68,68,0.2)]" 
          : "bg-neutral-900 border-neutral-800"
      }`}>
        {/* Left: Subfolder navigation, file dropdown, and active file name */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Subfolder Badge / Dashboard Home */}
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 text-xs font-mono font-medium transition shrink-0"
            title="Back to Dashboard"
          >
            <Folder size={13} className={accentColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} />
            <span className="hidden sm:inline">/{subfolderName}/</span>
          </button>

          {/* Active File Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition max-w-[200px] sm:max-w-[260px] truncate ${
                isLockedByOther
                  ? "bg-red-950/80 border-red-500/70 text-red-200 hover:bg-red-900/80"
                  : isMine
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-200 hover:bg-amber-900/60"
                  : "bg-neutral-950 hover:bg-neutral-850 border-neutral-700/80 text-white"
              }`}
              title="Switch active file"
            >
              <FileText size={13} className={
                isLockedByOther 
                  ? "text-red-400 shrink-0 animate-pulse" 
                  : isMine 
                  ? "text-amber-400 shrink-0" 
                  : accentColor === 'emerald' 
                  ? "text-emerald-400 shrink-0" 
                  : "text-cyan-400 shrink-0"
              } />
              <span className="truncate">{currentFile.name || currentFile.fileName}</span>
              <ChevronDown size={12} className="text-neutral-400 shrink-0 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-1 w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-mono text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                    <span>{safeFiles.length} file{safeFiles.length === 1 ? '' : 's'} in /{subfolderName}/</span>
                    <span className="text-[10px] text-neutral-500 uppercase">{extension}</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
                    {safeFiles.map((f, fIdx) => {
                      const isActive = f.fileName === activeFileName;
                      const fCheckout = f.checkout;
                      const fIsOther = isOtherSessionCheckout(fCheckout);
                      const fIsMine = isCurrentSessionCheckout(fCheckout);
                      const fShortSid = fCheckout?.sessionId ? getShortSessionId(fCheckout.sessionId) : '';

                      return (
                        <button
                          key={`subfolder_file_${f.fileName || f.id || fIdx}_${fIdx}`}
                          type="button"
                          onClick={() => {
                            onSelectFile(f.fileName);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition ${
                            isActive 
                              ? fIsOther
                                ? 'bg-red-950/80 text-red-200 font-bold border border-red-500/50'
                                : 'bg-cyan-950/80 text-cyan-200 font-bold border border-cyan-500/40' 
                              : fIsOther
                              ? 'bg-red-950/30 text-red-300 hover:bg-red-950/50 border border-red-900/40'
                              : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {fIsOther ? (
                              <Lock size={12} className="text-red-400 shrink-0" />
                            ) : fIsMine ? (
                              <Key size={12} className="text-amber-400 shrink-0" />
                            ) : (
                              <FileText size={12} className={accentColor === 'emerald' ? 'text-emerald-400 shrink-0' : 'text-cyan-400 shrink-0'} />
                            )}
                            <div className="truncate">
                              <div className="font-mono text-xs flex items-center gap-1.5">
                                <span>{f.fileName}</span>
                                {fIsOther && (
                                  <span className="px-1 py-0.2 rounded bg-red-900/90 text-red-200 text-[9px] font-sans font-bold uppercase tracking-wider border border-red-500/40">
                                    Locked ({fCheckout?.checkedOutBy || 'Other'} • {fShortSid})
                                  </span>
                                )}
                                {fIsMine && (
                                  <span className="px-1 py-0.2 rounded bg-amber-900/80 text-amber-200 text-[9px] font-sans font-bold uppercase tracking-wider border border-amber-500/40">
                                    Checked Out by You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate">{f.name}</div>
                            </div>
                          </div>
                          {isActive && <Check size={14} className={fIsOther ? "text-red-400 shrink-0" : "text-cyan-400 shrink-0"} />}
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

          {/* Checkout Status Indicator Pill */}
          {isCheckedOut ? (
            isMine ? (
              <div 
                className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono shrink-0"
                title={`Checked out by you in this session (${activeCheckout?.sessionId})`}
              >
                <Key size={10} className="text-amber-400" />
                <span className="font-bold">Checked Out</span>
                <span className="text-amber-400/70 font-mono">[{checkoutShortSid}]</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-200 text-[10px] font-mono shrink-0 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                title={`Checked out by ${activeCheckout?.checkedOutBy} (Session: ${activeCheckout?.sessionId})`}
              >
                <Lock size={10} className="text-red-400" />
                <span className="font-bold uppercase tracking-wider">Locked</span>
                <span className="text-red-300 truncate max-w-[90px]">{activeCheckout?.checkedOutBy}</span>
                <span className="text-red-400/80 font-mono">[{checkoutShortSid}]</span>
              </div>
            )
          ) : (
            <div 
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-800 text-neutral-400 text-[10px] font-mono shrink-0"
              title="File is currently unlocked and available to check out"
            >
              <Unlock size={10} className="text-neutral-500" />
              <span>Available</span>
            </div>
          )}

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

          {/* CHECK-OUT / CHECK-IN BUTTON */}
          {isCheckedOut ? (
            isMine ? (
              // Current User has it checked out -> Provide Check In
              <button
                type="button"
                onClick={() => {
                  setCheckInPushChanges(true);
                  setIsCheckInModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 rounded-md text-xs font-bold transition shadow-sm"
                title="Check in this file (unlock & push your changes)"
              >
                <Unlock size={12} className="text-amber-400" />
                <span>Check In</span>
              </button>
            ) : (
              // Another User/Session has it checked out -> Red warning + Force Unlock option
              <div className="flex items-center gap-1">
                {isConfirmingForceUnlock ? (
                  <div className="flex items-center gap-1 bg-red-950 border border-red-500 rounded p-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <span className="text-[10px] text-red-300 font-bold px-1">Force Unlock?</span>
                    <button
                      type="button"
                      onClick={handleConfirmForceUnlock}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold shadow"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingForceUnlock(false)}
                      className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingForceUnlock(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-950/90 hover:bg-red-900 border border-red-500 text-red-200 rounded-md text-xs font-bold transition shadow"
                    title={`Locked by ${activeCheckout?.checkedOutBy}. Click to force unlock / override checkout.`}
                  >
                    <ShieldAlert size={12} className="text-red-400" />
                    <span>Locked</span>
                  </button>
                )}
              </div>
            )
          ) : (
            // File is Available -> Provide Check Out Button
            <button
              type="button"
              onClick={() => setIsCheckOutModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 text-neutral-300 hover:text-amber-200 rounded-md text-xs font-semibold transition shadow-sm"
              title="Check out file for exclusive editing"
            >
              <Lock size={12} className="text-neutral-400 group-hover:text-amber-400" />
              <span className="hidden sm:inline">Check Out</span>
            </button>
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

          {/* SAVE BUTTON */}
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

          {onRefreshFromLinked && (
            <button
              type="button"
              onClick={onRefreshFromLinked}
              disabled={isSyncingLinked}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition shadow-sm ${
                isOutOfSync
                  ? "bg-amber-950/80 hover:bg-amber-900 border-amber-500/80 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse"
                  : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700/80 text-neutral-300 hover:text-white"
              } ${isSyncingLinked ? "opacity-60 cursor-not-allowed" : ""}`}
              title={
                isOutOfSync
                  ? "Remote changes detected in linked folder/cloud! Click to pull latest data."
                  : "Refresh & Pull latest file updates from linked folder/cloud"
              }
            >
              <RefreshCw size={12} className={`${isSyncingLinked ? "animate-spin text-cyan-400" : isOutOfSync ? "text-amber-400" : "text-neutral-400"}`} />
              <span className="hidden md:inline">
                {isSyncingLinked ? "Syncing..." : isOutOfSync ? "Pull Updates" : "Refresh"}
              </span>
              {isOutOfSync && !isSyncingLinked && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

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
      </div>

      {/* LOCKED FILE WARNING BANNER (Shows in Red when viewed and checked out by someone else) */}
      {isLockedByOther && activeCheckout && (
        <div className="bg-red-950/90 border-b border-red-600/80 px-4 py-1.5 flex items-center justify-between gap-3 text-xs text-red-100 z-10 shadow-lg animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={15} className="text-red-400 shrink-0 animate-bounce" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-bold text-red-200">
                LOCKED FILE: Checked out by {activeCheckout.checkedOutBy}
              </span>
              <span className="font-mono text-[11px] text-red-300/80">
                (Session ID: <code className="bg-red-900/60 px-1 py-0.2 rounded text-red-200 font-bold">{activeCheckout.sessionId}</code>)
              </span>
              {activeCheckout.lockNote && (
                <span className="text-[11px] text-red-200 italic font-medium">
                  &ldquo;{activeCheckout.lockNote}&rdquo;
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-red-300 hidden sm:inline">
              {new Date(activeCheckout.checkedOutAt).toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={handleConfirmForceUnlock}
              className="px-2.5 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-bold transition shadow"
            >
              Force Check-In / Unlock
            </button>
          </div>
        </div>
      )}

      {/* CHECK-OUT CONFIRMATION MODAL */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Check Out File</h3>
                <p className="text-[11px] font-mono text-amber-400 truncate">{currentFile.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <p className="leading-relaxed">
                Checking out this file reserves exclusive editing rights and broadcasts your active session ID across the team.
              </p>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400">Editor Session ID:</span>
                  <code className="font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {currentSessionId}
                  </code>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400">Target File:</span>
                  <span className="font-mono text-neutral-200 font-semibold">/{subfolderName}/{currentFile.fileName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300 block">
                  Optional Checkout Note / Task Summary
                </label>
                <input
                  type="text"
                  value={checkOutNoteInput}
                  onChange={(e) => setCheckOutNoteInput(e.target.value)}
                  placeholder="e.g. Redesigning kinematics curve or adjusting emitter rates"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCheckOutModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-600/30 flex items-center gap-1.5"
              >
                <Lock size={13} />
                <span>Check Out File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN CONFIRMATION MODAL */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-cyan-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow">
                <Unlock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Check In File</h3>
                <p className="text-[11px] font-mono text-cyan-400 truncate">{currentFile.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <p className="leading-relaxed">
                Checking in will release your lock on <code className="text-cyan-300 font-mono">{currentFile.fileName}</code> and make it available for other editors.
              </p>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkInPushChanges}
                  onChange={(e) => setCheckInPushChanges(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-700 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-neutral-200">Push & Save latest changes on check-in</div>
                  <div className="text-[11px] text-neutral-400">
                    Saves all current edits to project JSON, IndexedDB, and any linked folder/cloud storage.
                  </div>
                </div>
              </label>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300 block">
                  Check-In Note / Commit Description
                </label>
                <input
                  type="text"
                  value={checkInNoteInput}
                  onChange={(e) => setCheckInNoteInput(e.target.value)}
                  placeholder="e.g. Finished tuning particle trails and fixed gravity"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
              >
                <Unlock size={13} />
                <span>Confirm Check In</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
