import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  X, 
  Clock, 
  ChevronDown,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';
import { 
  ToastLogEntry, 
  ToastType, 
  subscribeToastLogs, 
  clearToastLogs, 
  markAllToastLogsRead 
} from '../utils/toastLogStore';
import { useAppTheme } from '../theme/ThemeContext';
import { MASON_VERSION_DISPLAY } from '../version';

interface ToastHistoryOverlayProps {
  className?: string;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ToastHistoryOverlay: React.FC<ToastHistoryOverlayProps> = ({
  className = '',
  onShowToast
}) => {
  const { primaryDef } = useAppTheme();
  const [logs, setLogs] = useState<ToastLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [hasNewToastAnim, setHasNewToastAnim] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogsCountRef = useRef<number>(0);

  // Subscribe to toast store updates
  useEffect(() => {
    const unsubscribe = subscribeToastLogs((newLogs) => {
      if (newLogs.length > prevLogsCountRef.current) {
        setHasNewToastAnim(true);
        setTimeout(() => setHasNewToastAnim(false), 1200);
      }
      prevLogsCountRef.current = newLogs.length;
      setLogs(newLogs);
    });

    return () => unsubscribe();
  }, []);

  // When opening overlay, mark all as read
  useEffect(() => {
    if (isOpen) {
      markAllToastLogsRead();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return logs.filter(l => !l.read).length;
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterType !== 'all' && log.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return log.text.toLowerCase().includes(q) || log.formattedTime.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: logs.length,
      success: logs.filter(l => l.type === 'success').length,
      error: logs.filter(l => l.type === 'error').length,
      info: logs.filter(l => l.type === 'info' || l.type === 'warning').length
    };
  }, [logs]);

  const handleCopySingle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyAll = () => {
    if (logs.length === 0) return;
    const textToCopy = logs
      .map(l => `[${l.formattedDate} ${l.formattedTime}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleClear = () => {
    if (logs.length === 0) return;
    clearToastLogs();
  };

  return (
    <div ref={containerRef} className={`fixed bottom-4 right-4 z-40 ${className}`}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`group relative flex items-center justify-center p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-500 shadow-xl backdrop-blur-md transition-all duration-200 active:scale-95 ${
            hasNewToastAnim ? 'ring-2 ring-emerald-500 scale-105' : ''
          }`}
          title="Notification Log & Toast History"
          aria-label="Open Toast Notification History"
        >
          {unreadCount > 0 ? (
            <BellRing size={17} className="text-amber-400 group-hover:text-amber-300 transition-colors animate-pulse" />
          ) : (
            <Bell size={17} className="text-neutral-400 group-hover:text-neutral-200 transition-colors" />
          )}

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-black bg-amber-400 border-2 border-neutral-950 rounded-full font-mono shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Tooltip on hover */}
          <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/95 border border-neutral-700/90 text-neutral-200 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl">
            Notification Log ({logs.length})
          </span>
        </button>
      )}

      {/* Expanded Overlay Drawer / Popover */}
      {isOpen && (
        <div className="w-[340px] sm:w-[410px] h-[480px] max-h-[calc(100vh-5rem)] flex flex-col bg-neutral-900/95 border border-neutral-700/90 rounded-2xl shadow-2xl backdrop-blur-xl text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                  color: primaryDef.hex
                }}
              >
                <Bell size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Notification History
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-mono font-semibold">
                    {logs.length}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500">System alerts & toast notification log</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {logs.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    disabled={copiedAll}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                    title="Copy all logs to clipboard"
                  >
                    {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition"
                    title="Clear notification history"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition ml-1"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-2.5 bg-neutral-900/60 border-b border-neutral-800 space-y-2 shrink-0">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notification history..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-neutral-950/80 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-neutral-500 hover:text-neutral-300 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition shrink-0 flex items-center gap-1 ${
                  filterType === 'all'
                    ? 'bg-neutral-200 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] opacity-75 font-mono">({counts.all})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('success')}
                className={`px-2 py-0.5 rounded-md font-medium transition shrink-0 flex items-center gap-1 ${
                  filterType === 'success'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-emerald-400 hover:bg-neutral-800'
                }`}
              >
                <CheckCircle2 size={11} className="shrink-0" />
                <span>Success</span>
                <span className="text-[10px] opacity-75 font-mono">({counts.success})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('error')}
                className={`px-2 py-0.5 rounded-md font-medium transition shrink-0 flex items-center gap-1 ${
                  filterType === 'error'
                    ? 'bg-red-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-red-400 hover:bg-neutral-800'
                }`}
              >
                <AlertTriangle size={11} className="shrink-0" />
                <span>Errors</span>
                <span className="text-[10px] opacity-75 font-mono">({counts.error})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('info')}
                className={`px-2 py-0.5 rounded-md font-medium transition shrink-0 flex items-center gap-1 ${
                  filterType === 'info'
                    ? 'bg-cyan-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-cyan-400 hover:bg-neutral-800'
                }`}
              >
                <Info size={11} className="shrink-0" />
                <span>Info</span>
                <span className="text-[10px] opacity-75 font-mono">({counts.info})</span>
              </button>
            </div>
          </div>

          {/* Logs List Container */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {filteredLogs.length === 0 ? (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                <Clock size={28} className="text-neutral-700" />
                <div>
                  <p className="text-xs font-semibold text-neutral-400">
                    {searchQuery ? 'No matching notifications found' : 'No notifications in history'}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {searchQuery
                      ? 'Try modifying your search or filter criteria'
                      : 'Toasts, cloud sync logs, and system alerts will appear here'}
                  </p>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSuccess = log.type === 'success';
                const isError = log.type === 'error';
                const isCopied = copiedId === log.id;

                return (
                  <div
                    key={log.id}
                    className={`group relative p-2.5 rounded-xl border transition-all duration-150 ${
                      isSuccess
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-900/40 text-neutral-200'
                        : isError
                        ? 'bg-red-950/25 hover:bg-red-950/35 border-red-900/50 text-red-100'
                        : 'bg-neutral-950/40 hover:bg-neutral-950/70 border-neutral-800/80 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isSuccess && <CheckCircle2 size={14} className="text-emerald-400" />}
                        {isError && <AlertTriangle size={14} className="text-red-400" />}
                        {!isSuccess && !isError && <Info size={14} className="text-cyan-400" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-xs leading-relaxed font-medium break-words select-text">
                          {log.text}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-mono">
                          <span>{log.formattedDate}</span>
                          <span>•</span>
                          <span>{log.formattedTime}</span>
                        </div>
                      </div>

                      {/* Action buttons (Copy) */}
                      <button
                        type="button"
                        onClick={() => handleCopySingle(log.id, log.text)}
                        className="absolute top-2 right-2 p-1 rounded-md text-neutral-500 hover:text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 opacity-0 group-hover:opacity-100 transition"
                        title="Copy message to clipboard"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-2 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 shrink-0">
            <span>Preserving recent session logs</span>
            <span className="font-mono">Mason {MASON_VERSION_DISPLAY} • {primaryDef.name}</span>
          </div>

        </div>
      )}
    </div>
  );
};
