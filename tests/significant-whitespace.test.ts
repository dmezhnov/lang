import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import type { File } from '../src/language/generated/ast.js';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper<File>(services);

describe('Significant Whitespace', () => {

    test('Statement terminated by newline', async () => {
        // "x =" should be an error because it expects a right-hand side before the newline
        // It should NOT consume 'y' from the next line
        const result = await parse(`
            x =
            y = 1
        `);

        // We expect parse errors because "x =" is incomplete syntax at the newline
        expect(result.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('Valid simple assignments', async () => {
        const result = await parse(`
x = 1
y = 2
`);
        expect(result.parseResult.parserErrors.length).toBe(0);
        expect(result.parseResult.value.statements.length).toBe(2);
    });

    test('Indentation handles where blocks', async () => {
        // Correct indentation
        const result = await parse(`
x = 1 where
    y = 2
`);
        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors:', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('Missing indentation in where block is error', async () => {
        // Missing indentation
        const result = await parse(`
x = 1 where
y = 2
`);
        // Expected: Error because INDENT was expected but not found (missing indentation)
        expect(result.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('DEDENT handling', async () => {
        const result = await parse(`
x = 1 where
    y = 2
z = 3
`);
        expect(result.parseResult.parserErrors.length).toBe(0);
        expect(result.parseResult.value.statements.length).toBe(2); // x=1... and z=3
    });
});
