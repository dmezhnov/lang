// Git helper script to save all changes into the "main" branch.
// Behavior (for the current repository and all its git submodules, recursively):
// - Ensure we are inside a Git repository.
// - Check out the "main" branch.
// - Stage all modifications.
// - If there are staged changes, create a commit with the provided message.
// - If an upstream is configured for the "main" branch, merge remote changes via
//   "git pull --no-rebase" before pushing.
// - Push the "main" branch to the remote.
// - Additionally, walk all git submodules (including nested ones) and apply
//   the same behavior in each submodule's own repository.

import { resolve as resolvePath, sep as pathSep } from 'node:path';

const $ = Bun.$;

const TARGET_BRANCH_NAME = 'main';

async function ensureInsideGitRepo(repoPath: string): Promise<void> {
    const result = await $`git rev-parse --is-inside-work-tree`.cwd(repoPath).nothrow();
    if (result.exitCode !== 0) {
        throw new Error(`Current directory "${repoPath}" is not inside a Git repository.`);
    }
}

async function resolveRemoteName(repoPath: string): Promise<string> {
    const output = await $`git remote`.cwd(repoPath).text();
    const remotes = output
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

    if (remotes.length === 0) {
        throw new Error(
            `No Git remotes configured for repository "${repoPath}". Please add a remote (for example, "origin").`,
        );
    }

    if (remotes.includes('origin')) {
        return 'origin';
    }

    if (remotes.length === 1) {
        return remotes[0]!;
    }

    throw new Error(
        `Multiple Git remotes detected in "${repoPath}" (${remotes.join(
            ', ',
        )}). Please add "origin" or adjust the script to select a remote explicitly.`,
    );
}

async function ensureTargetBranchExists(repoPath: string): Promise<void> {
    const result = await $`git rev-parse --verify ${TARGET_BRANCH_NAME}`.cwd(repoPath).nothrow();
    if (result.exitCode === 0) {
        return;
    }

    // Attempt to fetch from origin to see if main exists remotely
    /*
       We generally expect 'main' to exist. If it doesn't locally, we should try to fetch it or checkout -b if it's a new repo.
       For now, let's assume if it's missing locally, we create it?
       Actually, standard 'main' usually exists. If not, we might fail or create it.
       Let's stick to the behavior of creating it if missing, similar to 'save'.
    */
    // Create local branch from current HEAD.
    await $`git branch ${TARGET_BRANCH_NAME}`.cwd(repoPath);
}

async function checkoutTargetBranch(repoPath: string): Promise<void> {
    const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`.cwd(repoPath).text()).trim();
    if (currentBranch === TARGET_BRANCH_NAME) {
        return;
    }

    await $`git checkout ${TARGET_BRANCH_NAME}`.cwd(repoPath);
}

async function stageAllChanges(repoPath: string): Promise<void> {
    await $`git add -A`.cwd(repoPath);
}

async function hasStagedChanges(repoPath: string): Promise<boolean> {
    // git diff --cached --quiet returns exit code 1 when there are staged changes.
    const result = await $`git diff --cached --quiet`.cwd(repoPath).nothrow();
    return result.exitCode !== 0;
}

async function commitIfNeeded(repoPath: string, message: string): Promise<boolean> {
    const hasChanges = await hasStagedChanges(repoPath);
    if (!hasChanges) {
        console.log(`No changes to commit on the "${TARGET_BRANCH_NAME}" branch in "${repoPath}".`);
        return false;
    }

    await $`git commit -m ${message}`.cwd(repoPath);
    console.log(`Created commit with message: "${message}" in "${repoPath}".`);
    return true;
}

async function pushTargetBranch(repoPath: string, remoteName: string): Promise<void> {
    const result = await $`git push -u ${remoteName} ${TARGET_BRANCH_NAME}`.cwd(repoPath).nothrow();

    if (result.exitCode !== 0) {
        console.error(
            `Warning: failed to push "${TARGET_BRANCH_NAME}" branch to the "${remoteName}" remote for repository "${repoPath}". ` +
            'Your changes are committed locally, but the remote branch has not been updated. ' +
            'Please inspect the Git output above, fix the problem, and re-run the script ' +
            'if you need the remote to be up to date.',
        );
    }
}

async function pullTargetBranchWithMergeIfUpstreamExists(repoPath: string): Promise<void> {
    const upstreamCheck = await $`git rev-parse --abbrev-ref --symbolic-full-name ${TARGET_BRANCH_NAME}@{u}`
        .cwd(repoPath)
        .nothrow();

    if (upstreamCheck.exitCode !== 0) {
        console.log(
            `No upstream is configured for the "${TARGET_BRANCH_NAME}" branch yet in "${repoPath}". ` +
            'Skipping "git pull" before push.',
        );
        return;
    }

    // Upstream exists – pull with merge (no rebase) to integrate remote changes before pushing.
    const pullResult = await $`git pull --no-rebase`.cwd(repoPath).nothrow();

    if (pullResult.exitCode !== 0) {
        console.error(
            `Warning: failed to pull and merge remote changes into the "${TARGET_BRANCH_NAME}" branch in "${repoPath}". ` +
            'The script will continue using the local branch state. ' +
            'Please resolve any Git issues manually and re-run the script ' +
            'if you need the local branch to be synchronized with the remote.',
        );
    }
}


async function getCurrentBranch(repoPath: string): Promise<string> {
    return (await $`git rev-parse --abbrev-ref HEAD`.cwd(repoPath).text()).trim();
}

async function mergeBranch(repoPath: string, branchName: string): Promise<void> {
    const result = await $`git merge ${branchName}`.cwd(repoPath).nothrow();
    if (result.exitCode !== 0) {
        throw new Error(`Failed to merge branch "${branchName}" into "${TARGET_BRANCH_NAME}" in "${repoPath}". Please resolve conflicts manually.`);
    }
}

async function runPublishForRepo(repoPath: string, message: string): Promise<void> {
    await ensureInsideGitRepo(repoPath);

    const remoteName = await resolveRemoteName(repoPath);

    // 1. Stage and Commit on CURRENT branch (whatever it is)
    await stageAllChanges(repoPath);
    const committed = await commitIfNeeded(repoPath, message);

    const currentBranch = await getCurrentBranch(repoPath);

    // 2. If we are not on main, switch to main and merge the work we just did
    if (currentBranch !== TARGET_BRANCH_NAME) {
        await ensureTargetBranchExists(repoPath);
        await checkoutTargetBranch(repoPath);

        // If we were on detached HEAD, we might need to handle it differently,
        // but 'git merge HEAD' (referring to the previous HEAD) or the branch name works.
        // Since we just came from 'currentBranch', it should be a valid ref.
        // If detached, 'currentBranch' is 'HEAD', which might be ambiguous after checkout.
        // But `getCurrentBranch` returns 'HEAD' only if truly detached.
        // Better to use the commit hash if detached?
        // For now assuming we are on a branch or 'HEAD' resolves correctly if we used a specific commit logic,
        // but 'HEAD' after checkout refers to the NEW HEAD.
        // So if we were detached, we must capture the commit hash.

        let mergeSource = currentBranch;
        if (currentBranch === 'HEAD') {
            // Capture the commit hash we just committed to
            // But we already switched? No, we are checking out NOW.
            // Wait, logic above: we haven't switched yet.
            // So if currentBranch is HEAD, we need the SHA.
            // However, `getCurrentBranch` was called after commit.
            // If we are detached, `git rev-parse HEAD` returns the commit SHA?
            // No, `abbrev-ref` returns HEAD.
            // Let's get the SHA to be safe if it is HEAD.
            const sha = (await $`git rev-parse HEAD`.cwd(repoPath).text()).trim();
            mergeSource = sha;
        }

        console.log(`Merging changes from "${mergeSource}" into "${TARGET_BRANCH_NAME}"...`);
        await mergeBranch(repoPath, mergeSource);
    }

    // 3. Sync with remote and push
    // Always attempt to integrate remote changes
    await pullTargetBranchWithMergeIfUpstreamExists(repoPath);

    // Always attempt push
    await pushTargetBranch(repoPath, remoteName);

    if (!committed && currentBranch === TARGET_BRANCH_NAME) {
        console.log(`Branch "${TARGET_BRANCH_NAME}" has been pushed in "${repoPath}" (no new commit was necessary).`);
    } else if (currentBranch !== TARGET_BRANCH_NAME) {
        console.log(`Published changes from "${currentBranch}" to "${TARGET_BRANCH_NAME}" in "${repoPath}".`);
    }
}

async function ensureSubmodulesInitialized(rootPath: string): Promise<void> {
    const result = await $`git submodule update --init --recursive`.cwd(rootPath).nothrow();

    if (result.exitCode !== 0) {
        console.error(
            `Warning: failed to initialize git submodules in "${rootPath}". ` +
            'The script will continue, but submodules may not be updated. ' +
            'Please inspect the Git output above and fix the problem if you rely on submodules.',
        );
    }
}

async function listAllSubmodulePathsRecursively(rootPath: string): Promise<string[]> {
    const visited = new Set<string>();

    async function collectSubmodules(basePath: string): Promise<void> {
        const result = await $`git config --file .gitmodules --get-regexp path`.cwd(basePath).nothrow();

        if (result.exitCode !== 0) {
            return;
        }

        const stdout = result.stdout.toString().trim();
        if (!stdout) {
            return;
        }

        const lines = stdout.split('\n');
        for (const line of lines) {
            const segments = line.trim().split(/\s+/);
            if (segments.length < 2) {
                continue;
            }

            const relativePath = segments[1]!;
            const absolutePath = resolvePath(basePath, relativePath);

            if (visited.has(absolutePath)) {
                continue;
            }

            visited.add(absolutePath);
            await collectSubmodules(absolutePath);
        }
    }

    await collectSubmodules(rootPath);

    return Array.from(visited);
}

async function isIndependentGitRepository(candidatePath: string, rootPath: string): Promise<boolean> {
    const resolvedRoot = resolvePath(rootPath);
    const resolvedCandidate = resolvePath(candidatePath);

    const result = await $`git rev-parse --show-toplevel`.cwd(candidatePath).nothrow();

    if (result.exitCode !== 0) {
        return false;
    }

    const gitRoot = result.stdout.toString().trim();

    if (!gitRoot) {
        return false;
    }

    const resolvedGitRoot = resolvePath(gitRoot);

    if (resolvedGitRoot === resolvedRoot) {
        return false;
    }

    return resolvedGitRoot === resolvedCandidate;
}

async function getCommitMessage(): Promise<string> {
    // Check if message is provided as argument (e.g. bun scripts/publish.bun.ts "Message")
    // Bun.argv: [bun_binary, script_path, ...args]
    const args = Bun.argv.slice(2);
    if (args.length > 0) {
        return args.join(' ');
    }

    // Prompt the user
    process.stdout.write('Enter commit message: ');
    for await (const line of console) {
        const trimmed = line.trim();
        if (trimmed) {
            return trimmed;
        }
        process.stdout.write('Message cannot be empty. Enter commit message: ');
    }

    throw new Error('No commit message provided.');
}

export async function main(): Promise<void> {
    const message = await getCommitMessage();
    console.log(`Using commit message: "${message}"`);

    const rootPath = process.cwd();

    await ensureSubmodulesInitialized(rootPath);

    const allSubmodulePaths = await listAllSubmodulePathsRecursively(rootPath);

    const submodulePaths: string[] = [];

    for (const submodulePath of allSubmodulePaths) {
        const isRepo = await isIndependentGitRepository(submodulePath, rootPath);

        if (!isRepo) {
            console.warn(
                `Skipping path "${submodulePath}" because it is not an independent Git repository. ` +
                'If this path is meant to be a submodule, please ensure it is properly initialized.',
            );
            continue;
        }

        submodulePaths.push(submodulePath);
    }

    submodulePaths.sort((a, b) => {
        const aDepth = a.split(pathSep).length;
        const bDepth = b.split(pathSep).length;
        return bDepth - aDepth;
    });

    for (const submodulePath of submodulePaths) {
        await runPublishForRepo(submodulePath, message);
    }

    await runPublishForRepo(rootPath, message);
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
}
