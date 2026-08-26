import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# topbarSaveBtn
text = text.replace("document.getElementById('topbarSaveBtn').addEventListener('click', ()=> saveProject(false));", 
                    "const _tsb = document.getElementById('topbarSaveBtn');\n  if(_tsb) _tsb.addEventListener('click', ()=> saveProject(false));")

# backupToggleBtn
text = text.replace("document.getElementById('backupToggleBtn').addEventListener('click', toggleBackups);", 
                    "const _btb = document.getElementById('backupToggleBtn');\n  if(_btb) _btb.addEventListener('click', toggleBackups);")

text = text.replace("document.getElementById('backupIntervalInput').addEventListener('change', startBackupIntervalTimer);", 
                    "const _bii = document.getElementById('backupIntervalInput');\n  if(_bii) _bii.addEventListener('change', startBackupIntervalTimer);")


with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched listeners!")
