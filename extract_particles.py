import re

with open('src/components/ParticlesEditor.tsx', 'r') as f:
    lines = f.readlines()

# Extract ParticleInstance
particle_instance = []
in_pi = False
for line in lines:
    if line.startswith('export interface ParticleInstance') or line.startswith('interface ParticleInstance'):
        in_pi = True
    if in_pi:
        particle_instance.append(line)
        if line.startswith('}'):
            break

# Export ParticleInstance if not exported
particle_instance[0] = particle_instance[0].replace('interface ParticleInstance', 'export interface ParticleInstance')

# Write to ParticleEngine.ts
with open('src/engine/systems/ParticleEngine.ts', 'w') as f:
    f.write('''import { ParticleSystemData, ParticleBlendMode, ParticleShape, ParticleCurveMode, ParticleFxStyle, ParticleAnimStyle, ParticleSizeCurve, ParticleEmissiveMode } from '../masonProjectSchema';

''')
    f.writelines(particle_instance)
