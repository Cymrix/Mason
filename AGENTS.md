# Project Guidelines & Persistent Instructions

## Versioning Policy (CRITICAL)
- **ALWAYS bump the release version number on EVERY prompt / change request**, no matter how big or small the change.
- Version numbers follow direct sequential increments (e.g. `0.182` -> `0.183` -> `0.184`).
- Whenever code changes are made, update the following files synchronously:
  1. `src/version.ts` - Update `MASON_VERSION`, `MASON_VERSION_DISPLAY`, `MASON_FULL_VERSION`, and append a new release entry in `MASON_RELEASE_HISTORY`.
  2. `package.json` - Update the `"version"` field.
  3. `package-lock.json` - Update both top-level and root package `"version"` fields.

## Naming & Terminology Policy (STRICT BANS)
- **BANNED TERM 1 ("STUDIO")**: The word **"Studio" / "studio"** is strictly forbidden in all module names, UI labels, tab headers, component names, modal titles, button labels, tooltips, comments, schema descriptions, and logs, unless explicitly requested by the user.
- **BANNED TERM 2 ("PALETTE SPRAY")**: The term **"Palette Spray" / "Palette Spray Studio" / "Palette Spray Painter"** is strictly forbidden anywhere in this project (as it was an external legacy app name). Use **"Image & Sprite Editor"** or **"Sprite Editor"** instead.
- **Allowed Replacement Terminology**:
  - Prefer **"Editor"** (e.g. *Tilemap Editor*, *Animation Editor*, *Biome Editor*, *Prefab Editor*, *Particle Systems Editor*, *Image & Sprite Editor*).
  - Alternative context-appropriate terms: **"Canvas"** (e.g. *Composition Canvas*, *Macro Canvas*), **"Suite"** (e.g. *Mason World Authoring Suite*, *Mason Suite*), **"Workspace"**, or **"Creator"** / **"Organization"**.

