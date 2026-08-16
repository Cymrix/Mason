import React, { useState } from 'react';
import { 
  X, 
  DownloadCloud, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor, 
  Apple, 
  Chrome, 
  Compass, 
  Wifi, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MASON_FULL_VERSION } from '../version';
import { DetectedPlatform } from '../hooks/usePWA';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasNativePrompt: boolean;
  isInIframe: boolean;
  isInstalled: boolean;
  platform: DetectedPlatform;
  onTriggerNativeInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  hasNativePrompt,
  isInIframe,
  isInstalled,
  platform,
  onTriggerNativeInstall
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'auto' | 'chrome' | 'ios' | 'android' | 'safari'>('auto');

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenDirect = () => {
    // Open in a new standalone tab/window
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeClick = async () => {
    const installed = await onTriggerNativeInstall();
    if (installed) {
      onClose();
    }
  };

  const activeGuide = selectedTab === 'auto' 
    ? (platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : platform === 'safari' ? 'safari' : 'chrome')
    : selectedTab;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <DownloadCloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-100">Install Mason Studio PWA</h3>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full">
                  {MASON_FULL_VERSION}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Run Mason as a standalone desktop or mobile app with full offline support
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status / Quick Action Card */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-3 text-emerald-200 text-xs">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
            <div>
              <strong className="font-bold text-white block">Mason is already installed!</strong>
              You are currently running in standalone PWA application mode.
            </div>
          </div>
        ) : hasNativePrompt ? (
          <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-cyan-200">
                <strong className="font-bold text-white block">Direct 1-Click Install Ready</strong>
                Your browser is ready to install Mason directly to your device applications.
              </div>
              <button
                type="button"
                onClick={handleNativeClick}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition shrink-0"
              >
                <DownloadCloud size={15} />
                <span>Install Now</span>
              </button>
            </div>
          </div>
        ) : isInIframe ? (
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 shrink-0">
                <ExternalLink size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-200">Embedded Sandbox Detected</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Web browsers require opening the app in its own browser tab to trigger the native installation dialog and register desktop shortcuts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenDirect}
                className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/30"
              >
                <span>Open in Dedicated Tab & Install</span>
                <ArrowRight size={14} />
              </button>
              
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Copy Direct URL"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-cyan-400 flex items-center gap-1.5 font-bold text-[11px]">
              <Wifi size={14} />
              <span>100% Offline Ready</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Works without network connection using cached engine modules and local storage.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-cyan-400 flex items-center gap-1.5 font-bold text-[11px]">
              <Monitor size={14} />
              <span>Full Screen Canvas</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Zero browser address bars or tab distractions for maximum canvas authoring room.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-cyan-400 flex items-center gap-1.5 font-bold text-[11px]">
              <Sparkles size={14} />
              <span>Fast Native Launch</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Instantly launch from your desktop dock, Windows taskbar, or phone home screen.
            </p>
          </div>
        </div>

        {/* Step-by-step Installation Instructions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Installation Instructions
            </h4>

            {/* Platform Selector Tabs */}
            <div className="flex items-center bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedTab('chrome')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeGuide === 'chrome' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Chrome size={12} />
                <span>Chrome/Edge</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('ios')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeGuide === 'ios' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Apple size={12} />
                <span>iOS / iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('safari')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeGuide === 'safari' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Compass size={12} />
                <span>macOS Safari</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('android')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeGuide === 'android' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Smartphone size={12} />
                <span>Android</span>
              </button>
            </div>
          </div>

          {/* Guide Steps Body */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-2.5">
            {activeGuide === 'chrome' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Look at the right side of your browser URL address bar for the <strong>Install Mason icon (⊕ or 💻)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Or click the browser menu <strong>(⋮) → "Cast, save, and share" → "Install Mason Studio..."</strong></span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Click <strong>Install</strong> to add Mason to your Start Menu, Taskbar, or Applications folder.</span>
                </div>
              </>
            )}

            {activeGuide === 'ios' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>In Safari on your iPhone or iPad, tap the <strong>Share button (square with arrow ↑)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down the menu and tap <strong>"Add to Home Screen" (+)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top-right corner. The Mason icon will appear on your home screen.</span>
                </div>
              </>
            )}

            {activeGuide === 'safari' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>In Safari on macOS (Sonoma or newer), click <strong>File</strong> in the top menu bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Select <strong>"Add to Dock..."</strong></span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Click <strong>Add</strong> to run Mason in its own dedicated Mac window and Dock icon.</span>
                </div>
              </>
            )}

            {activeGuide === 'android' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>In Chrome or Firefox on Android, tap the <strong>Menu button (⋮)</strong> in the top right.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Confirm by tapping <strong>Install</strong>.</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="text-xs text-neutral-400 hover:text-cyan-300 font-mono flex items-center gap-1.5"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied direct link!' : 'Copy Direct URL'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
