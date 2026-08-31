import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Settings, 
  ChevronDown, 
  Plus, 
  Check, 
  Sparkles, 
  Download, 
  Upload, 
  Shield 
} from 'lucide-react';
import {
  MasonUserProfile,
  getAllProfiles,
  getActiveProfile,
  setActiveProfile,
  EVENT_PROFILE_CHANGED
} from '../utils/appProfileSystem';

interface ProfileBadgeSwitcherProps {
  onOpenConfigModal: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ProfileBadgeSwitcher: React.FC<ProfileBadgeSwitcherProps> = ({
  onOpenConfigModal,
  onShowToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<MasonUserProfile[]>(getAllProfiles);
  const [activeProf, setActiveProf] = useState<MasonUserProfile>(getActiveProfile);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync profile state when updated
  useEffect(() => {
    const handleSync = () => {
      setProfiles(getAllProfiles());
      setActiveProf(getActiveProfile());
    };

    window.addEventListener(EVENT_PROFILE_CHANGED, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(EVENT_PROFILE_CHANGED, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSwitch = (id: string, name: string) => {
    setActiveProfile(id);
    setActiveProf(getActiveProfile());
    setIsOpen(false);
    if (onShowToast) onShowToast(`Switched profile to "${name}"`, 'success');
  };

  return (
    <div className="relative inline-block text-left z-40" ref={menuRef}>
      
      {/* Trigger Badge Button */}
      <button
        type="button"
        onClick={() => {
          setProfiles(getAllProfiles());
          setActiveProf(getActiveProfile());
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 text-xs font-semibold text-neutral-200 transition active:scale-95 shadow-sm group cursor-pointer"
        title="Switch Mason Profile or Edit Global App Config"
      >
        <span className="text-base p-0.5 bg-neutral-950 rounded-md border border-neutral-800 group-hover:scale-105 transition">
          {activeProf.avatar}
        </span>

        <span className="truncate max-w-[100px] sm:max-w-[130px] text-white font-bold">
          {activeProf.name}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl z-[999] overflow-hidden animate-fade-in p-2 space-y-2">
          
          {/* Header Badge Info */}
          <div className="px-3 py-2 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeProf.avatar}</span>
              <div>
                <div className="text-xs font-bold text-white truncate max-w-[130px]">{activeProf.name}</div>
                <div className="text-[10px] font-mono text-amber-400 capitalize">Theme: {activeProf.config.theme}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active & Cached" />
          </div>

          {/* Profile Switcher List */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Select Profile ({profiles.length})
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {profiles.map((p) => {
                const isActive = p.id === activeProf.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitch(p.id, p.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{p.avatar}</span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-neutral-800 my-1" />

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenConfigModal();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Profiles & App Config...</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
