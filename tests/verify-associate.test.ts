
import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../vscode-extension/src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('Associate Syntax Verification', () => {

    test('parsers examples/syntax/correct/associate.lang (Should Pass)', async () => {
        const path = resolve(import.meta.dir, '../examples/syntax/correct/associate.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (correct/associate.lang):', JSON.stringify(result.parseResult.parserErrors, null, 2));
        }
        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
