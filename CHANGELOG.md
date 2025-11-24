# Changelog

All notable changes to the **Lang** extension are documented in this file.

## [0.0.3] - 2025-11-24

- Bumped extension version to 0.0.3 and prepared the package for publishing to
  the VS Code Marketplace.

## [0.0.2] - 2025-11-21

- Updated the TextMate grammar and tests so that **ALL_CAPS** variable
  names before a colon are correctly tokenized as `variable.name.lang`.
- Switched `.vscodeignore` to a whitelist-style configuration so that
  the packaged `.vsix` only contains the extension artifacts
  (`package.json`, README, CHANGELOG, LICENSE, language configuration,
  and grammar).
- Improved tooling:
  - added an ESLint 9 flat config with TypeScript support and basic
    `@stylistic` rules;
  - integrated Trunk configuration and `mise` tasks for running build,
    tests, linting, and installing tools/dependencies.

## [0.0.1] - 2025-11-19

- Added a TextMate grammar for `*.lang` files:
  - highlighting of `#` headings, `where` keyword, numbers, types,
    constants, functions, variables, operators `=`, `:`, `...`, and
    punctuation.
- Added language configuration (`language-configuration.json`):
  - `#` line comments, auto-closing `{}`, `[]`, `()`, `""`.
- Implemented `generate-lang.bun.ts` generator that produces both the
  grammar and language configuration.
- Added example code in `examples/` and a Bun test suite that covers
  all grammar scopes and the language configuration.
