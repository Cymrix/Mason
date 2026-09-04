/**
 * Toast Notification Logger & History Store
 * Tracks all toasts, system alerts, file sync updates, and warnings.
 */

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface ToastLogEntry {
  id: string;
  text: string;
  type: ToastType;
  timestamp: number;
  formattedTime: string;
  formattedDate: string;
  read: boolean;
}

const STORAGE_KEY = 'mason_toast_log_history';
const MAX_LOG_ENTRIES = 120;

let memoryLogs: ToastLogEntry[] = [];
let listeners: Array<(logs: ToastLogEntry[]) => void> = [];

// Load initial logs from localStorage
function loadInitialLogs(): ToastLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_LOG_ENTRIES);
      }
    }
  } catch (e) {
    console.warn('Could not read toast log history from localStorage:', e);
  }
  return [];
}

memoryLogs = loadInitialLogs();

function persistLogs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryLogs.slice(0, MAX_LOG_ENTRIES)));
  } catch (e) {
    console.warn('Could not save toast log history to localStorage:', e);
  }
}

function notifyListeners() {
  const cloned = [...memoryLogs];
  listeners.forEach(cb => {
    try {
      cb(cloned);
    } catch (e) {
      console.error('Error in toast log listener:', e);
    }
  });
}

/**
 * Add a new toast log entry
 */
export function addToastLog(text: string, type: ToastType = 'info'): ToastLogEntry {
  const now = new Date();
  const entry: ToastLogEntry = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text: String(text || '').trim(),
    type: (type || 'info') as ToastType,
    timestamp: now.getTime(),
    formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    formattedDate: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    read: false
  };

  memoryLogs = [entry, ...memoryLogs].slice(0, MAX_LOG_ENTRIES);
  persistLogs();
  notifyListeners();

  // Dispatch custom window event for decoupled listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mason:toast-logged', { detail: entry }));
  }

  return entry;
}

/**
 * Get all current toast logs
 */
export function getToastLogs(): ToastLogEntry[] {
  return [...memoryLogs];
}

/**
 * Clear all toast logs
 */
export function clearToastLogs(): void {
  memoryLogs = [];
  persistLogs();
  notifyListeners();
}

/**
 * Mark all logs as read
 */
export function markAllToastLogsRead(): void {
  let changed = false;
  memoryLogs = memoryLogs.map(log => {
    if (!log.read) {
      changed = true;
      return { ...log, read: true };
    }
    return log;
  });
  if (changed) {
    persistLogs();
    notifyListeners();
  }
}

/**
 * Get unread toast log count
 */
export function getUnreadToastCount(): number {
  return memoryLogs.filter(l => !l.read).length;
}

/**
 * Subscribe to toast log updates
 */
export function subscribeToastLogs(callback: (logs: ToastLogEntry[]) => void): () => void {
  listeners.push(callback);
  // Emit current state immediately
  callback([...memoryLogs]);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}
