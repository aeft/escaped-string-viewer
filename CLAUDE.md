# CLAUDE.md

* ALWAYS update the CLAUDE.md after you updating the code. The CLAUDE.md MUST be consistent with the code.
* ONLY use English when you are writing code / documents / comments.
* PROJECT OVERVIEW: This is a Chrome browser extension (Manifest V3) built with TypeScript that renders escaped strings in a floating preview panel. The extension detects selected text containing escape sequences like `\n`, `\t`, `\uXXXX` and displays the decoded version in an interactive overlay.

## Architecture

- **Main Files:**
  - `src/content.ts` - Content script that handles text selection and UI rendering
  - `src/popup.ts` - Extension popup for settings management
  - `src/utils/string-processor.ts` - Core string processing logic
  - `src/utils/settings-manager.ts` - Chrome storage settings management
  - `src/types/index.ts` - TypeScript type definitions

## Build Commands

- `npm run build` - Full production build
- `npm run dev` - Development mode with TypeScript watch
- `npm run package` - Create extension.zip for distribution
- `npm run type-check` - TypeScript type checking only

## Release Process

The project uses GitHub Actions for automated releases:

- **Workflow File:** `.github/workflows/release.yml`
- **Trigger:** Push tags with pattern `v*` (e.g., `v1.0.0`, `v2.1.3`)
- **Process:** 
  1. Installs dependencies
  2. Runs type checking
  3. Builds and packages the extension
  4. Creates GitHub release with extension.zip attached

**To create a release:**
```bash
git tag v1.0.1
git push origin v1.0.1
```
