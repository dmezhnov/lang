
import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('Nested List Syntax Verification', () => {

    test('parsers examples/correct syntax/nested_list.lang', async () => {
        const path = resolve(__dirname, '../examples/correct syntax/nested_list.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors:', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
