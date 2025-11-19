import { describe, it, expect } from "bun:test";
import { loadGrammar, getPatternByName } from "./helpers";

describe("comment.line.number-sign.lang", () => {
    it("matches markdown-style heading lines starting with #", async () => {
        const grammar = await loadGrammar();
        const commentPattern = getPatternByName(grammar, "comment.line.number-sign.lang");
        const re = new RegExp(commentPattern.match);

        const examples = [
            "# Операции с матрицами",
            "## Служебные операции",
            "### - Создать пустую матрицу по координатам ✅",
            "#### 1. Создать пустую матрицу по координатам ✅",
            "### - Для каждой пары",
        ];

        for (const line of examples) {
            expect(re.test(line)).toBe(true);
        }
    });
});


