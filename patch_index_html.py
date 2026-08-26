import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# find resetProjectToDefaults(targetW, targetH).then(() => {
search_str = r'resetProjectToDefaults\(targetW, targetH\)\.then\(\(\) => \{(.*?)\}\);'
def repl(m):
    return 'resetProjectToDefaults(targetW, targetH);\n' + m.group(1)

text = re.sub(search_str, repl, text, flags=re.DOTALL)

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched index.html")
