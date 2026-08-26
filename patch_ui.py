import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove brand text
text = text.replace('<div class="brand">Palette Spray Studio</div>', '<div class="brand" style="display:none;"></div>')

# 2. Remove load full screen checkbox
checkbox_pattern = r'<label[^>]*>\s*<input type="checkbox" id="autoFullscreenCheckbox">\s*Load full screen\s*</label>'
text = re.sub(checkbox_pattern, '', text)

# 3. Remove PWA items
pwa_pattern = r'<div class="menu-divider" id="pwaDivider"[^>]*></div>\s*<button class="menu-item" id="pwaInstallBtn"[^>]*>Install App \(PWA\)</button>'
text = re.sub(pwa_pattern, '', text)

# 4. Remove Backups UI since backups will be handled by the Mason project system
backup_ui_pattern = r'<button class="btn small" id="backupToggleBtn"[^>]*>Backups: Off</button>\s*<label id="backupIntervalLabel"[^>]*>.*?</label>\s*<label id="backupMaxLabel"[^>]*>.*?</label>'
text = re.sub(backup_ui_pattern, '', text, flags=re.DOTALL)

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched UI!")
