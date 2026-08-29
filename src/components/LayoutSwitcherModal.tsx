import React from 'react';
import { Layout, Columns, LayoutGrid, Maximize2 } from 'lucide-react';

export type WorkspaceLayout = 'classic' | 'floating' | 'bottom_dock' | 'zen';

interface LayoutSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: WorkspaceLayout;
  onSelectLayout: (layout: WorkspaceLayout) => void;
}

export const LayoutSwitcherModal: React.FC<LayoutSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onSelectLayout,
}) => {
  if (!isOpen) return null;

  const layouts: {
    id: WorkspaceLayout;
    title: string;
    description: string;
    icon: React.ReactNode;
    wireframe: React.ReactNode;
  }[] = [
    {
      id: 'classic',
      title: 'Classic Inspector',
      description: 'Dedicated left tool ribbon, central canvas, and persistent right inspector / palette.',
      icon: <Columns className="w-5 h-5 text-blue-400" />,
      wireframe: (
        <div className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-md p-1.5 flex gap-1.5 select-none">
          <div className="w-6 h-full bg-neutral-800 rounded flex flex-col gap-1 items-center p-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-neutral-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-neutral-700 rounded-sm"></div>
          </div>
          <div className="flex-1 h-full bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center">
            <div className="w-12 h-12 border border-dashed border-neutral-700 rounded flex items-center justify-center text-[10px] text-neutral-500">
              Canvas
            </div>
          </div>
          <div className="w-16 h-full bg-neutral-800 rounded p-1 flex flex-col gap-1">
            <div className="w-full h-2 bg-neutral-700 rounded-sm"></div>
            <div className="grid grid-cols-2 gap-0.5 mt-1">
              <div className="w-full h-3 bg-blue-600/40 rounded-sm"></div>
              <div className="w-full h-3 bg-emerald-600/40 rounded-sm"></div>
              <div className="w-full h-3 bg-amber-600/40 rounded-sm"></div>
              <div className="w-full h-3 bg-purple-600/40 rounded-sm"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'floating',
      title: 'Godot / Engine Floating Panels',
      description: 'Immersive full-screen viewport with floating, semi-transparent draggable glass panels.',
      icon: <LayoutGrid className="w-5 h-5 text-purple-400" />,
      wireframe: (
        <div className="w-full h-24 bg-neutral-950 border border-neutral-700 rounded-md p-1.5 relative select-none overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-20 flex items-center justify-center text-[10px] text-neutral-600">
            [Viewport Canvas]
          </div>
          {/* Floating tool chip */}
          <div className="absolute top-2 left-2 bg-neutral-800/90 border border-neutral-600 backdrop-blur rounded p-1 flex gap-1 shadow-lg">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-neutral-600 rounded-sm"></div>
          </div>
          {/* Floating palette card */}
          <div className="absolute bottom-2 right-2 w-20 h-14 bg-neutral-800/90 border border-neutral-600 backdrop-blur rounded p-1 shadow-xl">
            <div className="w-10 h-1.5 bg-neutral-500 rounded-sm mb-1"></div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-3 bg-blue-500/50 rounded-sm"></div>
              <div className="h-3 bg-emerald-500/50 rounded-sm"></div>
              <div className="h-3 bg-amber-500/50 rounded-sm"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'bottom_dock',
      title: 'Content Drawer & Asset Dock',
      description: 'Wide horizontal asset browser at the bottom for massive tile, biome, and foci catalogs.',
      icon: <Layout className="w-5 h-5 text-amber-400" />,
      wireframe: (
        <div className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-md p-1.5 flex flex-col gap-1 select-none">
          <div className="flex-1 flex gap-1">
            <div className="w-6 h-full bg-neutral-800 rounded flex flex-col gap-1 items-center p-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-neutral-700 rounded-sm"></div>
            </div>
            <div className="flex-1 h-full bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-500">
              Canvas
            </div>
          </div>
          <div className="h-8 bg-neutral-800 rounded p-1 flex items-center gap-1">
            <div className="w-5 h-5 bg-neutral-700 rounded-sm"></div>
            <div className="w-5 h-5 bg-blue-600/40 rounded-sm"></div>
            <div className="w-5 h-5 bg-emerald-600/40 rounded-sm"></div>
            <div className="w-5 h-5 bg-amber-600/40 rounded-sm"></div>
            <div className="w-5 h-5 bg-purple-600/40 rounded-sm"></div>
          </div>
        </div>
      ),
    },
    {
      id: 'zen',
      title: 'Minimalist Zen Viewport',
      description: 'Clean distraction-free authoring with a floating capsule bar and maximum drawing area.',
      icon: <Maximize2 className="w-5 h-5 text-emerald-400" />,
      wireframe: (
        <div className="w-full h-24 bg-neutral-950 border border-neutral-700 rounded-md p-1.5 relative select-none flex flex-col items-center justify-center">
          <div className="absolute top-2 bg-neutral-800 border border-neutral-600 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono">100% Canvas Space</div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-500" />
              Mason Workspace & UI Layout
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose your preferred IDE layout style for world authoring and simulation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {layouts.map((l) => {
            const isSelected = currentLayout === l.id;
            return (
              <div
                key={l.id}
                onClick={() => {
                  onSelectLayout(l.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col gap-3 group relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/30'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    ACTIVE
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {l.icon}
                  <h3 className="font-semibold text-sm text-neutral-100">{l.title}</h3>
                </div>

                {l.wireframe}

                <p className="text-xs text-neutral-400 leading-relaxed">{l.description}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-between items-center text-xs text-neutral-500">
          <span>You can switch layouts at any time via the top toolbar button.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
