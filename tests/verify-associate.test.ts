
import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('Associate Syntax Verification', () => {

    test('parsers examples/correct syntax/associate.lang (Should Pass)', async () => {
        const path = resolve(import.meta.dir, '../examples/correct syntax/associate.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (correct syntax/associate.lang):', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('parsers examples/error syntax/associate.lang (Should Fail)', async () => {
        const path = resolve(import.meta.dir, '../examples/error syntax/associate.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length === 0) {
            console.log('Unexpected success for error syntax/associate.lang');
        } else {
            // console.log('Expected Parser Errors:', result.parseResult.parserErrors.length);
        }

        expect(result.parseResult.parserErrors.length).toBeGreaterThan(0);
    });
});
