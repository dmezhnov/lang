import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("punctuation.separator.comma.lang", () => {
    it("matches commas in parameter lists", async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, "punctuation.separator.comma.lang");
        const re = new RegExp(pattern.match, "g");

        const line = "for_each_element(matrix_source, operation, value)";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches.length).toBeGreaterThanOrEqual(2);
    });
});


