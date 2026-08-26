import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("if (data.type === 'LOAD_SPRITE') {", "if (data.type === 'LOAD_SPRITE') {\n      setDirty(false);")
text = text.replace("if (data.type === 'LOAD_PROJECT') {\n      if (data.projectData) {\n        loadProjectData(data.projectData);", "if (data.type === 'LOAD_PROJECT') {\n      if (data.projectData) {\n        loadProjectData(data.projectData);\n        setDirty(false);")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched load dirty")
