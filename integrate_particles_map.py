import re

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

# Add physicsTick modification
physics_tick_pattern = r"animId = requestAnimationFrame\(physicsTick\);\n    };\n\n    animId = requestAnimationFrame\(physicsTick\);"
new_physics_tick = """
      particleEngineRef.current.update(dt, {}, mapData.height * 64 + 1000);
      animId = requestAnimationFrame(physicsTick);
    };

    animId = requestAnimationFrame(physicsTick);
"""
content = re.sub(physics_tick_pattern, new_physics_tick, content)

# Modify render loop to render particles
render_loop_pattern = r"(// ==========================================\n\s*// 10\. RENDER PLAYER \(Test Mode\))"
new_render_loop = """// ==========================================
      // 9.5 RENDER PARTICLES
      // ==========================================
      if (mode === 'play') {
         particleEngineRef.current.render(ctx, pan, scale, null);
      }

      \1"""
content = re.sub(render_loop_pattern, new_render_loop, content)

with open('src/components/RefinedMapCanvas.tsx', 'w') as f:
    f.write(content)

