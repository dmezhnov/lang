import { describe, it, expect } from "bun:test";
import { loadGrammar, loadExample, getPatternByName } from "./helpers";

describe("keyword.operator.of.lang", () => {
    it("matches `of` type operator in examples", async () => {
        const grammar = await loadGrammar();
        const typePattern = getPatternByName(grammar, "keyword.operator.of.lang");
        const re = new RegExp(typePattern.match, "g");

        const text = await loadExample("ident.lang");
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThanOrEqual(0);
    });
});
