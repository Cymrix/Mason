/**
 * Mason Core Version Configuration
 * Current Release: v0.89
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version as direct sequential integers without sub-numbers (e.g., v0.74 -> v0.75 -> v0.76 -> v0.77 -> v0.78 -> v0.79 -> v0.80 -> v0.81 -> v0.82 -> v0.83 -> v0.84 -> v0.85 -> v0.86 -> v0.87 -> v0.88 -> v0.89).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.89';
export const MASON_VERSION_DISPLAY = 'v0.89';
export const MASON_FULL_VERSION = 'v0.89';

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
    version: 'v0.89',
    date: '2026-08-22',
    changes: [
      'Synchronized Dashboard Card Theming: Wired all project dashboard cards, banners, quick actions, and subfolder stat blocks to dynamic theme surface colors (bgDef.cardHex & bgDef.borderHex), ensuring the dashboard cards update in real-time to match the live theme preview.',
      'Synchronized Launcher Cards: Updated Mason welcome and project launcher cards to dynamically react to the active theme background and surface tones.'
    ]
  },
  {
    version: 'v0.88',
    date: '2026-08-22',
    changes: [
      'Accurate Live Theme Workspace Preview: Updated the interactive live preview in the Theme Modal to render full miniature app chrome with true canvas background coloring, ensuring live theme changes match the actual application workspace.',
      'Refined Background Palette UI: Removed redundant quick-swatch strip, option counter label, and top-right color preview for a cleaner, unified custom theme mixer.'
    ]
  },
  {
    version: 'v0.87',
    date: '2026-08-22',
    changes: [
      'Dynamic App Background Theming: Fixed application background color persistence by wiring root layouts, canvas backdrops, and dashboard containers directly to dynamic theme CSS variables and bgDef colors.',
      'Expanded Background Tones (12 Total Options): Added a comprehensive suite of rich ambient dark tones including Volcanic Obsidian, Verdant Deepwood, Occult Amethyst, Blood Abyss, Mariana Trench, Industrial Zinc, and Antique Bronze.',
      'Background Color Swatch Selector: Redesigned the Custom Theme background palette picker into a compact responsive swatch grid and quick-swatch strip with active checkmarks and hex labels matching the accent color UI.',
      'Instant Pre-mount Background Initialization: Injected lightweight pre-render background tone sync script into HTML document head to eliminate contrast flashing during initial app boot.'
    ]
  },
  {
    version: 'v0.86',
    date: '2026-08-21',
    changes: [
      'PWA & Window Title Bar Dynamic Accent Coloring: Connected the OS window title bar (<meta name="theme-color">, msapplication-navbutton-color, and Apple status bar) to immediately and reactively paint with the active theme primary color.',
      'Instant Startup Synchronization: Inlined theme loader in main.tsx before DOM render to ensure installed PWA window chrome launches without color flash or lag.',
      'In-App Header Glow: Synchronized top navigation bar backdrop tint and borders with active theme CSS variables.'
    ]
  },
  {
    version: 'v0.85',
    date: '2026-08-21',
    changes: [
      'Agent Instructions & Workflow: Added agents.md instruction protocol enforcing mandatory version increments on every iteration.',
      'Brand Icon Geometry Fix: Corrected vector orientation for pixel-art masonry blueprint emblem across in-app headers, favicons, and PWA manifests.',
      'Subpath & GitHub Pages Immunity: Migrated navbar and menu emblems to standalone inline SVG components for flawless rendering across all host configurations.'
    ]
  },
  {
    version: 'v0.84',
    date: '2026-08-20',
    changes: [
      'Visual World Map Graph Canvas: Implemented an interactive visual node graph for the World Map module with draggable level cards, multi-wire bezier curved paths, zoom/pan controls, and interactive connection badges.',
      'Unlimited Map Transitions & Link Modal: Enabled multiple links per level pair with custom transition types (Doorways, Portals, Elevators, Zones, Teleporters, Seamless Boundaries) and progression flag locks.',
      'Flora & Environmental Details Builder: Added full add/remove and configuration controls for flora, foliage, boulders, and crystals with custom dimensions, scatter density, and destructibility.',
      'Interactive Props & Resizable Zones: Added resizable zone prop types (up to 32×32 tiles), interaction trigger events (overlap, touch, key press), and fast-travel world graph transport behaviors.',
      'In-Game Pause Menu Checkbox & Input Mappings Overhaul: Added mutually exclusive In-Game Pause Menu selection, text-editable binding names & categories, interaction behaviors, and direct UI opening bindings.'
    ]
  },
  {
    version: 'v0.83',
    date: '2026-08-20',
    changes: [
      'Start / Initial Landing Screen Checkbox & Mutual Exclusivity: Fixed issue where the initial landing screen checkbox persisted or checked multiple menus simultaneously.',
      'Unchecked by Default: Configured new and default menus to have the Start Screen box unchecked by default until explicitly selected.',
      'Strict Radio Invariant: Enforced strict mutual exclusivity across all menu screens so only one screen can be designated as the landing screen at a time.',
      'Persistence Fix: Fixed state updater so unchecking a landing screen cleanly clears initialMenuId and isInitialScreen without resurrecting on tab or screen switches.'
    ]
  },
  {
    version: 'v0.82',
    date: '2026-08-20',
    changes: [
      'UI Screen Designer Overhaul: Transformed the UI module into a customizable multi-screen designer supporting unlimited screens/menus (Start Menu, Pause Menu, Options, Inventory, Dialogue, Game Over).',
      'Drag-and-Drop & Resizing: Added freeform visual positioning and live resizing handles for UI widgets with configurable grid snapping (Off, 4px, 8px, 16px, 32px) and multi-resolution viewports (16:9, 4:3, Mobile).',
      'Button Linking & Pause Engine States: Implemented interactive button navigation targets (navigate_menu, close_menu, start_game, resume_game) with configurable engine pause/unpause execution.',
      'Interactive Test Mode: Enabled real-time interactive simulation of menus, navigation stacks, input fields, and sliders with live engine pause indicators.'
    ]
  },
  {
    version: 'v0.81',
    date: '2026-08-18',
    changes: [
      'Capsule Collider Keyframing: Enabled full per-frame capsule collider keyframing (Radius, Height, Offset X/Y) in Animation Studio with timeline indicators and interactive canvas handles.',
      'Spritesheet Uploads & Visualizer: Added image upload support (Data URLs), auto-calculating grid columns/rows from image dimensions, preset sprite sheets, and an interactive full-sheet tile grid viewer with frame inspect.',
      'Custom Variable Categories: Transformed Variable Category selection into a flexible free-text input with category suggestions, allowing bespoke category names.',
      'FSM Node Dragging Fix: Re-architected state graph node dragging using global window pointer listeners and delta calculations to eliminate stuck/hung drag states.',
      'Behavior Rule Authoring: Hardened updateCharacter state saving to guarantee new behavior rules and triggers persist immediately when added.'
    ]
  },
  {
    version: 'v0.80',
    date: '2026-08-18',
    changes: [
      'Single Consolidated Header: Integrated entity display names, avatars, and type badges directly into the center of the subfolder file header across all modules.',
      'Removed Redundant Metadata Bar: Eliminated the secondary metadata bar and redundant variable/state/rule counter text (already clearly represented on the sticky tabs).',
      'Action Integration: Moved the "Copy Rules/Vars" button and custom module tools directly into the top file header right-side action slot.',
      'Reclaimed Vertical Canvas Space: Modules now feature only one compact 36px (h-9) top navigation/file bar followed immediately by the sticky workspace tabs.'
    ]
  },
  {
    version: 'v0.79',
    date: '2026-08-18',
    changes: [
      'UI Streamlining: Restored full-featured top navbar font sizes and re-added the quick Modules icon dropdown (🧩) in the main top header.',
      'Removed Redundant Navigation: Removed intermediate dashboard module tabs bar (dashboard cards handle navigation) and consolidated duplicate buttons.',
      'Maximizing Vertical Space: Removed redundant sub-header bar, standalone app switch, and duplicate switch module button in ModuleRunnerContainer.',
      'Sticky Module Tabs: Made primary workspace tabs in Character Creator (Animation Studio, Spritesheets, Variables, States, Behaviors) and Biome Editor sticky so they never scroll away.',
      'Header Consolidation: Combined Project Info/Dashboard navigation and file operations into a single sleek h-9 bar, aligning Copy Rules/Vars alongside the character metadata.'
    ]
  },
  {
    version: 'v0.78',
    date: '2026-08-18',
    changes: [
      'App Layout: Added persistent, always-visible Module Tabs Bar (Dashboard, Maps, Biomes, Characters, UI HUD, World Graph) for instant 1-click navigation.',
      'Vertical Space Optimization: Condensed headers, file subfolder breadcrumb bars (h-9), and workspace tabs across all modules with compact pill styles and tooltips.',
      'Character FSM Engine: Fixed Add State and Add Transition modals, enabling instant visual creation and configuration of state nodes and transition triggers.'
    ]
  },
  {
    version: 'v0.77',
    date: '2026-08-18',
    changes: [
      'Animation Studio: Made animation playback paused by default on initial view.',
      'Frame-by-Frame Stepping: Added dedicated Previous Frame (<), Next Frame (>), First Frame (|<<), and Last Frame (>>|) controls.',
      'Interactive Frame Scrubber: Added a visual frame timeline strip displaying clip cells with keyframe indicators.',
      'Keyframe Positioning Engine: Added ability to snapshot and clear per-frame socket/point and hitbox polygon positions (with copy from previous frame support).',
      'Animation Clip Config: Added sidebar clip editor for Start Frame, End Frame, Spritesheet slot, FPS, and Loop parameters.'
    ]
  },
  {
    version: 'v0.76',
    date: '2026-08-18',
    changes: [
      'Character Module: Added group & individual visibility toggles for Sprite, Capsule, Sockets, and Hitboxes in the 2D Viewport and Sidebar.',
      'FSM States: Implemented smooth mouse wheel zoom and right-click / middle-click panning on the Finite State Machine graph canvas.',
      'Behaviors: Added a secondary state dropdown when "State Active / Event" trigger condition is chosen (supporting While In State, On State Enter, On State Exit, and On Transition Fired).',
      'Behaviors: Minimized behavior rule cards by default with summary badges and added global "Expand All" / "Collapse All" controls.'
    ]
  },
  {
    version: 'v0.75',
    date: '2026-08-18',
    changes: [
      'Dashboard: Centered the module grid layout for better focus on desktop.',
      'Behaviors: Added a "Variables" tab to allow Behavior scripts to dictate custom RPG stats, attributes, and proficiencies to linked Characters (with static/open enforcement).',
      'Characters: Refactored the RPG Stats tab to dynamically render variables exposed by the linked Behavior script.',
      'Behaviors: Added an animation selector dropdown to the "Play Animation State" action node, which aggregates available animations from assigned characters.'
    ]
  },
  {
    version: 'v0.74',
    date: '2026-08-18',
    changes: [
      'Engine: Completely decoupled and removed Archetypes from the architecture, merging stats and functionality directly into the Character Editor.',
      'Dashboard & Modals: Removed the Archetypes module card from the dashboard and pruned Archetypes from the subfolder system.'
    ]
  },
  {
    version: 'v0.73',
    date: '2026-08-17',
    changes: [
      'Top Bar: Converted Modules button into an icon-only button and transformed the quick dropdown into a minimalist icon-only grid for pro/expert workflow.',
      'Dashboard: Removed the redundant lower modules list so the top subfolder info cards serve as the direct launchpad and status center.',
      'Architecture: Streamlined module registry to 7 standalone modules, integrating macro tools directly into the Maps module.'
    ]
  },
  {
    version: 'v0.72',
    date: '2026-08-17',
    changes: [
      'Dashboard: Simplified module cards by removing descriptions and making every card fully clickable for instant launching without separate buttons.',
      'Top Bar: Converted the Modules button into a clean icon-grid dropdown popover for rapid 1-click module navigation.',
      'Modules Directory: Removed tabs and categories to show all modules directly in a clean, uncluttered grid.'
    ]
  },
  {
    version: 'v0.71',
    date: '2026-08-17',
    changes: [
      'Character Module: Resolved viewport stretching regression by dynamically syncing internal canvas buffer dimensions with container width/height instead of fixed aspect ratio scaling.',
      'Character Module: Fixed point & polygon snap-back on drag release by guaranteeing character file insertion in project filesystem and updating both active keyframe and base character anchors upon mouse release.'
    ]
  },
  {
    version: 'v0.70',
    date: '2026-08-17',
    changes: [
      'Character Module: Fixed silent failure where new keyframes were not saved if the base animation object had not yet been formally initialized in the character\'s data array.'
    ]
  },
  {
    version: 'v0.69',
    date: '2026-08-17',
    changes: [
      'Character Module: Bulletproofed global project state updates with deep cloning to prevent React from dropping mouseup commits.',
      'Character Module: Consolidated overlapping canvas and global mouseup event handlers to prevent race conditions during drag release.'
    ]
  },
  {
    version: 'v0.68',
    date: '2026-08-17',
    changes: [
      'Character Module: Re-architected canvas point/polygon dragging to use local component state (dragOverride) instead of dispatching global project updates on every mouse move, completely eliminating the 60fps rendering bottleneck/hang.',
      'Character Module: Restricted canvas panning exclusively to Right-Click (button 2) as requested.'
    ]
  },
  {
    version: 'v0.67',
    date: '2026-08-17',
    changes: [
      'Behavior Module: Bulletproofed IFTTT Rule state updates to ensure React re-renders correctly when adding/editing triggers and actions.'
    ]
  },
  {
    version: 'v0.66',
    date: '2026-08-17',
    changes: [
      'Confirmed version bumping rule and synced version to v0.66'
    ]
  },
  {
    version: 'v0.65',
    date: '2026-08-17',
    changes: [
      'Character Module: Fixed item dragging in viewport by resolving a stale closure on the live keyframe updater',
      'All Modules: Standardized panning controls to allow Right Click across all editor canvases'
    ]
  },
  {
    version: 'v0.64',
    date: '2026-08-17',
    changes: [
      'Character Module: Fixed canvas viewport mouse coordinate scaling factor to account for CSS resolution vs buffer size',
      'Character Module: Expanded point and polygon vertex hit detection targets (16px and 14px canvas radii)',
      'Character Module: Added point-in-polygon body click selection so clicking anywhere inside a hitbox selects it',
      'Character Module: Auto-pause animation playback during dragging to prevent keyframes from ticking',
      'Character Module: Fixed viewport wheel zoom event listener with non-passive preventDefault to prevent outer page scrolling',
      'Character Module: Enforced crisp handle sizing on screen regardless of zoom level'
    ]
  },
  {
    version: 'v0.63',
    date: '2026-08-17',
    changes: [
      'UI Module: Implemented interactive Press Key / Press Button modal recorder for live keyboard shortcut and gamepad combo capture',
      'UI Module: Added Reset/Clear input button and individual tag removal badges for keybindings',
      'Behavior Module: Fixed rule state persistence so AND/OR logic switches, trigger condition editing, and action controls update seamlessly',
      'Behavior Module: Enabled multi-trigger conditions and full form controls across all 12 trigger types and 6 action types'
    ]
  },
  {
    version: 'v0.62',
    date: '2026-08-16',
    changes: [
      'Introduced dedicated Behaviors & AI module (.behavior format) for authoring camera target foci, kinematic movement controllers, and finite-state machine enemy AI',
      'Integrated real-time motion vector & vision cone simulator into Behavior Studio',
      'Added 1-click behavior assignment matrix to link drivers to hero archetypes, enemy mobs, boss archons, and sentry turrets',
      'Added attached behavior selector card to Archetype Editor and updated Project Explorer and Dashboard with .behavior subfolder management'
    ]
  },
  {
    version: 'v0.61',
    date: '2026-08-16',
    changes: [
      'Set project versioning standard to whole numbers starting at v0.61 (v0.61 -> v0.62 -> v0.63)',
      'Added Add Layer modal dialog and Delete Layer buttons for custom background/foreground parallax depth layers with Main Layer safeguard',
      'Implemented Stamp Chunk and Fill Map tools for active biome assignment across map chunks',
      'Added canvas HUD grid toggle button and shortcut (G) for showing/hiding tile grid lines and chunk boundaries'
    ]
  },
  {
    version: 'v0.53.9',
    date: '2026-08-16',
    changes: [
      'Added Light Dashed Tile Outline Cursor preview for Tilemap Studio showing exact brush size (1x1 up to NxN) and chunk regions with translucent fill and floating dimension pill badges',
      'Distinguished Biome Open Air (allocated chunk cells with atmosphere fog tint) from Unallocated Void (no tile/chunk painted, displaying pure void space with no background)'
    ]
  },
  {
    version: 'v0.53.8',
    date: '2026-08-16',
    changes: [
      'Tilemap Studio Biome Backgrounds now dynamically load based on the centermost tile of the camera position (hiding backgrounds when pointing at empty void space without a biome)',
      'Upgraded Tilemap Studio painting interpolation to Super-Cover Orthogonal Line algorithm with window-level continuous pointer drag tracking to eliminate diagonal gaps and missed mouse ticks'
    ]
  },
  {
    version: 'v0.53.7',
    date: '2026-08-16',
    changes: [
      'Massive Tilemap Studio Painting Performance Overhaul: implemented viewport frustum culling to skip off-screen chunks',
      'Consolidated 4 separate full-world cell loops into a single frustum-culled detail pass per frame',
      'Implemented copy-on-write selective chunk cloning during mouse drag painting to eliminate garbage collection pauses'
    ]
  },
  {
    version: 'v0.53.6',
    date: '2026-08-16',
    changes: [
      'Updated Tilemap Studio "Fit" button to calculate exact bounding box of all chunks (including negative or offset chunk coordinates) and center all chunks perfectly in viewport'
    ]
  },
  {
    version: 'v0.53.5',
    date: '2026-08-16',
    changes: [
      'Fixed Add Chunk tool to enable empty chunks (open air) without pre-painting any terrain tiles',
      'Fixed Delete Chunk tool to cleanly delete chunks and purge all associated tile data'
    ]
  },
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
