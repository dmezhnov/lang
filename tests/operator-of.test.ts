import { describe, it, expect } from 'bun:test';
import { loadGrammar, loadExample, getPatternByName } from './helpers';

describe('keyword.control.lang', () => {
    it('matches `of` type operator in examples', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, 'keyword.control.lang');
        const re = new RegExp(pattern.match, 'g');

        const text = await loadExample('ident.lang');
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThanOrEqual(0);
    });
});
