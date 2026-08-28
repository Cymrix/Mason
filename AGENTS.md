# Project Guidelines & Persistent Instructions

## Versioning Policy (CRITICAL)
- **ALWAYS bump the release version number on EVERY prompt / change request**, no matter how big or small the change.
- Version numbers follow direct sequential increments (e.g. `0.182` -> `0.183` -> `0.184`).
- Whenever code changes are made, update the following files synchronously:
  1. `src/version.ts` - Update `MASON_VERSION`, `MASON_VERSION_DISPLAY`, `MASON_FULL_VERSION`, and append a new release entry in `MASON_RELEASE_HISTORY`.
  2. `package.json` - Update the `"version"` field.
  3. `package-lock.json` - Update both top-level and root package `"version"` fields.
