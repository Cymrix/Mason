import sys

with open('clean_index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('test_script.js', 'r', encoding='utf-8') as f:
    js = f.read()

combined = html + '\n<script>\n' + js + '\n</script>\n</body></html>'

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(combined)
print("Recombined successfully.")
