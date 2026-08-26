import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

stamps_old = """      stamps: stamps.map(s => {
        let maskUrl = '';
        try { maskUrl = s.mask ? s.mask.toDataURL() : ''; } catch(e){}
        return {
          name: s.name,
          mask: maskUrl,
          inverted: !!s.inverted,
          pivotX: s.pivotX,
          pivotY: s.pivotY,
          isSvg: !!s.isSvg,
          svgString: s.svgString || null,
          svgLineWidth: s.svgLineWidth,
          svgNoFill: s.svgNoFill
        };
      }),"""

stamps_new = """      stamps: (stamps || []).filter(s => s !== null).map(s => {
        let maskUrl = '';
        try { maskUrl = s.mask ? s.mask.toDataURL() : ''; } catch(e){}
        return {
          name: s.name,
          mask: maskUrl,
          inverted: !!s.inverted,
          pivotX: s.pivotX,
          pivotY: s.pivotY,
          isSvg: !!s.isSvg,
          svgString: s.svgString || null,
          svgLineWidth: s.svgLineWidth,
          svgNoFill: s.svgNoFill
        };
      }),"""

if stamps_old in text:
    text = text.replace(stamps_old, stamps_new, 1)
    print("Patched stamps in buildProjectData to handle nulls safely")
else:
    print("Could not find stamps_old in buildProjectData")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
