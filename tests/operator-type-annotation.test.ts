import { describe, it, expect } from "bun:test";
import { loadGrammar, loadExample, getPatternByName } from "./helpers";

describe("keyword.operator.type.annotation.lang", () => {
    it("matches `:` type annotation operator in examples", async () => {
        const grammar = await loadGrammar();
        const typePattern = getPatternByName(grammar, "keyword.operator.type.annotation.lang");
        const re = new RegExp(typePattern.match, "g");

        const text = await loadExample("operations.lang");
        const count = Array.from(text.matchAll(re)).length;

        expect(count).toBeGreaterThan(0);
    });
});


