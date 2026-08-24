import re

with open('src/components/ParticlesEditor.tsx', 'r') as f:
    content = f.read()

# Replace ParticleInstance interface
content = re.sub(r"interface ParticleInstance \{.*?\}\n", "", content, flags=re.DOTALL)

# Add imports for engine
import_statement = "import { ParticleEngine, ParticleInstance, evaluateTrackValue } from '../engine/systems/ParticleEngine';\n"
content = content.replace("import { FileSubfolderHeader }", import_statement + "import { FileSubfolderHeader }")

# Remove utility functions
utils_to_remove = ["hexToRgb", "rgbToHex", "getTrackNodesForData", "evaluateTrackValue", "getAnimProgress", "evaluate3PointValue", "evaluateColorAlpha", "evaluateSize", "getDynamicColorGradient", "getDynamicAlphaGradient"]

for util in utils_to_remove:
    # This is tricky because getDynamicColorGradient and getDynamicAlphaGradient are used in the UI. 
    pass

