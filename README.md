# Escaped String Viewer

Chrome extension that shows you what escaped strings actually look like when rendered.

## Examples

**Example 1**: Select `"def hello():\n    print(\"World\")\n    return True"` and see properly formatted Python code.

**Example 2**: Select `"# Title\n\n- Item 1\n- Item 2\n\n**Bold text**"` and see rendered markdown structure.

**Note**: No need for precise selection! You can select entire lines of code or logs - the extension automatically extracts the longest escaped string from your selection.

![String Preview Demo](./assets/demo.gif)

## Features

- **Instant Preview**: Select any text containing escape sequences to see the rendered output
- **Smart Detection**: Automatically finds and decodes quoted strings in complex text
- **Multiple Formats**: Supports `\n`, `\t`, `\r`, `\"`, `\\`, `\uXXXX` and more

## Installation

### Chrome Web Store (Coming Soon)

*Extension will be available on Chrome Web Store*

### Manual Installation

1. Download or clone this repository
2. Run `npm install && npm run build`
3. Open `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `dist/` folder

## How it Works

1. **Text Selection**: When you select text on any webpage, the extension automatically detects it
2. **Smart Parsing**: Uses two methods to find escaped strings:
   - Direct parsing of complete quoted strings like `"Hello\nWorld"`
   - Extraction of the longest quoted string from complex text
3. **JSON Decoding**: Applies `JSON.parse()` to safely decode escape sequences
4. **Visual Preview**: Shows the rendered result in a floating panel with:
   - Proper line breaks and formatting
   - Copy-to-clipboard functionality
   - Visual distinction between natural and wrapped line breaks

## Development

```bash
npm install        # Install dependencies
npm run dev        # Development mode with file watching
npm run build      # Production build
npm run package    # Create extension.zip for distribution
```

## Privacy

All string processing happens locally in your browser. No data is sent to external servers.

## License

MIT
