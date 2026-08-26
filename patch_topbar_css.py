import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '.topbar{\n    display:flex;align-items:center;justify-content:space-between;\n    padding:10px 16px;background:var(--panel);border-bottom:1px solid var(--line);\n    flex:0 0 auto;\n  }'
replacement = '.topbar{\n    display:flex;align-items:center;justify-content:space-between;\n    padding:6px 12px;background:#0a0a0a;border-bottom:1px solid #171717;\n    flex:0 0 auto;\n  }'

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched topbar css!")
else:
    print("Target not found!")
