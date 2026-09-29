import React, { useEffect, useState } from 'react';

export const ErrorDisplay: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const safeFormat = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') {
        if (val.message) return String(val.message);
        if (val.stack) return String(val.stack);
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      return String(val);
    };

    const handleError = (msg: any) => {
      const str = safeFormat(msg);
      
      if (!str || str === 'undefined' || str === 'null') return;

      // Filter benign messages such as vite websocket disconnects or ResizeObserver notifications
      if (
        str.includes('websocket') || 
        str.includes('ResizeObserver') || 
        str.includes('favicon.ico') ||
        (str.includes('Failed to fetch') && str.includes('vite'))
      ) {
        return;
      }

      setErrors(prev => [...prev.filter(e => e !== str), str].slice(-5));
    };

    const origError = console.error;
    console.error = (...args: any[]) => {
      try {
        const full = args.map(safeFormat).join(' ');
        if (
          !full.includes('websocket') && 
          !full.includes('ResizeObserver') &&
          !full.includes('favicon.ico')
        ) {
          handleError(full);
        }
      } catch {
        // Safe fallback
      }
      origError(...args);
    };

    const handleWindowError = (e: ErrorEvent) => handleError(e.message || e.error);
    const handleRejection = (e: PromiseRejectionEvent) => handleError(e.reason);

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => { 
      console.error = origError;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div 
      id="mason-runtime-error-banner"
      className="fixed top-0 left-0 right-0 z-[99999] bg-red-600/95 text-white px-4 py-2 flex items-center justify-between text-xs font-mono shadow-2xl backdrop-blur-md border-b border-red-400"
    >
      <div className="flex items-center gap-2 min-w-0 pr-4">
        <span className="bg-red-800 text-white font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
          Notice
        </span>
        <span className="truncate">{errors[errors.length - 1]}</span>
        {errors.length > 1 && (
          <span className="text-[10px] opacity-80 shrink-0">({errors.length} events)</span>
        )}
      </div>
      <button 
        type="button"
        onClick={() => setErrors([])} 
        className="shrink-0 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-sans font-semibold transition"
      >
        Dismiss
      </button>
    </div>
  );
};

