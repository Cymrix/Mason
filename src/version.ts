/**
 * Mason Core Version Configuration
 * Current Release: v1.00
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version as direct sequential integers without sub-numbers.
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.299';
export const MASON_VERSION_DISPLAY = 'v0.299';
export const MASON_FULL_VERSION = 'v0.299';

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
}

/**
 * Release History Log
 */
export const MASON_RELEASE_HISTORY = [
  {
    version: 'v0.299',
    date: '2026-09-04',
    notes: 'Fixed simulated biome wind in particle viewport: enabled responsive toolbar visibility across all screen sizes, implemented synchronous mutable ref synchronization for the 60fps render loop, and properly scaled aerodynamic global wind force integration across all active particles.'
  },
  {
    version: 'v0.298',
    date: '2026-09-04',
    notes: 'Enabled interactive grab/grabbing hand cursor states and visual targeting glow when hovering over or dragging the canvas emitter handle, and fully decoupled sub-particle sizes from parent particle size so increasing primary particle size does not scale sub-particles.'
  },
  {
    version: 'v0.297',
    date: '2026-09-04',
    notes: 'Decoupled sub-particles from primary emitter max particle budget so secondary bursts do not choke primary emission, and streamlined sub-particle burst quantity to accurately match referenced emitter rate/burstCount.'
  },
  {
    version: 'v0.296',
    date: '2026-09-04',
    notes: 'Fixed runtime error where count variable was undefined in fallback sub-particle generation branch within ParticleEngine.'
  },
  {
    version: 'v0.295',
    date: '2026-09-04',
    notes: 'Streamlined Sub-Particle Emitter configuration to strictly 3 clean controls: Referenced Particle System (curated presets, project particle systems, built-in systems with live visual preview and direct edit link), Trigger Events (On Impact, On Death, Both Events), and Trigger Probability (0-100%). Eliminated redundant manual property overrides to automatically inherit intrinsic parameters from the referenced system.'
  },
  {
    version: 'v0.294',
    date: '2026-09-04',
    notes: 'Architected referenced sub-emitter system and extended sub-particle controls: sub-particle spawning now references existing presets or project particle systems with live preview and deep links; added radial position jitter slider, start alpha random range sliders, and end alpha random range sliders; integrated velocity inheritance, burst count, and trigger probability controls while preserving backwards-compatible fallback overrides.'
  },
  {
    version: 'v0.293',
    date: '2026-09-04',
    notes: 'Eliminated severe particle viewport performance hitches during background sync: decoupled 60fps canvas render loop from React state re-renders using high-frequency mutable refs; throttled telemetry updates from 60Hz to 250ms; eliminated full-filesystem JSON.stringify checks from background auto-sync; replaced synchronous localStorage writes and deep JSON clone backup comparisons with non-blocking idle execution and lightweight replacer serializers; and added incremental file change timestamp detection and cooperative event-loop yielding to modular directory and cloud sync.'
  },
  {
    version: 'v0.292',
    date: '2026-09-04',
    notes: 'Implemented granular sub-particle (spark) parameter controls across the schema, engine, and editor UI: two-point Color Gradient with lifecycle fading vs random spectrum picking, visual preview ribbon and curated VFX presets; dynamic Lifetime Range (min/max) with duration presets; Start Size Range (min/max); and End Size Range (min/max) with zero-shrink and expansion presets.'
  },
  {
    version: 'v0.291',
    date: '2026-09-04',
    notes: 'Re-engineered Fluid Drag into a frame-rate independent, visually linear physical damping curve. Replaced the flat plateau past 0.25 with a progressive response model spanning 0.0 to 1.0, and added physical damping status indicators and quick-select presets (Zero, Air, Water, Medium, Viscous, Full Brake).'
  },
  {
    version: 'v0.290',
    date: '2026-09-04',
    notes: 'Added dedicated Gravity control slider and presets for spawned sub-particles (sparks), and added a Color Gradient Range module with real-time spectrum ribbon, min/max bounds, curated VFX presets, and randomized per-particle palette selection.'
  },
  {
    version: 'v0.289',
    date: '2026-09-04',
    notes: 'Inverted fluid drag values across the Particle Engine and Editor so that 0 represents no drag (frictionless 100% velocity retention) and 1.0 represents full drag (instant deceleration stop).'
  },
  {
    version: 'v0.288',
    date: '2026-09-04',
    notes: 'Set fixed widths and tabular-nums formatting for particle count and FPS telemetry indicators in viewport overlay, preventing layout jitter and horizontal stutter when values change between digit lengths.'
  },
  {
    version: 'v0.287',
    date: '2026-09-04',
    notes: 'Implemented offscreen sprite caching and color quantization for custom composite shapes and vector SVGs in ParticleEngine, eliminating per-particle matrix transformations and real-time Gaussian blur passes for 60 FPS performance.'
  },
  {
    version: 'v0.286',
    date: '2026-09-04',
    notes: 'Implemented Primitive Shape Studio for particle systems with layer stacking, relative center offset positioning, customizable dimensions, fill/stroke options, real-time shadowBlur glow, and alpha blend modes.'
  },
  {
    version: 'v0.285',
    date: '2026-09-03',
    notes: 'Added "Face Direction of Velocity" orientation parameter and options for particles, enabling dynamic heading alignment with customizable angle offsets and direction presets.'
  },
  {
    version: 'v0.284',
    date: '2026-09-03',
    notes: 'Moved solid floor geometry and collision plane into world space with particle system, eliminating camera-fixed offset so floor translates and scales with pan/zoom, and added interactive floor dragging and Y-coordinate toolbar controls.'
  },
  {
    version: 'v0.283',
    date: '2026-09-03',
    notes: 'Exposed sub-particle spawning on destroy and collision impact in the parameters library, decoupled solid floor canvas rendering to honor the viewport checkbox, and synchronized bloom glow blur radius directly with live particles and rendering.'
  },
  {
    version: 'v0.282',
    date: '2026-09-03',
    notes: 'Integrated particles/ virtual subfolder and .particle file management into Project File System Explorer with full creation, deletion, direct module navigation, and file renaming.'
  },
  {
    version: 'v0.281',
    date: '2026-09-03',
    notes: 'Preserved exact profile names, avatars, and configuration attributes on import without appending "(Imported)" labels.'
  },
  {
    version: 'v0.280',
    date: '2026-09-03',
    notes: 'Fixed profile configuration importing to immediately parse, save, and apply active and custom theme colors, swatches, and CSS variables across all UI modules and ThemeContext.'
  },
  {
    version: 'v0.279',
    date: '2026-09-03',
    notes: 'Standardized cloud and workspace backup subfolder naming from "Mason Backups" to "backups" within project workspaces, retaining automatic discovery for legacy backup directories.'
  },
  {
    version: 'v0.278',
    date: '2026-09-03',
    notes: 'Standardized image export and modular multi-file directory layout to save project images into "images/" instead of "assets/", preserving backward-compatible loading for legacy folders.'
  },
  {
    version: 'v0.277',
    date: '2026-09-03',
    notes: 'Persisted File System Access directory and file handles across page reloads in IndexedDB with automatic handle recovery; synchronized all sub-editor explicit saves (Prefabs, Sprites, Biomes, Frameworks, Particles, Themes) directly to linked external directories, files, and cloud destinations.'
  },
  {
    version: 'v0.276',
    date: '2026-09-03',
    notes: 'Fixed TypeError when opening the Prefab module by adding robust prefab data normalizers and safe fallbacks for missing prefabData, state nodes, variables, and properties.'
  },
  {
    version: 'v0.275',
    date: '2026-09-03',
    notes: 'Preserve project and sub-file timestamps when loading a workspace or switching/navigating files; file and project timestamps now update strictly when the item itself or the entire project is explicitly saved.'
  },
  {
    version: 'v0.274',
    date: '2026-09-03',
    notes: 'Changed profile configuration export and import file extension from .json to .profile across profile modal export payloads and the Unified File Manager.'
  },
  {
    version: 'v0.273',
    date: '2026-09-03',
    notes: 'Fixed module icon colors and missing icon mappings (Paintbrush and Sparkles) on the main start/welcome launcher screen when no project is loaded to properly synchronize with dynamic theme module colors.'
  },
  {
    version: 'v0.272',
    date: '2026-09-03',
    notes: 'Refactored Profile Configuration Import/Export tab to simplify into two options: Export Profile and Import Profile, both powered by the Unified File Manager sub-module.'
  },
  {
    version: 'v0.271',
    date: '2026-09-03',
    notes: 'Direct linked folder navigation from top-bar and sidebar; visual linked indicators on folders and breadcrumbs; suppressed unsolicited cloud writes on project load to protect OneDrive/GDrive timestamps.'
  },
  {
    version: 'v0.270',
    date: '2026-09-03',
    notes: 'Fixed reference error during background storage health check by properly importing and safely wrapping ensureOneDriveToken with non-throwing fallback handling.'
  },
  {
    version: 'v0.269',
    date: '2026-09-02',
    notes: 'Upgraded OneDrive authentication to use the Authorization Code Flow with PKCE, allowing secure refresh tokens and indefinite persistence without requiring re-authentication. Explained Google Drive security restrictions.'
  },
  {
    version: 'v0.268',
    date: '2026-09-02',
    notes: 'Implemented comprehensive storage location reachability & health checks (on launch, save, backup, and 30s background check), top-bar connection indicator badge, and non-empty folder conflict detection.'
  },
  {
    version: 'v0.267',
    date: '2026-09-02',
    notes: 'Restarted dev server and synchronized application release version configuration.'
  },
  {
    version: 'v0.266',
    date: '2026-09-02',
    notes: 'Implemented automatic storage location linking on project load across local and cloud drives, plus existing project detection & conflict resolution prompt (Overwrite vs. Load Found Project) when linking open projects to folders.'
  },
  {
    version: 'v0.265',
    date: '2026-09-02',
    changes: [
      'Updated File Sub-Module locations list to always show both Google Drive and Microsoft OneDrive cloud drives, displaying a button in the contents panel to navigate directly to the Editor & App Defaults tab in Profile Settings.'
    ]
  },
  {
    version: 'v0.264',
    date: '2026-09-02',
    changes: [
      'Updated modular workspace project structure so root manifest file is dynamically named using the project name (e.g. mourne_edris.mason) across local directories, Google Drive, and OneDrive.'
    ]
  },
  {
    version: 'v0.263',
    date: '2026-09-01',
    changes: [
      'Fixed modular file saving in local directories, Google Drive, and OneDrive so files retain clean native extensions (.map, .sprite, .biome, .prefab, .ui, .particle) without appending duplicate .json extensions.'
    ]
  },
  {
    version: 'v0.262',
    date: '2026-09-01',
    changes: [
      'Fixed bookmark navigation persistence bug in Unified File Manager Modal so clicking Quick Access bookmarks instantly switches active view to Cloud/Virtual target without being reset to local disk.'
    ]
  },
  {
    version: 'v0.261',
    date: '2026-09-01',
    changes: [
      'Removed "Save Map" label in save project mode and updated header/descriptions to "Save Project".',
      'Fixed bookmark jumping in File Manager Modal so clicking Quick Access bookmarks seamlessly navigates to the target cloud or virtual folder without resetting.'
    ]
  },
  {
    version: 'v0.260',
    date: '2026-09-01',
    changes: [
      'Removed the Link to Single .mason File option from the local computer storage location options in the File Manager Modal.'
    ]
  },
  {
    version: 'v0.259',
    date: '2026-09-01',
    changes: [
      'Added Cloud Drive Workspace Folder support for Google Drive and Microsoft OneDrive.',
      'Saving projects to Cloud Drives now creates/updates a modular multi-file folder workspace (project.mason manifest + maps/, biomes/, prefabs/, ui/, structure/, particles/, sprites/, behaviors/, assets/).',
      'Added Link Workspace Folder and Open Workspace Folder capabilities for Cloud Drives in the Unified File Manager Modal.'
    ]
  },
  {
    version: 'v0.258',
    date: '2026-09-01',
    changes: [
      'Implemented prominent Top Bar Target Location Indicator with dedicated visual chips for Local Disk (Folder/File), Google Drive, OneDrive, and Unlinked Browser Cache.',
      'Configured Linked Save Button and Ctrl+S keyboard shortcut to seamlessly persist changes to local IndexedDB and push to linked cloud/disk handles.',
      'Added Background Auto-Sync engine debounced by 3.5s with live spinner and confirmation indicator chips.'
    ]
  },
  {
    version: 'v0.257',
    date: '2026-09-01',
    changes: [
      'Implemented Linked Save Targets with direct single-click save and auto-synchronization to linked modular folders and local .mason files.',
      'Completed Multi-User Step 1: Modular File Architecture with manifest + granular subfolder JSON structure (.map, .biome, .prefab, .particle, .ui, .game, .sprite).',
      'Completed Multi-User Step 2: Concurrency file locking and client session ID verification to prevent multi-user overwrites across separate computers.',
      'Wired master Save button in top navigation bar and Hamburger Menu to automatically route saves through saveProjectToLinkedLocation when linked targets exist.',
      'Added dynamic Linked Target and Concurrency Lock status badges to top bar header and Project Dashboard.'
    ]
  },
  {
    version: 'v0.256',
    date: '2026-09-01',
    changes: [
      'Enhanced backup retention and save interval sliders with high contrast background and borders for clear visibility.',
      'Wired Save As and Manage Backups in Main Menu and EditorLayout with onProjectSaved to update active project state on new saves.',
      'Removed export/download button from top module bar across all modules.',
      'Simplified spritesheet asset import UI by removing redundant inline import buttons and unifying under the primary Import Selected Asset action.',
      'Integrated project version mismatch check with confirmation prompt when opening older or newer Mason project files.'
    ]
  },
  {
    version: 'v0.255',
    date: '2026-09-01',
    changes: [
      'Removed the redundant Google Drive / OneDrive switcher toggle button from the cloud explorer search header to keep location navigation purely driven by the sidebar.'
    ]
  },
  {
    version: 'v0.254',
    date: '2026-09-01',
    changes: [
      'Streamlined file sub-module left sidebar: converted connected cloud drives (Google Drive and OneDrive) into single discrete location buttons mirroring Local Computer Disk.',
      'Removed nested sidebar directory tree accordions in favor of seamless main workspace folder browsing and navigation.'
    ]
  },
  {
    version: 'v0.253',
    date: '2026-09-01',
    changes: [
      'Relocated Cloud Drive authentication and connection management directly to Profile Settings with dedicated Connect/Disconnect buttons for Google Drive and Microsoft OneDrive.',
      'Removed Default Cloud Provider dropdown in favor of individual multi-provider connection states.',
      'Updated Windows File Explorer style sub-module sidebar to conditionally display Google Drive and OneDrive root nodes only when actively connected.',
      'Filtered Quick Access directory bookmarks to only display locations from currently connected providers.'
    ]
  },
  {
    version: 'v0.252',
    date: '2026-09-01',
    changes: [
      'Removed Saved Project Slots local database concept in favor of direct single live project workflow.',
      'Streamlined Local PC storage view to focus directly on local disk project bundle upload/download and cloud/virtual file management.'
    ]
  },
  {
    version: 'v0.251',
    date: '2026-09-01',
    changes: [
      'Transformed UnifiedFileManagerModal into a full Windows File Explorer style sub-module with interactive directory tree navigation.',
      'Added expandable cloud folder tree (Google Drive & OneDrive) and local/virtual workspace storage nodes in the left sidebar.',
      'Updated contextual action text, file prompts, and primary action buttons (Load, Save, Import, Export) to dynamically adapt to trigger actions.',
      'Added Windows-style bottom file status bar with active location path prompt, file name input with extension indicators, and contextual action execution buttons.'
    ]
  },
  {
    version: 'v0.250',
    date: '2026-08-31',
    changes: [
      'Resolved Internal React error "Expected static flag was missing" caused by violation of the Rules of Hooks in UnifiedFileManagerModal.',
      'Refactored UnifiedFileManagerModal early isOpen exit check to execute downstream of all hooks to guarantee identical component-level render order.'
    ]
  },
  {
    version: 'v0.249',
    date: '2026-08-31',
    changes: [
      'Refactored the core file storage model into a completely unified UnifiedFileManagerModal files sub-module.',
      'Unified Local Device, Cloud Drive (Google Drive/OneDrive), and Virtual Drive browsers under a single consolidated modal view.',
      'Integrated selective layout filters, automated backup snapshot tools, local device downloads/uploads, and asset previews dynamically based on selected action context.',
      'Removed old LoadProjectModal, CloudSyncModal, and CloudImageImportModal files to secure clean single-point file input and output access.'
    ]
  },
  {
    version: 'v0.248',
    date: '2026-08-31',
    changes: [
      'Isolated and resolved OneDrive stalling/freezes by resetting active folder IDs on cloud provider tab switches inside CloudImageImportModal.',
      'Consolidated Import and Cloud Drive Explorer modals: added support for generic saving payloads to save configuration files directly to OneDrive or Google Drive.',
      'Integrated Save to Cloud button inside App Profile Config Modal for direct cloud export of .json profile files.',
      'Added dual timestamp (date + time) formatting to all virtual and cloud file browser lists in CloudImageImportModal.'
    ]
  },
  {
    version: 'v0.247',
    date: '2026-08-31',
    changes: [
      'Updated file explorer modals to display both date and time stamps together for file lists, project items, and app profile updates.',
      'Updated file inspector panel, project loading list, and cloud synchronization explorer items to present both date and time stamps.'
    ]
  },
  {
    version: 'v0.246',
    date: '2026-08-31',
    changes: [
      'Isolated custom theme colors from static presets, preserving custom hexes separately when selecting static preset cards.',
      'Ensured Custom Theme Card swatches reflect stored custom palette colors independently of the active static preset.',
      'Enabled seamless bidirectional switching between saved custom themes and static presets without state loss.'
    ]
  },
  {
    version: 'v0.245',
    date: '2026-08-31',
    changes: [
      'Updated Custom Theme Card in Theme Modal to feature full 8-module palette spectrum swatches and background tone info.',
      'Configured Custom Theme Card click behavior to directly activate the custom theme without redirecting to the swatches tab.',
      'Removed "User Configured" and "Open Swatches" links from the Custom Theme Card to align with preset card behavior.',
      'Ensured Custom Theme Card spectrum swatches dynamically mirror live custom color modifications in real-time.'
    ]
  },
  {
    version: 'v0.244',
    date: '2026-08-31',
    changes: [
      'Fixed white preview screen caused by background tone defaulting to pure white (#ffffff).',
      'Restored ambient dark background tone (#0a0814) for custom themes while preserving pure white custom accent defaults.',
      'Added sanitization in loadSavedAppTheme and getBackgroundToneDef to auto-heal pure white background tones from local storage.'
    ]
  },
  {
    version: 'v0.243',
    date: '2026-08-31',
    changes: [
      'Restarted and verified Node.js development server process on port 3000.'
    ]
  },
  {
    version: 'v0.242',
    date: '2026-08-31',
    changes: [
      'Fixed ReferenceError: updateTheme is not defined by destructuring updateTheme from useAppTheme context in ThemeModal component.'
    ]
  },
  {
    version: 'v0.241',
    date: '2026-08-31',
    changes: [
      'Configured Configure Theme button in App Profile Configuration modal to automatically dismiss the Profile modal when opening the Theme Palette modal.'
    ]
  },
  {
    version: 'v0.240',
    date: '2026-08-31',
    changes: [
      'Removed Canvas Grid Defaults section from App Profile Configuration modal.',
      'Updated Custom Theme defaults to pure white (#ffffff) for all custom color hex swatches.',
      'Synchronized Custom Theme palette automatically whenever preset colors or module color swatches are changed.',
      'Transformed Profile Config Theme setting into an active theme info card with direct link to the Theme Palette & Custom Mixer modal.'
    ]
  },
  {
    version: 'v0.239',
    date: '2026-08-31',
    changes: [
      'Updated Mason Profile Config defaults: set 10-minute auto-backups as default and removed unneeded UI density & grid snap config items.',
      'Added Custom Theme Palette option and expanded preset list in ThemeModal and Profile Configuration.',
      'Implemented Module Tab Memory & Persistence across Game Structure, Biomes, ParticleFX, Prefabs, and UI/HUD modules.',
      'Confirmed Location Bookmarks integration across Import, Cloud Storage Explorer, and Save Location modals.'
    ]
  },
  {
    version: 'v0.238',
    date: '2026-08-31',
    changes: [
      'Surfaced "User Profiles & Config" menu items across the Main Hamburger Menu (top-left) and Project Dashboard quick action buttons.',
      'Ensured seamless access to the User Profiles tab regardless of screen size or active navigation view.'
    ]
  },
  {
    version: 'v0.237',
    date: '2026-08-31',
    changes: [
      'Implemented Global Mason App Config & User Profiles system with instant cross-app browser caching.',
      'Added User Profile Switcher Badge in top navbar with quick dropdown and profile management.',
      'Created AppProfileConfigModal for switching/editing user profiles, customizing editor defaults, and exporting/importing .json config files.',
      'Integrated Location Bookmarks bar and 1-click Bookmark button into Cloud Drives Explorer & Save Location Modal (CloudSyncModal).'
    ]
  },
  {
    version: 'v0.236',
    date: '2026-08-31',
    changes: [
      'Added Location Bookmarks system in Import and Cloud Drive modals (Google Drive, OneDrive, Virtual Drive).',
      'Implemented persistent bookmarking in localStorage with real-time cross-tab/modal event synchronization.',
      'Added "Bookmark Location" toggle buttons and a Quick Bookmarks bar for 1-click folder navigation.'
    ]
  },
  {
    version: 'v0.235',
    date: '2026-08-31',
    changes: [
      'Fixed React Rules of Hooks violation in SpritesheetSliceModal where early return (if (!isOpen) return null) preceded hook definitions, causing static flag runtime errors.'
    ]
  },
  {
    version: 'v0.234',
    date: '2026-08-31',
    changes: [
      'Set "Grid (Cols×Rows)" as the default slicing mode across SpritesheetSliceModal and editor integrations.',
      'Removed redundant "Replace Image" button and direct file input from SpritesheetSliceModal in favor of the unified Import modal (Google Drive, OneDrive, Virtual Drive, Local File).'
    ]
  },
  {
    version: 'v0.233',
    date: '2026-08-31',
    changes: [
      'Refactored CloudImageImportModal to a unified "Import" modal featuring Google Drive, OneDrive, Local File, and a new dedicated "Virtual Drive" browser tab to load existing project assets.',
      'Context-aware Import modal: in Spritesheet / Sub-module mode (Prefab and Particle editors), hides "Import Destination" and "Load as Spritesheet / Single Image" toggles in favor of a clean single "Select Image for Slicing" action.',
      'Unified slicing triggers across Prefab and Particle editors so clicking "Upload & Configure Slicing" opens the SpritesheetSliceModal directly instead of bypassing with raw file inputs.',
      'Renamed "Load from Cloud" buttons in the SpritesheetSliceModal to "Import".'
    ]
  },
  {
    version: 'v0.232',
    date: '2026-08-31',
    changes: [
      'Replaced the "Load Image" option in the Image & Sprite Editor internal hamburger/file menu (☰) with a clean "Import" button.',
      'Configured the internal "Import" menu action to dispatch an OPEN_IMPORT_MODAL message to the parent wrapper, instantly triggering the Cloud & Local Drive import modal.',
      'Added fallback handlers for standalone preview contexts.'
    ]
  },
  {
    version: 'v0.231',
    date: '2026-08-31',
    changes: [
      'Refactored Cloud Drive image import workflow: removed extra standalone "Load from Cloud" toolbar button and consolidated subfolder menu actions into a unified "Import..." entry that directly opens the cloud and local import module.',
      'Configured CloudImageImportModal to auto-detect and immediately use whichever Cloud Drive provider (Google Drive or Microsoft OneDrive) is already authenticated for the project, displaying user credentials and loading directory contents on open.',
      'Integrated Cloud Drive spritesheet and texture loading directly into SpritesheetSliceModal and the spritesheet sub-modals for both PrefabEditor and ParticlesEditor.',
      'Added high-visibility dropzone overlays and direct cloud browsing triggers for empty spritesheet and particle texture slots.'
    ]
  },
  {
    version: 'v0.230',
    date: '2026-08-31',
    changes: [
      'Added Cloud Drive image and spritesheet loading capabilities to Image & Sprite Studio from Google Drive and Microsoft OneDrive with live folder browsing and thumbnail previews.',
      'Created dedicated CloudImageImportModal with single image loading and integrated Spritesheet Slicing mode (supporting margins, spacing, row/column counts, and frame limits).',
      'Implemented seamless project asset registration into fileSystem.images and synchronized iframe canvas states via postMessage (LOAD_SPRITE and LOAD_PROJECT).',
      'Added direct Cloud Drive import action buttons in FileSubfolderHeader dropdown and active toolbar controls.'
    ]
  },
  {
    version: 'v0.229',
    date: '2026-08-31',
    changes: [
      'Added dedicated "🌪️ Turbulence & Noise" parameter card with velocity jitter controls (0-100 px/s) to the particle module for blizzard flurries, heat shimmers, and fire embers.',
      'Centralized all particle parameter addition and removal handlers (handleAddParam & handleRemoveParam) ensuring immediate live physics simulation updates and state synchronization upon parameter removal.',
      'Verified and aligned all particle presets (including Blizzard Flurries, Fire Embers, Smoke, Fireworks, etc.) to use canonical parameters and sync dynamic parameter library states.',
      'Confirmed custom color swatch pickers on all theme items across the primary accent, individual modules, and background tones.'
    ]
  },
  {
    version: 'v0.228',
    date: '2026-08-31',
    changes: [
      'Added interactive custom color swatches to all theme items in ThemeModal (Main App Accent, Image/Sprite Studio, Maps, Biomes, Prefabs, Particles, UI/HUD, Game Graph, and App Background Tone).',
      'Integrated instant native color pickers and hex indicators with real-time CSS variable synchronization across the workspace and preview.',
      'Refined color resolution and preview cards to seamlessly support custom user palettes.'
    ]
  },
  {
    version: 'v0.227',
    date: '2026-08-31',
    changes: [
      'Added a dedicated interactive "Custom" color swatch to every theme item (Main App Accent, Image/Sprite Studio, Maps, Biomes, Prefabs, Particles, UI/HUD, Game Graph, and App Background Tone).',
      'Integrated native instant color pickers and Hex editors for unlimited theme color customization across all modules and background tones.',
      'Updated ThemeContext and Theme Engine with custom hex calculation, live dynamic CSS variables, and instant workspace preview synchronization.'
    ]
  },
  {
    version: 'v0.226',
    date: '2026-08-30',
    changes: [
      'Resolved critical file synchronization blockages and platform buffer limits by modularizing the Prefab editor behaviors module.',
      'Extracted the 3,700-line Behaviors tab into a standalone, highly-performant Sub-Component: PrefabBehaviorsTab.',
      'Synchronized and verified flawless local production compilation and linting passes.'
    ]
  },
  {
    version: 'v0.225',
    date: '2026-08-30',
    changes: [
      'Performed an exhaustive byte-level and character-encoding audit of PrefabEditor.tsx and all other source files using Python.',
      'Confirmed 100% absence of corrupted Unicode replacement characters, BOMs, or invalid UTF-8 sequences.',
      'Validated and successfully executed a flawless local production compilation and linting pass using esbuild and Vite.'
    ]
  },
  {
    version: 'v0.224',
    date: '2026-08-30',
    changes: [
      'Upgraded the absolute in-modal Delete/Restore confirmation overlays to fixed-position full-window overlays, correcting scaling issues inside the main scroll container.',
      'Refined the hover and active states for cloud drive and backup deletion buttons with rich high-contrast red highlights.',
      'Pristinely cleaned the workspace root by deleting obsolete scratch files (server.js, generate-icons.mjs) and consolidating the PWA generator script.'
    ]
  },
  {
    version: 'v0.223',
    date: '2026-08-30',
    changes: [
      'Replaced iframe-blocked window.confirm with styled in-modal Delete and Restore confirmation dialogs.',
      'Enhanced delete and restore buttons in Explorer and Backups tabs with distinct hover highlights and active states.',
      'Cleaned up repository by removing leftover scratch scripts, test logs, puppeteer artifacts, and obsolete test files.',
      'Verified cloud and backup deletion workflows across Google Drive and Microsoft OneDrive.'
    ]
  },
  {
    version: 'v0.222',
    date: '2026-08-30',
    changes: [
      'Removed separate Save As and Load tabs from Cloud Drive modal in favor of unified Explorer workflow.',
      'Added inline Save As dialog with custom filename input and backup options to Explorer actions toolbar.',
      'Unified cloud project loading and saving directly inside the Cloud Drives Explorer view.',
      'Updated EditorLayout cloud sync mode typing to explore and backups.'
    ]
  },
  {
    version: 'v0.221',
    date: '2026-08-30',
    changes: [
      'Refactored Project Backups system to directly read and manage backup files from the cloud backups/ directory without separate database dependencies.',
      'Added explicit confirmation dialogs ("Are you sure?") and toast feedback before deleting project files and backups in Cloud Drive.',
      'Disabled project saving when no project is open and cleaned filename defaults to strictly ProjectName.mason.',
      'Enhanced Refresh, Disconnect, and Done buttons with high-contrast hover feedback and click animations.'
    ]
  },
  {
    version: 'v0.220',
    date: '2026-08-30',
    changes: [
      'Added automated Project File Backup Engine running every 10m (configurable 3-60m) retaining 10 snapshots (configurable 1-50) with auto cloud sub-folder backups/ sync.',
      'Added comprehensive Backups & History management tab in Cloud Drive modal with snapshot restore, instant manual backup, and file download.',
      'Enhanced Cloud Drive modal buttons (Refresh, Disconnect, Done) with high-contrast hover states, active click feedback, and real-time toast alerts.',
      'Standardized project saving filename default to clean ProjectName.mason without arbitrary IDs or redundant prefixes.',
      'Removed all PWA installation buttons and prompts from menus, dashboard, and launcher.'
    ]
  },
  {
    version: 'v0.219',
    date: '2026-08-30',
    changes: [
      'Streamlined Microsoft OneDrive integration to a pure, seamless 1-click OAuth login popup.',
      'Removed manual token input and configuration drawers in favor of zero-friction user login.',
      'Updated default authentication tenant to common to seamlessly support Personal and Work/School Microsoft accounts.',
      'Provided precise Azure Portal configuration steps for Personal and Work/School account sign-in.'
    ]
  },
  {
    version: 'v0.218',
    date: '2026-08-30',
    changes: [
      'Resolved unauthorized_client Azure error handling for Microsoft OneDrive connection.',
      'Added Azure & Token Configuration drawer with instant Microsoft Graph Access Token authentication.',
      'Added custom Azure Application Client ID and tenant configuration with 1-click SPA Redirect URI copy tool.',
      'Enhanced diagnostic error feedback explaining consumer account requirements and immediate workaround methods.'
    ]
  },
  {
    version: 'v0.217',
    date: '2026-08-30',
    changes: [
      'Added automatic scrollbar reset to top whenever navigating to folders or loading new contents in the Cloud Drives Explorer modal.',
      'Attached container and list refs with immediate and reactive scroll reset.'
    ]
  },
  {
    version: 'v0.216',
    date: '2026-08-30',
    changes: [
      'Fixed Cloud Drives Explorer modal displaying on app startup by adding missing isOpen visibility guard.',
      'Added backdrop click and Escape key support to close CloudSyncModal.',
      'Updated all cloud load buttons and labels to consistently read "Load Project".'
    ]
  },
  {
    version: 'v0.215',
    date: '2026-08-30',
    changes: [
      'Refactored Cloud Drives Explorer with interactive folder tree browsing and directory traversal.',
      'Added Google Drive Picker integration for native modal folder selection.',
      'Added direct navigation controls: Up Level button, quick jump to root/target folder, and all-folders view.',
      'Enhanced folder and file action buttons with "Open Folder", "Set Target", "Save Here", and "Load Map".'
    ]
  },
  {
    version: 'v0.214',
    date: '2026-08-30',
    changes: [
      'Implemented full Cloud Drives Explorer to browse Google Drive and Microsoft OneDrive directories.',
      'Added interactive folder navigation, search filtering, and directory breadcrumb traversal.',
      'Added direct "Save Project Here", custom filename selection, and "Pick This Location" target configuration.',
      'Integrated real-time Cloud Drive action triggers into top bar and main menu.'
    ]
  },
  {
    version: 'v0.213',
    date: '2026-08-30',
    changes: [
      'Restored full UTF-8 text integrity and structure in PrefabEditor component.',
      'Eliminated invalid characters causing Vite/esbuild pre-transform build failures at line 9065.',
      'Verified zero compilation and linting errors across the entire codebase.'
    ]
  },
  {
    version: 'v0.212',
    date: '2026-08-29',
    changes: [
      'Eliminated unclosed or raw JSX angle brackets and arrows across the Prefab editor UI to conform to strict bundler requirements.',
      'Refactored multi-byte emoji character listings to standard plain-text equivalents to prevent compiler charset decoding drift.',
      'Fully validated file UTF-8 integrity ensuring seamless, warning-free cross-environment builds.'
    ]
  },
  {
    version: 'v0.211',
    date: '2026-08-29',
    changes: [
      'Implemented advanced axis-separated capsule movement physics with downward ground snapping and step-climbing traversal.',
      'Eliminated diagonal jittering and mid-air launching on slopes by continuously tracking analytical surface heights.',
      'Refined multi-sample vertical side-probes to prevent horizontal wall-clipping while ignoring walkable ramps.'
    ]
  },
  {
    version: 'v0.210',
    date: '2026-08-29',
    changes: [
      'Fixed incorrect variable values shown in behavior dropdown lists and math/condition preview blocks by resolving values from behaviorVariables instead of the variables definition template.',
      'Refactored live playtest variable updates to write strictly to runtimeVariables and preserve original pristine behaviorVariables set inside the editor across respawns.'
    ]
  },
  {
    version: 'v0.209',
    date: '2026-08-29',
    changes: [
      'Resolved horizontal block on diagonal slopes by allowing walkable-slope standing states to bypass horizontal foot checks against adjacent flat support blocks.',
      'Fixed prefab variables caching bug by resetting playtest runtime and local variables and sync-refreshing behavior overrides with fresh values on player respawn.'
    ]
  },
  {
    version: 'v0.208',
    date: '2026-08-29',
    changes: [
      'Refactored polygon collider generator to calculate the exact bounding box of all loaded map chunks to guarantee cyan wireframe overlays cover all active tiles.',
      'Upgraded platformer horizontal movement checks to prevent passing through the vertical back walls of diagonal slopes.',
      'Implemented neighborhood multi-row vertical probe scan (above, same, below) to handle perfect step-up slope climbing and step-down slope snapping.'
    ]
  },
  {
    version: 'v0.207',
    date: '2026-08-29',
    changes: [
      'Introduced isSolidFlatTile helper in the physics simulation.',
      'Refactored the player falling down Move Y collision check to ignore slope tiles, allowing the player to perfectly land on and descend slope hypotenuse surfaces instead of snapping to flat block boundaries.',
      'Fully synchronized the visual collider wireframes with the physical platformer movement engine.'
    ]
  },
  {
    version: 'v0.206',
    date: '2026-08-29',
    changes: [
      'Implemented getEffectiveTileShape helper resolving autotiled smart slopes on-the-fly.',
      'Refactored platformer horizontal Move X and vertical Move Y collision systems to use dynamically resolved autotile slope shapes for perfect player movement matching.',
      'Optimized isSolidTile check to correctly ignore decorative layers/background elements.'
    ]
  },
  {
    version: 'v0.205',
    date: '2026-08-29',
    changes: [
      'Synchronized merged polygon collider engine with active game-renderer autotile slope solver neighbor presence logic.',
      'Refactored tracing loop to use a strict clockwise planar graph edge-tracing Right-Hand Rule to guarantee non-stalling loop closure and support fully complex composite shapes.'
    ]
  },
  {
    version: 'v0.204',
    date: '2026-08-29',
    changes: [
      'Fixed tile cell reference bug (from cell.tile_id to cell.tile_type_id) to restore wireframe renders for solid/diagonal tiles.',
      'Implemented full 2D edge-cancellation collider-merging algorithm to compile and display the real cached contiguous outline polygons.'
    ]
  },
  {
    version: 'v0.203',
    date: '2026-08-29',
    changes: [
      'Added interactive Tile Polygon Collider Wireframe Overlay (Shield icon HUD button + Shift+C hotkey) to view exact block colliders on map canvas and SVG polygon thumbnails to Tile Shape Selector.'
    ]
  },
  {
    version: 'v0.202',
    date: '2026-08-29',
    changes: [
      'Fixed build failure caused by embedded zlib compression artifact in PrefabEditor.tsx and restored clean UTF-8 source content.'
    ]
  },
  {
    version: 'v0.201',
    date: '2026-08-29',
    changes: [
      'Verified clean UTF-8 source file encoding across all modules and validated successful production Vite build.'
    ]
  },
  {
    version: 'v0.200',
    date: '2026-08-29',
    changes: [
      'Fixed redundant duplicate rendering of Prefab Composition Studio in the Composite tab by removing extraneous secondary view block.'
    ]
  },
  {
    version: 'v0.199',
    date: '2026-08-29',
    changes: [
      'Implemented "Set Allowed Traversal Angle" action in Prefab Behaviors allowing dynamic control over climbable incline slopes (0° to 90°) with real-time SVG slope gauge.',
      'Added configurable steep slope behaviors (Wall Block, Slide Downhill with custom slide speed, or Slow Incline Struggle) and ceiling slope traversal support.',
      'Implemented full Action Sequence Reordering (Move Up / Move Down buttons) on behavior action cards to rearrange the execution order of actions inside rules.',
      'Integrated traversal angle thresholds into RefinedMapCanvas collision detection and physics simulation.'
    ]
  },
  {
    version: 'v0.198',
    date: '2026-08-29',
    changes: [
      'Added Math Calculator & Arithmetic Operations for Prefab Behavior actions (multiplication, addition, subtraction, division, modulo, power, clamp, min/max, abs, lerp, random_range, toggle, and negation).',
      'Implemented Rule Local Variables with dynamic scoping, allowing behavior actions to calculate and store temporary values (such as move speed * run speed modifier) without polluting global prefab state.',
      'Updated Kinematic Move, Physics Impulse, and Gravity Override actions to seamlessly consume rule-scoped local variables and prefab variables with grouped dropdown selectors.',
      'Added live interactive math formula preview in the behavior rule editor showing real-time computed outputs.'
    ]
  },
  {
    version: 'v0.197',
    date: '2026-08-29',
    changes: [
      'Implemented Slope Detection IF condition trigger in Prefab Behavior system with support for ramps, ceiling slopes, uphill/downhill incline detection, sensor locations, and slope angles.',
      'Refactored Kinematic Move actions into dedicated Manual Kinematics (move left/right/up/down/forward/backward, angle deg, set/add velocity, stop axes) and moved autonomous routines into new AI & Automation actions (patrol, chase, flee, flight sine, wander, circle).',
      'Cleaned up Mapped Player Input IF condition by removing redundant trigger mode override and making the UI Input Mappings tab the single source of truth for key timing.',
      'Integrated real-time slope surface height calculation into physics collision loop and sensor raycasts in RefinedMapCanvas.'
    ]
  },
  {
    version: 'v0.196',
    date: '2026-08-29',
    changes: [
      'Added Raw Keyboard, Raw Mouse, and Raw Gamepad condition triggers to the Prefab Behavior system for direct testing and unmapped hardware inputs.',
      'Implemented full runtime event listeners and gamepad polling loop in RefinedMapCanvas with modifier keys, mouse wheel/hover/bounds detection, and analog stick/trigger deadzone thresholds.',
      'Added dedicated Prefab Behavior UI editors for configuring raw key codes, mouse actions, target areas, gamepad button modes, and analog axis directions.'
    ]
  },
  {
    version: 'v0.195',
    date: '2026-08-29',
    changes: [
      'Fixed Mapped Player Input in prefab behaviors to directly read from and execute active input mappings defined in the UI Module Input Mappings tab.',
      'Added dynamic mapping resolution in Prefab Behavior Trigger Editor and RefinedMapCanvas engine with support for custom action IDs, names, labels, and trigger modes.'
    ]
  },
  {
    version: 'v0.194',
    date: '2026-08-29',
    changes: [
      'Removed hardcoded default character kinematics and wired up fully granular, behavior-driven controller execution in Play Mode.',
      'Added full support for custom movement rules, variable-based speed and force, directional solid triggers, custom descend rates, and dynamic collision capsule heights.'
    ]
  },
  {
    version: 'v0.193',
    date: '2026-08-29',
    changes: [
      'Fixed Play Mode stalling and frame stutter in Web and PWA by resolving exponential requestAnimationFrame loop duplication and throttling HUD state updates.',
      'Fixed mouse cursor and tile painting misalignment after exiting Play Mode by synchronizing viewport pan state on mode transitions and reading live coordinate refs.'
    ]
  },
  {
    version: 'v0.192',
    date: '2026-08-29',
    changes: [
      'Dev server health verification and preview initialization refresh.',
      'Ensured stable rendering across all module canvases and launchers.'
    ]
  },
  {
    version: 'v0.191',
    date: '2026-08-28',
    changes: [
      'Major performance refactor: Fixed Play Mode stalling and dropping frames in production by decoupling the 60fps canvas render loop from the React state cycle.',
      'Throttled HUD state updates via strict equality checks.'
    ]
  },
  {
    version: 'v0.190',
    date: '2026-08-28',
    changes: [
      'Fixed mouse-wheel zoom-to-cursor scaling on Map canvases by correctly configuring originMode for the Viewport module.'
    ]
  },
  {
    version: 'v0.189',
    date: '2026-08-28',
    changes: [
      'Fully migrated Tilemap Studio (RefinedMapCanvas) to strictly use the shared ViewportCanvasContainer component.'
    ]
  },
  {
    version: 'v0.189',
    date: '2026-08-28',
    changes: [
      'Hotfix: Resolved React rendering crash in RefinedMapCanvas caused by undefined mapData.cells in chunk-based maps.'
    ]
  },
  {
    version: 'v0.187',
    date: '2026-08-28',
    changes: [
      'Refactored map canvas modules to utilize the shared Viewport Canvas sub-module.',
      'Replaced custom-built pan/zoom hook in RefinedMapCanvas and MapCanvas with shared useMasonViewport implementation.',
      'Swapped inline floating viewport UI with standard ViewportHUD component in map editors.'
    ]
  },
  {
    version: 'v0.186',
    date: '2026-08-28',
    changes: [
      'Updated OneDrive OAuth authorization endpoint to default to /consumers/ for Personal Microsoft Accounts.',
      'Resolved Azure AD userAudience error when authenticating with personal Outlook/Hotmail/Live accounts.',
      'Added tenant account switcher in CloudSyncModal to seamlessly toggle between Personal (consumers) and Work/School (common) accounts.',
      'Added automated detection and quick-fix button for userAudience OAuth configuration mismatches.'
    ]
  },
  {
    version: 'v0.185',
    date: '2026-08-28',
    changes: [
      'Enhanced .mason file structure to serialize full undo history stacks, redo stacks, project checkpoints, and version history logs.',
      'Ensured seamless preservation of project checkpoints and undo history when downloading, exporting, or loading cloud project files.',
      'Exposed manual checkpoint creation and restoration utility methods in editor hook.',
      'Bumped Mason release version constants to v0.185.'
    ]
  },
  {
    version: 'v0.184',
    date: '2026-08-28',
    changes: [
      'Resolved OneDrive OAuth popup redirect and auto-closing handshake via window postMessage.',
      'Implemented visual toggle switch between active cloud storage providers (Google Drive vs Microsoft OneDrive).',
      'Added Virtual File & Folder Browser for Google Drive and OneDrive with custom target directory selection.',
      'Updated cloud storage engine to save full multi-level project structures (.mason).',
      'Made cloud auto-backup non-optional and auto-active when connected.',
      'Bumped Mason release version constants to v0.184.'
    ]
  },
  {
    version: 'v0.183',
    date: '2026-08-28',
    changes: [
      'Configured Google Drive & Microsoft OneDrive OAuth integrations with lazy auth initialization.',
      'Updated Azure SPA redirect URI matching for OneDrive cloud level synchronization.',
      'Streamlined Cloud Storage & Sync modal UI.',
      'Bumped release version constants to v0.183.'
    ]
  },
  {
    version: 'v0.182',
    date: '2026-08-28',
    changes: [
      'Restored standalone Sprite Studio engine scripts and verified palette/layer/drawing tools reactivity.',
      'Initiated Google Drive and Microsoft OneDrive OAuth cloud synchronization setup milestone.',
      'Bumped Mason release version constants to v0.182 across engine manifests.'
    ]
  },
  {
    version: 'v0.177',
    date: '2026-08-27',
    changes: [
      'Implemented BASE_URL subpath resolution for embedded iframe src in SpriteEditorWrapper and SpriteEditorModal to fix 404 stalls on GitHub Pages.',
      'Added handshake ping loop to SpriteEditorModal to prevent postMessage race conditions during high-speed CDN initialization.',
      'Bumped release version constants, package manifest, and ServiceWorker cache identifier to v0.177.'
    ]
  },
  {
    version: 'v0.176',
    date: '2026-08-27',
    changes: [
      'Analyzed GitHub Pages iframe loading stall causes (subpath BASE_URL resolution, postMessage race conditions, Service Worker caching scopes).',
      'Bumped release version constants, package manifest, and ServiceWorker cache identifier to v0.176.'
    ]
  },
  {
    version: 'v0.175',
    date: '2026-08-27',
    changes: [
      'Repaired corrupted himg/rimg image loading handlers in decodeLayersData preventing layer and height/roughness map initialization.',
      'Added fallback initApp DOM listener to guarantee immediate 32x32 canvas and layer initialization on iframe load.',
      'Bumped release version constants, package manifest, and ServiceWorker cache identifier to v0.175.'
    ]
  },
  {
    version: 'v0.174',
    date: '2026-08-27',
    changes: [
      'Decompressed binary zlib stream in Sprite Editor bundle (/public/modules/sprites/index.html) to fix layer data loading and syntax crashes.',
      'Created Git milestone repository snapshot and v1.0-milestone tag.',
      'Bumped release version constants, package manifest, and ServiceWorker cache identifier to v0.174.'
    ]
  },
  {
    version: 'v0.171',
    date: '2026-08-26',
    changes: [
      'Fixed asynchronous loadProjectData promise handling so iframe wait for full layer, frame, and stamp decoding before rendering and returning status.',
      'Added canvas render, grid overlay, centering, and size sync inside loadProjectData completion handler.',
      'Removed premature promise resolution on layer roughness decoding.',
      'Guarded pointerDown interaction handlers against undefined layers/activeLayer state.',
      'Bumped Mason release version to v0.171 and ServiceWorker cache to mason-v0.171.'
    ]
  },
  {
    version: 'v0.170',
    date: '2026-08-26',
    changes: [
      'Resolved layer data loading freeze in Image & Sprite Editor by handling empty/missing layer image data and adding fallback onerror promise resolution in decodeLayersData.',
      'Fixed cursor paint preview alignment and centered canvas view offsets by anchoring cursorPreviewCanvas and marginFadeCanvas CSS, guarding canvasCoords scale calculations, and handling ResizeObserver container layout updates.',
      'Restored brush and eraser hover cursor previews on canvas mousemove when in idle hover state.',
      'Bumped Mason release version to v0.170 and ServiceWorker cache to mason-v0.170.'
    ]
  },
  {
    version: 'v0.169',
    date: '2026-08-26',
    changes: [
      'Removed makeDummy document proxy monkey-patch from /public/modules/sprites/index.html to restore native DOM event listener binding on canvas and controls.',
      'Updated PWA ServiceWorker (sw.js) fetch navigation fallback to prevent module sub-apps (/modules/...) from accidentally serving the root SPA React index.html.',
      'Added explicit SPRITE_READY postMessage handling in SpriteEditorWrapper and SpriteEditorModal to guarantee iframe sprite project loads after script initialization.',
      'Bumped Mason release version to v0.169 and ServiceWorker cache to mason-v0.169.'
    ]
  },
  {
    version: 'v0.168',
    date: '2026-08-26',
    changes: [
      'Fixed GitHub Pages & PWA subpath 404 error when opening Image & Sprite Editor by updating iframe src from absolute /modules/sprites/index.html to relative ./modules/sprites/index.html across SpriteEditorWrapper, SpriteEditorModal, and modulesRegistry.',
      'Updated PWA Service Worker (sw.js) cache identifier to mason-v0.168.',
      'Bumped Mason release version to v0.168.'
    ]
  },
  {
    version: 'v0.167',
    date: '2026-08-26',
    changes: [
      'Resolved 404 GitHub Pages redirect error in PWA mode by removing legacy external canonical/og:url links and redundant iframe service worker registration in /modules/sprites/index.html.',
      'Updated PWA Service Worker (sw.js) to cache /modules/sprites/index.html and updated CACHE_NAME to mason-v0.167.',
      'Bumped Mason release version to v0.167.'
    ]
  },
  {
    version: 'v0.166',
    date: '2026-08-26',
    changes: [
      'Decompressed and restored clean uncorrupted Image & Sprite Editor engine bundle (/modules/sprites/index.html), resolving syntax errors and restoring full canvas click & tool responsiveness.',
      'Bumped Mason release version to v0.166.'
    ]
  },
  {
    version: 'v0.165',
    date: '2026-08-26',
    changes: [
      'Fixed temporary Ctrl key tool switching behavior: releasing Ctrl or moving over canvas continuously restores the previously selected tool on keyup and pointermove.',
      'Added Frequency Threshold Color Reduction mode in Reduce Colors popup: filters out rare colors below pixel count threshold, remapping canvas pixels and/or trimming main palette.',
      'Bumped Mason release version to v0.165.'
    ]
  },
  {
    version: 'v0.164',
    date: '2026-08-26',
    changes: [
      'Added temporary Ctrl key color selection shortcut: holding Ctrl while hovering over the canvas switches to colorpick mode and restores previous tool on release.',
      'Bumped Mason release version to v0.164.'
    ]
  },
  {
    version: 'v0.163',
    date: '2026-08-26',
    changes: [
      'Replaced all native browser confirm() and alert() calls across Sprite Editor iframe modules with custom iframe-safe modal dialogs (asyncConfirm & showCustomAlert).',
      'Bumped Mason release version to v0.163 across package manifest, version constants, and release history log.'
    ]
  },
  {
    version: 'v0.162',
    date: '2026-08-26',
    changes: [
      'Cleaned up and consolidated repository workspace: removed 117 leftover temporary scripts (_tmp_script_*, patch_*, fix_*, test_*, rewrite_*, etc.) and temporary build directories.',
      'Audited root file tree down to production-essential configuration and application assets.'
    ]
  },
  {
    version: 'v0.161',
    date: '2026-08-26',
    changes: [
      'Added canvas dimension & size preset controls to the Create New Sprite modal across the top bar button and subfolder dropdown menu.',
      'Removed legacy /palette-spray-studio and /public/palette-spray-studio directories to fully consolidate sprite engine assets into /public/modules/sprites/.',
      'Cleaned up export submenu by removing redundant standalone heightmap and roughness map export items in favor of the full PNG & Maps export suite.',
      'Streamlined FileSubfolderHeader with aspect ratio linking, preset resolution chips (16×16 to 256×256), and dynamic pixel counter.'
    ]
  },
  {
    version: 'v0.160',
    date: '2026-08-26',
    changes: [
      'Fixed the Sprite & Image Editor black screen root cause by reintroducing the safe DOM Proxy shim (Script 0) to prevent unhandled TypeErrors from missing optional elements during engine startup.',
      'Embedded the bidirectional postMessage iframe bridge directly into the Sprite Editor main IIFE execution scope, guaranteeing access to layers, frames, resetProjectToDefaults, and render.',
      'Synchronized SpriteEditor message handling in SpriteEditorWrapper for SPRITE_STATUS and SPRITE_STATUS_UPDATE payloads.',
      'Ensured full asset and canvas parity across /modules/sprites/index.html and /palette-spray-studio/index.html.'
    ]
  },
  {
    version: 'v0.159',
    date: '2026-08-26',
    changes: [
      'Resolved Sprite & Image Editor black screen regression by consolidating the postMessage iframe bridge directly into the primary application execution scope.',
      'Exposed core SpriteEditor methods (render, resetProjectToDefaults, loadProjectData, buildProjectData, centerCanvas, fitCanvasToScreen) to window scope so message listeners execute synchronously without closure isolation.',
      'Guaranteed active layer rendering, grid overlay generation, canvas centering, and screen fitting on fresh sprite and project loads.',
      'Eliminated disconnected duplicate scripts and unified dirty-state tracking across strokes, undo/redo history, and project saves.'
    ]
  },
  {
    version: 'v0.158',
    date: '2026-08-25',
    changes: [
      'Resolved Image & Sprite Editor canvas and tool interaction blockage by decompressing internal binary stream artifacts in the HTML bundle.',
      'Removed conflicting dummy DOM Proxy overrides that disrupted standard document query lookups and element event attachment.',
      'Restored seamless bidirectional iframe message bridge for sprite file loading, saving, rendering, and active dirty state tracking.',
      'Enhanced Project Explorer module routing to accurately activate target sprite files when opened directly from the image explorer.'
    ]
  },
  {
    version: 'v0.157',
    date: '2026-08-25',
    changes: [
      'Added inline confirmation dialog when deleting file restore points in the Project Explorer modal.'
    ]
  },
  {
    version: 'v0.154',
    date: '2026-08-25',
    changes: [
      'Synchronized PNG image files and Sprite files on canvas saves so visual previews always reflect the latest saved drawing.',
      'Normalized per-file differential backup comparison to prevent creating duplicate checkpoints when restoring files.',
      'Added bidirectional restoration and instant UI preview refresh when restoring historical file versions.'
    ]
  },
  {
    version: 'v0.153',
    date: '2026-08-25',
    changes: [
      'Fixed sprite canvas reload loop when painting or editing canvas layers in Image & Sprite Studio.',
      'Added lastLoadedSpriteFileNameRef to prevent state updates from re-sending LOAD_PROJECT during drawing sessions.'
    ]
  },
  {
    version: 'v0.152',
    date: '2026-08-25',
    changes: [
      'Transitioned differential backups to per-file tracking in IndexedDB.',
      'Implemented "Previous Versions & Checkpoints" viewer and restorer in the Virtual File Explorer.',
      'Added live snapshot previews and one-click file version restoration for maps, biomes, prefabs, sprites, and assets.'
    ]
  },
  {
    version: 'v0.151',
    date: '2026-08-25',
    changes: [
      'Implemented automatic spritesheet animation frame slicing when editing spritesheet assets.',
      'Added export settings persistence (mode, dimensions, tiles, frame counts) linked across Sprite and Image project files.',
      'Streamlined sprite export options by removing height/roughness map buttons.',
      'Integrated differential project backup snapshots into IndexedDB for persistent project recovery.'
    ]
  },
  {
    version: 'v0.150',
    date: '2026-08-25',
    changes: [
      'Disabled direct browser auto-downloads during image export in favor of dedicated top bar export/download buttons.',
      'All image exports save silently and cleanly directly to the project /images/ subfolder with toast feedback.'
    ]
  },
  {
    version: 'v0.149',
    date: '2026-08-25',
    changes: [
      'Integrated PNG image export directly into project storage (/images/ subfolder).',
      'Cleaned Image Editor menu by eliminating redundant New/Load/Save/Save As iframe actions in favor of Mason top bar navigation.',
      'Updated Project Explorer to track and display /sprites/ and /images/ subfolders with full deletion and file inspection capabilities.',
      'Updated Project Dashboard with live counts and badges for .png image assets alongside .sprite files.'
    ]
  },
  {
    version: 'v0.148',
    date: '2026-08-25',
    changes: [
      'Updated Project Dashboard to track .sprite files directly from project storage instead of counting prefab spritesheets.',
      'Updated dashboard card extension badge to .sprite and included sprite files in total project file metrics.'
    ]
  },
  {
    version: 'v0.147',
    date: '2026-08-25',
    changes: [
      'Fixed file deletion across Image/Sprite Studio, Biome Editor, Map Editor, and Project Explorer.',
      'Removed blocking double window.confirm calls that prevented deletion after inline UI confirmation.',
      'Added full file deletion capabilities inside Project Explorer Modal with immediate state and storage sync.'
    ]
  },
  {
    version: 'v0.146',
    date: '2026-08-25',
    changes: [
      'Implemented custom interactive modal dialog for unsaved changes confirmation when switching image files, creating or duplicating sprites, or exiting to dashboard.',
      'Added immediate Save & Continue, Discard Changes, and Cancel handling to ensure user edits are never lost unintentionally.'
    ]
  },
  {
    version: 'v0.145',
    date: '2026-08-25',
    changes: [
      'Resolved SpriteEditor iframe save timeouts by safely catching errors during asynchronous image loads.',
      'Fixed blank canvases during project load due to empty image data throwing unhandled exceptions.',
      'Ensured `isSuppressingDirty` resets correctly after project load, restoring dirty state functionality and red save buttons.'
    ]
  },
  {
    version: 'v0.145',
    date: '2026-08-25',
    changes: [
      'Resolved SpriteEditor iframe save timeouts by safely catching errors during asynchronous image loads.',
      'Fixed blank canvases during project load due to empty image data throwing unhandled exceptions.',
      'Ensured  resets correctly after project load, restoring dirty state functionality and red save buttons.'
    ]
  },
  {
    version: 'v0.145',
    date: '2026-08-25',
    changes: [
      'Resolved SpriteEditor saves failing silently by fixing buildProjectData crashing in iframe.',
      'Fixed SVG caching missing patches and cross-file frame caching on load.',
      'Fixed SpriteEditor isDirty not firing on stroke completion, restoring glowing red Save button.',
      'Patched async load project execution to prevent dirty-state suppression overriding new user edits.'
    ]
  },
  {
    version: 'v0.145',
    date: '2026-08-25',
    changes: [
      'Sequential version bump to v0.145 maintaining strict version increment discipline.',
      'Verified zero-downtime hot reloading, development server stability, and production build readiness.'
    ]
  },
  {
    version: 'v0.142',
    date: '2026-08-25',
    changes: [
      'Eliminated asynchronous default SVG preset loading delays that blocked dirty state propagation.',
      'Fixed frames array clearing in resetProjectToDefaults, resolving the issue where old sprite graphics persisted into blank or newly switched files.',
      'Hardened buildProjectData with null-safe accessors for canvas data URLs, stamps, frames, and layers, preventing save serialization crashes.',
      'Added immediate visual toast notifications and error handling on saving, file switching, and sprite operations.',
      'Guaranteed dirty state notification dispatch on every stroke completion and layer manipulation so the Save button turns glowing red with live save prompts on file switch.'
    ]
  },
  {
    version: 'v0.141',
    date: '2026-08-25',
    changes: [
      'Fixed sprite dirty state suppression flags with try/finally lifecycle guarding so unsaved edits reliably mark the file dirty and never get silently discarded.',
      'Enhanced the Save button with an unmissable glowing red pulse, white badge, and bold highlight when unsaved changes exist in the active sprite.',
      'Synchronized the main top-right Save Project button to also glow red and pulse when sprite changes are pending.',
      'Ensured instant canvas clearing on sprite file switches to prevent previous sprite graphics from persisting into new files.',
      'Enabled reliable confirmation prompts when switching away from a modified sprite or creating new files with unsaved work.',
      'Fixed toast notification dispatching for sprite saves, file creation, duplication, and deletion.'
    ]
  },
  {
    version: 'v0.140',
    date: '2026-08-25',
    changes: [
      'Resolved sprite dirty state tracking bug caused by shadowed setDirty declaration in iframe context, restoring live red glowing Save button indicators.',
      'Fixed asynchronous file saving in Sprite Editor with explicit save acknowledgement and prompt confirmation dialogs on file switches and new sprite creation.',
      'Fixed canvas persistence bleed when switching between different .sprite files by awaiting clean reset/load promises before clearing dirty flags.',
      'Added success and informational toast notifications on saving, creating, duplicating, and deleting sprite files.'
    ]
  },
  {
    version: 'v0.139',
    date: '2026-08-25',
    changes: [
      'Preserved live canvas & tool state in memory when switching between Sprite Editor and other Mason modules (Maps, Biomes, Dashboard).',
      'Implemented confirmation dialog on switching between different .sprite files or creating new sprites when unsaved changes exist, giving choices to Save or Discard changes.',
      'Fixed workspace canvas clean reset on file switches to prevent pixel bleeding into empty sprite files.',
      'Updated active dirty state indicator on the header Save button to highlight red when changes are made.'
    ]
  },
  {
    version: 'v0.138',
    date: '2026-08-24',
    changes: [
      'Resolved `Invalid hook call` and `Cannot read properties of null (reading useState)` runtime errors in ProjectTaskBoard and ProjectDashboard components.',
      'Refactored hooks usage to access `React.useState` explicitly via default React namespace to avoid Vite module resolution and Fast Refresh destructuring collisions.'
    ]
  },
  {
    version: 'v0.137',
    date: '2026-08-24',
    changes: [
      'Resolved a critical SyntaxError resulting from a malformed replacement string block that aborted the entire script execution prematurely.',
      'Fixed a TypeError (Illegal invocation) inside the makeDummy proxy by correctly binding native HTML Element getters to the target instead of the Proxy wrapper.'
    ]
  },
  {
    version: 'v0.136',
    date: '2026-08-24',
    changes: [
      'Fixed a bug in Palette Spray Studio embedded applet causing a black screen on fresh sprite creation.',
      'Corrected string quotation in typeof checks and implemented a resilient makeDummy DOM fallback for optional module elements.',
      'Ensured proper canvas resize and initial rendering for empty LOAD_SPRITE events.'
    ]
  },
  {
    version: 'v0.135',
    date: '2026-08-24',
    changes: [
      'Refactored Palette Spray Studio into a streamlined, embedded Mason module and React modal component.',
      'Stripped standalone cloud storage overhead, Google Drive / OneDrive credentials, and PWA manifest links.',
      'Integrated SpriteEditorModal component allowing direct pixel art painting & spritesheet creation inside Prefab Editor.',
      'Added top-level Palette Spray Studio module entry to Mason Modules Registry.'
    ]
  },
  {
    version: 'v0.134',
    date: '2026-08-24',
    changes: [
      'Removed all sub-description flavor text from App Background Tone cards in the Theme modal.',
      'Background tone cards now display strictly the clean color name.',
      'Added hover tooltips (`title` attribute) on all background tone buttons to display the color name on hover.'
    ]
  },
  {
    version: 'v0.133',
    date: '2026-08-24',
    changes: [
      'Refocused the chromatic color spectrum to 36 clean 10° hue steps around the 360° color wheel.',
      'All 36 chromatic hues maintain 100% saturation and 50% lightness for vibrant, high-contrast theme selection.',
      'Preserved clear descriptive color titles (e.g. Pure Red, Scarlet Red, Deep Orange, Pure Yellow, Solar Lime, Pure Lime, Hyper Mint, Pure Cyan, Sky Blue, Pure Blue, Cosmic Violet, Pure Magenta).'
    ]
  },
  {
    version: 'v0.132',
    date: '2026-08-24',
    changes: [
      'Expanded the chromatic color spectrum to 72 precise 5° hue steps around the 360° color wheel, all tuned to 100% saturation and 50% lightness for strong, vivid contrast.',
      'Removed degree text from all color swatches in favor of clean, descriptive color names.',
      'Removed hex code text from the app background tone cards for a cleaner, streamlined theme selector.'
    ]
  },
  {
    version: 'v0.131',
    date: '2026-08-24',
    changes: [
      'Engineered a methodical 24-color palette divided into 19 vivid 20° chromatic hue steps around the 360° color wheel plus 5 distinct grayscale contrast values.',
      'Eliminated visually redundant overlapping swatches while maximizing dark-mode theme contrast across all app components.'
    ]
  },
  {
    version: 'v0.130',
    date: '2026-08-24',
    changes: [
      'Disbanded standalone Scientific CUD group and seamlessly integrated all Okabe-Ito colors directly into their matching chromatic hue spectrum positions.'
    ]
  },
  {
    version: 'v0.129',
    date: '2026-08-24',
    changes: [
      'Organized Custom Palette Mixer colors linearly by chromatic hue across all accent selectors.',
      'Removed user-facing color family labels, score badges, group headers, and dividers for a clean, seamless UI experience.'
    ]
  },
  {
    version: 'v0.128',
    date: '2026-08-24',
    changes: [
      'Organized Custom Palette Mixer colors chromatically by Hue spectrum (Reds & Roses, Oranges & Ambers, Golds & Yellows, Limes & Emeralds, Teals & Cyans, Blues & Indigos, Purples & Fuchsias, Neutrals, and Scientific CUD).',
      'Added explicit Hue Group sub-headers and badges to the Main App Accent selector.',
      'Added chromatic hue dividers and group hover labels across all module swatch selection rows.'
    ]
  },
  {
    version: 'v0.127',
    date: '2026-08-24',
    changes: [
      'Added Color Family classification (Red, Orange, Yellow, Green, Blue/Cyan, Purple, Neutral) to prevent blue variants from being treated as distinct hues.',
      'Refined all standard theme presets to maximize true color family diversity across 6-7 distinct families.',
      'Added Live Palette Family Distinction Score and Family Coverage badges to Theme Modal preset cards & Custom Palette Mixer.',
      'Added Color Family names to swatch button tooltips in custom theme mixer.'
    ]
  },
  {
    version: 'v0.126',
    date: '2026-08-24',
    changes: [
      'Updated Theme Modal & Theme Engine to support all 6 installed modules including Particles & VFX (.particle).',
      'Added Particles module accent color customization to Theme Modal custom palette mixer and preset spectrum strips.',
      'Connected Particles Editor subfolder header to dynamic theme module colors.'
    ]
  },
  {
    version: 'v0.125',
    date: '2026-08-24',
    changes: [
      'Fixed hurtbox and hitbox collider visibility toggling in Prefab Composition Studio to sync with the Colliders toolbar button.'
    ]
  },
  {
    version: 'v0.124',
    date: '2026-08-24',
    changes: [
      'Migrated Prefab Composition Viewport to the shared useMasonViewport and ViewportCanvasContainer sub-modules.',
      'Added originMode support to useMasonViewport for exact cursor-anchored zoom in center-origin viewports.',
      'Configured default paused animation state and clean default sockets/colliders for new prefabs.'
    ]
  },
  {
    version: 'v0.123',
    date: '2026-08-24',
    changes: [
      'Fixed spritesheet slicing mathematics, preserving user column count and row boundaries without auto-overwrites.',
      'Eliminated preview canvas stretching using dynamic ResizeObserver viewport sizing for true 1:1 pixel rendering.',
      'Added single-row strip auto-detection and quick selectors for 1-click column & row adjustments.'
    ]
  },
  {
    version: 'v0.122',
    date: '2026-08-23',
    changes: [
      'Added full motion blur support to both Particle and Prefab animation timelines.',
      'Particles Engine stretches particles dynamically across their velocity vector based on the motion blur track intensity.',
      'Prefab Editor features a new Sprite Blur track in the Animation Studio Matrix for keyframing visual motion blur during fast character animations.'
    ]
  },
  {
    version: 'v0.122',
    date: '2026-08-23',
    changes: [
      'Fixed React state mutation bug in bi-directional sync which caused animation settings to stop rendering.'
    ]
  },
  {
    version: 'v0.113',
    date: '2026-08-23',
    changes: [
      'Fixed bidirectional sync bug where animation track edits were overwritten by initialization fields.'
    ]
  },
  {
    version: 'v0.112',
    date: '2026-08-23',
    changes: [
      'Initialization & Animation Bi-Directional Synchronization: Merged base initialization properties (start/mid/end colors, sizes, alpha, emissive, rotation) with track node keyframes so editing initialization parameters instantly updates animation gradients and viewport rendering.'
    ]
  },
  {
    version: 'v0.122',
    date: '2026-08-23',
    changes: [
      'Rule & Version Enforcement: Established strict project rules requiring sequential integer version bumping across package.json, version.ts, and service worker cache on every code update.'
    ]
  },
  {
    version: 'v0.110',
    date: '2026-08-23',
    changes: [
      'Particle Matrix & Color Flow Fixes: Synchronized the timeline matrix scrubber slider position with the overlay row indicator line, and unified color flow keyframe nodes with inspector color settings using robust hex normalization.'
    ]
  },
  {
    version: 'v0.109',
    date: '2026-08-23',
    changes: [
      'Particle Viewport Zoom: Fixed mouse wheel zoom behavior in the particle editor viewport to correctly center and scale toward the mouse cursor position.'
    ]
  },
  {
    version: 'v0.108',
    date: '2026-08-23',
    changes: [
      'React Hook Import Fixes: Resolved runtime `useState` and `useMemo` errors by explicitly importing `useMemo`, `useEffect`, and `useCallback` directly from \'react\' across core components and custom hooks.',
      'Build Stability: Verified type checking and production bundling across all editor modules.'
    ]
  },
  {
    version: 'v0.107',
    date: '2026-08-23',
    changes: [
      'Particle Emitter Initialize Ranges: Updated continuous rate, lifespan (min/max age), periodic burst count, and burst interval properties in the Emitter configuration card to be configurable as dynamic range parameters.',
      'Periodic Burst Control Checkbox: Added checkbox to easily enable or disable periodic burst emitters in the particle simulation, with visual disabling of corresponding fields.',
      'Interactive Visual Graph Dragging Fix: Hardened world map node panning & drag mechanics to completely prevent node stutter, jitter, or snapping issues.'
    ]
  },
  {
    version: 'v0.104',
    date: '2026-08-23',
    changes: [
      'Visuals tab FX Animation Styles: Implemented customizable "One-Shot", "Oscillate" (bouncing triangle wave), and "Repeat" loop modes for particle Size, Color/Alpha, Emissive Light/Glow, and Rotation properties.',
      'Inverted Drag Controls: Reversed motion drag sliders and randomized ranges so that 0 represents no air drag (100% velocity retention) and 1 represents maximum drag (velocity stops immediately).'
    ]
  },
  {
    version: 'v0.103',
    date: '2026-08-23',
    changes: [
      '3-Keyframe Air Drag Lifecycle: Integrated multi-stage air drag kinematics curves with customizable Start, Mid, and End air resistance values, random ranges, and motion curve profiles.',
      'Fixed ReferenceError: Added missing RotateCw icon import from lucide-react.'
    ]
  },
  {
    version: 'v0.102',
    date: '2026-08-23',
    changes: [
      'Emissive Lighting & Glow: Added Emissive toggle with 3-keyframe color & radius controls, curve animation, and "Glow Only" vs "Light Up Area" dynamic scene casting.',
      'Particle FX Animation Styles: Integrated 5 behavioral FX presets (Default 3-Keyframe, Pulse & Oscillate, Flicker & Shimmer, Orbit & Swirl, Spark & Crackle).',
      '3-Keyframe Rotation Lifecycle: Added Start, Mid (with Mid keyframe checkbox), and End rotation ranges (°), with customizable rotation lifecycle curves.',
      'Interactive Viewport Test Scenes: Enhanced viewport theme backgrounds with interactive geometry (Dungeon Wall & Pillars, 3D Wooden Box Crate Obstacles & Shelves, Dark Forest & Moon, Crystal Cave) and obstacle collision logic.'
    ]
  },
  {
    version: 'v0.101',
    date: '2026-08-23',
    changes: [
      'Mid Size Keyframe Checkbox: Added a matching "Mid keyframe" checkbox in the Size Lifecycle header.',
      'Auto-Calculated Midpoint: When Mid Size Keyframe is unchecked, size lifecycle curves smoothly evaluate with auto-calculated midpoint values.'
    ]
  },
  {
    version: 'v0.100',
    date: '2026-08-23',
    changes: [
      'Streamlined Alpha Controls UI: Replaced button toggles with clean "Mid keyframe" and "Range" checkboxes.',
      'Cleaner Slider Layout: Removed redundant color/range bar indicators so opacity range is cleanly read directly from min/max dual range sliders.'
    ]
  },
  {
    version: 'v0.99',
    date: '2026-08-23',
    changes: [
      'Full 3-Point Lifecycle Animation Curves: Refactored particle size and alpha evaluation engines to support 6 custom curve modes (Balanced Smooth, Straight Linear, Fast Attack/Long Fade Out, Slow Build/Short Ease Out, Bell Arch Swell, Burst Peak Decay) operating across full particle lifetimes.',
      'Dual-Thumb Alpha Opacity Sliders: Replaced confusing text inputs with interactive dual-thumb sliders featuring real-time visual range tracks, fixed opacity vs random range toggles, and optional mid-keyframe alpha controls.'
    ]
  },
  {
    version: 'v0.98',
    date: '2026-08-23',
    changes: [
      'Pixel-Perfect Nearest-Neighbor Buffer Scaling: Offscreen rendering and buffer scaling in the Particle Module now strictly enforce nearest-neighbor interpolation (`imageSmoothingEnabled = false`), delivering pixel-perfect retro aesthetics across all resolution scales.',
      'Size Lifecycle (Start, Mid, End): Added keyframed 3-stage size lifecycle evaluation (`startSize` → `midSize` → `endSize`), matching the existing color gradient lifecycle.',
      'Randomized Size & Alpha Ranges: Added min/max range controls for start size, mid size, end size, start alpha, mid alpha, and end alpha, giving every individual particle randomized lifecycle variation.'
    ]
  },
  {
    version: 'v0.97',
    date: '2026-08-23',
    changes: [
      'Top Navigation Bar Particle Icon: Fixed icon mapping so the particles module icon in the top bar uses Sparkles, matching the project dashboard card.',
      'Particle Surface Restitution & Energy Damping: Particles resting on collision surfaces now settle smoothly when bounce restitution energy drops below threshold, eliminating jitter while remaining fully reactive to wind and gravity forces.',
      'Version Synchronization: Bumped Mason release version to v0.97 across package manifest, engine constants, and release history.'
    ]
  },
  {
    version: 'v0.96',
    date: '2026-08-23',
    changes: [
      'Biome Gravity System: Added biome gravity multiplier controls in Biome Studio (Standard 1.0x, Zero-G / Weightless 0.0x, Low-G Moon 0.3x, Heavy 1.8x, Inverted -1.0x, or Custom scale).',
      'Prefab Gravity Overrides: Added action to allow prefab behaviors to override biome gravity or revert back to biome defaults dynamically.',
      'Prefab Variable Binding: Prefab behaviors can now bind and read prefab variables (e.g., speed, jump_force, gravity_scale) for movement velocity, impulse jump forces, and gravity modifiers.',
      'Sensory Triggers Refinement: Removed redundant gravity filters from prefab triggers, unifying gravity state checks into the multi-condition IF evaluation engine.'
    ]
  },
  {
    version: 'v0.95',
    date: '2026-08-23',
    changes: [
      'Engine Sensory Triggers: Integrated solid detection (left, right, ceiling, floor, forward, backward, ledge ahead) and kinematics physics triggers (jump peak, apex, falling, rising, grounded, wall sliding).',
      'Multi-Condition IF Evaluator: Added full AND / OR multi-trigger condition evaluation in Prefab and Behavior rules.',
      'Parallax Viewport Centering: Parallax backdrop rendering strictly synchronizes with the center viewport chunk, fading out completely when positioned over unallocated void chunks.',
      'Top Navigation Polish: Removed theme shortcut button from top navbar in favor of main menu theme settings.'
    ]
  },
  {
    version: 'v0.94',
    date: '2026-08-22',
    changes: [
      'Prefab Studio Viewport Defaults: Configured sensory sockets, hitboxes, and collision capsule overlays to be turned OFF by default in the animation viewport so only the clean sprite is visible on launch.',
      'Map Module Animation Speed Calibration: Fixed the delta-time physics timer calculation in play mode so prefab animation frame transitions play smoothly at their exact configured FPS rate.',
      'Prefab Sprite & Capsule Alignment: Realigned the map spawn marker, placement preview, and interactive player sprite to use center-anchored coordinates matching the Prefab Studio definition and exact capsule offset.'
    ]
  },
  {
    version: 'v0.93',
    date: '2026-08-22',
    changes: [
      'Map Module Prefab Sync: Auto-synchronized the Map Editor "Test Hero" selector with the active prefab file in Prefab Studio.',
      'Real Prefab Sprite Rendering: Updated Map Canvas to render the actual prefab spritesheet frames, collision capsules, and orientation at the spawn location and placement hover preview instead of a generic capsule proxy.',
      'Play Mode Sprite Animation: Animated real prefab sprites in Play Mode with state-based clip selection (idle, walk, run, jump, attack, dash), facing direction flips, and squash-and-stretch effects.'
    ]
  },
  {
    version: 'v0.92',
    date: '2026-08-22',
    changes: [
      'Prefab Animation Studio: Square Keyframe Matrix Grid — Fixed layout and column width table styling with <colgroup> definitions and w-max table-fixed rules, enforcing perfect 28px × 28px square cells.',
      'Keyframe Matrix UI Polish: Replaced text coordinates with compact centered indicator badges (◆ for keyframes, ○ for holding frames), added vertical drag-resize handles and S/M/L height presets.',
      'Left Sidebar Resizing: Implemented interactive draggable border handle for adjustable animation sidebar width.'
    ]
  },
  {
    version: 'v0.91',
    date: '2026-08-22',
    changes: [
      'Map Module HUD Enhancement: Replaced the center-top Region Transitioning progress overlay with an Upper-Left Map Chunk Biome HUD inspector.',
      'Real-Time Hover Inspection: The new upper-left HUD dynamically tracks the mouse cursor and displays the exact chunk coordinates [cx, cy], tile coordinates (x, y), biome name, and regional color gem for whichever chunk is currently hovered.'
    ]
  },
  {
    version: 'v0.90',
    date: '2026-08-22',
    changes: [
      'Prefab Module Spritesheet Optimization: Removed redundant Total Frames input from spritesheet slot cards (frames are configured directly per animation clip).',
      'Tile Grid Inspector Cleanup: Removed the redundant "Set as Start Frame" button from the spritesheet inspector.',
      'Fixed Spritesheet Zoom & Viewport Framing: Synchronized tile grid cell dimensions with background slice size and offsets across all zoom levels (0.5x, 1x, 2x, 3x, 4x), guaranteeing every sprite frame stays perfectly centered and bounded inside each cell.'
    ]
  },
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
      'Sticky Module Tabs: Made primary workspace tabs in Prefab Creator (Animation Studio, Spritesheets, Variables, States, Behaviors) and Biome Editor sticky so they never scroll away.',
      'Header Consolidation: Combined Project Info/Dashboard navigation and file operations into a single sleek h-9 bar, aligning Copy Rules/Vars alongside the prefab metadata.'
    ]
  },
  {
    version: 'v0.78',
    date: '2026-08-18',
    changes: [
      'App Layout: Added persistent, always-visible Module Tabs Bar (Dashboard, Maps, Biomes, Prefabs, UI HUD, World Graph) for instant 1-click navigation.',
      'Vertical Space Optimization: Condensed headers, file subfolder breadcrumb bars (h-9), and workspace tabs across all modules with compact pill styles and tooltips.',
      'Prefab FSM Engine: Fixed Add State and Add Transition modals, enabling instant visual creation and configuration of state nodes and transition triggers.'
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
      'Prefab Module: Added group & individual visibility toggles for Sprite, Capsule, Sockets, and Hitboxes in the 2D Viewport and Sidebar.',
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
      'Behaviors: Added a "Variables" tab to allow Behavior scripts to dictate custom RPG stats, attributes, and proficiencies to linked Prefabs (with static/open enforcement).',
      'Prefabs: Refactored the RPG Stats tab to dynamically render variables exposed by the linked Behavior script.',
      'Behaviors: Added an animation selector dropdown to the "Play Animation State" action node, which aggregates available animations from assigned prefabs.'
    ]
  },
  {
    version: 'v0.74',
    date: '2026-08-18',
    changes: [
      'Engine: Completely decoupled and removed Archetypes from the architecture, merging stats and functionality directly into the Prefab Editor.',
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
      'Prefab Module: Resolved viewport stretching regression by dynamically syncing internal canvas buffer dimensions with container width/height instead of fixed aspect ratio scaling.',
      'Prefab Module: Fixed point & polygon snap-back on drag release by guaranteeing prefab file insertion in project filesystem and updating both active keyframe and base prefab anchors upon mouse release.'
    ]
  },
  {
    version: 'v0.70',
    date: '2026-08-17',
    changes: [
      'Prefab Module: Fixed silent failure where new keyframes were not saved if the base animation object had not yet been formally initialized in the prefab\'s data array.'
    ]
  },
  {
    version: 'v0.69',
    date: '2026-08-17',
    changes: [
      'Prefab Module: Bulletproofed global project state updates with deep cloning to prevent React from dropping mouseup commits.',
      'Prefab Module: Consolidated overlapping canvas and global mouseup event handlers to prevent race conditions during drag release.'
    ]
  },
  {
    version: 'v0.68',
    date: '2026-08-17',
    changes: [
      'Prefab Module: Re-architected canvas point/polygon dragging to use local component state (dragOverride) instead of dispatching global project updates on every mouse move, completely eliminating the 60fps rendering bottleneck/hang.',
      'Prefab Module: Restricted canvas panning exclusively to Right-Click (button 2) as requested.'
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
      'Prefab Module: Fixed item dragging in viewport by resolving a stale closure on the live keyframe updater',
      'All Modules: Standardized panning controls to allow Right Click across all editor canvases'
    ]
  },
  {
    version: 'v0.64',
    date: '2026-08-17',
    changes: [
      'Prefab Module: Fixed canvas viewport mouse coordinate scaling factor to account for CSS resolution vs buffer size',
      'Prefab Module: Expanded point and polygon vertex hit detection targets (16px and 14px canvas radii)',
      'Prefab Module: Added point-in-polygon body click selection so clicking anywhere inside a hitbox selects it',
      'Prefab Module: Auto-pause animation playback during dragging to prevent keyframes from ticking',
      'Prefab Module: Fixed viewport wheel zoom event listener with non-passive preventDefault to prevent outer page scrolling',
      'Prefab Module: Enforced crisp handle sizing on screen regardless of zoom level'
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
