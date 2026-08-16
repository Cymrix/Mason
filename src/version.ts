/**
 * Mason Core Version Configuration
 * Current Release: v0.53.4
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.30 -> v0.31 -> v0.32 -> v0.33 -> v0.34 -> v0.35 -> v0.36 -> v0.37 -> v0.38 -> v0.40 -> v0.41 -> v0.42 -> v0.43).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.53.4';
export const MASON_VERSION_DISPLAY = 'v0.53.4';
export const MASON_FULL_VERSION = 'v0.53.4';

export interface ProjectChangeRecord {
  timestamp: string;
  action: string;
  revision: number;
}

/**
 * Returns formatted version string with optional revision or build tag
 */
export const getMasonVersionString = (revision?: number): string => {
  if (revision !== undefined && revision > 0) {
    return `${MASON_VERSION_DISPLAY}-rev${revision}`;
  }
  return MASON_FULL_VERSION;
};

/**
 * Release History Log
 */
export const MASON_RELEASE_HISTORY = [
  {
    version: 'v0.53.4',
    date: '2026-08-16',
    changes: [
      'Simplified Tilemap Studio biome selector dropdown to show clean biome names without parenthetical filenames',
      'Removed submode status text to the right of Lit/Unlit Mode toggle'
    ]
  },
  {
    version: 'v0.53.3',
    date: '2026-08-16',
    changes: [
      'Updated dashboard card label for .ui files to "UI & HUD"'
    ]
  },
  {
    version: 'v0.53.2',
    date: '2026-08-16',
    changes: [
      'Cleaned up dashboard file category card titles (Maps, Biomes, Archetypes, UI Themes, Game Structure)'
    ]
  },
  {
    version: 'v0.53.1',
    date: '2026-08-16',
    changes: [
      'Fixed ReferenceError: deleteConfirmBiomeId is not defined in RefinedBiomeEditor',
      'Added id and name definitions to RefinedMapData TypeScript interface'
    ]
  },
  {
    version: 'v0.53',
    date: '2026-08-16',
    changes: [
      'Removed fixed 2×2 chunk dimension ceiling in ChunkCacheManager, enabling full rendering across all infinite/arbitrary chunk coordinates in chunked maps',
      'Fixed issue where painting outside the first 4 chunks failed to composite baked tile textures'
    ]
  },
  {
    version: 'v0.52',
    date: '2026-08-16',
    changes: [
      'Implemented Map-ID scoped isolation in ChunkCacheManager to prevent cross-map offscreen canvas cache bleed',
      'Fixed empty chunk painting bug where newly created maps displayed cached tile data from previous maps',
      'Added deep chunk array cloning during map tile edits and map cache invalidation on level creation'
    ]
  },
  {
    version: 'v0.51',
    date: '2026-08-16',
    changes: [
      'Replaced browser window.confirm() dialogs with interactive inline confirmation badges to fix deletion inside sandboxed iframes',
      'Fixed map, biome, and asset file deletion across FileSubfolderHeader and Biome Editor',
      'Added fallback creation when deleting the last remaining map so the studio state remains consistent'
    ]
  },
  {
    version: 'v0.50',
    date: '2026-08-16',
    changes: [
      'Implemented IndexedDB persistence layer to eliminate localStorage 5MB quota errors for large maps and chunked projects',
      'Purged obsolete all-project JSON stores that caused quota overflow',
      'Added asynchronous IndexedDB project resolution and memory-cached multi-tier storage'
    ]
  },
  {
    version: 'v0.49',
    date: '2026-08-16',
    changes: [
      'Isolated Zoom HUD and Info Bar pointer events to prevent unintentional tile interactions on the map',
      'Added strict target verification and event bubbling prevention on floating toolbars and status overlays'
    ]
  },
  {
    version: 'v0.48',
    date: '2026-08-16',
    changes: [
      'Added Bresenham stroke interpolation for seamless, buttery smooth tilemap brush and eraser painting',
      'Implemented dedicated "Fit" button in Tilemap Studio HUD to automatically fit and center maps of any size',
      'Added stroke interpolation to Macro Biome Map painter and Autotile Live Sandbox',
      'Optimized batch stroke updates across chunks and cell matrices'
    ]
  },
  {
    version: 'v0.47',
    date: '2026-08-16',
    changes: [
      'Resolved uncaught TypeError when interacting with chunked and blank maps by supporting both chunks and legacy cells in EditorLayout',
      'Synchronized MapFile schema to support chunks, data envelope, and cell arrays seamlessly',
      'Prevented undefined coordinate indexing during map canvas brush strokes and entity painting'
    ]
  },
  {
    version: 'v0.46',
    date: '2026-08-16',
    changes: [
      'Hardened BlobTilesetPreview island and platform preset generators against out-of-bounds column access',
      'Added array and null guards to all 4 chunk rendering layers in RefinedMapCanvas',
      'Safeguarded subtab count badges and tile type selections in RefinedBiomeEditor and ParallaxLayersEditor'
    ]
  },
  {
    version: 'v0.45',
    date: '2026-08-16',
    changes: [
      'Comprehensive array safety audit across BlobTilesetPreview, mapChunkHelper, and paint tool pipelines',
      'Protected 2D grid neighbor lookups in sandbox live preview and flood-fill bucket solvers against undefined coordinates'
    ]
  },
  {
    version: 'v0.44',
    date: '2026-08-16',
    changes: [
      'Hardened 2D array grid bounds checks preventing undefined coordinate crashes during map generation and painting',
      'Added optional chaining across EditorLayout, RefinedMapEditor, MapCanvas, and BiomeMacroMapModal',
      'Resolved TypeError out-of-bounds coordinate indexing for brush strokes and procedural fills'
    ]
  },
  {
    version: 'v0.43',
    date: '2026-08-16',
    changes: [
      'Added visual chunk outlines bound to a new showGrid UI toggle button',
      'Moved canvas HUD overlay to top-right to prevent clipping with main editor layout status bar',
      'Updated default map file generation to produce pristine blank slates completely devoid of pre-rendered level chunks',
      'Implemented dynamic cursor-centered parallax backdrop rendering that fades out into black void when pointing at non-biome empty space',
      'Fixed brush tool collision to automatically allocate new data chunks if painting on a missing grid coordinate'
    ]
  },
  {
    version: 'v0.42',
    date: '2026-08-16',
    changes: [
      'Fixed cursor-centered zooming math by eliminating React 18 automatic batching race conditions during native high-frequency wheel events',
      'Migrated useCanvasPanZoom state to immediate synchronous Refs to guarantee mathematically perfect matrix panning on every tick'
    ]
  },
    {
    version: 'v0.41',
    date: '2026-08-16',
    changes: [
      'Fixed infinite canvas viewport scaling by migrating off logical map bounds directly to window resizing with ResizeObserver',
      'Implemented full Screen-to-World camera transform pipeline with ctx.scale and ctx.translate to resolve zoom misalignment',
      'Fixed parallax and foreground layers so they stretch to the screen bounds rather than the cached data chunk bounds'
    ]
  },
  {
    version: 'v0.40',
    date: '2026-08-16',
    changes: [
      'Migrated 2D map rendering from standard array to dynamic 16x16 chunk engine to allow infinite canvas and fast repainting',
      'Added Add Chunk and Delete Chunk tools to let creators forcefully manage chunk allocations and map sizes',
      'Updated lit mode global darkness overlay bounds and bound background painting to world tile limits'
    ]
  },
  {
    version: 'v0.39',
    date: '2026-08-16',
    changes: [
      'Fixed panning collision issues where Middle-click and Spacebar-drag inputs incorrectly triggered map tile painting',
      'Decoupled canvas drawing event listeners to only listen for Left-Click actions'
    ]
  },
  {
    version: 'v0.38',
    date: '2026-08-16',
    changes: [
      'Separated slope overlays into dedicated Top Slope (Floor Ramps ◢ / ◣) and Bottom Slope (Ceilings ◥ / ◤)',
      'Converted slope rendering to pure horizontal mirroring (flipH) without rotation, keeping slope trims upright',
      'Added dedicated Inner Corner for Slopes in addition to standard Inner Corner for solid Blocks',
      'Preserved overlay Z-order hierarchy (Right Side -> Left Side -> Inner Corners -> Slopes -> Bottom -> Top)',
      'Updated Biome Studio Overlay panel with clear helper sublabels and thumbnail controls for top/bottom slopes and inner corners'
    ]
  },
  {
    version: 'v0.37',
    date: '2026-08-16',
    changes: [
      'Implemented 16px-grid spritesheet multi-frame overlays with deterministic spatial random frame picking',
      'Configured custom overlay Z-order hierarchy (Right -> Left -> Inner Corner -> Slope -> Bottom -> Top)',
      'Added automatic rotation transforms (-90°, 90°, 180°) for slope trims from a single 45° Up-Right source image',
      'Removed all vector/color fallback artifacts when overlay images are not provided',
      'Streamlined project dashboard header badge to cleanly display version tag without redundant name prefix',
      'Updated standalone PWA title and manifest metadata to strictly display "Mason"'
    ]
  },
  {
    version: 'v0.36',
    date: '2026-08-16',
    changes: [
      'Regenerated 100% compliant, pristine PNG icons (192x192, 512x512, 512x512 maskable) fixing corrupted IHDR bytes',
      'Updated web manifest with PWA id, display_override, prefer_related_applications, and wide desktop screenshot',
      'Updated index.html with explicit 192px/512px PNG and SVG favicon & apple-touch-icon links',
      'Updated Service Worker cache (v0.36) to precache all high-res PWA PNG icons and screenshots for offline installability'
    ]
  },
  {
    version: 'v0.35',
    date: '2026-08-16',
    changes: [
      'Added Full Albedo Texture preview tab to the left of 47-Blob Matrix in Biome Studio preview workspace',
      'Implemented pure seamless blended albedo canvas (Base Material A ↔ Base Material B dual-noise projection)',
      'Added interactive cursor-centered wheel zoom, right-click panning, reset HUD, and grid border toggle support',
      'Added Export Albedo PNG download feature for standalone map exports'
    ]
  },
  {
    version: 'v0.34',
    date: '2026-08-16',
    changes: [
      'Relocated Dual Overlapping Noise Blend Map controls directly to the left side of the Blob Tileset Preview section',
      'Created side-by-side side panel layout enabling instant real-time visualization of noise scale, weight, seed, contrast, and threshold adjustments on the preview canvas'
    ]
  },
  {
    version: 'v0.33',
    date: '2026-08-16',
    changes: [
      'Fixed albedo noise map range normalization (stretching raw noise from [0.25, 0.75] to full [0.0, 1.0] range)',
      'Ensured Base Material B reaches 100% solid opacity at contrast 1.0 without requiring extreme contrast boosts',
      'Fixed noise mask inversion (Base A <-> Base B swap) to produce immediate 100% pattern reversals',
      'Added Layer 1 and Layer 2 Weight Influence sliders to Biome Studio noise blend controls'
    ]
  },
  {
    version: 'v0.32',
    date: '2026-08-16',
    changes: [
      'Expanded noise scale sliders to 4px - 512px, enabling noise features up to full albedo texture sizes',
      'Added seed controls and randomize buttons for Noise Layer 1 and Noise Layer 2',
      'Increased blend contrast range up to 10.0 with C2 quintic noise smoothstep, enabling sharp patches of Material B at 100% full opacity'
    ]
  },
  {
    version: 'v0.31',
    date: '2026-08-16',
    changes: [
      'Fixed mouse wheel cursor-centered zoom in Biome Studio blob matrix and live sandbox preview',
      'Hardcoded tile size to 64px and removed tile scale UI selectors from Biome preview',
      'Fixed Base Material B albedo texture wrapping to support 100% full opacity blending'
    ]
  },
  {
    version: 'v0.30',
    date: '2026-08-16',
    changes: [
      'Updated autotile edge overlay render order in Biome Studio: sides -> bottom -> top',
      'Configured heightmap and roughness textures to use world-aligned seamless repeating matching albedo texture scale'
    ]
  },
  {
    version: 'v0.29',
    date: '2026-08-16',
    changes: [
      'Removed "MENU" text label from the main hamburger trigger button',
      'Automatically hide PWA install buttons once the application is running in installed mode'
    ]
  }
];
