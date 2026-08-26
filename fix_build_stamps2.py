import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

stamps_old = "stamps: (stamps || []).map(s=>({"

stamps_new = "stamps: (stamps || []).filter(s => s !== null).map(s=>({"

if stamps_old in text:
    text = text.replace(stamps_old, stamps_new, 1)
    print("Patched stamps in buildProjectData to handle nulls safely")
else:
    print("Could not find stamps_old in buildProjectData")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
