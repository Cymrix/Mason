# Agent Instructions & Workflow Protocol for Mason

## 🚨 CRITICAL HARD RULE: BUMP APP VERSION ON EVERY SET OF CHANGES

Whenever you make any group of changes, implement a feature, fix a bug, or fulfill a user prompt, **YOU MUST BUMP THE MASON APPLICATION VERSION**.

### Version Bump Checklist (Mandatory for Every Iteration)

1. **`src/version.ts`**:
   - Increment `MASON_VERSION` (e.g. `'0.84'` -> `'0.85'`).
   - Increment `MASON_VERSION_DISPLAY` (e.g. `'v0.84'` -> `'v0.85'`).
   - Increment `MASON_FULL_VERSION` (e.g. `'v0.84'` -> `'v0.85'`).
   - Prepend a new entry to `MASON_RELEASE_HISTORY` with the new version tag, current date (`YYYY-MM-DD`), and bullet points detailing the changes made.

2. **`package.json`**:
   - Synchronize `"version": "0.XX"` to match the new version in `src/version.ts`.

3. **`public/sw.js`**:
   - Update `CACHE_NAME = 'mason-v0.XX'` to force Service Worker cache refresh and ensure PWAs and offline clients receive the updated build.

### Versioning Format Rules
- Use strictly sequential integers without sub-patch numbers (e.g. `v0.80` -> `v0.81` -> `v0.82` -> `v0.83` -> `v0.84` -> `v0.85` -> `v0.86`).
- Never skip numbers or downgrade versions.

---

## 🛠️ Additional Development Guidelines

### 1. Brand Assets & Vector Icons
- Always use the standalone vector component `MasonBrandIcon` (`src/components/MasonBrandIcon.tsx`) for in-app brand emblems to ensure reliable rendering across GitHub Pages subpaths, custom domains, offline modes, and installed PWAs.
- Keep `public/favicon.svg` and `public/icon.svg` aligned with the vector brand icon specifications.

### 2. Variable & Schema Conventions
- All RPG stats, character attributes, and custom variables must follow the `var_xxxxxxxx` (8-character lowercase hex) ID format.

### 3. State & Persistence
- State modifications must be immutable / deep-cloned to guarantee React re-renders and reliable synchronization with IndexedDB and localStorage stores.
