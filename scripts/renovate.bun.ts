import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

// Find the trunk-installed renovate binary
// This is a bit heuristic, looking for the folder structure
const cacheDir = path.join(process.env.HOME || '', '.cache/trunk/tools/renovate');

async function findRenovateBin(): Promise<string | null> {
    if (!existsSync(cacheDir)) {
        console.error(`Cache dir not found: ${cacheDir}`);
        return null;
    }

    // Find the version directory (e.g. 42.86.1-4a9f...)
    const entries = await readdir(cacheDir);

    // Sort reverse to prioritize what looks like latest versions
    entries.sort().reverse();
    console.log(`Found candidate directories in trunk cache: ${entries.join(', ')}`);

    for (const entry of entries) {
        const versionDir = path.join(cacheDir, entry);
        const binPath = path.join(versionDir, 'node_modules/.bin/renovate');

        if (existsSync(binPath)) {
            console.log(`Found valid binary at: ${binPath}`);
            return binPath;
        }
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
    '--onboarding=false'
];

const proc = Bun.spawn([bin, ...args], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
});

const exitCode = await proc.exited;
process.exit(exitCode);
