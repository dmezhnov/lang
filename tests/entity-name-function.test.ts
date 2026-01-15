import { describe, it, expect } from 'bun:test';
import { loadGrammar, getPatternByCaptureName } from './helpers';

describe.skip('entity.name.function.lang', () => {
    it('matches function names before parentheses', async () => {
        const grammar = await loadGrammar();
        const fnPattern = getPatternByCaptureName(grammar, 'entity.name.function.lang');
        const re = new RegExp(fnPattern.match);

        const samples = [
            'new_empty(coordinates)',
            'sum_by_axis(matrix_source, axis)',
            'for_each_element(matrix_source, operation, value)',
        ];

        for (const line of samples) {
            const match = re.exec(line);
            expect(match?.[1]).toBeTruthy();
        }
    });
});
