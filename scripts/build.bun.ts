import type { BuildConfig } from 'bun';
import { watch } from 'fs';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

const config: BuildConfig = {
    entrypoints: [
        'src/extension/main.ts',
        'src/language/main.ts'
    ],
    outdir: 'out',
    target: 'node',
    format: 'cjs',
    sourcemap: isProduction ? 'none' : 'external',
    minify: isProduction,
    external: ['vscode'],
    // Bun automatically handles creating chunks if needed, but for VSCode extensions
    // we usually want separate bundles or a specific structure.
    // entrypoints will result in out/extension/main.js and out/language/main.js
    // if we mirror source structure, checking outdir behavior below.
    naming: {
        entry: '[dir]/[name].[ext]',
    },
};

async function build() {
    console.log('[watch] build started');
    const result = await Bun.build(config);

    if (!result.success) {
        for (const message of result.logs) {
            console.error(message);
        }
    }
    console.log('[watch] build finished');
}

await build();

if (isWatch) {
    console.log('Watching for changes...');
    // Simple recursive watcher on src
    watch('src', { recursive: true }, async (event, filename) => {
        console.log(`Detected change in ${filename}`);
        await build();
    });

    // Keep process alive
    process.stdin.resume();
}
