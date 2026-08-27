with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = """      } else {
        // Older project format, saved before animation frames existed — wrap the single loaded
        // layer stack as one frame so everything downstream keeps working unchanged.
        frames = [makeFrame('Frame ' + frameIdCounter, layers, activeLayer)];
        currentFrameIndex = 0;
      }"""

replacement = """      } else {
        // Older project format, saved before animation frames existed — wrap the single loaded
        // layer stack as one frame so everything downstream keeps working unchanged.
        frames = [makeFrame('Frame ' + frameIdCounter, layers, activeLayer)];
        currentFrameIndex = 0;
        layers = frames[currentFrameIndex].layers;
        activeLayer = frames[currentFrameIndex].activeLayer;
        undoStack = frames[currentFrameIndex].undoStack;
        redoStack = frames[currentFrameIndex].redoStack;
      }"""

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed layers.")
else:
    print("Target not found.")
