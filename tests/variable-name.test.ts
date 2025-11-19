import { describe, it, expect } from "bun:test";
import { loadGrammar, loadExample, getPatternByName } from "./helpers";

describe("variable.name.lang", () => {
    it("matches simple variable names in assignment", async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, "variable.name.lang");
        const re = new RegExp(varPattern.match, "g");

        const text = await loadExample("some.lang");
        const matches = Array.from(text.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain("x");
    });

    it("matches variable names before colon", async () => {
        const grammar = await loadGrammar();
        const varPattern = getPatternByName(grammar, "variable.name.lang");
        const re = new RegExp(varPattern.match, "g");

        const line = "matrix_source: Matrix";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain("matrix_source");
    });
});


