# Lang Language for Zed

Syntax highlighting and language server support for the Lang programming language in Zed.

## Features

- **Syntax highlighting** for `.lang` files
- **Language Server Protocol (LSP)** with diagnostics and autocompletion
- **Mathematical operators**: `of`, `from`, `for`
- **Indentation-based blocks** (like Python)

## Installation

### From Zed Extensions Panel

1. Open Zed
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Linux/Windows)
3. Type "zed: extensions"
4. Search for "Lang"
5. Click Install

### Manual Installation (Development)

1. Open Zed
2. Press `Cmd+Shift+P` → "zed: install dev extension"
3. Navigate to this `zed-extension/` folder
4. Select the folder

## Usage

Open any `.lang` file — syntax highlighting and LSP features will activate automatically.

## Language Server

The bundled language server provides:
- **Error diagnostics** (undefined variables, type mismatches)
- **Hover information**
- **Autocompletion** (keywords, variables)

## Examples

```lang
x = 5
y of x
  value = 10
```

See [examples/](../examples/) for more.

## Links

- [Main Repository](https://github.com/dmezhnov/lang)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=dmezhnov.lang-language)
- [Report Issues](https://github.com/dmezhnov/lang/issues)

## License

[MIT](LICENSE)
