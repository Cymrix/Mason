import re
with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add img.onerror = () => res(layerObj); right before img.src = ld.data;
text = text.replace("img.src = ld.data;", "img.onerror = () => res(layerObj);\n      img.src = ld.data;")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed!')
