import { describe, it, expect } from 'bun:test';
import { loadExample } from './helpers';
import { validateTextDocument } from '../src/lang-validator';

describe('lang syntax validator', () => {
    it('does not report errors for the operations.lang example', async () => {
        const text = await loadExample('operations.lang');
        const diagnostics = validateTextDocument(text);

        expect(diagnostics.length).toBe(0);
    });

    it('reports unmatched brackets and misplaced where', () => {
        const text = [
            'x = (5',
            'where',
            '    y = 1',
            '',
        ].join('\n');

        const diagnostics = validateTextDocument(text);

        expect(diagnostics.length).toBeGreaterThanOrEqual(2);
        expect(diagnostics.some((d) => d.message.includes('Unclosed bracket'))).toBe(true);
        expect(diagnostics.some((d) => d.message.includes('Unexpected `where`'))).toBe(true);
    });

    it('reports unterminated string literals', () => {
        const text = 'name = "unterminated string';

        const diagnostics = validateTextDocument(text);

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]?.message).toContain('Unterminated string literal');
    });
});


