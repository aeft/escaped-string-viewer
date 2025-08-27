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
