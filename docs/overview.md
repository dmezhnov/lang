# Lang language overview

This repository contains a small Visual Studio Code extension for the `lang`
language. The extension is focused on providing:

- syntax highlighting powered by a TextMate grammar;
- basic structural syntax validation with inline diagnostics;
- examples that demonstrate the language constructs.

## Features

- **Syntax highlighting**
  Highlighting is implemented via the generated TextMate grammar in
  `syntaxes/lang.tmLanguage.json`. It covers:

  - `where` keyword;
  - numbers;
  - identifiers and function‑like definitions;
  - punctuation and operators such as `=`, `of`, `from`, `for`, `...`,
    parentheses, and braces;
  - Markdown‑style heading lines that start with `#`, `##`, `###`, etc.

- **Structural syntax validation**
  The extension runs a lightweight validator for `*.lang` files. It checks:

  - inconsistent indentation that does not match any previous indentation
    level in the file;
  - incorrect placement of `where` blocks (for example, a `where` line without
    a preceding statement at a lower indentation level, or multiple `where`
    blocks for the same statement);
  - unbalanced parentheses and braces;
  - unterminated string literals.

  These checks are intentionally conservative and do not yet implement a full
  parser for the language. Code that follows the documented syntax should not
  be reported as invalid, but some malformed code may still be accepted if it
  does not violate the structural rules above.

- **Examples**
  The `examples/` directory contains `.lang` files that show how the language
  can be used. The examples are also used by the test suite to exercise the
  grammar and validator.

## Using the extension

1. Install the extension (from a local `.vsix` or from the Marketplace).
2. Open a file with the `.lang` extension.
   VS Code will detect the `lang` language automatically.
3. As you edit the file, syntax highlighting and diagnostics will update in
   real time.

## Development notes

For local development, the typical workflow is:

1. Install tools and dependencies:

   ```bash
   mise run install
   ```

2. Rebuild the grammar and package the extension:

   ```bash
   mise run build
   ```

3. Run tests (including grammar and validator tests):

   ```bash
   mise run test
   ```

4. Run linting (via Trunk):

   ```bash
   mise run lint
   ```
