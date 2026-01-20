# Lang Language

A domain-specific language (DSL) for mathematical and business logic modeling with first-class support for VS Code and Zed editors.

## Features

- **Syntax highlighting** for `.lang` files
- **Language Server Protocol (LSP)** support with diagnostics and autocompletion
- **Mathematical operators**: `of`, `from`, `for`
- **Significant whitespace** support (Python-style indentation)
- **Type annotations** and validation

## Editor Support

### VS Code

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=dmezhnov.lang-language) or [OpenVSX](https://open-vsx.org/extension/dmezhnov/lang-language).

### Zed

The Zed extension is available in `zed-extension/`. See [zed-extension/README.md](zed-extension/README.md) for installation instructions.

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Mise](https://mise.jdx.dev) (optional but recommended)
- [Nix](https://nixos.org) (for Zed extension on NixOS)

### Setup

```bash
# Install dependencies
bun install
# or
mise install

# Build all extensions
mise build

# Run tests
mise test

# Watch mode (VS Code extension only)
mise watch
```

### Project Structure

```
lang/
├── package.json              # Monorepo root
├── vscode-extension/         # VS Code extension
├── zed-extension/            # Zed extension (Rust/WASM)
├── scripts/                  # Build and publish scripts
└── examples/                 # Example .lang files
```

### Building

```bash
# Build everything (VS Code VSIX + Zed WASM)
mise build

# Build only VS Code
bun run build

# Build only Zed
mise build:zed
```

### Publishing

```bash
# Publish to VS Code Marketplace + OpenVSX + sync Zed branch
mise publish
```

See [vscode-extension/README.md](vscode-extension/README.md) for VS Code-specific details.

## License

[MIT](LICENSE) © 2026 The Lang extension authors
