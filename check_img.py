from PIL import Image

img = Image.open('sprite2.png').convert('RGB')
pixels = list(img.getdata())
colors = set(pixels)
print(f"Number of unique colors: {len(colors)}")
if len(colors) < 10:
    print("Top colors:", list(colors)[:10])
else:
    from collections import Counter
    c = Counter(pixels)
    print("Top 5 colors:", c.most_common(5))
