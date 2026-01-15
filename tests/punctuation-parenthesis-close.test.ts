import { describe, it, expect } from 'bun:test';
import { loadGrammar, getPatternByName } from './helpers';

describe.skip('punctuation.parenthesis.close.lang', () => {
    it('matches closing parenthesis', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, 'punctuation.parenthesis.close.lang');
        const re = new RegExp(pattern.match, 'g');

        const line = 'sum_by_axis(matrix_source, axis)';
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toEqual(expect.arrayContaining([')']));
    });
});
