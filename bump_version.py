import re

with open('src/version.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('0.144', '0.145')

new_entry = """export const MASON_RELEASE_HISTORY = [
  {
    version: 'v0.145',
    date: '2026-08-25',
    changes: [
      'Resolved SpriteEditor iframe save timeouts by safely catching errors during asynchronous image loads.',
      'Fixed blank canvases during project load due to empty image data throwing unhandled exceptions.',
      'Ensured `isSuppressingDirty` resets correctly after project load, restoring dirty state functionality and red save buttons.'
    ]
  },"""

text = text.replace('export const MASON_RELEASE_HISTORY = [', new_entry, 1)

with open('src/version.ts', 'w', encoding='utf-8') as f:
    f.write(text)

with open('package.json', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('"version": "0.144"', '"version": "0.145"')

with open('package.json', 'w', encoding='utf-8') as f:
    f.write(text)

