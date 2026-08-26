import re

with open('src/components/FileSubfolderHeader.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_class = 'className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 rounded text-xs font-semibold transition"'
new_class = 'className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition ${isDirty ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200"}`}'

text = text.replace(old_class, new_class)

with open('src/components/FileSubfolderHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched Header 2")
