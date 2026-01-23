import { describe, it, expect } from 'bun:test';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

type BracketPair = [string, string];

type AutoClosingPair = {
    open: string;
    close: string;
};

type LanguageConfiguration = {
    comments?: {
        lineComment?: string;
    };
    brackets?: BracketPair[];
    autoClosingPairs?: AutoClosingPair[];
    surroundingPairs?: AutoClosingPair[];
};

async function loadLanguageConfiguration(): Promise<LanguageConfiguration> {
    const configPath = resolve('vscode-extension/language-configuration.json');
    const raw = await readFile(configPath, 'utf8');
    return JSON.parse(raw) as LanguageConfiguration;
}

describe('language-configuration.json', () => {
    it('has # as line comment', async () => {
        const config = await loadLanguageConfiguration();
        expect(config.comments?.lineComment).toBe('#');
    });

    it('defines bracket pairs {}, ()', async () => {
        const config = await loadLanguageConfiguration();
        const brackets = config.brackets ?? [];

        expect(brackets).toEqual(
            expect.arrayContaining([
                ['{', '}'],
                ['(', ')'],
            ]),
        );
    });

    it('defines auto-closing pairs for {}, (), ""', async () => {
        const config = await loadLanguageConfiguration();
        const pairs = config.autoClosingPairs ?? [];
        const asTuples = pairs.map((p) => [p.open, p.close] as [string, string]);

        expect(asTuples).toEqual(
            expect.arrayContaining([
                ['{', '}'],
                ['(', ')'],
                ['"', '"'],
            ]),
        );
    });

    it('defines surrounding pairs for {}, (), ""', async () => {
        const config = await loadLanguageConfiguration();
        const pairs = config.surroundingPairs ?? [];
        const asTuples = pairs.map((p) => [p.open, p.close] as [string, string]);

        expect(asTuples).toEqual(
            expect.arrayContaining([
                ['{', '}'],
                ['(', ')'],
                ['"', '"'],
            ]),
        );
    });
});
