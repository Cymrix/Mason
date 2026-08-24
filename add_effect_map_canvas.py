import re

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

effect_code = """
  // Set up particle emitters when entering play mode
  useEffect(() => {
    if (mode === 'play') {
      particleEngineRef.current.clearEmitters();
      particleEngineRef.current.particles = [];
      
      // Look for props/actors that have attached particles
      if (mapData && characters && particleSystems) {
        for (let y = 0; y < mapData.height; y++) {
          for (let x = 0; x < mapData.width; x++) {
            const cell = mapData.cells[y * mapData.width + x];
            
            // Check actor_id
            if (cell.actor_id) {
              const actor = characters.find(c => c.id === cell.actor_id);
              if (actor && actor.attachedParticles) {
                for (const attachment of actor.attachedParticles) {
                  const system = particleSystems.find(ps => ps.id === attachment.particleSystemId);
                  if (system) {
                    const originX = x * 64 + 32 + (attachment.offsetX || 0);
                    const originY = y * 64 + 32 + (attachment.offsetY || 0);
                    particleEngineRef.current.addEmitter(system, originX, originY);
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [mode, mapData, characters, particleSystems]);

  // Exact character configuration
"""

content = content.replace("  // Exact character configuration", effect_code)

with open('src/components/RefinedMapCanvas.tsx', 'w') as f:
    f.write(content)
