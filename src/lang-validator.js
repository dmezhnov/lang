// Simple structural syntax validator for the Lang language.
// It checks:
// - indentation consistency;
// - placement of `where` blocks;
// - balanced () and {} brackets;
// - unterminated string literals using double quotes.
//
// The validator operates line by line and is intentionally conservative:
// it does not yet implement a full parser for the language, but it should
// never report constructs as invalid when they follow the documented syntax.

/**
 * @typedef {Object} LangDiagnostic
 * @property {number} start - Zero-based offset in the document where the problem starts.
 * @property {number} end - Zero-based offset in the document where the problem ends.
 * @property {string} message - Human-readable description of the problem.
 */

/**
 * Validate a Lang document and return a list of diagnostics.
 *
 * @param {string} text
 * @returns {LangDiagnostic[]}
 */
function validateTextDocument(text) {
    /** @type {LangDiagnostic[]} */
    const diagnostics = [];

    const lines = text.split(/\r?\n/);
    /** @type {number[]} */
    const indentLevels = [0];
    let lastIndent = 0;

    /** @type {{ indent: number; lineIndex: number; hasWhere: boolean } | null} */
    let lastStatement = null;

    /** @type {{ char: string; offset: number }[]} */
    const bracketStack = [];

    let inString = false;
    let stringStartOffset = 0;

    let offset = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const lineStartOffset = offset;

        // Compute indentation (spaces and tabs). Tabs are allowed but treated as width 4.
        let indent = 0;
        let i = 0;
        while (i < line.length) {
            const ch = line[i];
            if (ch === ' ') {
                indent += 1;
            } else if (ch === '\t') {
                indent += 4;
            } else {
                break;
            }
            i += 1;
        }

        const trimmed = line.slice(i);

        const isBlank = trimmed.length === 0;
        const isComment =
            !isBlank && trimmed[0] === '#';

        // Detect the start of a comment region for inline comments. A comment
        // begins at the first run of one or more `#` characters that is either
        // followed by whitespace or reaches the end of the line.
        let commentStartColumn = -1;
        for (let j = 0; j < line.length; j += 1) {
            if (line[j] !== '#') {
                continue;
            }

            let k = j;
            while (k < line.length && line[k] === '#') {
                k += 1;
            }
            const afterRun = k < line.length ? line[k] : '';

            if (afterRun === '' || /\s/.test(afterRun)) {
                commentStartColumn = j;
                break;
            }
        }

        // Track indentation only for non-blank, non-comment lines.
        if (!isBlank && !isComment) {
            if (indent > lastIndent) {
                indentLevels.push(indent);
                lastIndent = indent;
            } else if (indent < lastIndent) {
                if (!indentLevels.includes(indent)) {
                    diagnostics.push({
                        start: lineStartOffset,
                        end: lineStartOffset + indent,
                        message:
                            'Inconsistent indentation: this indentation level does not match any previous indentation level.',
                    });
                }
                lastIndent = indent;
            }
        }

        // Skip comment-only lines and blank lines for structural analysis and
        // bracket scanning. Lines with inline comments are still processed up
        // to the start of the comment.
        if (isBlank || isComment) {
            offset = lineStartOffset + line.length + 1;
            continue;
        }

        // Detect `where` lines (case-insensitive).
        const trimmedLower = trimmed.toLowerCase();
        const isWhereLine = /^where(\b|$)/.test(trimmedLower);

        if (isWhereLine) {
            const afterWhere = trimmed.slice(5).trim();
            if (afterWhere.length > 0) {
                diagnostics.push({
                    start: lineStartOffset + i + 5,
                    end: lineStartOffset + line.length,
                    message: 'Unexpected tokens after `where`. The `where` keyword must appear alone on a line.',
                });
            }

            if (!lastStatement || lastStatement.indent >= indent) {
                diagnostics.push({
                    start: lineStartOffset + i,
                    end: lineStartOffset + line.length,
                    message:
                        'Unexpected `where` without a preceding statement at a lower indentation level.',
                });
            } else if (lastStatement.hasWhere) {
                diagnostics.push({
                    start: lineStartOffset + i,
                    end: lineStartOffset + line.length,
                    message:
                        'A statement may not have more than one associated `where` block.',
                });
            } else {
                lastStatement.hasWhere = true;
            }
        } else {
            // This line is treated as a statement.
            lastStatement = {
                indent,
                lineIndex,
                hasWhere: false,
            };
        }

        // Scan for strings and brackets on non-comment parts of the line.
        const scanLimit = commentStartColumn >= 0 ? commentStartColumn : line.length;
        for (let j = 0; j < scanLimit; j += 1) {
            const ch = line[j];
            const pos = lineStartOffset + j;

            if (inString) {
                if (ch === '"') {
                    // Count preceding backslashes to determine if this quote is escaped.
                    let backslashCount = 0;
                    let k = j - 1;
                    while (k >= 0 && line[k] === '\\') {
                        backslashCount += 1;
                        k -= 1;
                    }
                    const isEscaped = backslashCount % 2 === 1;
                    if (!isEscaped) {
                        inString = false;
                    }
                }
                continue;
            }

            if (ch === '"') {
                inString = true;
                stringStartOffset = pos;
                continue;
            }

            if (ch === '(' || ch === '{') {
                bracketStack.push({ char: ch, offset: pos });
                continue;
            }

            if (ch === ')' || ch === '}') {
                if (bracketStack.length === 0) {
                    diagnostics.push({
                        start: pos,
                        end: pos + 1,
                        message: `Unexpected closing bracket \`${ch}\`; there is no matching opening bracket.`,
                    });
                    continue;
                }

                const top = bracketStack[bracketStack.length - 1];
                const expected =
                    top.char === '(' ? ')' :
                        top.char === '{' ? '}' :
                            null;

                if (expected !== ch) {
                    diagnostics.push({
                        start: pos,
                        end: pos + 1,
                        message: `Mismatched closing bracket \`${ch}\`; expected \`${expected}\`.`,
                    });
                } else {
                    bracketStack.pop();
                }
            }
        }

        offset = lineStartOffset + line.length + 1;
    }

    if (inString) {
        diagnostics.push({
            start: stringStartOffset,
            end: stringStartOffset + 1,
            message: 'Unterminated string literal; missing closing quote (`"`).',
        });
    }

    for (const entry of bracketStack) {
        diagnostics.push({
            start: entry.offset,
            end: entry.offset + 1,
            message: `Unclosed bracket \`${entry.char}\`; missing matching closing bracket.`,
        });
    }

    return diagnostics;
}

module.exports = {
    validateTextDocument,
};


