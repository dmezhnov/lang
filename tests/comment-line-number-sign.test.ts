import { describe, it, expect } from 'bun:test';
import { loadGrammar, getPatternByName } from './helpers';

describe('comment.line.number-sign.lang', () => {
    it('matches heading-style lines starting with #', async () => {
        const grammar = await loadGrammar();
        const commentPattern = getPatternByName(grammar, 'comment.line.number-sign.lang');
        const re = new RegExp(commentPattern.match);

        const examples = [
            '# Операции с матрицами',
            '## Служебные операции',
            '### - Создать пустую матрицу по координатам ✅',
            '#### 1. Создать пустую матрицу по координатам ✅',
            '### - Для каждой пары',
        ];

        for (const line of examples) {
            expect(re.test(line)).toBe(true);
        }
    });

    it('matches inline comments after code when # is followed by whitespace', async () => {
        const grammar = await loadGrammar();
        const commentPattern = getPatternByName(grammar, 'comment.line.number-sign.lang');
        const re = new RegExp(commentPattern.match);

        const examples = [
            'x = 5 # inline comment',
            'value: number  ##   another comment',
            'MatrixEl = { coords: c1, ... cn }   # trailing',
        ];

        for (const line of examples) {
            expect(re.test(line)).toBe(true);
        }
    });

    it('does not match # immediately followed by a non-space character', async () => {
        const grammar = await loadGrammar();
        const commentPattern = getPatternByName(grammar, 'comment.line.number-sign.lang');
        const re = new RegExp(commentPattern.match);

        const examples = [
            'x = 5 #comment',
            'value#not-comment',
        ];

        for (const line of examples) {
            expect(re.test(line)).toBe(false);
        }
    });

    it('treats runs of # at end of line as comments', async () => {
        const grammar = await loadGrammar();
        const commentPattern = getPatternByName(grammar, 'comment.line.number-sign.lang');
        const re = new RegExp(commentPattern.match);

        const examples = [
            'x = 5 ###',
            '   ##',
        ];

        for (const line of examples) {
            expect(re.test(line)).toBe(true);
        }
    });
});


