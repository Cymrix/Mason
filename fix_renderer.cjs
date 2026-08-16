const fs = require('fs');
let file = fs.readFileSync('src/engine/tileMaterialRenderer.ts', 'utf8');

// details.leftSide.enabled -> (details.leftSide.overlayTextureUrl || details.leftSide.color)
file = file.replace(/details\.leftSide\.enabled/g, "(details.leftSide.overlayTextureUrl || details.leftSide.color)");
file = file.replace(/details\.rightSide\.enabled/g, "(details.rightSide.overlayTextureUrl || details.rightSide.color)");
file = file.replace(/details\.bottom\.enabled/g, "(details.bottom.overlayTextureUrl || details.bottom.color)");
file = file.replace(/details\.top\.enabled/g, "(details.top.overlayTextureUrl || details.top.color)");

file = file.replace(/innerDetails && innerDetails\.enabled/g, "innerDetails && (innerDetails.overlayTextureUrl || innerDetails.color)");

file = file.replace(/const details = \(tileType\.tileDetails as any\)\.slope\?\.enabled\s*\?\s*\(tileType\.tileDetails as any\)\.slope\s*:\s*tileType\.tileDetails\.top;/g, "const slopeDetails = (tileType.tileDetails as any).slope;\n  const details = (slopeDetails && (slopeDetails.overlayTextureUrl || slopeDetails.color)) ? slopeDetails : tileType.tileDetails.top;");

file = file.replace(/if \(!details \|\| !details\.enabled\) return;/g, "if (!details || (!details.overlayTextureUrl && !details.color)) return;");

fs.writeFileSync('src/engine/tileMaterialRenderer.ts', file);
