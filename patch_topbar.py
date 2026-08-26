import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Make projectNameInput hidden
text = text.replace('<input type="text" id="projectNameInput" value="Untitled" placeholder="Untitled" class="project-name-input"', '<input type="text" id="projectNameInput" value="Untitled" placeholder="Untitled" class="project-name-input" style="display:none;"')

# Remove Apply to App btn
pattern_apply = r'<button id="applyToAppBtn".*?</button>'
text = re.sub(pattern_apply, '', text, flags=re.DOTALL)

# Remove Cancel Modal btn
pattern_cancel = r'<button id="cancelModalBtn".*?</button>'
text = re.sub(pattern_cancel, '', text, flags=re.DOTALL)

# Remove Save Project block from topbar-actions
pattern_save = r'<div style="display:flex; align-items:center; background:var\(--panel-2\); border:1px solid var\(--line\); border-radius:4px; padding:0 2px;">.*?<span id="saveLocationIndicator".*?</span>.*?<button class="btn icon" id="topbarSaveBtn".*?</button>.*?</div>'
text = re.sub(pattern_save, '', text, flags=re.DOTALL)

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched topbar internals!")
