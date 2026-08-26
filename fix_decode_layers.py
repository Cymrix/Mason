import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

decode_old = """  function decodeLayersData(layerDataArr, w, h){
    return Promise.all((layerDataArr||[]).map(ld=> new Promise(res=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d', { willReadFrequently: true }).drawImage(img,0,0);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const layerObj = {
          name: ld.name || 'Layer',
          canvas: c, ctx, colorCanvas: c, colorCtx: ctx,
          heightCanvas: null, heightCtx: null,
          roughnessCanvas: null, roughnessCtx: null,
          visible: ld.visible !== false,
          locked: !!ld.locked,
          opacity: (typeof ld.opacity === 'number') ? ld.opacity : 100
        };
        const promises = [];
        if(ld.heightData){
          promises.push(new Promise(r1=>{
            const himg = new Image();
            himg.onload = ()=>{
              const hc = document.createElement('canvas');
              hc.width = w; hc.height = h;
              hc.getContext('2d', { willReadFrequently: true }).drawImage(himg,0,0);
              layerObj.heightCanvas = hc;
              layerObj.heightCtx = hc.getContext('2d', { willReadFrequently: true });
              r1();
            };
            himg.src = ld.heightData;
          }));
        }
        if(ld.roughnessData){
          promises.push(new Promise(r2=>{
            const rimg = new Image();
            rimg.onload = ()=>{
              const rc = document.createElement('canvas');
              rc.width = w; rc.height = h;
              rc.getContext('2d', { willReadFrequently: true }).drawImage(rimg,0,0);
              layerObj.roughnessCanvas = rc;
              layerObj.roughnessCtx = rc.getContext('2d', { willReadFrequently: true });
              r2();
            };
            rimg.src = ld.roughnessData;
          }));
        }
        Promise.all(promises).then(()=> res(layerObj));
      };
      img.src = ld.data;
    })));
  }"""

decode_new = """  function decodeLayersData(layerDataArr, w, h){
    return Promise.all((layerDataArr||[]).map(ld=> new Promise(res=>{
      const buildEmptyLayer = () => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        return {
          name: ld.name || 'Layer',
          canvas: c, ctx, colorCanvas: c, colorCtx: ctx,
          heightCanvas: null, heightCtx: null,
          roughnessCanvas: null, roughnessCtx: null,
          visible: ld.visible !== false,
          locked: !!ld.locked,
          opacity: (typeof ld.opacity === 'number') ? ld.opacity : 100
        };
      };

      if (!ld.data || ld.data === '') {
        const layerObj = buildEmptyLayer();
        res(layerObj);
        return;
      }

      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d', { willReadFrequently: true }).drawImage(img,0,0);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const layerObj = {
          name: ld.name || 'Layer',
          canvas: c, ctx, colorCanvas: c, colorCtx: ctx,
          heightCanvas: null, heightCtx: null,
          roughnessCanvas: null, roughnessCtx: null,
          visible: ld.visible !== false,
          locked: !!ld.locked,
          opacity: (typeof ld.opacity === 'number') ? ld.opacity : 100
        };
        const promises = [];
        if(ld.heightData && ld.heightData !== ''){
          promises.push(new Promise(r1=>{
            const himg = new Image();
            himg.onload = ()=>{
              const hc = document.createElement('canvas');
              hc.width = w; hc.height = h;
              hc.getContext('2d', { willReadFrequently: true }).drawImage(himg,0,0);
              layerObj.heightCanvas = hc;
              layerObj.heightCtx = hc.getContext('2d', { willReadFrequently: true });
              r1();
            };
            himg.onerror = () => r1();
            himg.src = ld.heightData;
          }));
        }
        if(ld.roughnessData && ld.roughnessData !== ''){
          promises.push(new Promise(r2=>{
            const rimg = new Image();
            rimg.onload = ()=>{
              const rc = document.createElement('canvas');
              rc.width = w; rc.height = h;
              rc.getContext('2d', { willReadFrequently: true }).drawImage(rimg,0,0);
              layerObj.roughnessCanvas = rc;
              layerObj.roughnessCtx = rc.getContext('2d', { willReadFrequently: true });
              r2();
            };
            rimg.onerror = () => r2();
            rimg.src = ld.roughnessData;
          }));
        }
        Promise.all(promises).then(()=> res(layerObj));
      };
      img.onerror = ()=>{
        const layerObj = buildEmptyLayer();
        res(layerObj);
      };
      img.src = ld.data;
    })));
  }"""

if decode_old in text:
    text = text.replace(decode_old, decode_new, 1)
    print("Patched decodeLayersData to handle empty data and onerror")
else:
    print("Could not find decode_old")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
