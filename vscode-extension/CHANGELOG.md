# Changelog

## [0.4.4] - 2026-01-20

### Added

- **Zed Support**: Full support for Zed Editor with automated WASM builds and asset packaging.
- **Documentation**: Standardized README, LICENSE, and Icons across all extensions.
- **Build System**: Unified `mise build` command for building both VS Code and Zed extensions.
- **Metadata Sync**: Automatic synchronization of version and description from root `package.json`.

## [0.4.3] - 2026-01-18

### Changed

- **Build**: Migrated build system to run via `Bun` as a task runner, but kept **esbuild** for bundling (Bun.build is currently incompatible with VS Code LSP).
- **Packaging**: Fixed publish workflow to correctly attach VSIX assets and include the extension icon.
- **LSP**: Added standalone language server binary `lang-language-server` usage in other editors.

## [0.4.2] - 2026-01-18 [YANKED]

### Changed

- Failed release (build instability). Superseded by 0.4.3.

## [0.4.1] - 2026-01-18

### Added

- **Meta**: Added extension icon.

## [0.4.0] - 2026-01-18

### Added

- **Validation**: Added semantic validation for constant equations. The IDE now
  detects and reports errors for:
  - False equality (e.g., `x = 1 + 1 = 3`).
  - False comparisons (e.g., `5 < 3`).
  - Invalid chained comparisons (e.g., `1 < 2 > 3`).
- **Examples**: Added validation examples in `examples/validation/`.

### Changed

- Version bump to include all fixes from 0.3.15 in published extension.

## [0.3.15] - 2026-01-18

### Added

- **Grammar**: Added unary minus operator (e.g., `-20`).

### Fixed

- **Tests**: Removed broken error syntax test for `associate.lang` (parenthesized statements are now
  valid).

## [0.3.14] - 2026-01-18

### Fixed

- **Grammar**: Updated `Parenthesized` to accept statements, allowing equations in parentheses (e.g.,
  `(x = 5) and (y = 6)`).

## [0.3.13] - 2026-01-18

### Added

- **Grammar**: Added `nothing` literal for representing omitted list elements.
- **Lexer**: Automatic insertion of `nothing` between consecutive commas (e.g., `(A, , B)` becomes
  `(A, nothing, B)`).

## [0.3.12] - 2026-01-18

### Added

- **Grammar**: Support for comparison chains in `Record` field values (e.g., `key = 850 + 350 + 1000 =
  2200`).
- **Grammar**: Allow multiple blank lines between record closing braces and `where` clauses.

## [0.3.11] - 2026-01-18

### Fixed

- **Grammar**: Fixed `Statement` rule to allow statements without explicit termination in certain
  contexts (e.g., last statement in where blocks before closing braces). This resolves parsing
  issues with nested where clauses in records.

## [0.3.10] - 2026-01-17

### Added

- **Grammar**: Added support for logical operators `and`, `or`, and `not`.
- **Grammar**: Added support for boolean literals `true` and `false`.
- **Verification**: Verified `examples/correct syntax/logic.lang`.

## [0.3.9] - 2026-01-16

### Fixed

- **Grammar**: Resolved parsing ambiguity between `Equation` and `ExprStatement`. This fixes errors
  where expressions starting with an identifier (like `f of ...`) were incorrectly treated as
  failed equations.
- **Grammar**: Updated `FunctionCall` and `List` to support ellipsis (`...`) in argument lists (e.g.,
  `func(a, ..., b)`) and anywhere in lists.
- **Verification**: Verified `examples/correct syntax/list.lang` which includes complex nested lists
  and ellipses.

## [0.3.8] - 2026-01-16

### Fixed

- **Grammar**: Generalize `Record` fields to allow expressions as keys (e.g., `("key") = value`).
  This supports dynamic keys or quoted strings as associative keys.

## [0.3.7] - 2026-01-16

### Fixed

- **Grammar**: Refactored `Expression` hierarchy to ensure logical operators (`from`, `of`, `for`)
  bind tighter than list separators (`,`). This fixes issues with lists of binary expressions like
  `(1 from I, 1 from C)`.
- **Grammar**: Removed `where` from comparison operators to resolve ambiguity with `where` clauses.
- **Grammar**: Updated `Record` syntax to support `=` assignment for fields (e.g., `{ a = 5 }`) and
  comma separators between fields.

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
