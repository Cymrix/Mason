import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace buildProjectData
build_proj_old = """  function buildProjectData(){
    captureCurrentFrameState();
    return {
      type: 'palette-spray-studio-project',
      version: 6,
      name: document.getElementById('projectNameInput').value,
      autoFullscreen,
      backupsEnabled: !!backupDirHandle,
      width: W,
      height: H,
      onionSkinEnabled,
      onionSkinOpacity,
      activeLayer,
      layers: layers.map(l=>({
        name:l.name, visible:l.visible, locked:!!l.locked, opacity:l.opacity, data:l.colorCanvas.toDataURL(),
        heightData: l.heightCanvas ? l.heightCanvas.toDataURL() : null,
        roughnessData: l.roughnessCanvas ? l.roughnessCanvas.toDataURL() : null
      })),
      currentFrameIndex,
      frames: frames.map(f => ({
        name: f.name,
        activeLayer: f.activeLayer,
        layers: f.layers.map(l=>({
          name:l.name, visible:l.visible, locked:!!l.locked, opacity:l.opacity, data:l.colorCanvas.toDataURL(),
          heightData: l.heightCanvas ? l.heightCanvas.toDataURL() : null,
          roughnessData: l.roughnessCanvas ? l.roughnessCanvas.toDataURL() : null
        }))
      })),
      groups: groups.map(g => g.isMain
        ? {id:g.id, name:g.name, isMain:true, colors:g.colors.map(c=>({id:c.id, hex:c.hex, name:c.name||''})), collapsed:g.collapsed, columns:g.columns}
        : {id:g.id, name:g.name, isMain:false, colorRefs:[...g.colorRefs], collapsed:g.collapsed, columns:g.columns}
      ),
      selectedColors: [...selectedColors],
      gradients: gradients.map(g=>({name:g.name, stops:[...g.stops]})),
      stamps: stamps.map(s=>({
        name:s.name,
        mask:s.mask.toDataURL(),
        w:s.mask.width,
        h:s.mask.height,
        inverted:!!s.inverted,
        pivotX: (s.pivotX !== undefined ? s.pivotX : 0.5),
        pivotY: (s.pivotY !== undefined ? s.pivotY : 0.5),
        isSvg: !!s.isSvg,
        svgString: s.svgString || null,
        svgLineWidth: s.svgLineWidth !== undefined ? s.svgLineWidth : null,
        svgNoFill: s.svgNoFill !== undefined ? !!s.svgNoFill : null
      })),
      grids: grids.map(g=>({...g})),
      gridMasterOn,
      sprayPresets: sprayPresets.map(p=>({
        id: p.id,
        name: p.name,
        builtin: !!p.builtin,
        savedSettings: p.savedSettings ? JSON.parse(JSON.stringify(p.savedSettings)) : JSON.parse(JSON.stringify(p.settings)),
        settings: JSON.parse(JSON.stringify(p.settings))
      })),
      activeSprayPresetId: activeSprayPresetId,
      tool: {
        tool, brushSize, opacity, sourceKind, selectedGradientIndex, selectedStampIndex,
        dabShape, brushShape, brushMode, sprayMode, softenType, softenHardness, density, dabSize, dabWidth, dabHeight, dabLockAspect,
        sizeJitterAmt, sizeJitterMin, sizeJitterMax, dabWidthJitterMin, dabWidthJitterMax, dabHeightJitterMin, dabHeightJitterMax, opacityJitterAmt, opacityJitterMin, opacityJitterMax,
        rotationJitterAmt, rotationMode, rotationAlgorithm, rotationMinAngle, rotationMaxAngle,
        rotationRanges: Array.isArray(rotationRanges) ? JSON.parse(JSON.stringify(rotationRanges)) : [{ min: rotationMinAngle, max: rotationMaxAngle }],
        activeRotationRangeIndex,
        sprayTargetAnchorX, sprayTargetAnchorY, spraySnapToGrid, spraySnapClearCell,
        falloff, flow, pixelPerfect, brushPixelPerfect, colorizeTargetHex, sprayCombineSameColor, sprayInterpolate,
        heightPaintEnabled, heightSourceLayerIndex, heightMode, heightMin, heightMax, heightSoftness
      }
    };
  }"""

build_proj_new = """  function buildProjectData(){
    if (typeof captureCurrentFrameState === 'function') captureCurrentFrameState();
    const projNameInput = document.getElementById('projectNameInput');
    const pName = projNameInput ? projNameInput.value : 'Sprite';

    const safeLayers = (layers || []).map(l => {
      const srcCanvas = l.colorCanvas || l.canvas;
      let dataUrl = '';
      try { dataUrl = srcCanvas ? srcCanvas.toDataURL() : ''; } catch(e){}
      let hData = null;
      if (l.heightCanvas) { try { hData = l.heightCanvas.toDataURL(); } catch(e){} }
      let rData = null;
      if (l.roughnessCanvas) { try { rData = l.roughnessCanvas.toDataURL(); } catch(e){} }
      return {
        name: l.name || 'Layer', visible: l.visible !== false, locked: !!l.locked, opacity: (typeof l.opacity === 'number') ? l.opacity : 100,
        data: dataUrl, heightData: hData, roughnessData: rData
      };
    });

    const safeFrames = (frames && frames.length > 0) ? frames.map(f => ({
      name: f.name || 'Frame', activeLayer: typeof f.activeLayer === 'number' ? f.activeLayer : 0,
      layers: (f.layers || []).map(l => {
        const srcCanvas = l.colorCanvas || l.canvas;
        let dataUrl = '';
        try { dataUrl = srcCanvas ? srcCanvas.toDataURL() : ''; } catch(e){}
        let hData = null;
        if (l.heightCanvas) { try { hData = l.heightCanvas.toDataURL(); } catch(e){} }
        let rData = null;
        if (l.roughnessCanvas) { try { rData = l.roughnessCanvas.toDataURL(); } catch(e){} }
        return {
          name: l.name || 'Layer', visible: l.visible !== false, locked: !!l.locked, opacity: (typeof l.opacity === 'number') ? l.opacity : 100,
          data: dataUrl, heightData: hData, roughnessData: rData
        };
      })
    })) : [{ name: 'Frame 1', activeLayer: typeof activeLayer === 'number' ? activeLayer : 0, layers: safeLayers }];

    return {
      type: 'palette-spray-studio-project',
      version: 6,
      name: pName,
      autoFullscreen: !!autoFullscreen,
      backupsEnabled: !!backupDirHandle,
      width: W, height: H,
      onionSkinEnabled: !!onionSkinEnabled, onionSkinOpacity: (typeof onionSkinOpacity === 'number') ? onionSkinOpacity : 50,
      activeLayer: typeof activeLayer === 'number' ? activeLayer : 0,
      layers: safeLayers, currentFrameIndex: typeof currentFrameIndex === 'number' ? currentFrameIndex : 0, frames: safeFrames,
      groups: (groups || []).map(g => g.isMain
        ? {id:g.id, name:g.name, isMain:true, colors:(g.colors||[]).map(c=>({id:c.id, hex:c.hex, name:c.name||''})), collapsed:!!g.collapsed, columns:g.columns||9}
        : {id:g.id, name:g.name, isMain:false, colorRefs:[...(g.colorRefs||[])], collapsed:!!g.collapsed, columns:g.columns||9}
      ),
      selectedColors: Array.from(selectedColors || []),
      gradients: (gradients || []).map(g=>({name:g.name, stops:[...(g.stops||[])]})),
      stamps: (stamps || []).map(s=>({
        name: s.name || 'Stamp',
        mask: s.mask ? (typeof s.mask.toDataURL === 'function' ? s.mask.toDataURL() : s.mask) : '',
        w: s.mask ? s.mask.width : 32, h: s.mask ? s.mask.height : 32,
        inverted: !!s.inverted, pivotX: (s.pivotX !== undefined ? s.pivotX : 0.5), pivotY: (s.pivotY !== undefined ? s.pivotY : 0.5),
        isSvg: !!s.isSvg, svgString: s.svgString || null, svgLineWidth: s.svgLineWidth !== undefined ? s.svgLineWidth : null, svgNoFill: s.svgNoFill !== undefined ? !!s.svgNoFill : null
      })),
      grids: (grids || []).map(g=>({...g})), gridMasterOn: !!gridMasterOn,
      sprayPresets: (sprayPresets || []).map(p=>({
        id: p.id, name: p.name, builtin: !!p.builtin,
        savedSettings: p.savedSettings ? JSON.parse(JSON.stringify(p.savedSettings)) : JSON.parse(JSON.stringify(p.settings || {})),
        settings: JSON.parse(JSON.stringify(p.settings || {}))
      })),
      activeSprayPresetId: activeSprayPresetId,
      tool: {
        tool, brushSize, opacity, sourceKind, selectedGradientIndex, selectedStampIndex,
        dabShape, brushShape, brushMode, sprayMode, softenType, softenHardness, density, dabSize, dabWidth, dabHeight, dabLockAspect,
        sizeJitterAmt, sizeJitterMin, sizeJitterMax, dabWidthJitterMin, dabWidthJitterMax, dabHeightJitterMin, dabHeightJitterMax, opacityJitterAmt, opacityJitterMin, opacityJitterMax,
        rotationJitterAmt, rotationMode, rotationAlgorithm, rotationMinAngle, rotationMaxAngle,
        rotationRanges: Array.isArray(rotationRanges) ? JSON.parse(JSON.stringify(rotationRanges)) : [{ min: rotationMinAngle, max: rotationMaxAngle }],
        activeRotationRangeIndex, sprayTargetAnchorX, sprayTargetAnchorY, spraySnapToGrid, spraySnapClearCell,
        falloff, flow, pixelPerfect, brushPixelPerfect, colorizeTargetHex, sprayCombineSameColor, sprayInterpolate,
        heightPaintEnabled, heightSourceLayerIndex, heightMode, heightMin, heightMax, heightSoftness
      }
    };
  }"""

if build_proj_old in text:
    text = text.replace(build_proj_old, build_proj_new, 1)
    print("Patched buildProjectData")
else:
    print("Could not find buildProjectData")

# Replace loadProjectData dirty fix
load_proj_old = """      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
    }).catch(err => {"""

load_proj_new = """      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
      if (window.parent) {
        window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty: false }, '*');
      }
    }).catch(err => {"""

if load_proj_old in text:
    text = text.replace(load_proj_old, load_proj_new, 1)
    print("Patched loadProjectData clean dispatch")

pointer_up_old = """    if(layerContentChanged && layers[activeLayer]) {
      invalidateColorBuffer(layers[activeLayer]);
      refreshLayerThumbOnly();
    }"""

pointer_up_new = """    if(layerContentChanged && layers[activeLayer]) {
      invalidateColorBuffer(layers[activeLayer]);
      refreshLayerThumbOnly();
      setDirty(true);
    }"""

if pointer_up_old in text:
    text = text.replace(pointer_up_old, pointer_up_new, 1)
    print("Patched pointerUp setDirty")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

