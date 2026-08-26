import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("          return updatedProj || project;", "          setIsDirty(false);\n          return updatedProj || project;")

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched save dirty clear")
