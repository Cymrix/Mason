import re
with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add img.onerror = () => res(null); right before img.src = sd.mask;
text = text.replace("img.onload = ()=>{", "img.onerror = () => res(null);\n      img.onload = ()=>{")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed!')
