import { describe, it, expect } from "bun:test";
import { loadGrammar, loadExample, getPatternByName } from "./helpers";

describe("keyword.operator.from.lang", () => {
    // This test also covers keyword.operator.lang used in captures
    it("matches `from` field access operator in examples", async () => {
        const grammar = await loadGrammar();
        const fromPattern = getPatternByName(grammar, "keyword.operator.from.lang");
        const re = new RegExp(fromPattern.match, "g");

        const text = await loadExample("ident.lang");
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});
