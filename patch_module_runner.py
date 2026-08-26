import re

with open('src/components/ModuleRunnerContainer.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add import
import_target = "import { ParticlesEditor } from './ParticlesEditor';"
import_replacement = "import { ParticlesEditor } from './ParticlesEditor';\nimport { SpriteEditorWrapper } from './SpriteEditorWrapper';"
if import_target in text:
    text = text.replace(import_target, import_replacement)

# Replace the sprite block
# It currently looks like:
#        {moduleId === 'sprites' && (
#          <div className="flex-1 flex flex-col overflow-hidden relative">
#            <div className="h-10 px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between z-10 select-none">
#              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
#                🎨 Image Editor
#              </span>
#              <button
#                type="button"
#                onClick={onBackToProjectInfo}
#                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition"
#              >
#                Back to Dashboard
#              </button>
#            </div>
#            
#            <iframe
#              src="/modules/sprites/index.html"
#              className="flex-1 w-full h-full min-h-0 border-none bg-neutral-950"
#              title="Image Editor"
#              onLoad={(e) => {
#                const win = (e.target as HTMLIFrameElement).contentWindow;
#                if (win) {
#                  win.postMessage({
#                    type: 'LOAD_SPRITE',
#                    width: 32,
#                    height: 32,
#                    projectName: project.name || 'Module Editor'
#                  }, '*');
#                }
#              }}
#            />
#          </div>
#        )}

pattern = re.compile(r"\{\s*moduleId === 'sprites' && \(\s*<div className=\"flex-1 flex flex-col overflow-hidden relative\">.*?\)\s*\}", re.DOTALL)

def repl(m):
    return """{moduleId === 'sprites' && (
          <SpriteEditorWrapper
            project={project}
            onUpdateProject={(updater) => onUpdateProject(updater(project))}
            onBackToDashboard={onBackToProjectInfo}
          />
        )}"""

text = pattern.sub(repl, text)

with open('src/components/ModuleRunnerContainer.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched ModuleRunnerContainer!")
