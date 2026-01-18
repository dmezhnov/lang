import * as esbuild from 'esbuild';
import * as fs from 'fs';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build: esbuild.PluginBuild) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
            });
            console.log('[watch] build finished');

            // Make language server executable
            const serverPath = 'out/language/main.js';
            try {
                if (fs.existsSync(serverPath)) {
                    let content = fs.readFileSync(serverPath, 'utf8');
                    if (!content.startsWith('#!/usr/bin/env node')) {
                        content = '#!/usr/bin/env node\n' + content;
                        fs.writeFileSync(serverPath, content);
                    }
                    fs.chmodSync(serverPath, '755');
                }
            } catch (e) {
                console.error('Failed to make server executable:', e);
            }
        });
    },
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: [
            'src/extension/main.ts',
            'src/language/main.ts'
        ],
        bundle: true,
        format: 'cjs',
        minify: isProduction,
        sourcemap: !isProduction,
        sourcesContent: false,
        platform: 'node',
        outdir: 'out',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
        ],
    });

    if (isWatch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
