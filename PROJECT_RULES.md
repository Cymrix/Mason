# Project Rules for Mason

## 🚨 HARD RULES

### 1. Sequential Integer Version Bumping
Every prompt/iteration change **MUST** bump the version number:
- `package.json` (`"version": "0.XX"`)
- `src/version.ts` (`MASON_VERSION`, `MASON_VERSION_DISPLAY`, `MASON_FULL_VERSION`, and `MASON_RELEASE_HISTORY`)
- `public/sw.js` (`CACHE_NAME`)

### 2. Variable ID Specification
All RPG / Character / Behavior variables must use the format `var_xxxxxxxx` (8-hex characters).
