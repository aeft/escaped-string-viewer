# Inline Escaped String Renderer (MV3)

Render selected escaped strings (like `\n`, `\t`, `\uXXXX`) in a floating panel on any page.

## Install (Developer Mode)

1. Clone or download this folder.
2. Open **chrome://extensions**.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked** and select the folder.

## Use

- Select any text containing escaped sequences, or a quoted string literal.
- On mouseup, the panel appears near the cursor with the decoded version.
- **Copy** copies the decoded text. **Wrap** toggles line wrapping. **✕** closes the panel.
- Press **Esc** to close.

## What gets decoded?

- Common sequences: `\\n`, `\\r`, `\\t`, `\\"`, `\\\\`, and `\\uXXXX`.
- It detects both raw escaped fragments (e.g., `#!/usr/bin/env python\\nimport os`) and quoted strings (e.g., `"#!/usr/bin/env python\\n..."`).

## Notes

- The panel is injected into a Shadow DOM to avoid style collisions.
- Only a content script is needed; no background service worker.
- If your selection is very large, consider wrapping ("Wrap: ON") to make it more readable.

## Privacy

- The extension does not send data anywhere. All decoding happens locally in the content script.
