import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = "document.getElementById('autoFullscreenCheckbox').addEventListener('change', e=>{\n    autoFullscreen = e.target.checked;\n  });"
replacement = "const _afc = document.getElementById('autoFullscreenCheckbox');\n  if(_afc) _afc.addEventListener('change', e=>{\n    autoFullscreen = e.target.checked;\n  });"

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched afc!")
else:
    print("Target not found!")
