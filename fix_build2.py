import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

build_old = """  function buildProjectData(){
    if (typeof captureCurrentFrameState === 'function') captureCurrentFrameState();"""

build_new = """  function buildProjectData(){
    try {
      if (typeof captureCurrentFrameState === 'function') captureCurrentFrameState();
    } catch(e) {
      console.warn("captureCurrentFrameState failed", e);
    }
"""

if build_old in text:
    text = text.replace(build_old, build_new, 1)
    print("Patched captureCurrentFrameState in buildProjectData")
else:
    print("Could not find captureCurrentFrameState inside buildProjectData")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
