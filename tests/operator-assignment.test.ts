import { describe, it, expect } from 'bun:test';
import { loadGrammar, loadExample, getPatternByName } from './helpers';

describe('keyword.operator.assignment.lang', () => {
    it.skip('matches `=` assignment operator in examples', async () => {
        const grammar = await loadGrammar();
        const assignPattern = getPatternByName(grammar, 'keyword.operator.assignment.lang');
        const re = new RegExp(assignPattern.match, 'g');

        const text = await loadExample('ident.lang');
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});
