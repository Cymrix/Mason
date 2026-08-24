import re

with open('src/components/RefinedMapCanvas.tsx', 'r') as f:
    content = f.read()

# Modify Eraser tool to also erase actor_id
content = content.replace("target.particle_emitter_id = null;", "target.particle_emitter_id = null;\n                    target.actor_id = null;")
content = content.replace("currentCell.particle_emitter_id = null;", "currentCell.particle_emitter_id = null;\n                  currentCell.actor_id = null;")

# Add logic to set actor_id
paint_logic = """                    } else if (paintCategory === 'particles') {
                      target.particle_emitter_id = selectedAssetId;
                    }"""
new_paint_logic = """                    } else if (paintCategory === 'actor') {
                      target.actor_id = selectedAssetId;
                    } else if (paintCategory === 'particles') {
                      target.particle_emitter_id = selectedAssetId;
                    }"""
content = content.replace(paint_logic, new_paint_logic)

paint_logic2 = """                  } else if (paintCategory === 'particles') {
                    currentCell.particle_emitter_id = selectedAssetId;
                  }"""
new_paint_logic2 = """                  } else if (paintCategory === 'actor') {
                    currentCell.actor_id = selectedAssetId;
                  } else if (paintCategory === 'particles') {
                    currentCell.particle_emitter_id = selectedAssetId;
                  }"""
content = content.replace(paint_logic2, new_paint_logic2)

with open('src/components/RefinedMapCanvas.tsx', 'w') as f:
    f.write(content)
