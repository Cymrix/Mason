import re

with open('src/components/ParticlesEditor.tsx', 'r') as f:
    content = f.read()

def extract_function(name):
    pattern = r"const\s+" + name + r"\s*=\s*\([^)]*\)\s*(?::\s*[^{]+)?=>\s*\{"
    match = re.search(pattern, content)
    if not match:
        return ""
    
    start = match.start()
    
    # find matching brace
    brace_count = 0
    end = -1
    for i in range(start, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i + 1
                break
    
    func_str = content[start:end]
    # replace "const NAME =" with "export function NAME"
    func_str = re.sub(r"const\s+" + name + r"\s*=\s*(\([^)]*\)\s*(?::\s*[^{]+)?=>)\s*\{", r"export function " + name + r"\1 {", func_str)
    # convert "=> {" to "{"
    func_str = re.sub(r"=>\s*\{", "{", func_str, count=1)
    return func_str

# Get all the functions
hexToRgb = extract_function("hexToRgb")
rgbToHex = extract_function("rgbToHex")
getTrackNodesForData = extract_function("getTrackNodesForData")
evaluateTrackValue = extract_function("evaluateTrackValue")
getAnimProgress = extract_function("getAnimProgress")
evaluate3PointValue = extract_function("evaluate3PointValue")
evaluateColorAlpha = extract_function("evaluateColorAlpha")
evaluateSize = extract_function("evaluateSize")

# we need to remove dragStateRef dependency from getTrackNodesForData
getTrackNodesForData = re.sub(r"if\s*\(dragStateRef\.current[^\}]+\}\s*", "", getTrackNodesForData)

with open('src/engine/systems/ParticleEngine.ts', 'a') as f:
    f.write("\n\n" + hexToRgb)
    f.write("\n\n" + rgbToHex)
    f.write("\n\n" + getTrackNodesForData)
    f.write("\n\n" + evaluateTrackValue)
    f.write("\n\n" + getAnimProgress)
    f.write("\n\n" + evaluate3PointValue)
    f.write("\n\n" + evaluateColorAlpha)
    f.write("\n\n" + evaluateSize)
