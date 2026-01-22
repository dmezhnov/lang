
import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('List Syntax Verification', () => {

    test('parsers examples/syntax/correct/list.lang', async () => {
        const path = resolve(import.meta.dir, '../examples/syntax/correct/list.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (list.lang):', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
