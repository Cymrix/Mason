import re

with open('src/engine/masonProjectSchema.ts', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''export interface MasonFileSystem {
  maps: MapFile[];
  biomes: BiomeFile[];
  prefabs: PrefabFile[];
  ui: UIThemeFile[];
  game: GameStructureFile[];
  behaviors: BehaviorFile[];
  particles?: ParticleSystemFile[];
}'''

replacement = '''export interface SpriteFile {
  id: string;
  name: string;
  fileName: string;
  updatedAt: string;
  spriteData: any; // Raw JSON export from Palette Spray Studio
}

export interface MasonFileSystem {
  maps: MapFile[];
  biomes: BiomeFile[];
  prefabs: PrefabFile[];
  ui: UIThemeFile[];
  game: GameStructureFile[];
  behaviors: BehaviorFile[];
  particles?: ParticleSystemFile[];
  sprites?: SpriteFile[];
}'''

if target in text:
    text = text.replace(target, replacement)
    with open('src/engine/masonProjectSchema.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched schema!")
else:
    print("Target not found!")
