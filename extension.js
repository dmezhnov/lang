// Basic diagnostics provider for the Lang language.
// It highlights simple syntax issues such as unbalanced brackets and unclosed string literals.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const vscode = require('vscode');

/**
 * Determine whether the quote at the given position is escaped.
 * @param {string} line
 * @param {number} index
 * @returns {boolean}
 */
function isEscaped(line, index) {
    let backslashCount = 0;
    for (let i = index - 1; i >= 0; i -= 1) {
        if (line[i] === '\\') {
            backslashCount += 1;
        } else {
            break;
        }
    }
    return backslashCount % 2 === 1;
}

/**
 * Compute diagnostics for a single Lang document.
 * @param {vscode.TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function validateTextDocument(document) {
    const diagnostics = [];

    if (document.languageId !== 'lang') {
        return diagnostics;
    }

    const bracketPairs = {
        '{': '}',
        '[': ']',
        '(': ')',
    };
    /** @type {Record<string, string>} */
    const closingToOpening = {};
    for (const [open, close] of Object.entries(bracketPairs)) {
        closingToOpening[close] = open;
    }

    /** @type {{ ch: string; line: number; character: number }[]} */
    const stack = [];

    for (let line = 0; line < document.lineCount; line += 1) {
        const lineText = document.lineAt(line).text;
        const firstNonWhitespaceIndex = lineText.search(/\S/);

        // Skip empty lines
        if (firstNonWhitespaceIndex === -1) {
            continue;
        }

        // Treat lines starting with `#` (after optional whitespace) as comments and ignore them
        if (lineText[firstNonWhitespaceIndex] === '#') {
            continue;
        }

        let inString = false;
        let lastQuotePos = -1;

        for (let character = 0; character < lineText.length; character += 1) {
            const ch = lineText[character];

            // Toggle string state on unescaped double quotes
            if (ch === '"' && !isEscaped(lineText, character)) {
                inString = !inString;
                if (inString) {
                    lastQuotePos = character;
                } else {
                    lastQuotePos = -1;
                }
                continue;
            }

            // Ignore any characters inside strings
            if (inString) {
                continue;
            }

            // Track bracket balance
            if (bracketPairs[ch]) {
                stack.push({ ch, line, character });
                continue;
            }

            const expectedOpen = closingToOpening[ch];
            if (expectedOpen) {
                const last = stack.pop();
                if (!last || last.ch !== expectedOpen) {
                    const range = new vscode.Range(
                        line,
                        character,
                        line,
                        character + 1,
                    );
                    const message = last
                        ? `Unexpected '${ch}', expected closing bracket for '${last.ch}'.`
                        : `Unexpected '${ch}', no matching opening bracket '${expectedOpen}'.`;
                    diagnostics.push(
                        new vscode.Diagnostic(
                            range,
                            message,
                            vscode.DiagnosticSeverity.Error,
                        ),
                    );
                }
            }
        }

        // If we are still inside a string at the end of the line, mark the last quote as an error
        if (inString && lastQuotePos >= 0) {
            const range = new vscode.Range(
                line,
                lastQuotePos,
                line,
                lastQuotePos + 1,
            );
            diagnostics.push(
                new vscode.Diagnostic(
                    range,
                    'Unclosed string literal.',
                    vscode.DiagnosticSeverity.Error,
                ),
            );
        }
    }

    // Any remaining opening brackets on the stack are unclosed
    for (const entry of stack) {
        const range = new vscode.Range(
            entry.line,
            entry.character,
            entry.line,
            entry.character + 1,
        );
        diagnostics.push(
            new vscode.Diagnostic(
                range,
                `Unclosed '${entry.ch}'.`,
                vscode.DiagnosticSeverity.Error,
            ),
        );
    }

    return diagnostics;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const collection = vscode.languages.createDiagnosticCollection('lang');
    context.subscriptions.push(collection);

    /**
     * @param {vscode.TextDocument} document
     */
    function updateDiagnostics(document) {
        if (document && document.languageId === 'lang') {
            const diagnostics = validateTextDocument(document);
            collection.set(document.uri, diagnostics);
        } else if (document) {
            collection.delete(document.uri);
        }
    }

    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        vscode.workspace.onDidChangeTextDocument((event) =>
            updateDiagnostics(event.document),
        ),
        vscode.workspace.onDidCloseTextDocument((document) =>
            collection.delete(document.uri),
        ),
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                updateDiagnostics(editor.document);
            }
        }),
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};


