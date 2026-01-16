
import { describe, test, expect } from "bun:test";
import { parseHelper } from "langium/test";
import { createLangServices } from "../src/language/lang-module.js";
import { EmptyFileSystem } from "langium";
import { readFileSync } from "fs";
import { resolve } from "path";

const services = createLangServices(EmptyFileSystem).Lang;
const parse = parseHelper(services);

describe("Correct Syntax Example Verification", () => {
    test("parsers examples/correct syntax/lang.lang", async () => {
        const path = resolve(__dirname, "../examples/correct syntax/lang.lang");
        const content = readFileSync(path, "utf-8");
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log("Parser Errors (lang.lang):", result.parseResult.parserErrors);
        }

        expect(result.parseResult.parserErrors.length).toBe(0);
    });

    test("parsers examples/correct syntax/ident.lang", async () => {
        const path = resolve(__dirname, "../examples/correct syntax/ident.lang");
        const content = readFileSync(path, "utf-8");
        const result = await parse(content);

        if (result.parseResult.parserErrors.length > 0) {
            console.log("Parser Errors (ident.lang):", result.parseResult.parserErrors);
        }

        expect(result.parseResult.parserErrors.length).toBe(0);
    });
});
