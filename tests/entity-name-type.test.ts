import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("entity.name.type.lang", () => {
    it("matches type names starting with a capital letter", async () => {
        const grammar = await loadGrammar();
        const typePattern = getPatternByName(grammar, "entity.name.type.lang");
        const re = new RegExp(typePattern.match, "g");

        const line =
            "matrix_source: Matrix(Region, Product_category, Product, Market_participant)";
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches).toEqual(
            expect.arrayContaining([
                "Matrix",
                "Region",
                "Product_category",
                "Product",
                "Market_participant",
            ]),
        );
    });
});

