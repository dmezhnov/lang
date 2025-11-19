import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("constant.numeric.lang", () => {
    it("matches numeric literals", async () => {
        const grammar = await loadGrammar();
        const numPattern = getPatternByName(grammar, "constant.numeric.lang");
        const re = new RegExp(numPattern.match, "g");

        const line = "OVERALL_REQUEST_CAPACITY: number = 120/100";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toEqual(expect.arrayContaining(["120", "100"]));
    });
});


