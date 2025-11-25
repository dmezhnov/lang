import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

// Very small TextMate grammar generator and language configuration generator
// for the custom "Lang" language.
// It writes the same JSON structures as `syntaxes/lang.tmLanguage.json`
// and `language-configuration.json`.

// Core language characters shared between grammar patterns and language configuration
const coreCharacters = {
    commentLine: '#',
    brackets: {
        curly: ['{', '}'] as const,
        paren: ['(', ')'] as const,
    },
    string: {
        doubleQuote: '"',
    },
} as const;

// Helpers for building regular expression sources
function escapeForRegex(text: string): string {
    return text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function escapeForCharClass(text: string): string {
    return text.replace(/[-\\^]/g, '\\$&');
}

// Basic patterns
const stringPattern = String.raw`${coreCharacters.string.doubleQuote}(?:\\.|[^${escapeForCharClass(
    coreCharacters.string.doubleQuote,
)}])*${coreCharacters.string.doubleQuote}`;
// Comment regions start at the first run of one or more `#` characters that is
// either followed by whitespace and some text, or reaches the end of the line.
// This supports both full-line comments and inline comments after code, while
// avoiding treating `#` immediately followed by a non-space character as a
// comment.
const numberSignCommentPattern = String.raw`(?:${escapeForRegex(
    coreCharacters.commentLine,
)}+\s+.*$|${escapeForRegex(coreCharacters.commentLine)}+$)`;
const numberPattern = /[0-9]+/.source;
const keywordWherePattern = /\bwhere\b/.source;
const assignmentOperatorPattern = /=/.source;
const typeAnnotationOperatorPattern = /:/.source;
// Punctuation and other operators
const lParenPattern = escapeForRegex(coreCharacters.brackets.paren[0]);
const rParenPattern = escapeForRegex(coreCharacters.brackets.paren[1]);
const commaPattern = /,/.source;
const ellipsisPattern = /\.{3}/.source;
// capture 1: variable name (any case), capture 2: colon as type-annotation operator
const variableBeforeColonPattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(:)/.source;
const functionNamePattern = /([a-z_][A-Za-z0-9_]*)\s*\(/.source;
const variablePattern = /[a-z_][A-Za-z0-9_]*/.source;

const lang_postfix = 'lang';

const grammar = {
    $schema:
        'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: 'Lang',
    patterns: [
        {
            match: stringPattern,
            name: `string.quoted.double.${lang_postfix}`,
        },
        {
            match: numberSignCommentPattern,
            name: `comment.line.number-sign.${lang_postfix}`,
        },
        {
            match: numberPattern,
            name: `constant.numeric.${lang_postfix}`,
        },
        {
            match: keywordWherePattern,
            name: `keyword.other.${lang_postfix}`,
        },
        {
            match: assignmentOperatorPattern,
            name: `keyword.operator.assignment.${lang_postfix}`,
        },
        {
            match: typeAnnotationOperatorPattern,
            name: `keyword.operator.type.annotation.${lang_postfix}`,
        },
        {
            match: variableBeforeColonPattern,
            captures: {
                '1': { name: `variable.name.${lang_postfix}` },
                '2': { name: `keyword.operator.type.annotation.${lang_postfix}` },
            },
        },
        {
            match: lParenPattern,
            name: `punctuation.parenthesis.open.${lang_postfix}`,
        },
        {
            match: rParenPattern,
            name: `punctuation.parenthesis.close.${lang_postfix}`,
        },
        {
            match: commaPattern,
            name: `punctuation.separator.comma.${lang_postfix}`,
        },
        {
            match: ellipsisPattern,
            name: `keyword.operator.ellipsis.${lang_postfix}`,
        },
        {
            match: functionNamePattern,
            captures: {
                '1': { name: `entity.name.function.${lang_postfix}` },
            },
        },
        {
            match: variablePattern,
            name: `variable.name.${lang_postfix}`,
        },
    ],
    repository: {},
    scopeName: `${lang_postfix}.${lang_postfix}`,
};

const bracketPairs: [string, string][] = [
    coreCharacters.brackets.curly,
    coreCharacters.brackets.paren,
];

const quotePair = {
    open: coreCharacters.string.doubleQuote,
    close: coreCharacters.string.doubleQuote,
};

const bracketAutoPairs = bracketPairs.map(([open, close]) => ({ open, close }));

const languageConfiguration = {
    comments: {
        lineComment: coreCharacters.commentLine,
    },
    brackets: bracketPairs,
    autoClosingPairs: [...bracketAutoPairs, quotePair],
    surroundingPairs: [...bracketAutoPairs, quotePair],
};

export async function main() {
    const outDir = './syntaxes';
    await mkdir(outDir, { recursive: true });

    const grammarPath = resolve(outDir, 'lang.tmLanguage.json');
    const grammarJson = JSON.stringify(grammar, null, 4) + '\n';

    await writeFile(grammarPath, grammarJson, 'utf8');

    const languageConfigPath = resolve('language-configuration.json');
    const languageConfigJson =
        JSON.stringify(languageConfiguration, null, 4) + '\n';
    await writeFile(languageConfigPath, languageConfigJson, 'utf8');
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        // non-fatal for tooling, but indicate error in exit code
        process.exitCode = 1;
    });
}
