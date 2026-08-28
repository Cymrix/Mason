with open("public/modules/sprites/index.html", "r") as f:
    text = f.read()

text = text.replace("<script><script>", "<script>\n")

with open("public/modules/sprites/index.html", "w") as f:
    f.write(text)
print("Fixed double script same line")
