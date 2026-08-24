with open("src/components/ParticlesEditor.tsx", "r") as f:
    content = f.read()

# Locate getTrackNodesForData in ParticlesEditor.tsx and replace it cleanly
target_start = "  const getTrackNodesForData = (visuals: any, track: string): { time: number; value: any }[] => {"
if target_start in content:
    parts = content.split(target_start)
    # find closing brace of getTrackNodesForData
    # let's find the function body
    rest = parts[1]
    # We can replace the entire old function definition
    # Let's inspect where evaluateTrackValue starts
    target_end = "  const evaluateTrackValue ="
    func_parts = rest.split(target_end)
    
    new_func = """ {
    if (dragStateRef.current && dragStateRef.current.track === track) {
      return dragStateRef.current.nodes;
    }

    let nodes: { time: number; value: any }[] = [];
    if (visuals?.trackNodes?.[track] && Array.isArray(visuals.trackNodes[track]) && visuals.trackNodes[track].length > 0) {
      nodes = [...visuals.trackNodes[track]];
    }

    if (track === 'size') {
      const start = visuals?.startSize ?? 8;
      const end = visuals?.endSize ?? 2;
      const mid = visuals?.midSize;
      const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
      if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
      const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
      if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
      if (mid !== undefined) {
        const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
        if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
      } else {
        nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
      }
    } else if (track === 'color') {
      const start = visuals?.startColor ?? '#ffa500';
      const end = visuals?.endColor ?? '#ff0000';
      const mid = visuals?.midColor;
      const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
      if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
      const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
      if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
      if (mid) {
        const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
        if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
      } else {
        nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
      }
    } else if (track === 'alpha') {
      const start = visuals?.startAlpha ?? 1.0;
      const end = visuals?.endAlpha ?? 0.0;
      const mid = visuals?.midAlpha;
      const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
      if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
      const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
      if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
      if (mid !== undefined) {
        const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
        if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
      } else {
        nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
      }
    } else if (track === 'emissive') {
      const start = visuals?.emissiveStartStrength ?? 35;
      const end = visuals?.emissiveEndStrength ?? 0;
      const mid = visuals?.emissiveMidStrength;
      const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
      if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
      const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
      if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
      if (mid !== undefined) {
        const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
        if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
      } else {
        nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
      }
    } else if (track === 'rotation') {
      const start = visuals?.startRotationDeg ?? 0;
      const end = visuals?.endRotationDeg ?? 360;
      const mid = visuals?.midRotationDeg;
      const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
      if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
      const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
      if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
      if (mid !== undefined) {
        const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
        if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
      } else {
        nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
      }
    } else if (track === 'speed') {
      if (nodes.length === 0) nodes = [{ time: 0, value: 0 }, { time: 1, value: 0 }];
    } else if (track === 'drag') {
      if (nodes.length === 0) nodes = [{ time: 0, value: 0.98 }, { time: 1, value: 0.98 }];
    }

    if (nodes.length === 0) nodes = [{ time: 0, value: 0 }, { time: 1, value: 1 }];
    return nodes.sort((a, b) => a.time - b.time);
  };
  
"""
    content = parts[0] + target_start + new_func + target_end + func_parts[1]
    with open("src/components/ParticlesEditor.tsx", "w") as f:
        f.write(content)
    print("Successfully updated ParticlesEditor.tsx getTrackNodesForData")
else:
    print("Error: target_start not found in ParticlesEditor.tsx")

# Now update ParticleEngine.ts getTrackNodesForData
with open("src/engine/ParticleEngine.ts", "r") as f:
    engine_content = f.read()

engine_start = "export function getTrackNodesForData(visuals: any, track: string): { time: number; value: any }[] {"
if engine_start in engine_content:
    parts = engine_content.split(engine_start)
    engine_end = "export function evaluateTrackValue("
    func_parts = parts[1].split(engine_end)
    
    new_engine_func = """ {
  let nodes: { time: number; value: any }[] = [];
  if (visuals?.trackNodes?.[track] && Array.isArray(visuals.trackNodes[track]) && visuals.trackNodes[track].length > 0) {
    nodes = [...visuals.trackNodes[track]];
  }

  if (track === "size") {
    const start = visuals?.startSize ?? 8;
    const end = visuals?.endSize ?? 2;
    const mid = visuals?.midSize;
    const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
    if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
    const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
    if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
    if (mid !== undefined) {
      const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
      if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
    } else {
      nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
    }
  } else if (track === "color") {
    const start = visuals?.startColor ?? "#ffa500";
    const end = visuals?.endColor ?? "#ff0000";
    const mid = visuals?.midColor;
    const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
    if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
    const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
    if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
    if (mid) {
      const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
      if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
    } else {
      nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
    }
  } else if (track === "alpha") {
    const start = visuals?.startAlpha ?? 1.0;
    const end = visuals?.endAlpha ?? 0.0;
    const mid = visuals?.midAlpha;
    const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
    if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
    const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
    if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
    if (mid !== undefined) {
      const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
      if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
    } else {
      nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
    }
  } else if (track === "emissive") {
    const start = visuals?.emissiveStartStrength ?? 35;
    const end = visuals?.emissiveEndStrength ?? 0;
    const mid = visuals?.emissiveMidStrength;
    const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
    if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
    const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
    if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
    if (mid !== undefined) {
      const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
      if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
    } else {
      nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
    }
  } else if (track === "rotation") {
    const start = visuals?.startRotationDeg ?? 0;
    const end = visuals?.endRotationDeg ?? 360;
    const mid = visuals?.midRotationDeg;
    const n0 = nodes.find(n => Math.abs(n.time - 0) < 0.001);
    if (n0) n0.value = start; else nodes.push({ time: 0, value: start });
    const n1 = nodes.find(n => Math.abs(n.time - 1) < 0.001);
    if (n1) n1.value = end; else nodes.push({ time: 1, value: end });
    if (mid !== undefined) {
      const nMid = nodes.find(n => Math.abs(n.time - 0.5) < 0.001);
      if (nMid) nMid.value = mid; else nodes.push({ time: 0.5, value: mid });
    } else {
      nodes = nodes.filter(n => Math.abs(n.time - 0.5) >= 0.001);
    }
  } else if (track === "speed") {
    if (nodes.length === 0) nodes = [{ time: 0, value: 0 }, { time: 1, value: 0 }];
  } else if (track === "drag") {
    if (nodes.length === 0) nodes = [{ time: 0, value: 0.98 }, { time: 1, value: 0.98 }];
  }

  if (nodes.length === 0) nodes = [{ time: 0, value: 0 }, { time: 1, value: 1 }];
  return nodes.sort((a, b) => a.time - b.time);
}

"""
    engine_content = parts[0] + engine_start + new_engine_func + engine_end + func_parts[1]
    with open("src/engine/ParticleEngine.ts", "w") as f:
        f.write(engine_content)
    print("Successfully updated ParticleEngine.ts getTrackNodesForData")
else:
    print("Error: engine_start not found in ParticleEngine.ts")
