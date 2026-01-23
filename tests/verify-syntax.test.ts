

import { describe, test, expect } from 'bun:test';
import { parseHelper } from 'langium/test';
import { createLangServices } from '../vscode-extension/src/language/lang-module.js';
import { EmptyFileSystem } from 'langium';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe('correct Example Verification', () => {
    test('parsers examples/syntax/correct/lang.lang', async () => {
        const path = resolve(__dirname, '../examples/syntax/correct/lang.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (lang.lang):', result.parseResult.parserErrors);
        }

        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('parsers examples/syntax/correct/ident.lang', async () => {
        const path = resolve(__dirname, '../examples/syntax/correct/ident.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (ident.lang):', result.parseResult.parserErrors);
        }

        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test('parsers examples/validation/correct/constant-equations.lang', async () => {
        const path = resolve(__dirname, '../examples/validation/correct/constant-equations.lang');
        const content = readFileSync(path, 'utf-8');
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log('Parser Errors (constant-equations.lang):', result.parseResult.parserErrors);
        }

        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
