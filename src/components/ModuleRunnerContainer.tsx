import React, { useState, useRef, useEffect } from 'react';
import { MasonProject } from '../engine/masonProjectSchema';
import { getModuleById, MasonModuleDefinition } from '../engine/modulesRegistry';
import { 
  ArrowLeft, 
  RotateCw, 
  Folder, 
  ChevronDown, 
  Play, 
  Layers, 
  ExternalLink,
  Code,
  Sparkles,
  Maximize2
} from 'lucide-react';

// Child module views
import { ArchetypeEditor } from './ArchetypeEditor';
import { UIThemeModule } from './UIThemeModule';

interface ModuleRunnerContainerProps {
  moduleId: string;
  project: MasonProject;
  onUpdateProject: (updated: MasonProject) => void;
  onBackToProjectInfo: () => void;
  onOpenModulesModal: () => void;
  onOpenExplorer: () => void;
}

export const ModuleRunnerContainer: React.FC<ModuleRunnerContainerProps> = ({
  moduleId,
  project,
  onUpdateProject,
  onBackToProjectInfo,
  onOpenModulesModal,
  onOpenExplorer
}) => {
  const [viewMode, setViewMode] = useState<'iframe' | 'interactive'>('interactive');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const modDef = getModuleById(moduleId);

  // Send initial data to iframe mini-app when loaded
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MASON_MODULE_EVENT') {
        console.log('Received event from module mini-app:', event.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project]);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'MASON_INIT_PROJECT_DATA',
        project,
        moduleId
      }, '*');
    }
  };

  if (!modDef) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
        <p>Module "{moduleId}" not found.</p>
        <button
          type="button"
          onClick={onBackToProjectInfo}
          className="mt-4 px-4 py-2 bg-neutral-800 rounded-xl text-white text-xs font-bold"
        >
          Back to Project Info
        </button>
      </div>
    );
  }

  // Determine active file for this module
  const getActiveFileName = () => {
    switch (moduleId) {
      case 'maps': return project.activeFiles.mapFileName;
      case 'biomes': return project.activeFiles.biomeFileName;
      case 'archetypes': return project.activeFiles.archetypeFileName;
      case 'ui': return project.activeFiles.uiFileName;
      case 'gamestructure': return project.activeFiles.gameStructureFileName;
      default: return '';
    }
  };

  const activeFileName = getActiveFileName();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950 select-none">
      
      {/* Sub-Header Module Navigation Bar */}
      <div className="h-11 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between shrink-0">
        {/* Left: Back + Module Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToProjectInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition"
            title="Return to Project Overview"
          >
            <ArrowLeft size={14} />
            <span>Project Info</span>
          </button>

          <div className="h-4 w-px bg-neutral-800"></div>

          <div className="flex items-center gap-2">
            <span className="text-base">{modDef.icon}</span>
            <span className="text-xs font-bold text-neutral-100">{modDef.name}</span>
            <span className="text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
              {modDef.subfolder}/
            </span>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-3">
          {/* Active File Badge */}
          {activeFileName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
              <span className="text-neutral-500">File:</span>
              <span className="text-cyan-400 font-bold">{activeFileName}</span>
            </div>
          )}

          {/* View Mode Toggle: Interactive React vs HTML Mini-App Iframe */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition ${
                viewMode === 'interactive' 
                  ? 'bg-neutral-800 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Interactive
            </button>
            <button
              type="button"
              onClick={() => setViewMode('iframe')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition ${
                viewMode === 'iframe' 
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              HTML Mini-App
            </button>
          </div>

          {/* Switch Module Button */}
          <button
            type="button"
            onClick={onOpenModulesModal}
            className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>🧩 Switch Module</span>
          </button>

          {/* Reload Iframe */}
          {viewMode === 'iframe' && (
            <button
              type="button"
              onClick={() => setIframeKey(k => k + 1)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Reload Mini-App Frame"
            >
              <RotateCw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Module Content Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'iframe' ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={modDef.entryHtml}
            onLoad={handleIframeLoad}
            title={modDef.name}
            className="w-full h-full border-none bg-neutral-950"
          />
        ) : (
          // Interactive Full-Engine React View
          <>
            {moduleId === 'archetypes' && (
              <ArchetypeEditor
                project={project}
                onUpdateProject={onUpdateProject}
                onOpenFiles={onOpenExplorer}
              />
            )}
            {moduleId === 'ui' && (
              <UIThemeModule
                project={project}
                onUpdateProject={onUpdateProject}
                onOpenFiles={onOpenExplorer}
              />
            )}
            {moduleId !== 'archetypes' && moduleId !== 'ui' && (
              // For other modules in interactive mode, we load the mini-app runner with full message sync
              <iframe
                key={`interactive_${iframeKey}`}
                ref={iframeRef}
                src={modDef.entryHtml}
                onLoad={handleIframeLoad}
                title={modDef.name}
                className="w-full h-full border-none bg-neutral-950"
              />
            )}
          </>
        )}
      </div>

    </div>
  );
};
