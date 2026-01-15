import { describe, it, expect } from 'bun:test';
import { loadGrammar, getPatternByName } from './helpers';

describe('keyword.control.lang', () => {
    it('matches `for` operator', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, 'keyword.control.lang');
        const re = new RegExp(pattern.match, 'g');

        const text = 'x for y';
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});
