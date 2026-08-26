import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("    } {\n", "    }\n")

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

