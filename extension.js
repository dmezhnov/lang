// VS Code extension entry point for the Lang language.
// It wires the structural validator into the editor as diagnostics.

const vscode = require('vscode');
const { validateTextDocument } = require('./src/lang-validator');

/**
 * Activate the extension.
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    /** @type {vscode.DiagnosticCollection} */
    const collection = vscode.languages.createDiagnosticCollection('lang');
    context.subscriptions.push(collection);

    /**
     * Run validation for a single text document if it is a Lang document.
     *
     * @param {vscode.TextDocument} document
     */
    function runValidation(document) {
        if (document.languageId !== 'lang') {
            return;
        }

        const text = document.getText();
        const diagnosticsData = validateTextDocument(text);

        const diagnostics = diagnosticsData.map((d) => {
            const range = new vscode.Range(
                document.positionAt(d.start),
                document.positionAt(d.end),
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                d.message,
                vscode.DiagnosticSeverity.Error,
            );
            diagnostic.source = 'lang';
            return diagnostic;
        });

        collection.set(document.uri, diagnostics);
    }

    // Validate existing open Lang documents on activation.
    for (const document of vscode.workspace.textDocuments) {
        runValidation(document);
    }

    // Revalidate when documents are opened or changed.
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            runValidation(document);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            runValidation(event.document);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => {
            if (document.languageId === 'lang') {
                collection.delete(document.uri);
            }
        }),
    );
}

/**
 * Deactivate the extension.
 */
function deactivate() {
    // Nothing to clean up explicitly; VS Code will dispose subscriptions.
}

module.exports = {
    activate,
    deactivate,
};


