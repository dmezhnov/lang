import { describe, it, expect } from 'bun:test';
import {
    loadGrammar,
    loadExample,
    getPatternByName,
    getPatternByCaptureName,
} from './helpers';

describe('variable.name.lang', () => {
    it('matches simple variable names in assignment', async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, 'variable.name.lang');
        const re = new RegExp(varPattern.match, 'g');

        const text = await loadExample('some.lang');
        const matches = Array.from(text.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain('x');
    });

    it('matches variable names before colon', async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, 'variable.name.lang');
        const re = new RegExp(varPattern.match, 'g');

        const line = 'matrix_source: Matrix';
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain('matrix_source');
    });

    it('matches ALL_CAPS variable names before colon', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByCaptureName(grammar, 'variable.name.lang');
        const re = new RegExp(pattern.match);

        const line = 'OVERALL_REQUEST_CAPACITY: number';
        const match = re.exec(line);

        expect(match?.[1]).toBe('OVERALL_REQUEST_CAPACITY');
    });
});
