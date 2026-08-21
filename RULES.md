# Project Rules & Development Guidelines for Mason

## 🚨 MANDATORY HARD RULES (NON-NEGOTIABLE)

### 1. INCREMENT THE VERSION NUMBER ON EVERY ITERATION / PROMPT
With **EVERY** group of changes, prompt request, or feature update:
1. **`src/version.ts`**:
   - Bump `MASON_VERSION = '0.XX'` (e.g. `0.76` -> `0.77` -> `0.78`).
   - Bump `MASON_VERSION_DISPLAY = 'v0.XX'`.
   - Bump `MASON_FULL_VERSION = 'v0.XX'`.
   - Prepend a new entry to `MASON_RELEASE_HISTORY` detailing the exact user requests and changes implemented.
2. **`package.json`**:
   - Update `"version": "0.XX"` to match `src/version.ts`.
3. **`public/sw.js`**:
   - Update `CACHE_NAME = 'mason-v0.XX'` to force Service Worker cache refresh.

### 2. CONVENTIONS & CONSTRAINTS
- **Variables Format**: Custom stats and variables must always follow the `var_xxxxxxxx` (8-character lowercase hex) ID format.
- **State Machine**: States and transitions authored in the States graph must seamlessly link with Behavior rules as triggers and actions.
- **Collapsible Rules**: Behavior rules must remain collapsed/minimized by default for clean UX.
- **No Mock Data / Silent Overwrites**: Deep clone state modifications and ensure IndexedDB + LocalStorage sync seamlessly.
