
import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('Ident Error Syntax Verification', () => {

    test('parsers examples/error syntax/ident.lang (Should Fail)', async () => {
        const path = resolve(__dirname, '../examples/error syntax/ident.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length === 0) {
            console.log('Unexpected success for error syntax/ident.lang');
            console.log('Statements:', JSON.stringify(result.parseResult.value.statements, null, 2));
        } else {
             console.log('Expected Parser Errors (error syntax/ident.lang):', result.parseResult.parserErrors.length, 'errors found.');
        }

        expect(result.parseResult.parserErrors.length).toBeGreaterThan(0);
    });
});
