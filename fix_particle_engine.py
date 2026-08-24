import re

with open('src/engine/systems/ParticleEngine.ts', 'r') as f:
    content = f.read()

# Fix interface
content = content.replace("system: ParticlePhysicsConfig;", "system: ParticleSystemData;")

# Add activeEmitters array if not present
if "activeEmitters: ActiveEmitter[] = [];" not in content:
    content = content.replace("public particles: ParticleInstance[] = [];", "public particles: ParticleInstance[] = [];\n  public activeEmitters: ActiveEmitter[] = [];")

# Add methods
methods_code = """
  public addEmitter(system: ParticleSystemData, x: number, y: number) {
    this.activeEmitters.push({ system, originX: x, originY: y, accumulator: 0 });
  }

  public clearEmitters() {
    this.activeEmitters = [];
  }
"""

if "public addEmitter(" not in content:
    content = content.replace("public spawnParticles(", methods_code + "\n  public spawnParticles(")

# Add update loop modification
update_code = """
  public update(dt: number, physicsRules: ParticlePhysicsConfig, globalFloorY: number) {
    // Process active emitters
    for (const emitter of this.activeEmitters) {
      const emissionRate = emitter.system.emitter.emissionRate ?? 20;
      if (emissionRate > 0) {
        emitter.accumulator += dt * emissionRate;
        const count = Math.floor(emitter.accumulator);
        if (count > 0) {
          emitter.accumulator -= count;
          // Spawn 'count' particles
          this.spawnParticles(count, emitter.system, { x: emitter.originX, y: emitter.originY });
        }
      }
    }
"""

content = re.sub(r'public update\(dt: number, physicsRules: ParticlePhysicsConfig, globalFloorY: number\) \{', update_code, content)

with open('src/engine/systems/ParticleEngine.ts', 'w') as f:
    f.write(content)
