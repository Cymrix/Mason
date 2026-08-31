import { SpriteExportMetadata, SpriteFile, ImageFile, MasonProject } from '../engine/masonProjectSchema';
import { saveActiveMasonProject } from './masonStorage';

/**
 * Slices a composite spritesheet image dataUrl / URL into individual animation frame tiles
 */
export async function sliceSpritesheetToFrames(
  imageSrc: string,
  cols: number = 1,
  rows: number = 1,
  tileWidth: number = 32,
  tileHeight: number = 32,
  options?: {
    marginX?: number;
    marginY?: number;
    spacingX?: number;
    spacingY?: number;
    totalFrames?: number;
  }
): Promise<{
  frames: Array<{
    name: string;
    layers: Array<{ name: string; data: string }>;
    activeLayer: number;
  }>;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve({
        frames: [
          {
            name: 'Frame 1',
            layers: [{ name: 'Layer 1', data: '' }],
            activeLayer: 0
          }
        ],
        width: tileWidth || 32,
        height: tileHeight || 32
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const marginX = Math.max(0, options?.marginX || 0);
      const marginY = Math.max(0, options?.marginY || 0);
      const spacingX = Math.max(0, options?.spacingX || 0);
      const spacingY = Math.max(0, options?.spacingY || 0);

      const numCols = cols > 0 ? cols : Math.max(1, Math.floor((img.naturalWidth - marginX) / ((tileWidth || 32) + spacingX)));
      const numRows = rows > 0 ? rows : Math.max(1, Math.floor((img.naturalHeight - marginY) / ((tileHeight || 32) + spacingY)));
      const tw = tileWidth > 0 ? tileWidth : Math.max(1, Math.floor((img.naturalWidth - marginX - (numCols - 1) * spacingX) / numCols));
      const th = tileHeight > 0 ? tileHeight : Math.max(1, Math.floor((img.naturalHeight - marginY - (numRows - 1) * spacingY) / numRows));

      const maxFrames = options?.totalFrames && options.totalFrames > 0 ? options.totalFrames : numCols * numRows;

      const frames: Array<{
        name: string;
        layers: Array<{ name: string; data: string }>;
        activeLayer: number;
      }> = [];

      let frameIdx = 1;
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          if (frames.length >= maxFrames) break;

          const sx = marginX + c * (tw + spacingX);
          const sy = marginY + r * (th + spacingY);

          const canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              img,
              sx, sy, tw, th,
              0, 0, tw, th
            );
          }
          const frameDataUrl = canvas.toDataURL('image/png');
          frames.push({
            name: `Frame ${frameIdx}`,
            layers: [
              {
                name: 'Layer 1',
                data: frameDataUrl
              }
            ],
            activeLayer: 0
          });
          frameIdx++;
        }
      }

      resolve({
        frames: frames.length > 0 ? frames : [
          {
            name: 'Frame 1',
            layers: [{ name: 'Layer 1', data: imageSrc }],
            activeLayer: 0
          }
        ],
        width: tw,
        height: th
      });
    };

    img.onerror = () => {
      resolve({
        frames: [
          {
            name: 'Frame 1',
            layers: [{ name: 'Layer 1', data: imageSrc }],
            activeLayer: 0
          }
        ],
        width: tileWidth || 32,
        height: tileHeight || 32
      });
    };

    img.src = imageSrc;
  });
}

/**
 * Creates or updates an ImageFile and corresponding SpriteFile in the Mason project
 * with linked export settings and frame configuration.
 */
export async function createOrLinkImageAndSpriteProject(
  project: MasonProject,
  opts: {
    name: string;
    imageSrc: string;
    cols?: number;
    rows?: number;
    tileWidth?: number;
    tileHeight?: number;
    sourceSpriteFileName?: string;
    exportSettings?: SpriteExportMetadata;
  }
): Promise<{
  updatedProject: MasonProject;
  spriteFile: SpriteFile;
  imageFile: ImageFile;
}> {
  const cleanBase = opts.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'asset';
  const pngFileName = `${cleanBase}.png`;
  const spriteFileName = `${cleanBase}.sprite`;

  const cols = opts.cols || 1;
  const rows = opts.rows || 1;
  const tw = opts.tileWidth || 32;
  const th = opts.tileHeight || 32;

  // 1. Slice image into frames if imageSrc is present
  const sliced = await sliceSpritesheetToFrames(opts.imageSrc, cols, rows, tw, th);

  const exportMetadata: SpriteExportMetadata = {
    exportMode: cols > 1 || rows > 1 ? 'spritesheet' : 'flattened',
    targetFileName: pngFileName,
    cols,
    rows,
    tileWidth: sliced.width,
    tileHeight: sliced.height,
    frameCount: sliced.frames.length,
    description: `Export settings for ${opts.name}`,
    updatedAt: new Date().toISOString(),
    ...opts.exportSettings
  };

  const spriteData = {
    version: 1,
    width: sliced.width,
    height: sliced.height,
    layers: sliced.frames[0]?.layers || [{ name: 'Layer 1', data: '' }],
    frames: sliced.frames,
    currentFrameIndex: 0,
    exportSettings: exportMetadata
  };

  // 2. Build or update ImageFile
  const currentImages = project.fileSystem.images || [];
  const existingImgIdx = currentImages.findIndex(i => i.fileName === pngFileName);
  
  const imageFile: ImageFile = {
    id: existingImgIdx !== -1 ? currentImages[existingImgIdx].id : `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: opts.name,
    fileName: pngFileName,
    createdAt: existingImgIdx !== -1 ? currentImages[existingImgIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataUrl: opts.imageSrc,
    width: sliced.width * cols,
    height: sliced.height * rows,
    sourceSpriteFileName: spriteFileName,
    exportSettings: exportMetadata
  };

  const updatedImages = [...currentImages];
  if (existingImgIdx !== -1) {
    updatedImages[existingImgIdx] = imageFile;
  } else {
    updatedImages.push(imageFile);
  }

  // 3. Build or update SpriteFile
  const currentSprites = project.fileSystem.sprites || [];
  const existingSpriteIdx = currentSprites.findIndex(s => s.fileName === spriteFileName);

  const spriteFile: SpriteFile = {
    id: existingSpriteIdx !== -1 ? currentSprites[existingSpriteIdx].id : `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: opts.name,
    fileName: spriteFileName,
    createdAt: existingSpriteIdx !== -1 ? currentSprites[existingSpriteIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spriteData,
    imageUrl: opts.imageSrc,
    dataUrl: opts.imageSrc,
    width: sliced.width,
    height: sliced.height,
    exportSettings: exportMetadata,
    linkedImageFileNames: [pngFileName]
  };

  const updatedSprites = [...currentSprites];
  if (existingSpriteIdx !== -1) {
    updatedSprites[existingSpriteIdx] = spriteFile;
  } else {
    updatedSprites.push(spriteFile);
  }

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      spriteFileName
    },
    fileSystem: {
      ...project.fileSystem,
      images: updatedImages,
      sprites: updatedSprites
    }
  };

  saveActiveMasonProject(updatedProject, `Imported/Created Sprite & Image: ${opts.name}`);

  return {
    updatedProject,
    spriteFile,
    imageFile
  };
}

/**
 * Bi-directionally repairs and synchronizes broken or missing links between
 * ImageFiles in /images/ and SpriteFiles in /sprites/.
 */
export function sanitizeAndRepairProjectImageLinks(project: MasonProject): {
  updatedProject: MasonProject;
  repairedCount: number;
} {
  const images = [...(project.fileSystem.images || [])];
  const sprites = [...(project.fileSystem.sprites || [])];
  let repairedCount = 0;

  // 1. Repair images pointing to invalid or missing sprite files
  const spriteFileMap = new Map(sprites.map(s => [s.fileName, s]));

  const updatedImages = images.map(img => {
    let sourceSprite = img.sourceSpriteFileName ? spriteFileMap.get(img.sourceSpriteFileName) : null;

    // Fallback match: if sourceSpriteFileName is missing or invalid, check by base filename
    if (!sourceSprite) {
      const imgBase = img.fileName.replace(/\.(png|gif|jpeg|jpg)$/i, '').replace(/_(spritesheet|height|roughness|color)$/i, '');
      const matchedSprite = sprites.find(s => {
        const sBase = s.fileName.replace(/\.sprite$/i, '');
        return sBase === imgBase || s.linkedImageFileNames?.includes(img.fileName);
      });

      if (matchedSprite) {
        repairedCount++;
        sourceSprite = matchedSprite;
        return {
          ...img,
          sourceSpriteFileName: matchedSprite.fileName
        };
      }
    }
    return img;
  });

  // 2. Ensure each SpriteFile's linkedImageFileNames array includes all images referencing it
  const updatedSprites = sprites.map(sprite => {
    const existingLinks = new Set(sprite.linkedImageFileNames || []);
    let changed = false;

    // Add all images whose sourceSpriteFileName points to this sprite
    updatedImages.forEach(img => {
      if (img.sourceSpriteFileName === sprite.fileName && !existingLinks.has(img.fileName)) {
        existingLinks.add(img.fileName);
        changed = true;
      }
    });

    if (changed) {
      repairedCount++;
      return {
        ...sprite,
        linkedImageFileNames: Array.from(existingLinks)
      };
    }
    return sprite;
  });

  const updatedProject: MasonProject = {
    ...project,
    fileSystem: {
      ...project.fileSystem,
      images: updatedImages,
      sprites: updatedSprites
    }
  };

  return { updatedProject, repairedCount };
}

/**
 * Manually relinks or unlinks an ImageFile to/from a target SpriteFile.
 */
export function relinkImageToSprite(
  project: MasonProject,
  imageFileName: string,
  targetSpriteFileName: string | null
): MasonProject {
  const currentImages = project.fileSystem.images || [];
  const currentSprites = project.fileSystem.sprites || [];

  const updatedImages = currentImages.map(img => {
    if (img.fileName === imageFileName) {
      return {
        ...img,
        sourceSpriteFileName: targetSpriteFileName || undefined,
        updatedAt: new Date().toISOString()
      };
    }
    return img;
  });

  const updatedSprites = currentSprites.map(sprite => {
    const currentLinks = (sprite.linkedImageFileNames || []).filter(fn => fn !== imageFileName);
    if (targetSpriteFileName && sprite.fileName === targetSpriteFileName) {
      currentLinks.push(imageFileName);
    }
    return {
      ...sprite,
      linkedImageFileNames: Array.from(new Set(currentLinks)),
      updatedAt: new Date().toISOString()
    };
  });

  const updatedProject: MasonProject = {
    ...project,
    fileSystem: {
      ...project.fileSystem,
      images: updatedImages,
      sprites: updatedSprites
    }
  };

  saveActiveMasonProject(updatedProject, `Relinked image "${imageFileName}"`);
  return updatedProject;
}

