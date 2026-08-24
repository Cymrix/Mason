import re

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if '// 1.' in line or '// 6.' in line or '// 7.' in line or '// 8.' in line or '// 9.' in line:
        print(f"{i+1}: {line}")
