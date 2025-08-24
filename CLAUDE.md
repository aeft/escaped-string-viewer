# CLAUDE.md

ALWAYS update the CLAUDE.md after you updating the code. The CLAUDE.md MUST be consistant with the code.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension (Manifest V3) that renders escaped strings in a floating preview panel. The extension detects selected text containing escape sequences like `\n`, `\t`, `\uXXXX` and displays the decoded version in an interactive overlay.

## Architecture

- **manifest.json**: Chrome extension manifest defining permissions and content script injection
- **content.js**: Main content script that handles text selection, escape sequence detection, and UI management
- **styles.css**: Styling for the Shadow DOM-based floating panel to avoid style conflicts with host pages

## Key Components

### Content Script (`content.js`)

- Uses Shadow DOM (`attachShadow`) to isolate extension UI from page styles
- Implements debounced selection handling to avoid performance issues
- Supports three decoding modes:
  1. Direct quoted string parsing with `JSON.parse()`
  2. Extraction of longest quoted JSON string from selection
  3. Loose escape sequence decoding for unquoted text
- Panel positioning with viewport boundary detection

### Escape Sequence Handling

The extension processes common escape sequences:

- `\n`, `\r`, `\t` (whitespace)
- `\"`, `\\` (quote/backslash escaping)
- `\uXXXX` (Unicode sequences)

## Development Commands

Since this is a browser extension without build tooling:

- **Install**: Load unpacked extension in Chrome developer mode from `chrome://extensions`
- **Debug**: Use Chrome DevTools on any page where the extension is active
- **Test**: Select text with escape sequences on any webpage to verify functionality

## Extension Loading

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. The extension will be active on all pages (`<all_urls>`)

## File Structure Notes

- No build process or package manager dependencies
- Pure vanilla JavaScript with Chrome extension APIs
- Styles use Shadow DOM isolation (`:host` selectors)
- Content script runs at `document_idle` for optimal page load performance
