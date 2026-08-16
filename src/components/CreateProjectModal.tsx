import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description: string, author: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject
}) => {
  const [name, setName] = useState('New Metroidvania World');
  const [author, setAuthor] = useState('Mason Architect');
  const [description, setDescription] = useState('A modular 2D sidescroller Metroidvania adventure.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject(name.trim(), description.trim(), author.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Create New Mason Project</h3>
              <p className="text-[10px] text-neutral-400">Initialize modular project workspace</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-300 uppercase">Project Title</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ashen Echoes of the Void"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-300 uppercase">Lead Author / Studio</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Mason Architect"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-300 uppercase">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of the world, lore, or game mechanics..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30"
            >
              Create Project
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
