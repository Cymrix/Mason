import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''  function syncBackupUI() {
    const btn = document.getElementById('backupToggleBtn');
    const intervalLabel = document.getElementById('backupIntervalLabel');
    const maxLabel = document.getElementById('backupMaxLabel');
    const locInd = document.getElementById('saveLocationIndicator');'''

replacement = '''  function syncBackupUI() {
    const btn = document.getElementById('backupToggleBtn');
    if (!btn) return;
    const intervalLabel = document.getElementById('backupIntervalLabel');
    const maxLabel = document.getElementById('backupMaxLabel');
    const locInd = document.getElementById('saveLocationIndicator');'''

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched syncBackupUI!")
else:
    print("Target not found!")
