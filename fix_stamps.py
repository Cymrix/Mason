import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

stamp_old = """    const stampPromise = Promise.all(stampSrc.map(sd=> new Promise(res=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = sd.w || img.width; c.height = sd.h || img.height;
        c.getContext('2d', { willReadFrequently: true }).drawImage(img,0,0);
        res({
          name: sd.name || 'Stamp',
          mask: c,
          inverted: !!sd.inverted,
          pivotX: (sd.pivotX !== undefined ? sd.pivotX : 0.5),
          pivotY: (sd.pivotY !== undefined ? sd.pivotY : 0.5),
          isSvg: !!sd.isSvg,
          svgString: sd.svgString || null,
          svgLineWidth: sd.svgLineWidth !== undefined ? sd.svgLineWidth : null,
          svgNoFill: sd.svgNoFill !== undefined ? !!sd.svgNoFill : null
        });
      };
      img.src = sd.mask;
    })));"""

stamp_new = """    const stampPromise = Promise.all(stampSrc.map(sd=> new Promise(res=>{
      if (!sd.mask || sd.mask === '') {
        res(null);
        return;
      }
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = sd.w || img.width; c.height = sd.h || img.height;
        c.getContext('2d', { willReadFrequently: true }).drawImage(img,0,0);
        res({
          name: sd.name || 'Stamp',
          mask: c,
          inverted: !!sd.inverted,
          pivotX: (sd.pivotX !== undefined ? sd.pivotX : 0.5),
          pivotY: (sd.pivotY !== undefined ? sd.pivotY : 0.5),
          isSvg: !!sd.isSvg,
          svgString: sd.svgString || null,
          svgLineWidth: sd.svgLineWidth !== undefined ? sd.svgLineWidth : null,
          svgNoFill: sd.svgNoFill !== undefined ? !!sd.svgNoFill : null
        });
      };
      img.onerror = () => res(null);
      img.src = sd.mask;
    })));"""

if stamp_old in text:
    text = text.replace(stamp_old, stamp_new, 1)
    print("Patched stampPromise to handle empty mask and onerror")
else:
    print("Could not find stamp_old")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
