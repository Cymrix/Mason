import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '    </div>\n  </div>\n\n  \n    </div>\n\n    <!-- Instructions'
replacement = '    </div>\n  </div>\n\n    <!-- Instructions'

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched extra div!")
else:
    print("Target not found!")
