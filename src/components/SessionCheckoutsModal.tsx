import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ExternalLink, 
  X, 
  Layers, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { MasonProject } from '../engine/masonProjectSchema';
import { 
  getAllCheckedOutFiles, 
  performCheckInAllFiles, 
  performForceUnlockAllFiles, 
  performFileCheckIn, 
  performFileForceUnlock,
  getShortSessionId, 
  getCurrentSessionId,
  CheckedOutFileInfo
} from '../utils/fileCheckoutStore';
import { getActiveProfile } from '../utils/appProfileSystem';

interface SessionCheckoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MasonProject | null;
  onUpdateProject: (updater: MasonProject | ((prev: MasonProject) => MasonProject), meta?: { actionLabel?: string; syncLinked?: boolean }) => void;
  onNavigateToFile?: (moduleKey: string, fileName: string) => void;
  onSaveActiveProject?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SessionCheckoutsModal: React.FC<SessionCheckoutsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onNavigateToFile,
  onSaveActiveProject,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'others'>('all');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen || !project) return null;

  const activeProfile = getActiveProfile();
  const currentSessionId = getCurrentSessionId();
  const lockedFiles = getAllCheckedOutFiles(project);

  const myLocks = lockedFiles.filter(f => f.isCurrentSession);
  const otherLocks = lockedFiles.filter(f => f.isOtherSession);

  const filteredFiles = lockedFiles.filter(f => {
    if (activeTab === 'mine' && !f.isCurrentSession) return false;
    if (activeTab === 'others' && !f.isOtherSession) return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return f.fileName.toLowerCase().includes(q) || 
             f.subfolder.toLowerCase().includes(q) || 
             f.checkout.checkedOutBy.toLowerCase().includes(q) ||
             (f.checkout.lockNote && f.checkout.lockNote.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCheckInAllSave = () => {
    if (onSaveActiveProject) {
      onSaveActiveProject();
    }
    const { project: updated, count } = performCheckInAllFiles(project, { onlyCurrentSession: true, note: 'Bulk check-in with save' });
    onUpdateProject(updated, { actionLabel: `Check in ${count} files (Save)`, syncLinked: true });
    if (onShowToast) onShowToast(`Saved and checked in ${count} session files`, 'success');
  };

  const handleCheckInAllRelease = () => {
    const { project: updated, count } = performCheckInAllFiles(project, { onlyCurrentSession: true, note: 'Bulk lock release' });
    onUpdateProject(updated, { actionLabel: `Released locks on ${count} files`, syncLinked: false });
    if (onShowToast) onShowToast(`Released checkout locks on ${count} files without saving`, 'info');
  };

  const handleForceUnlockAll = () => {
    if (!window.confirm('Are you sure you want to force unlock ALL files across all sessions?')) return;
    const { project: updated, count } = performForceUnlockAllFiles(project);
    onUpdateProject(updated, { actionLabel: `Force unlocked ${count} files`, syncLinked: true });
    if (onShowToast) onShowToast(`Force unlocked ${count} files`, 'info');
  };

  const handleSingleCheckIn = (item: CheckedOutFileInfo, pushSave: boolean) => {
    if (pushSave && onSaveActiveProject) {
      onSaveActiveProject();
    }
    const { project: updated } = performFileCheckIn(project, item.subfolderKey, item.fileName, { note: pushSave ? 'Checked in with save' : 'Lock released' });
    onUpdateProject(updated, { actionLabel: `Check in ${item.fileName}`, syncLinked: pushSave });
    if (onShowToast) onShowToast(`Checked in ${item.fileName}`, 'success');
  };

  const handleSingleForceUnlock = (item: CheckedOutFileInfo) => {
    const { project: updated } = performFileForceUnlock(project, item.subfolderKey, item.fileName);
    onUpdateProject(updated, { actionLabel: `Force unlock ${item.fileName}`, syncLinked: true });
    if (onShowToast) onShowToast(`Force unlocked ${item.fileName}`, 'info');
  };

  const getSubfolderBadgeColor = (subfolder: string) => {
    switch (subfolder.toLowerCase()) {
      case 'maps': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'biomes': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'prefabs': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'particles': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'sprites': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'ui themes': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'game structure': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/70 rounded-xl border border-amber-500/40 text-amber-400 shadow-md">
              <Lock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Session File Checkouts &amp; Locks
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lockedFiles.length} Locked
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>Active Profile: <strong className="text-neutral-200">{activeProfile.name}</strong></span>
                <span>•</span>
                <span>Tab Session: <strong className="text-amber-400 font-mono">{getShortSessionId(currentSessionId)}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myLocks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCheckInAllSave}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                  title="Save current work and check in all files locked by this session"
                >
                  <Save size={13} />
                  <span>Check In All (Save)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckInAllRelease}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  title="Release checkout locks on all your session files without saving"
                >
                  <Unlock size={13} />
                  <span>Release All (No Save)</span>
                </button>
              </>
            )}

            {lockedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleForceUnlockAll}
                className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                title="Force unlock all files in project"
              >
                <ShieldAlert size={13} className="text-red-400" />
                <span className="hidden sm:inline">Force Unlock All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TABS & SEARCH BAR */}
        <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>All Locks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-700/60 text-neutral-300">
                {lockedFiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'mine'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              <span>My Session</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-200 border border-amber-500/30">
                {myLocks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('others')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'others'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-rose-300'
              }`}
            >
              <span>Other Sessions</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-200 border border-rose-500/30">
                {otherLocks.length}
              </span>
            </button>
          </div>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Filter locked files..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* LOCKED FILES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-emerald-400 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-white">No Active File Locks</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {lockedFiles.length === 0 
                    ? 'All project files are unlocked and available for editing. When you check out a file to make edits, it will appear here.'
                    : 'No locked files matched the active filter tab or search query.'
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredFiles.map((item) => (
              <div
                key={`${item.subfolderKey}_${item.fileName}`}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  item.isCurrentSession 
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50' 
                    : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg border mt-0.5 shrink-0 ${
                    item.isCurrentSession ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                  }`}>
                    <Lock size={16} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getSubfolderBadgeColor(item.subfolder)}`}>
                        {item.subfolder}
                      </span>
                      <h4 className="text-xs font-bold text-white font-mono truncate">
                        {item.fileName}
                      </h4>
                      {item.isCurrentSession ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          My Session ({getShortSessionId(item.checkout.sessionId)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                          <ShieldAlert size={10} />
                          <span>{item.checkout.checkedOutBy} ({getShortSessionId(item.checkout.sessionId)})</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <Clock size={11} className="text-neutral-500" />
                        <span>{new Date(item.checkout.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      {item.checkout.lockNote && (
                        <span className="text-neutral-300 italic bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          "{item.checkout.lockNote}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW ACTIONS */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {onNavigateToFile && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToFile(item.subfolderKey, item.fileName);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                      title="Open and edit this file in its module"
                    >
                      <ExternalLink size={12} />
                      <span>Open</span>
                    </button>
                  )}

                  {item.isCurrentSession ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSingleCheckIn(item, true)}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="Save changes and check in file"
                      >
                        <Save size={12} />
                        <span>Check In &amp; Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSingleCheckIn(item, false)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        title="Release lock without saving"
                      >
                        <Unlock size={12} />
                        <span>Release</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSingleForceUnlock(item)}
                      className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title="Force unlock file checked out by another session"
                    >
                      <ShieldAlert size={12} />
                      <span>Force Unlock</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-user &amp; multi-tab checkout guard active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
