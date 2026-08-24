import re

with open('src/engine/systems/ParticleEngine.ts', 'r') as f:
    content = f.read()

# Add ActiveEmitter interface
interface_code = """
export interface ActiveEmitter {
  system: ParticlePhysicsConfig;
  originX: number;
  originY: number;
  accumulator: number;
}
"""
content = re.sub(r'export class ParticleEngine \{', interface_code + '\nexport class ParticleEngine {', content)

# Add activeEmitters array
init_code = """  particles: ParticleInstance[] = [];
  grid: Map<string, ParticleInstance[]> = new Map();
  activeEmitters: ActiveEmitter[] = [];
"""
content = re.sub(r'particles: ParticleInstance\[\] = \[\];\n\s*grid: Map<string, ParticleInstance\[\]> = new Map\(\);', init_code, content)

# Add addEmitter and clearEmitters methods
methods_code = """
  addEmitter(system: ParticlePhysicsConfig, x: number, y: number) {
    this.activeEmitters.push({ system, originX: x, originY: y, accumulator: 0 });
  }

  clearEmitters() {
    this.activeEmitters = [];
  }
"""
content = re.sub(r'spawnParticles\(system: ParticlePhysicsConfig, originX: number, originY: number\) \{', methods_code + '\n  spawnParticles(system: ParticlePhysicsConfig, originX: number, originY: number) {', content)

# Update logic
update_code = """
  update(dt: number, externalForces: { windForce?: {x: number, y: number} }, killY: number) {
    // Process active emitters
    for (const emitter of this.activeEmitters) {
      if (emitter.system.emissionRate > 0) {
        emitter.accumulator += dt * emitter.system.emissionRate;
        const count = Math.floor(emitter.accumulator);
        if (count > 0) {
          emitter.accumulator -= count;
          // Spawn 'count' particles
          // We can temporarily modify system maxParticles just for this spawn tick if we want,
          // but better to just spawn 'count' ignoring maxParticles here, because we handle maxParticles globally or we can just let spawnParticles do it
          const oldMax = emitter.system.maxParticles;
          emitter.system.maxParticles = count; // hack to just spawn count
          this.spawnParticles(emitter.system, emitter.originX, emitter.originY);
          emitter.system.maxParticles = oldMax;
        }
      }
    }
"""
content = re.sub(r'update\(dt: number, externalForces: \{ windForce\?: \{x: number, y: number\} \}, killY: number\) \{', update_code, content)

with open('src/engine/systems/ParticleEngine.ts', 'w') as f:
    f.write(content)
