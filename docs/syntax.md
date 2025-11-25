# Lang language syntax

This document summarizes the intended syntax of the `lang` language and the
aspects that are currently validated by the extension.

## Lexical elements

- **Identifiers**

  ```text
  Identifier ::= [A-Za-z_][A-Za-z0-9_]*
  ```

  Identifiers are used for type names, value names, function‑like definitions,
  and constants.

- **Number literals**

  ```text
  NumberLiteral ::= [0-9]+
  ```

- **String literals**

  ```text
  StringLiteral ::= '"' ( '\' any | [^"] )* '"'
  ```

  Strings use double quotes and support escaping of the quote character.

- **Keywords and operators**

  The language uses the following keywords and operator symbols:

  - `where`
  - `=`
  - `:`
  - `...`
  - `(`
  - `)`
  - `{`
  - `}`
  - `,`

- **Comments**

  Comment regions start at the first run of one or more `#` characters that is
  either followed by whitespace or reaches the end of the line. Everything
  from the first `#` in that run to the end of the line is treated as comment
  text.

  ```text
  CommentStart ::= '#'+' (?=\s|$)
  ```

  Examples:

  - full-line comments:

    ```lang
    # Heading
    ## Subheading
    ```

  - inline comments after code:

    ```lang
    x = 5 # this is a comment
    value: number  ## another comment
    ```

  - a run of `#` characters at the end of the line is also a comment marker:

    ```lang
    x = 5 ###
    ```

  Sequences like `x = 5 #comment` (without a space after `#`) are **not**
  treated as comments by the validator.

## Indentation and blocks

Indentation is significant in `lang` source files:

- Each non‑blank, non‑comment line has a logical indentation level determined
  by its leading spaces and tabs (tabs are treated as width 4).
- Indentation levels must either increase relative to the previous
  non‑comment line (starting a nested block) or return to one of the
  previously used indentation levels.
- If a line uses an indentation width that does not match any earlier level,
  the validator reports an **inconsistent indentation** error.

### `where` blocks

`where` blocks associate additional local definitions with a preceding
statement or field. A `where` block has the following shape:

```lang
statement_or_field
    where
        nested_definition_1 = ...
        nested_definition_2 = ...
```

The rules enforced by the validator are:

- a `where` line must be indented **more** than the statement it belongs to;
- a `where` line must have a preceding non‑comment statement on an earlier
  line with a **strictly smaller** indentation level;
- a single statement may not have more than one `where` block;
- the `where` keyword must appear **alone on a line** (apart from whitespace).

If any of these rules is violated, the extension reports a diagnostic on the
corresponding `where` line.

## Expressions and records

The language is expression‑oriented. At a high level, expressions include:

- function‑like calls:

  ```lang
  sum_by_axis(matrix_source, axis_to_sum)
  ```

- comma‑separated lists and sequences, including ranges with ellipsis:

  ```lang
  Axis = Region, District, Product_category
  Matrix = m1, ... mn
  ```

- record‑like structures:

  ```lang
  MatrixEl = {
      coords: c1, ... cn
          where
              c1: Coordinate
              ...
              cn: Coordinate
      value
  }
  ```

The current validator focuses on structural correctness (indentation, `where`
placement, brackets, and strings) and deliberately does **not** attempt to
fully parse or type‑check all expression forms. As a result:

- syntactically malformed expressions may still pass validation if they do not
  violate the structural rules;
- valid expressions that conform to the examples are not expected to produce
  diagnostics.

## Structural validation rules

The extension currently enforces the following structural rules:

- **Indentation**

  - A line whose indentation does not match any previously seen indentation
    level is reported as inconsistent.

- **`where` placement**

  - A `where` line without a preceding statement at a lower indentation level
    is reported as unexpected.
  - A second `where` line that would attach to the same statement is reported
    as an error.
  - Any non‑whitespace content following the `where` keyword on the same line
    is reported as unexpected.

- **Brackets**

  - Each opening bracket `(` or `{` must have a matching closing bracket
    `)` or `}` of the correct type.
  - An unexpected closing bracket (with no corresponding opening bracket) is
    reported as an error.
  - A mismatched closing bracket is reported as an error.
  - Any remaining unmatched opening brackets at the end of the file are
    reported as unclosed.

- **String literals**

  - Unterminated string literals (a double quote without a matching closing
    quote) are reported as errors.
  - Quotes escaped with a backslash inside a string are treated as part of the
    string, not as terminators.

These rules are intentionally conservative. They are designed so that code
following the documented syntax in `examples/` should be accepted without
diagnostics, while obvious structural mistakes are highlighted in the editor.
