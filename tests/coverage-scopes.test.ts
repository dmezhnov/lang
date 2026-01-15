import { describe, it, expect } from 'bun:test';
import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { loadGrammar } from './helpers';

async function listTestFiles(): Promise<string[]> {
    const dir = resolve('tests');
    const entries = await readdir(dir);
    return entries.filter((name) => name.endsWith('.test.ts') && name !== 'coverage-scopes.test.ts');
}

describe('grammar test coverage for scopes', () => {
    it('has at least one dedicated test mentioning every scope used in the grammar', async () => {
        const grammar = await loadGrammar();

        // Collect all unique scope names from pattern.name and captures[*].name
        const scopes = new Set<string>();
        for (const pattern of grammar.patterns) {
            if (pattern.name) {
                scopes.add(pattern.name);
            }
            for (const capture of Object.values(pattern.captures ?? {})) {
                scopes.add(capture.name);
            }
        }

        // Read all test files (except this coverage test itself)
        const testFiles = await listTestFiles();
        const fileContents: string[] = [];
        for (const file of testFiles) {
            const fullPath = resolve('tests', file);
            fileContents.push(await readFile(fullPath, 'utf8'));
        }

        const missingScopes: string[] = [];
        for (const scope of scopes) {
            const mentionedSomewhere = fileContents.some((content) => content.includes(scope));
            if (!mentionedSomewhere) {
                missingScopes.push(scope);
            }
        }

        expect(missingScopes).toEqual([]);
    });
});


