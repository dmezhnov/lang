# Changelog

## [0.3.7] - 2026-01-16

### Fixed

- **Grammar**: Refactored `Expression` hierarchy to ensure logical operators (`from`, `of`, `for`) bind tighter than
  list separators (`,`). This fixes issues with lists of binary expressions like `(1 from I, 1 from C)`.
- **Grammar**: Removed `where` from comparison operators to resolve ambiguity with `where` clauses.
- **Grammar**: Updated `Record` syntax to support `=` assignment for fields (e.g., `{ a = 5 }`) and comma separators
  between fields.

## [0.3.6] - 2026-01-16

### Added

- **Grammar**: Added support for:
  - Dot member access (e.g., `list.A`).
  - Chained function calls (e.g., `f(a)(b)`).
  - Multiline lists and nested structures (implicit line joining inside parentheses).
- **Validation**: Verified compliance with provided syntax examples.

## [0.3.4] - 2026-01-16

### Fixed

- **Grammar**: Resolved `MismatchedTokenException` in parser by ensuring virtual
  tokens carry correct type indices.
- **Lexer**: Fixed type safety issues in `LangLexer`.

## [0.3.3] - 2026-01-16

### Added

- **Significant Whitespace**: Implemented Python-style indentation usage.
  - Newlines are now statement terminators.
  - `where` blocks and records require indentation.
  - Removed strict requirement for "INDENT"/"DEDENT" keywords (now inferred
    from whitespace).

## [0.3.2] - 2026-01-15

### Fixed

- **Tests**: Removed obsolete test files (`lang-validator.test.ts`,
  `ebnf-validator.test.ts`) that were causing build failures.

## [0.3.1] - 2026-01-15

### Fixed

- **VS Code Compatibility**: Downgraded `engines.vscode` requirement to
  `^1.104.0` to support older IDE versions.
- **Build**: Resolved typescript errors and removed unused imports.

## [0.2.0] - 2026-01-13

### Added

- Added `for` operator to the language syntax (supported in grammar and textmate)

## [0.1.0] - 2026-01-05

### ⚠️ BREAKING CHANGES

- **Replaced `:` operator with two distinct operators:**
  - `of` — for type annotations and set membership (e.g., `value of number`)
  - `from` — for field access (e.g., `y from x` equivalent to `x.y`)
- All existing `.lang` files must be updated to use the new syntax

### Changed

- Updated EBNF grammars (`docs/new.ebnf`, `docs/lang.ebnf`) with `of` and
  `from` operators
- Updated TextMate grammar generator to produce patterns for both keywords
- Updated documentation (`docs/syntax.md`, `docs/overview.md`) with new syntax examples
- Updated all example files to use new operator syntax
- Fixed `scopeName` from `lang.lang` to `source.lang` (follows TextMate conventions)

### Added

- New test files: `operator-of.test.ts` and `operator-from.test.ts`

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
