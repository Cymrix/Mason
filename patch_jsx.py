import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("() => setActiveModuleId(null)", "() => handleLaunchModule(null)")

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched JSX")
