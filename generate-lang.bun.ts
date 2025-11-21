import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

// Very small TextMate grammar generator and language configuration generator
// for the custom "Lang" language.
// It writes the same JSON structures as `syntaxes/lang.tmLanguage.json`
// and `language-configuration.json`.
// Basic patterns
const stringPattern = /"(?:\\.|[^"])*"/.source;
// Lines starting with one or more `#` followed by space (Markdown-style headings and comments)
const numberSignCommentPattern = /#+\s.*/.source;
const numberPattern = /[0-9]+/.source;
const keywordWherePattern = /\bwhere\b/.source;
const assignmentOperatorPattern = /=/.source;
const typeAnnotationOperatorPattern = /:/.source;
const typePattern = /[A-Z][A-Za-z0-9_]*/.source;
// Punctuation and other operators
const lParenPattern = /\(/.source;
const rParenPattern = /\)/.source;
const commaPattern = /,/.source;
const ellipsisPattern = /\.{3}/.source;
// capture 1: variable name (any case), capture 2: colon as type-annotation operator
const variableBeforeColonPattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(:)/.source;
const functionNamePattern = /([a-z_][A-Za-z0-9_]*)\s*\(/.source;
const variablePattern = /[a-z_][A-Za-z0-9_]*/.source;

const grammar = {
    $schema:
        'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: 'Lang',
    patterns: [
        {
            match: stringPattern,
            name: 'string.quoted.double.lang',
        },
        {
            match: numberSignCommentPattern,
            name: 'comment.line.number-sign.lang',
        },
        {
            match: numberPattern,
            name: 'constant.numeric.lang',
        },
        {
            match: keywordWherePattern,
            name: 'keyword.other.lang',
        },
        {
            match: assignmentOperatorPattern,
            name: 'keyword.operator.assignment.lang',
        },
        {
            match: typeAnnotationOperatorPattern,
            name: 'keyword.operator.type.annotation.lang',
        },
        {
            match: variableBeforeColonPattern,
            captures: {
                '1': { name: 'variable.name.lang' },
                '2': { name: 'keyword.operator.type.annotation.lang' },
            },
        },
        {
            match: typePattern,
            name: 'entity.name.type.lang',
        },
        {
            match: lParenPattern,
            name: 'punctuation.parenthesis.open.lang',
        },
        {
            match: rParenPattern,
            name: 'punctuation.parenthesis.close.lang',
        },
        {
            match: commaPattern,
            name: 'punctuation.separator.comma.lang',
        },
        {
            match: ellipsisPattern,
            name: 'keyword.operator.ellipsis.lang',
        },
        {
            match: functionNamePattern,
            captures: {
                '1': { name: 'entity.name.function.lang' },
            },
        },
        {
            match: variablePattern,
            name: 'variable.name.lang',
        },
    ],
    repository: {},
    scopeName: 'lang.lang',
};

const languageConfiguration = {
    comments: {
        lineComment: '#',
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
    ],
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
