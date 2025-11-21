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
