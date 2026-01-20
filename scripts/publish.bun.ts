import { resolve as resolvePath } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const $ = Bun.$;

// Workaround for NixOS/Home Manager read-only SSH config permission errors.
if (!process.env.GIT_SSH_COMMAND) {
    process.env.GIT_SSH_COMMAND = 'ssh -F /dev/null';
}

const TARGET_BRANCH = 'main';
const DRAFT_BRANCH = 'draft';

async function ensureGitClean(repoPath: string): Promise<void> {
    const result = await $`git status --porcelain`.cwd(repoPath).text();
    if (result.trim().length > 0) {
        console.log('Working directory is dirty. executing save script...');
        await $`bun run scripts/save.bun.ts`.cwd(repoPath);
    }
}

async function promptForVersion(currentVersion: string): Promise<string> {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const nextPatch = `${major}.${minor}.${(patch || 0) + 1}`;

    process.stdout.write(`Enter new version number (current: ${currentVersion}, default: ${nextPatch}): `);
    for await (const line of console) {
        const trimmed = line.trim();
        if (trimmed) {
            return trimmed;
        }
        return nextPatch;
    }
    throw new Error('No version provided.');
}


function syncVSCodePackage(rootPkgPath: string, vscodeExtPkgPath: string) {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const vscodeExtPkg = JSON.parse(readFileSync(vscodeExtPkgPath, 'utf-8'));

    // Sync metadata from root to vscode-extension
    vscodeExtPkg.name = rootPkg.name;
    vscodeExtPkg.displayName = rootPkg.displayName;
    vscodeExtPkg.publisher = rootPkg.publisher;
    vscodeExtPkg.description = rootPkg.description;
    vscodeExtPkg.version = rootPkg.version;
    vscodeExtPkg.repository = rootPkg.repository;
    vscodeExtPkg.license = rootPkg.license;

    writeFileSync(vscodeExtPkgPath, JSON.stringify(vscodeExtPkg, null, 4) + '\n');
    console.log(`✓ Synced metadata to ${vscodeExtPkgPath}`);
}

function syncZedExtension(rootPkgPath: string, zedTomlPath: string) {
    if (!existsSync(zedTomlPath)) return;

    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    let tomlContent = readFileSync(zedTomlPath, 'utf-8');

    // Sync metadata from root to zed-extension/extension.toml
    tomlContent = tomlContent.replace(/^version = "[\d.]+"$/m, `version = "${rootPkg.version}"`);
    tomlContent = tomlContent.replace(/^description = ".*"$/m, `description = "${rootPkg.description}"`);

    // Handle repository URL (extract from object if needed)
    const repoUrl = typeof rootPkg.repository === 'string'
        ? rootPkg.repository
        : rootPkg.repository?.url || '';
    tomlContent = tomlContent.replace(/^repository = ".*"$/m, `repository = "${repoUrl}"`);

    // Update authors array (convert publisher to authors)
    if (rootPkg.publisher) {
        tomlContent = tomlContent.replace(/^authors = \[.*\]$/m, `authors = ["${rootPkg.publisher}"]`);
    }

    writeFileSync(zedTomlPath, tomlContent);
    console.log(`✓ Synced metadata to ${zedTomlPath}`);
}

function updatePackageVersion(pkgPath: string, version: string) {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    pkg.version = version;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
    console.log(`Updated ${pkgPath} to version ${version}`);
}


function extractReleaseNotes(changelogContent: string, version: string): string {
    const escapedVersion = version.replace(/\./g, '\\.');
    const headerPattern = new RegExp(`^## \\[?${escapedVersion}\\]?`);

    const lines = changelogContent.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (startIndex === -1) {
            if (headerPattern.test(line)) {
                startIndex = i + 1;
            }
        } else {
            if (line.startsWith('## ')) {
                endIndex = i;
                break;
            }
        }
    }

    if (startIndex === -1) {
        throw new Error(`Could not find release notes for version ${version} in CHANGELOG.md`);
    }

    return lines.slice(startIndex, endIndex === -1 ? undefined : endIndex).join('\n').trim();
}

export async function main(): Promise<void> {
    const repoPath = process.cwd();

    // 1. Ensure clean state
    await ensureGitClean(repoPath);

    // Read current version from root package.json
    const pkgPath = resolvePath(repoPath, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const currentVersion = pkg.version;

    // 2. Prompt for version
    const version = await promptForVersion(currentVersion);
    console.log(`Preparing to publish version: ${version}`);

    // 3. Verify Changelog and Extract Notes
    const changelogPath = resolvePath(repoPath, 'CHANGELOG.md');
    const changelogContent = readFileSync(changelogPath, 'utf-8');
    const releaseNotes = extractReleaseNotes(changelogContent, version);
    console.log(`Extracted release notes for ${version}.`);

    // 4. Sync metadata across all package files
    const rootPkgPath = resolvePath(repoPath, 'package.json');

    // First update root version
    updatePackageVersion(rootPkgPath, version);

    // Then sync all metadata to extensions
    syncVSCodePackage(rootPkgPath, resolvePath(repoPath, 'vscode-extension/package.json'));
    syncZedExtension(rootPkgPath, resolvePath(repoPath, 'zed-extension/extension.toml'));


    await $`bun install`.cwd(repoPath); // Updates bun.lockb

    // 4.5 Build and Package to generate VSIX
    console.log('Building and packaging VSIX...');
    await $`bun run scripts/package.bun.ts`.cwd(repoPath);

    // 5. Commit bump
    const status = await $`git status --porcelain`.cwd(repoPath).text();
    if (status.trim()) {
        await $`git add .`.cwd(repoPath);
        await $`git commit -m "chore: bump version to ${version}"`.cwd(repoPath);
    } else {
        console.log('No changes to commit (version likely already bumped). Skipping commit step.');
    }

    // 6. Squash merge to main
    console.log(`Switching to ${TARGET_BRANCH} and squash merging...`);
    await $`git checkout ${TARGET_BRANCH}`.cwd(repoPath);
    await $`git pull origin ${TARGET_BRANCH}`.cwd(repoPath);

    await $`git merge --squash ${DRAFT_BRANCH}`.cwd(repoPath);

    // 7. Commit to main
    const commitMsg = `new version ${version}`;
    await $`git commit -m ${commitMsg}`.cwd(repoPath);
    console.log(`Committed: ${commitMsg}`);

    // 8. Push to main
    await $`git push origin ${TARGET_BRANCH}`.cwd(repoPath);
    console.log(`Pushed ${TARGET_BRANCH} to origin.`);

    // 9. GitHub Release
    console.log('Creating GitHub Release...');
    const pkgName = pkg.name;
    const vsixPath = `release/${version}/${pkgName}-${version}.vsix`;

    try {
        await $`gh release create v${version} ${vsixPath} --title "v${version}" --notes ${releaseNotes} --target ${TARGET_BRANCH}`.cwd(repoPath);
        console.log(`GitHub Release v${version} created.`);
    } catch (e) {
        console.warn('⚠️  Failed to create GitHub Release (it might already exist):', e);
        console.log('Continuing to publish steps...');
    }

    // 9.5 Publish to VS Code Marketplace
    console.log('Publishing to VS Code Marketplace...');
    try {
        await $`bun x vsce publish --packagePath ${vsixPath}`.cwd(repoPath);
        console.log('Successfully published to VS Code Marketplace.');
    } catch (e) {
        console.error('Failed to publish to VS Code Marketplace:', e);
    }

    // 9.6 Publish to OpenVSX
    console.log('Publishing to OpenVSX...');
    try {
        await $`bun x ovsx publish --packagePath ${vsixPath}`.cwd(repoPath);
        console.log('Successfully published to OpenVSX.');
    } catch (e) {
        console.warn('Failed to publish to OpenVSX (optional):', e);
    }

    // 9.5 Publish to VS Code Marketplace
    console.log('Publishing to VS Code Marketplace...');
    try {
        await $`bun x vsce publish --packagePath ${vsixPath}`.cwd(repoPath);
        console.log('Successfully published to VS Code Marketplace.');
    } catch (e) {
        console.error('Failed to publish to VS Code Marketplace:', e);
    }

    // 9.6 Publish to OpenVSX
    console.log('Publishing to OpenVSX...');
    try {
        await $`bun x ovsx publish --packagePath ${vsixPath}`.cwd(repoPath);
        console.log('Successfully published to OpenVSX.');
    } catch (e) {
        console.warn('Failed to publish to OpenVSX (optional):', e);
    }

    // 10. Publish Zed extension (placeholder for now)
    console.log('\n📦 Zed Extension:');
    console.log('⚠️  Zed extension submission to registry is not yet automated.');
    console.log('   To publish manually, visit: https://github.com/zed-industries/extensions');
    console.log(`   Zed branch has been updated at: https://github.com/${pkg.repository?.url?.match(/github\.com[:/](.+?)(\.git)?$/)?.[1]}/tree/zed`);
    console.log('');

    // Sync zed-extension to the 'zed' branch for Zed extensions registry.
    // This allows the Zed registry to submodule a branch where extension.toml is at the root.
    console.log('Syncing zed-extension to branch \'zed\'...');
    try {
        // Ensure local zed branch doesn't exist to avoid ancestry errors
        try { await $`git branch -D zed`.cwd(repoPath).quiet(); } catch {}

        // Force push the subdir to the 'zed' branch
        await $`git subtree split --prefix zed-extension -b zed`.cwd(repoPath);
        await $`git push origin zed:zed --force`.cwd(repoPath);
        // Clean up the temporary local branch split
        await $`git branch -D zed`.cwd(repoPath);
    } catch (e) {
        console.error('Failed to sync Zed branch:', e);
        console.log('You may need to run: git subtree push --prefix zed-extension origin zed');
    }

    // Fetch tags
    await $`git pull origin ${TARGET_BRANCH}`.cwd(repoPath);

    // 11. Sync draft branch
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
