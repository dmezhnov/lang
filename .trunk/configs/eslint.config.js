import js        from '@eslint/js';
import tsParser  from '@typescript-eslint/parser';
import tsPlugin  from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import putout    from 'eslint-plugin-putout';

export default [
    {
        plugins: {
            putout,
        },
        rules: {
            'convert-esm-to-commonjs': 'off'
        },
    },
    js.configs.recommended,
    stylistic.configs['disable-legacy'],
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/semi':   ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                console:    'readonly',
                process:    'readonly',
                module:     'readonly',
                require:    'readonly',
                __dirname:  'readonly',
                __filename: 'readonly',
            },
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType:  'module',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Bun:     'readonly',
                module:  'readonly',
                require: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
        },
    },
];
