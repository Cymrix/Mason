import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('function resizeCanvasWorkspace')
print(text[pos:pos+1000])
