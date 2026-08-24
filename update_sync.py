with open("src/components/ParticlesEditor.tsx", "r") as f:
    content = f.read()

target = """      if (currentParticleData.visuals && updatedData.visuals) {
        const oldStyle = currentParticleData.visuals.fxStyle as any;"""

replacement = """      if (currentParticleData.visuals && updatedData.visuals) {
        // --- Bidirectional Sync ---
        const oldVis = currentParticleData.visuals;
        const newVis = updatedData.visuals;
        
        const syncTrack = (trackName: string, startField: string, endField: string, midField: string) => {
           if (oldVis[startField] !== newVis[startField]) {
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time) < 0.001 ? { ...n, value: newVis[startField] } : n);
               }
           } else if (oldVis[endField] !== newVis[endField]) {
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time - 1) < 0.001 ? { ...n, value: newVis[endField] } : n);
               }
           } else if (oldVis[midField] !== newVis[midField]) {
               if (newVis.trackNodes?.[trackName]) {
                   newVis.trackNodes[trackName] = newVis.trackNodes[trackName].map((n: any) => Math.abs(n.time - 0.5) < 0.001 ? { ...n, value: newVis[midField] } : n);
               }
           } else if (newVis.trackNodes?.[trackName]) {
               const n0 = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time) < 0.001);
               if (n0) newVis[startField] = n0.value;
               const n1 = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time - 1) < 0.001);
               if (n1) newVis[endField] = n1.value;
               const nMid = newVis.trackNodes[trackName].find((n: any) => Math.abs(n.time - 0.5) < 0.001);
               if (nMid) newVis[midField] = nMid.value;
           }
        };

        syncTrack('color', 'startColor', 'endColor', 'midColor');
        syncTrack('size', 'startSize', 'endSize', 'midSize');
        syncTrack('alpha', 'startAlpha', 'endAlpha', 'midAlpha');
        syncTrack('emissive', 'emissiveStartStrength', 'emissiveEndStrength', 'emissiveMidStrength');
        syncTrack('rotation', 'startRotationDeg', 'endRotationDeg', 'midRotationDeg');
        // --------------------------

        const oldStyle = currentParticleData.visuals.fxStyle as any;"""

content = content.replace(target, replacement)
with open("src/components/ParticlesEditor.tsx", "w") as f:
    f.write(content)
print("Updated ParticlesEditor.tsx with bi-directional sync!")
