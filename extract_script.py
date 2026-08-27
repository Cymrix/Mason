import re
with open("public/modules/sprites/index.html", "r") as f:
    text = f.read()

scripts = re.findall(r"<script[^>]*>(.*?)</script>", text, re.DOTALL)
with open("test_script.js", "w") as f:
    f.write(scripts[-1])
