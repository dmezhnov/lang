# Lang — syntax highlighting for a small DSL

This extension adds support for the `lang` language in VS Code:

- **syntax highlighting** for `*.lang` files (`where` clauses, types,
  variables, function-like definitions, etc.);
- example programs in the `examples` folder;
- tests that exercise every TextMate scope in the grammar.

## Usage

- Install the extension (locally from `.vsix` or from the Marketplace).
- Open a file with the `.lang` extension — the language will be
  detected automatically.
- Open a file with the `.lang` extension — the language will be
  detected automatically.

## Editor Support (LSP)

This extension includes a standalone Language Server Protocol (LSP) binary that can be used with other editors like Neovim, Helix, or Emacs.

### Neovim (nvim-lspconfig)

```lua
local configs = require('lspconfig.configs')
local lspconfig = require('lspconfig')

if not configs.lang_language then
  configs.lang_language = {
    default_config = {
      cmd = { "lang-language-server", "--stdio" },
      filetypes = { "lang" },
      root_dir = lspconfig.util.root_pattern(".git", "package.json"),
      settings = {},
    },
  }
end

lspconfig.lang_language.setup({})
```

### Helix

Add to your `languages.toml`:

```toml
[[language]]
name = "lang"
scope = "source.lang"
injection-regex = "lang"
file-types = ["lang"]
roots = ["package.json"]
language-server = { command = "lang-language-server", args = ["--stdio"] }
```

Ensure `lang-language-server` is in your PATH (install via `npm install -g dmezhnov/lang`).
## Development

From the project root:

- install tools and dependencies (if needed):

```bash
mise run install
```

- generate the grammar and language configuration (and build a `.vsix` package):

```bash
mise run build
```

- run tests:

```bash
mise run test
```

- run linting (Trunk):

```bash
mise run lint
```

## Packaging and publishing

1. Build a `.vsix` package:

```bash
mise run build
```

1. Publish (requires a configured publisher on the VS Code
   Marketplace):

```bash
mise run publish
```

Before publishing for real, replace the `publisher` field in
`package.json` with your own Marketplace publisher identifier.
