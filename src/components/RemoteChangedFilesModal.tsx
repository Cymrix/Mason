import React, { useEffect, useState } from 'react';
import {
  X,
  FolderSync,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  Palette,
  Gamepad2,
  Box,
  Layout
} from 'lucide-react';
import { MasonProject } from '../engine/masonProjectSchema';
import { getRemoteChangedFiles, RemoteChangedFileItem } from '../utils/linkedSaveTarget';

interface RemoteChangedFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MasonProject;
  onPullUpdates: () => Promise<void> | void;
  isSyncing?: boolean;
}

const getCategoryMeta = (subfolder: string) => {
  switch (subfolder) {
    case 'maps':
      return { label: 'Map', color: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/50', icon: Layout };
    case 'biomes':
      return { label: 'Biome', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50', icon: Layers };
    case 'prefabs':
      return { label: 'Prefab', color: 'bg-amber-950/80 text-amber-400 border-amber-700/50', icon: Box };
    case 'particles':
      return { label: 'Particles', color: 'bg-purple-950/80 text-purple-400 border-purple-700/50', icon: Sparkles };
    case 'sprites':
      return { label: 'Sprite', color: 'bg-fuchsia-950/80 text-fuchsia-400 border-fuchsia-700/50', icon: Palette };
    case 'ui':
      return { label: 'UI Theme', color: 'bg-orange-950/80 text-orange-400 border-orange-700/50', icon: Palette };
    case 'game':
      return { label: 'Game Data', color: 'bg-indigo-950/80 text-indigo-400 border-indigo-700/50', icon: Gamepad2 };
    case 'root':
      return { label: 'Manifest', color: 'bg-zinc-800 text-zinc-300 border-zinc-600/50', icon: FileCode };
    default:
      return { label: subfolder, color: 'bg-zinc-800 text-zinc-300 border-zinc-600/50', icon: FileCode };
  }
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return 'None';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp;
  }
};

export const RemoteChangedFilesModal: React.FC<RemoteChangedFilesModalProps> = ({
  isOpen,
  onClose,
  project,
  onPullUpdates,
  isSyncing = false
}) => {
  const [changedFiles, setChangedFiles] = useState<RemoteChangedFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  const fetchChangedFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRemoteChangedFiles(project);
      if (res.success) {
        setChangedFiles(res.changedFiles);
      } else {
        setError(res.error || 'Failed to inspect remote changes');
      }
    } catch (err: any) {
      setError(err.message || 'Error checking remote files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChangedFiles();
    }
  }, [isOpen, project.id, project.updatedAt]);

  if (!isOpen) return null;

  const targetName =
    project.storageLocation?.displayName ||
    project.storageLocation?.targetFolderName ||
    project.storageLocation?.fileName ||
    'Linked Remote Storage';

  const handlePull = async () => {
    setIsPulling(true);
    try {
      await onPullUpdates();
      onClose();
    } catch (err) {
      console.error('Pull updates error:', err);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="remote-changed-files-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <FolderSync size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Remote Changes Available
              </h2>
              <p className="text-xs text-zinc-400">
                Target: <span className="text-zinc-300 font-mono">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-3">
              <RefreshCw size={24} className="animate-spin text-amber-400" />
              <p className="text-xs font-mono">Scanning remote storage for updated files...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Failed to retrieve remote file changes</p>
                <p className="text-red-300/80 mt-1">{error}</p>
                <button
                  onClick={fetchChangedFiles}
                  className="mt-3 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-[11px] font-medium transition"
                >
                  Retry Scan
                </button>
              </div>
            </div>
          ) : changedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm font-medium text-zinc-200">Everything is in sync</p>
              <p className="text-xs text-zinc-400 max-w-sm">
                No newer or changed files were found on the remote target. Your local project matches the remote files.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between">
                <span>
                  Found <strong className="text-amber-300 font-mono">{changedFiles.length}</strong> out-of-sync file{changedFiles.length === 1 ? '' : 's'}. Pulling will update only these specific files.
                </span>
                <span className="text-[11px] text-amber-400/80 font-mono">Selective Sync</span>
              </div>

              <div className="space-y-2">
                {changedFiles.map((file, idx) => {
                  const meta = getCategoryMeta(file.subfolder);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={`${file.subfolder}-${file.fileName}-${idx}`}
                      className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono shrink-0 ${meta.color}`}
                        >
                          <Icon size={11} />
                          <span>{meta.label}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-200 truncate font-mono">
                            {file.subfolder !== 'root' ? `${file.subfolder}/` : ''}
                            {file.fileName}
                          </p>
                          {file.displayName && file.displayName !== file.fileName && (
                            <p className="text-[11px] text-zinc-400 truncate">{file.displayName}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono text-[10px] text-zinc-400 hidden sm:block">
                          <div>
                            <span className="text-zinc-500">Remote:</span> {formatTimestamp(file.remoteUpdatedAt)}
                          </div>
                          {file.localUpdatedAt && (
                            <div>
                              <span className="text-zinc-500">Local:</span> {formatTimestamp(file.localUpdatedAt)}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            file.status === 'added'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                          }`}
                        >
                          {file.status === 'added' ? 'New Remote' : 'Modified'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={fetchChangedFiles}
            disabled={isLoading || isPulling || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Re-scan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Close
            </button>
            {changedFiles.length > 0 && (
              <button
                type="button"
                onClick={handlePull}
                disabled={isPulling || isSyncing || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={isPulling || isSyncing ? 'animate-spin' : ''} />
                <span>
                  {isPulling || isSyncing
                    ? 'Pulling...'
                    : `Pull Updates (${changedFiles.length} file${changedFiles.length === 1 ? '' : 's'})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
