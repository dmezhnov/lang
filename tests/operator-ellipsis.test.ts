import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("keyword.operator.ellipsis.lang", () => {
    it("matches `...` inside generic arguments", async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, "keyword.operator.ellipsis.lang");
        const re = new RegExp(pattern.match, "g");

        const line = "matrix_source_1: Matrix(...TAxis)";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toEqual(expect.arrayContaining(["..."]));
    });
});


