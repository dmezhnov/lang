import { describe, test, expect, beforeAll } from 'bun:test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { URI } from 'vscode-uri';

const services = createLangServices(EmptyFileSystem).Lang;

async function parse(content: string, options?: { documentUri?: string }) {
    const documentUri = options?.documentUri ?? `file:///test-${Math.random()}.lang`;
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(content, URI.parse(documentUri));
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    return document;
}

beforeAll(() => {
    // Services created above
});

describe('Constant Equation Validation', () => {
    test('valid equation: 2 + 2 = 4', async () => {
        const document = await parse('x = 2 + 2 = 4\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics).toHaveLength(0);
    });

    test('invalid equation: 1 + 1 = 3', async () => {
        const document = await parse('x = 1 + 1 = 3\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toContain('Equation is false');
    });

    test('valid comparison: 5 > 3', async () => {
        const document = await parse('x = 5 > 3\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics).toHaveLength(0);
    });

    test('invalid comparison: 5 < 3', async () => {
        const document = await parse('x = 5 < 3\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toContain('Equation is false');
    });

    test('skip equation with variables: a + b = 10', async () => {
        const document = await parse('x = a + b = 10\n');
        const diagnostics = document.diagnostics ?? [];
        // Should not error - contains variables
        expect(diagnostics).toHaveLength(0);
    });

    test('valid chain: 1 < 2 < 3', async () => {
        const document = await parse('x = 1 < 2 < 3\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics).toHaveLength(0);
    });

    test('invalid chain: 1 < 2 > 3', async () => {
        const document = await parse('x = 1 < 2 > 3\n');
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toContain('Equation is false');
    });
});
