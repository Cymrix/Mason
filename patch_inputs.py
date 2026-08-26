import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = "const minutes = Math.max(1, +document.getElementById('backupIntervalInput').value || 10);"
replacement1 = "const _bInput = document.getElementById('backupIntervalInput'); const minutes = Math.max(1, _bInput ? +_bInput.value : 10);"

target2 = "const maxFiles = Math.max(1, +document.getElementById('backupMaxFilesInput').value || 10);"
replacement2 = "const _maxF = document.getElementById('backupMaxFilesInput'); const maxFiles = Math.max(1, _maxF ? +_maxF.value : 10);"

target3 = "showToast('Backups on — into \"' + displayFolderName + '\", every save plus every ' + document.getElementById('backupIntervalInput').value + ' min');"
replacement3 = "const _bIn = document.getElementById('backupIntervalInput'); showToast('Backups on — into \"' + displayFolderName + '\", every save plus every ' + (_bIn ? _bIn.value : 10) + ' min');"

text = text.replace(target1, replacement1)
text = text.replace(target2, replacement2)
text = text.replace(target3, replacement3)

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched inputs!")
