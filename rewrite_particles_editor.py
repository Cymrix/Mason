import re

with open('src/components/ParticlesEditor.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
import_str = "import { ParticleEngine, evaluateTrackValue } from '../engine/systems/ParticleEngine';\n"
content = content.replace("import { FileSubfolderHeader } from './FileSubfolderHeader';", import_str + "import { FileSubfolderHeader } from './FileSubfolderHeader';")

# 2. Remove ParticleInstance interface definition
content = re.sub(r"interface ParticleInstance \{.*?\n\}\n", "", content, flags=re.DOTALL)

# 3. Add engineRef to the component
content = re.sub(r"const canvasRef = useRef<HTMLCanvasElement \| null>\(null\);\n  const particlesRef = useRef<ParticleInstance\[\]>\(\[\]\);", r"const canvasRef = useRef<HTMLCanvasElement | null>(null);\n  const engineRef = useRef<ParticleEngine>(new ParticleEngine());", content)

# 4. Remove spawnParticles function body completely
spawn_func_pattern = r"// Spawn a burst of particles at given position\n\s*const spawnParticles = \([^)]*\) => \{.*?(?=  // Main 60fps GPU simulation render loop)"
content = re.sub(spawn_func_pattern, r"const spawnParticles = (count: number, customOrigin?: { x: number; y: number }) => {\n    const origin = customOrigin || emitterPos;\n    engineRef.current.spawnParticles(count, activeParticleData, origin);\n  };\n\n", content, flags=re.DOTALL)

# 5. Simplify renderLoop inside useEffect
# I will replace the inner part of renderLoop after `const floorY = height - 50;`
# up to `animId = requestAnimationFrame(renderLoop);` with a call to engineRef
old_render_logic_pattern = r"// Handle continuous stream emission.*?ctx\.restore\(\);\n\n      animId = requestAnimationFrame\(renderLoop\);"
new_render_logic = """// Handle continuous stream emission
      if (isPlaying && activeParticleData.emitter.isContinuous) {
        const rateMin = activeParticleData.emitter.emissionRateMin ?? activeParticleData.emitter.emissionRate ?? 20;
        const rateMax = activeParticleData.emitter.emissionRateMax ?? activeParticleData.emitter.emissionRate ?? 20;
        const currentRate = rateMin + Math.random() * (rateMax - rateMin);
        
        if (currentRate > 0) {
          const emitInterval = 1 / currentRate;
          if (now - lastEmitTimeRef.current >= emitInterval * 1000) {
            const particlesToSpawn = Math.max(1, Math.floor(((now - lastEmitTimeRef.current) / 1000) * currentRate));
            spawnParticles(particlesToSpawn);
            lastEmitTimeRef.current = now;
          }
        }
      }

      // Handle periodic bursts
      const burstEnabled = activeParticleData.emitter.burstEnabled !== false;
      if (isPlaying && burstEnabled) {
        const intervalMin = activeParticleData.emitter.burstIntervalMin ?? activeParticleData.emitter.burstInterval ?? 1.0;
        const intervalMax = activeParticleData.emitter.burstIntervalMax ?? activeParticleData.emitter.burstInterval ?? 1.0;
        
        if (nextBurstIntervalRef.current === null) {
           nextBurstIntervalRef.current = intervalMin + Math.random() * (intervalMax - intervalMin);
        }

        if (now - lastBurstTimeRef.current >= nextBurstIntervalRef.current * 1000) {
          const countMin = activeParticleData.emitter.burstCountMin ?? activeParticleData.emitter.burstCount ?? 30;
          const countMax = activeParticleData.emitter.burstCountMax ?? activeParticleData.emitter.burstCount ?? 30;
          const count = Math.floor(countMin + Math.random() * (countMax - countMin));
          spawnParticles(count);
          lastBurstTimeRef.current = now;
          nextBurstIntervalRef.current = intervalMin + Math.random() * (intervalMax - intervalMin);
        }
      }

      engineRef.current.update(dt, activeParticleData.physics, floorY);

      // Render environment
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      const gridSize = 64;
      
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      
      const scaledWidth = width / zoom;
      const scaledHeight = height / zoom;
      const startX = -panOffset.x / zoom;
      const startY = -panOffset.y / zoom;
      
      ctx.beginPath();
      for (let x = Math.floor(startX / gridSize) * gridSize; x < startX + scaledWidth; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + scaledHeight);
      }
      for (let y = Math.floor(startY / gridSize) * gridSize; y < startY + scaledHeight; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + scaledWidth, y);
      }
      ctx.stroke();
      
      // Draw emitter handle
      if (isPlaying) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(emitterPos.x, emitterPos.y, 4 / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.arc(emitterPos.x, emitterPos.y, 12 / zoom, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (activeParticleData.physics.collideWithMapSolids) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, floorY, width, height - floorY);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(width, floorY);
        ctx.stroke();
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('SOLID FLOOR GEOMETRY (COLLISION PLANE)', 16, floorY + 20);
      }

      engineRef.current.render(ctx, panOffset, zoom, activeParticleData);

      animId = requestAnimationFrame(renderLoop);"""
content = re.sub(old_render_logic_pattern, new_render_logic, content, flags=re.DOTALL)

with open('src/components/ParticlesEditor.tsx', 'w') as f:
    f.write(content)

