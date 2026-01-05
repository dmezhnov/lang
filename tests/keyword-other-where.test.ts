import { describe, it, expect } from "bun:test";
import { loadGrammar, loadExample, getPatternByName } from "./helpers";

describe("keyword.other.lang (where)", () => {
    it("matches `where` keyword in examples", async () => {
        const grammar = await loadGrammar();
        const wherePattern = getPatternByName(grammar, "keyword.other.lang");
        const re = new RegExp(wherePattern.match, "g");

        const testLine = "where";
        const count = Array.from(testLine.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});
