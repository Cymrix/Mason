import React, { useRef } from 'react';
import { X, Upload, Folder, Trash2, Clock, Check } from 'lucide-react';
import { ProjectIndexItem } from '../utils/masonStorage';
import { MasonProject } from '../engine/masonProjectSchema';

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: ProjectIndexItem[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onImportBundle: (project: MasonProject) => void;
}

export const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
  isOpen,
  onClose,
  savedProjects,
  onSelectProject,
  onDeleteProject,
  onImportBundle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const project = JSON.parse(text) as MasonProject;
        if (project && project.id && project.fileSystem) {
          onImportBundle(project);
          onClose();
        } else {
          alert('Invalid Mason project bundle format.');
        }
      } catch (err) {
        console.error('Failed to parse project file:', err);
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Load Project</h3>
              <p className="text-[10px] text-neutral-400">Select a local save or import a .mason.json bundle</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Upload file area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-5 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-cyan-500 bg-neutral-950/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group"
        >
          <Upload size={24} className="text-neutral-400 group-hover:text-cyan-400 transition" />
          <div className="text-xs font-bold text-neutral-200">Import .mason.json Bundle</div>
          <p className="text-[10px] text-neutral-500">Click or drag file here to restore an exported project</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.mason.json"
            className="hidden"
          />
        </div>

        {/* Saved Projects list */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Local Saved Projects ({savedProjects.length})
          </h4>

          {savedProjects.length === 0 ? (
            <div className="p-4 rounded-xl bg-neutral-950 text-center text-xs text-neutral-500">
              No saved projects found in local storage.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {savedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer group transition"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-cyan-300 transition truncate block">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {p.mapCount} maps • {p.biomeCount} biomes • {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => onDeleteProject(p.id, e)}
                      className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition"
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="text-[11px] font-bold text-cyan-400 group-hover:underline">Open →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
