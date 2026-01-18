import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('Where Syntax Verification', () => {

    test('parsers examples/syntax/correct syntax/where.lang (Should Pass)', async () => {
        const path = resolve(__dirname, '../examples/syntax/correct syntax/where.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (correct syntax/where.lang):', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('parsers examples/syntax/error syntax/where.lang (Should Fail)', async () => {
        const path = resolve(__dirname, '../examples/syntax/error syntax/where.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        // Detailed log to see WHAT failed if it unexpectedly passes
        if (result.parseResult.parserErrors.length === 0) {
            console.log('Unexpected success for error syntax/where.lang');
        } else {
             console.log('Expected Parser Errors (error syntax/where.lang):', result.parseResult.parserErrors.length, 'errors found.');
        }

        expect(result.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('Inline where clause support', async () => {
        const input = 'x = 1 where y = 2\n';
        const result = await parse(input);
        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('Block where clause support', async () => {
        const input = `
x = 1
    where
        y = 2
`;
        const result = await parse(input);
        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
