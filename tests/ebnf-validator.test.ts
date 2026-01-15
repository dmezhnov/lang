import { describe, it, expect } from 'bun:test';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

describe('EBNF Grammar Validation', () => {
    it('docs/new.ebnf is valid', async () => {
        const grammarPath = resolve('docs/new.ebnf');
        const grammarContent = await readFile(grammarPath, 'utf8');

        const errors = validateEBNF(grammarContent);
        if (errors.length > 0) {
            console.error('\nEBNF Validation Errors:\n' + errors.join('\n'));
        }
        expect(errors).toHaveLength(0);
    });
});

function validateEBNF(content: string): string[] {
    const errors: string[] = [];
    const definedRules = new Set<string>();
    const usedRules = new Set<{ name: string; line: number }>();

    // 1. Tokenize and Parse Rules
    const lines = content.split(/\r?\n/);

    // First pass: Collect defined rules
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue; // Skip empty or comments (if any)

        // Standard EBNF definition: identifier ::= ...
        const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*::=/);
        if (match) {
            definedRules.add(match[1]);
        }
    }

    // 2. Validate Definitions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        // Strip definition part
        let rhs = line;
        const defMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*::=(.*)$/);

        // Handle multiline rules (simplification: assume single line for now based on file structure)
        // If not a definition start, it might be continuation?
        // current new.ebnf seems to have one rule per line or blocks.

        if (defMatch) {
            rhs = defMatch[2];
        } else {
            // If line doesn't start with definition, it might be continuation or empty.
            // But new.ebnf is well formatted.
            // Let's assume strict formatting for now based on file content observation.
            // Or better: just parse all identifiers in the line that are not strings.
        }

        // Remove strings to avoid matching identifiers inside strings
        // Handle 'string' and "string" with escaping
        const cleanedRhs = rhs.replace(/'(?:\\.|[^\\'])*'/g, '').replace(/"(?:\\.|[^\\"])*"/g, '');

        // Find identifiers
        const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        let match;
        while ((match = identifierRegex.exec(cleanedRhs)) !== null) {
            const id = match[1];
            // Filter keywords or special abstract tokens if any (like valid terminal placeholders?)
            // But in new.ebnf everything is explicit.
            usedRules.add({ name: id, line: i + 1 });
        }

        // Check brackets balance
        checkBalance(rhs, '(', ')', i + 1, errors);
        checkBalance(rhs, '[', ']', i + 1, errors);
        checkBalance(rhs, '{', '}', i + 1, errors);
    }

    // 3. Check undefined rules
    for (const usage of usedRules) {
        if (!definedRules.has(usage.name)) {
            // Check if it's a special terminal or something.
            // new.ebnf seems self-contained except maybe abstract concepts.
            // Let's check what's missing.
            errors.push(`Undefined rule '${usage.name}' at line ${usage.line}`);
        }
    }

    return errors;
}

function checkBalance(text: string, open: string, close: string, line: number, errors: string[]) {
    let balance = 0;
    // Remove strings first
    const clean = text.replace(/'(?:\\.|[^\\'])*'/g, '').replace(/"(?:\\.|[^\\"])*"/g, '');

    for (const char of clean) {
        if (char === open) balance++;
        else if (char === close) balance--;
        if (balance < 0) {
            errors.push(`Unbalanced '${close}' at line ${line}`);
            return;
        }
    }
    if (balance > 0) {
        errors.push(`Unbalanced '${open}' at line ${line}`);
    }
}
