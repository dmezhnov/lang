## Changelog

All notable changes to the **Lang** extension are documented in this file.

### [0.0.1] - 2025-11-19

- Added a TextMate grammar for `*.lang` files:
  - highlighting of `#` headings, `where` keyword, numbers, types, constants, functions, variables, operators `=`, `:`, `...`, and punctuation.
- Added language configuration (`language-configuration.json`):
  - `#` line comments, auto-closing `{}`, `[]`, `()`, `""`.
- Implemented `generate-lang.bun.ts` generator that produces both the grammar and language configuration.
- Added example code in `examples/` and a Bun test suite that covers all grammar scopes and the language configuration.