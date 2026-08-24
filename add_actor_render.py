import re

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

actor_render = """
      // ==========================================
      // 9.25 RENDER ACTORS & PROPS
      // ==========================================
      if (mapData.cells && characters) {
        for (let y = minVisTileY; y <= maxVisTileY; y++) {
          for (let x = minVisTileX; x <= maxVisTileX; x++) {
            if (y < 0 || y >= mapData.height || x < 0 || x >= mapData.width) continue;
            const cell = mapData.cells[y * mapData.width + x];
            if (cell && cell.actor_id) {
              const actor = characters.find(c => c.id === cell.actor_id);
              if (actor) {
                const screenX = x * TILE_SIZE + TILE_SIZE / 2;
                const screenY = y * TILE_SIZE + TILE_SIZE; // bottom-center
                
                ctx.save();
                if (actor.spriteUrl) {
                  // If we had a loaded image, we'd draw it. For now, draw placeholder.
                  ctx.fillStyle = actor.tintColor || '#a855f7';
                  ctx.fillRect(screenX - 12, screenY - 48, 24, 48);
                  
                  // Label
                  ctx.fillStyle = 'white';
                  ctx.font = '10px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(actor.name, screenX, screenY - 52);
                } else {
                  // Fallback prop shape
                  ctx.fillStyle = actor.tintColor || '#a855f7';
                  ctx.beginPath();
                  ctx.roundRect(screenX - 10, screenY - 32, 20, 32, 4);
                  ctx.fill();
                  ctx.strokeStyle = '#3b0764';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }
                ctx.restore();
              }
            }
          }
        }
      }
"""

content = content.replace("// 9.5 RENDER PARTICLES", actor_render + "\n      // 9.5 RENDER PARTICLES")

with open('src/components/RefinedMapCanvas.tsx', 'w') as f:
    f.write(content)
