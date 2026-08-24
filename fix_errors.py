import re

with open('src/components/EditorLayout.tsx', 'r') as f:
    content = f.read()

# Fix PaintCategory
content = re.sub(r"type PaintCategory = 'tile_type' \| 'environmental' \| 'interactive' \| 'wildlife' \| 'particles';", "type PaintCategory = 'tile_type' | 'environmental' | 'interactive' | 'wildlife' | 'particles' | 'actor';", content)

# Fix actor.spriteUrl, actor.name, actor.type
content = content.replace("actor.spriteUrl", "actor.characterData?.spriteUrl")
content = content.replace("actor.name", "actor.characterData?.name")
content = content.replace("actor.type", "actor.characterData?.characterType")
content = content.replace("actor.id", "actor.characterData?.id")

with open('src/components/EditorLayout.tsx', 'w') as f:
    f.write(content)

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

# Fix mapData.cells flat indexing
content = content.replace("const cell = mapData.cells[y * mapData.width + x];", "const cell = mapData.cells[y]?.[x];")
content = content.replace("const cell = chunk[i];", "const cell = chunk[i];")

with open('src/components/RefinedMapCanvas.tsx', 'w') as f:
    f.write(content)
