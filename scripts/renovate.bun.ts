
import { existsSync } from 'node:fs';
import path from 'node:path';

// Find the trunk-installed renovate binary
// This is a bit heuristic, looking for the folder structure
const cacheDir = path.join(process.env.HOME || '', '.cache/trunk/tools/renovate');

async function findRenovateBin(): Promise<string | null> {
    if (!existsSync(cacheDir)) return null;

    // Find the version directory (e.g. 42.86.1-4a9f...)
    // We'll just take the first one found or look for the one in use
    const entries = await Array.fromAsync(new Bun.Glob('*').scan(cacheDir));

    // entries might be like ['42.86.1...']
    // Sort to get latest if multiple?
    entries.sort();

    if (entries.length === 0) return null;

    const versionDir = path.join(cacheDir, entries[entries.length - 1]);
    const binPath = path.join(versionDir, 'node_modules/.bin/renovate');

    if (existsSync(binPath)) {
        return binPath;
    }
    return null;
}

const bin = await findRenovateBin();
if (!bin) {
    console.error('Could not find Renovate binary in .cache/trunk/tools/renovate');
    console.error('Please ensure trunk has installed renovate (run `trunk install`).');
    process.exit(1);
}

console.log(`Using Renovate binary: ${bin}`);

if (!process.env.GITHUB_TOKEN) {
    console.warn('WARNING: GITHUB_TOKEN is not set. Renovate might fail to fetch changelogs or private repos.');
}

const args = [
    '--platform=local',
    '--dry-run=full',
    '--schedule=null',
    '--require-config=optional',
    process.cwd()
];

const proc = Bun.spawn([bin, ...args], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
});

const exitCode = await proc.exited;
process.exit(exitCode);
