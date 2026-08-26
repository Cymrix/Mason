with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update cachedDefaultSvgStamps
stamp_init_old = """  async function initDefaultSvgStamps(){
    if(stamps.length > 0) return;
    for(const item of DEFAULT_SVG_PRESETS){
      try {
        const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${item.d}" fill="#ffffff"/></svg>`;
        const img = await svgToImage(markup);
        const mask = buildStampMask(img);
        stamps.push({ name: item.name, mask, svgString: markup, isSvg: true });
      } catch(e) {
        console.warn('Error loading default SVG preset:', item.name, e);
      }
    }
    if(stamps.length > 0 && selectedStampIndex === null){
      selectedStampIndex = 0;
    }

    prewarmActiveSizeCache();

    updateStampShapeAvailability();
    refreshStampList();
    populateStampDropdown();
  }"""

stamp_init_new = """  let cachedDefaultSvgStamps = null;
  async function initDefaultSvgStamps(){
    if(stamps.length > 0) return;
    if (cachedDefaultSvgStamps && cachedDefaultSvgStamps.length > 0) {
      stamps = cachedDefaultSvgStamps.map(s => ({ ...s }));
      if (selectedStampIndex === null) selectedStampIndex = 0;
      prewarmActiveSizeCache();
      updateStampShapeAvailability();
      refreshStampList();
      populateStampDropdown();
      return;
    }
    const loaded = [];
    for(const item of DEFAULT_SVG_PRESETS){
      try {
        const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${item.d}" fill="#ffffff"/></svg>`;
        const img = await svgToImage(markup);
        const mask = buildStampMask(img);
        loaded.push({ name: item.name, mask, svgString: markup, isSvg: true });
      } catch(e) {
        console.warn('Error loading default SVG preset:', item.name, e);
      }
    }
    cachedDefaultSvgStamps = loaded;
    stamps = loaded.map(s => ({ ...s }));
    if(stamps.length > 0 && selectedStampIndex === null){
      selectedStampIndex = 0;
    }

    prewarmActiveSizeCache();

    updateStampShapeAvailability();
    refreshStampList();
    populateStampDropdown();
  }"""

if stamp_init_old in text:
    text = text.replace(stamp_init_old, stamp_init_new, 1)
    print("Patched initDefaultSvgStamps caching")
else:
    print("stamp_init_old not found")

# 2. Fix resetProjectToDefaults frames clear bug
reset_old_frames = """    layerIdCounter = 1;
    frameIdCounter = 1;
    layers = [];
    addLayer(initialLayerName || 'Layer 1', initialDrawFn || null, true);"""

reset_new_frames = """    layerIdCounter = 1;
    frameIdCounter = 1;
    frames = [];
    layers = [];
    addLayer(initialLayerName || 'Layer 1', initialDrawFn || null, true);"""

if reset_old_frames in text:
    text = text.replace(reset_old_frames, reset_new_frames, 1)
    print("Patched resetProjectToDefaults frames reset")
else:
    print("reset_old_frames not found")

# 3. Fix loadProjectData's suppression bug where it clears dirty late, 
# and also pointer up isn't setting dirty correctly when the layer changed!
# Oh wait, we should just NOT suppress dirty if we are in iframe, OR we should just ensure setDirty is called correctly.

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Finished updating public/modules/sprites/index.html")
