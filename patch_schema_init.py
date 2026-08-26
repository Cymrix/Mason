import re

with open('src/engine/masonProjectSchema.ts', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''      game: gameStructures,
      behaviors,
      particles
    },'''

replacement = '''      game: gameStructures,
      behaviors,
      particles,
      sprites: []
    },'''

if target in text:
    text = text.replace(target, replacement)
    with open('src/engine/masonProjectSchema.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched createInitialMasonProject!")
else:
    print("Target not found!")
