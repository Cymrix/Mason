import re

with open('src/utils/masonStorage.ts', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'ParticleSystemFile,'
replacement = 'ParticleSystemFile,\n  SpriteFile,'

if target in text:
    text = text.replace(target, replacement)
    with open('src/utils/masonStorage.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched imports!")
else:
    print("Target not found!")
