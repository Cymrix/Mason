import os

files = [
    "src/components/BiomeMacroMapModal.tsx",
    "src/components/FileSubfolderHeader.tsx",
    "src/components/MapCanvas.tsx",
    "src/components/EditorLayout.tsx",
    "src/components/RefinedMapCanvas.tsx",
    "src/hooks/useCanvasPanZoom.ts"
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        continue
    with open(filepath, "r") as f:
        content = f.read()
    
    content = content.replace("React.useMemo", "useMemo")
    content = content.replace("React.useEffect", "useEffect")
    content = content.replace("React.useCallback", "useCallback")
    
    if "import React," in content:
        if "useMemo" in content and "useMemo" not in content.split("from")[0]:
            content = content.replace("import React, {", "import React, { useMemo,")
        if "useEffect" in content and "useEffect" not in content.split("from")[0]:
            content = content.replace("import React, {", "import React, { useEffect,")
        if "useCallback" in content and "useCallback" not in content.split("from")[0]:
            content = content.replace("import React, {", "import React, { useCallback,")

    with open(filepath, "w") as f:
        f.write(content)

print("Fixed all hooks successfully")
