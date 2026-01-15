import { describe, it, expect } from 'bun:test';
import { loadGrammar, getPatternByName } from './helpers';

describe('keyword.control.lang (where)', () => {
    it('matches `where` keyword in examples', async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, 'keyword.control.lang');
        const re = new RegExp(pattern.match, 'g');

        const testLine = 'where';
        const count = Array.from(testLine.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});
