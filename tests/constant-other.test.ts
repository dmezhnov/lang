import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("constant.other.lang", () => {
    it("matches ALL_CAPS constants", async () => {
        const grammar = await loadGrammar();
        const constPattern = getPatternByName(grammar, "constant.other.lang");
        const re = new RegExp(constPattern.match, "g");

        const line = "OVERALL_REQUEST_CAPACITY: number = 120/100";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toContain("OVERALL_REQUEST_CAPACITY");
    });
});


