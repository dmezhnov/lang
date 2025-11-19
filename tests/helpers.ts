import { readFile } from "fs/promises";
import { resolve } from "path";

export type GrammarPattern = {
    match: string;
    name?: string;
    captures?: Record<string, { name: string }>;
};

export type Grammar = {
    patterns: GrammarPattern[];
};

export async function loadGrammar(): Promise<Grammar> {
    const grammarPath = resolve("syntaxes", "lang.tmLanguage.json");
    const raw = await readFile(grammarPath, "utf8");
    return JSON.parse(raw) as Grammar;
}

export async function loadExample(file: string): Promise<string> {
    const examplePath = resolve("examples", file);
    return readFile(examplePath, "utf8");
}

export function getPatternByName(grammar: Grammar, name: string): GrammarPattern {
    const pattern = grammar.patterns.find((p) => p.name === name);
    if (!pattern) {
        throw new Error(`Pattern with name "${name}" not found in grammar`);
    }
    return pattern;
}

export function getPatternByCaptureName(grammar: Grammar, captureName: string): GrammarPattern {
    const pattern = grammar.patterns.find((p) =>
        Object.values(p.captures ?? {}).some((c) => c.name === captureName),
    );
    if (!pattern) {
        throw new Error(`Pattern with capture name "${captureName}" not found in grammar`);
    }
    return pattern;
}


