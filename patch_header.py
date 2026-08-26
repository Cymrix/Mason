import re

with open('src/components/FileSubfolderHeader.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("  onBackToDashboard?: () => void;\n  accentColor?: string; // e.g. \"cyan\", \"emerald\", \"amber\", \"purple\", \"rose\"", "  onBackToDashboard?: () => void;\n  isDirty?: boolean;\n  accentColor?: string; // e.g. \"cyan\", \"emerald\", \"amber\", \"purple\", \"rose\"")

# Find the Save button:
# onClick={onSaveFile} title="Save Project"
save_btn_re = r'(<button[^>]*?onClick=\{onSaveFile\}[^>]*?>\s*<Save[^>]*?>\s*</button>)'
match = re.search(save_btn_re, text)
if match:
    old_btn = match.group(1)
    new_btn = old_btn.replace('className="', 'className={`${isDirty ? \'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]\' : \'hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent\'} ')
    new_btn = new_btn.replace('hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent', '')
    text = text.replace(old_btn, new_btn)

with open('src/components/FileSubfolderHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched Header")
