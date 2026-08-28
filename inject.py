import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('test_script.js', 'r', encoding='utf-8') as f:
    js = f.read()

start_idx = html.find("(function(){\n  const displayCanvas = document.getElementById(")
if start_idx == -1:
    print("Could not find start idx.")
    exit(1)

script_idx = html.rfind('<script>', 0, start_idx)

end_idx = html.rfind('</script></body></html>')
if end_idx == -1:
    end_idx = html.rfind('</script>\n</body>\n</html>')
    if end_idx == -1:
        end_idx = html.rfind('</script>')
        if end_idx == -1:
            print("Could not find end idx.")
            exit(1)

new_html = html[:script_idx] + '<script>\n' + js + '\n</script>\n</body>\n</html>'

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print("Injected successfully!")
