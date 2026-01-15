import { describe, it, expect } from 'bun:test';
import {
    loadGrammar,
    loadExample,
    getPatternByName,
    getPatternByCaptureName,
} from './helpers';

describe('variable.name.lang', () => {
    it.skip('matches simple variable names in assignment', async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, 'variable.name.lang');
        const re = new RegExp(varPattern.match, 'g');

        const text = await loadExample('ident.lang');
        const matches = Array.from(text.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain('x');
    });

    it.skip('matches variable names before colon', async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, 'variable.name.lang');
        const re = new RegExp(varPattern.match, 'g');

        const line = 'matrix_source of Matrix';
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain('matrix_source');
    });

    it.skip('matches ALL_CAPS variable names before colon', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByCaptureName(grammar, 'variable.name.lang');
        const re = new RegExp(pattern.match);

        const line = 'OVERALL_REQUEST_CAPACITY of number';
        const match = re.exec(line);

        expect(match?.[1]).toBe('OVERALL_REQUEST_CAPACITY');
    });
});
