import re

with open('src/components/ModuleRunnerContainer.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = """            <iframe
              src="/modules/sprites/index.html"
              className="flex-1 w-full h-full min-h-0 border-none bg-neutral-950"
              title="Image Editor"
              onLoad={(e) => {
                const win = (e.target as HTMLIFrameElement).contentWindow;
                if (win) {
                  win.postMessage({
                    type: 'LOAD_SPRITE',
                    width: 32,
                    height: 32,
                    projectName: project.name || 'Module Editor'
                  }, '*');
                }
              }}
            />"""

text = re.sub(r'<iframe\s*src="/modules/sprites/index.html".*?/>', replacement, text, flags=re.DOTALL)

with open('src/components/ModuleRunnerContainer.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched ModuleRunnerContainer.tsx")
