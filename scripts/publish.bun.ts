import { resolve as resolvePath } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const $ = Bun.$;

// Workaround for NixOS/Home Manager read-only SSH config permission errors.
// We force SSH to ignore the user config file since it's causing "Bad owner or permissions" errors.
if (!process.env.GIT_SSH_COMMAND) {
    process.env.GIT_SSH_COMMAND = 'ssh -F /dev/null';
}

const TARGET_BRANCH = 'main';
const DRAFT_BRANCH = 'draft';

async function ensureGitClean(repoPath: string): Promise<void> {
    const result = await $`git status --porcelain`.cwd(repoPath).text();
    if (result.trim().length > 0) {
        throw new Error(`Working directory in "${repoPath}" is not clean. Please commit or stash changes before publishing.`);
    }
}

async function promptForVersion(): Promise<string> {
    process.stdout.write('Enter new version number (e.g., 0.3.1): ');
    for await (const line of console) {
        const trimmed = line.trim();
        if (trimmed) {
            return trimmed;
        }
        process.stdout.write('Version cannot be empty. Enter new version number: ');
    }
    throw new Error('No version provided.');
}

function updatePackageVersion(repoPath: string, version: string) {
    const pkgPath = resolvePath(repoPath, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.version = version;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
    console.log(`Updated package.json to version ${version}`);
}

function extractReleaseNotes(changelogContent: string, version: string): string {
    const escapedVersion = version.replace(/\./g, '\\.');
    // Matches "## [0.3.0]" or "## 0.3.0" possibly followed by date
    const headerPattern = new RegExp(`^## \\[?${escapedVersion}\\]?`);

    const lines = changelogContent.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (startIndex === -1) {
            if (headerPattern.test(line)) {
                startIndex = i + 1; // Start content after the header
            }
        } else {
            // If we found the start, look for the next header (starting with ## )
            if (line.startsWith('## ')) {
                endIndex = i;
                break;
            }
        }
    }

    if (startIndex === -1) {
        throw new Error(`Could not find release notes for version ${version} in CHANGELOG.md`);
    }

    const notes = lines.slice(startIndex, endIndex === -1 ? undefined : endIndex).join('\n').trim();
    return notes;
}

export async function main(): Promise<void> {
    const repoPath = process.cwd();

    // 1. Ensure clean state
    await ensureGitClean(repoPath);

    // 2. Prompt for version
    const version = await promptForVersion();
    console.log(`Preparing to publish version: ${version}`);

    // 3. Verify Changelog and Extract Notes
    const changelogPath = resolvePath(repoPath, 'CHANGELOG.md');
    const changelogContent = readFileSync(changelogPath, 'utf-8');
    const releaseNotes = extractReleaseNotes(changelogContent, version);
    console.log(`Extracted release notes for ${version}.`);

    // 4. Update package.json and lockfile
    updatePackageVersion(repoPath, version);
    await $`bun install`.cwd(repoPath); // Updates bun.lockb

    // 5. Commit bump to current branch (draft)
    await $`git add package.json bun.lock`.cwd(repoPath);
    await $`git commit -m "chore: bump version to ${version}"`.cwd(repoPath);

    // 6. Squash merge to main
    console.log(`Switching to ${TARGET_BRANCH} and squash merging...`);
    await $`git checkout ${TARGET_BRANCH}`.cwd(repoPath);
    await $`git pull origin ${TARGET_BRANCH}`.cwd(repoPath);

    // Merge draft into main with squash
    await $`git merge --squash ${DRAFT_BRANCH}`.cwd(repoPath);

    // 7. Commit to main
    const commitMsg = `new version ${version}`;
    await $`git commit -m ${commitMsg}`.cwd(repoPath);
    console.log(`Committed: ${commitMsg}`);

    // 8. Push to main (required before gh release)
    await $`git push origin ${TARGET_BRANCH}`.cwd(repoPath);
    console.log(`Pushed ${TARGET_BRANCH} to origin.`);

    // 9. GitHub Release
    console.log('Creating GitHub Release...');
    // Using --target to ensure it tags the commit we just pushed to main
    await $`gh release create v${version} --title "v${version}" --notes ${releaseNotes} --target ${TARGET_BRANCH}`.cwd(repoPath);
    console.log(`GitHub Release v${version} created.`);

    // Fetch the new tag locally
    await $`git pull origin ${TARGET_BRANCH}`.cwd(repoPath);

    // 10. Sync draft branch
    console.log(`Resetting ${DRAFT_BRANCH} to match ${TARGET_BRANCH}...`);
    await $`git checkout ${DRAFT_BRANCH}`.cwd(repoPath);
    await $`git reset --hard ${TARGET_BRANCH}`.cwd(repoPath);
    await $`git push origin ${DRAFT_BRANCH} --force`.cwd(repoPath);
    console.log(`${DRAFT_BRANCH} is now synced with ${TARGET_BRANCH}.`);
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
}
