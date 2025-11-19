import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("string.quoted.double.lang", () => {
    it("matches double-quoted strings", async () => {
        const grammar = await loadGrammar();
        const pattern = getPatternByName(grammar, "string.quoted.double.lang");
        const re = new RegExp(pattern.match, "g");

        const line = 'x = "hello \\"world\\""';
        const matches = Array.from(line.matchAll(re)).map((m) => m[0]);

        expect(matches.length).toBe(1);
        expect(matches[0]).toBe('"hello \\"world\\""');
    });
});


