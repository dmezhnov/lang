// Git helper script to save all changes into the "draft" branch.
// Behavior (for the current repository and all its git submodules, recursively):
// - Ensure we are inside a Git repository.
// - Ensure a local "draft" branch exists (create it if missing).
// - Check out the "draft" branch.
// - Stage all modifications.
// - If there are staged changes, create a commit with a unique message
//   in the format "draft-YYYY-MM-DD-HH-MM-SS".
// - If an upstream is configured for the "draft" branch, merge remote changes via
//   "git pull --no-rebase" before pushing.
// - Push the "draft" branch to the remote (create remote branch if missing).
// - Additionally, walk all git submodules (including nested ones) and apply
//   the same behavior in each submodule's own repository.

import { resolve as resolvePath, sep as pathSep } from 'node:path';

const $ = Bun.$;

const DRAFT_BRANCH_NAME = 'draft';

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

async function ensureDraftBranchExists(repoPath: string): Promise<void> {
    const result = await $`git rev-parse --verify ${DRAFT_BRANCH_NAME}`.cwd(repoPath).nothrow();
    if (result.exitCode === 0) {
        return;
    }

    // Create local draft branch from current HEAD.
    await $`git branch ${DRAFT_BRANCH_NAME}`.cwd(repoPath);
}

async function checkoutDraftBranch(repoPath: string): Promise<void> {
    const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`.cwd(repoPath).text()).trim();
    if (currentBranch === DRAFT_BRANCH_NAME) {
        return;
    }

    await $`git checkout ${DRAFT_BRANCH_NAME}`.cwd(repoPath);
}

function formatDraftCommitMessage(now: Date): string {
    const pad = (value: number): string => value.toString().padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `draft-${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

async function stageAllChanges(repoPath: string): Promise<void> {
    await $`git add -A`.cwd(repoPath);
}

async function hasStagedChanges(repoPath: string): Promise<boolean> {
    // git diff --cached --quiet returns exit code 1 when there are staged changes.
    const result = await $`git diff --cached --quiet`.cwd(repoPath).nothrow();
    return result.exitCode !== 0;
}

async function commitIfNeeded(repoPath: string): Promise<boolean> {
    const hasChanges = await hasStagedChanges(repoPath);
    if (!hasChanges) {
        console.log(`No changes to commit on the "${DRAFT_BRANCH_NAME}" branch in "${repoPath}".`);
        return false;
    }

    const message = formatDraftCommitMessage(new Date());
    await $`git commit -m ${message}`.cwd(repoPath);
    console.log(`Created commit with message: ${message} in "${repoPath}".`);
    return true;
}

async function pushDraftBranch(repoPath: string, remoteName: string): Promise<void> {
    const result = await $`git push -u ${remoteName} ${DRAFT_BRANCH_NAME}`.cwd(repoPath).nothrow();

    if (result.exitCode !== 0) {
        // Treat push failures as a soft error: we still want the local commit to
        // succeed even if the remote is temporarily unavailable or credentials
        // are not configured in the current environment.
        console.error(
            `Warning: failed to push "${DRAFT_BRANCH_NAME}" branch to the "${remoteName}" remote for repository "${repoPath}". ` +
            'Your changes are committed locally, but the remote branch has not been updated. ' +
            'Please inspect the Git output above, fix the problem, and re-run the save script ' +
            'if you need the remote to be up to date.',
        );
    }
}

async function pullDraftBranchWithMergeIfUpstreamExists(repoPath: string): Promise<void> {
    // Check whether the draft branch has an upstream configured. If there is no upstream yet
    // (for example, on the very First push), we skip the pull step and go straight to push.
    const upstreamCheck = await $`git rev-parse --abbrev-ref --symbolic-full-name ${DRAFT_BRANCH_NAME}@{u}`
        .cwd(repoPath)
        .nothrow();

    if (upstreamCheck.exitCode !== 0) {
        console.log(
            `No upstream is configured for the "${DRAFT_BRANCH_NAME}" branch yet in "${repoPath}". ` +
            'Skipping "git pull" before push.',
        );
        return;
    }

    // Upstream exists – pull with merge (no rebase) to integrate remote changes before pushing.
    const pullResult = await $`git pull --no-rebase`.cwd(repoPath).nothrow();

    if (pullResult.exitCode !== 0) {
        // If we cannot pull (for example, due to missing credentials or lack of
        // network connectivity), continue without integrating remote changes.
        // This keeps the local save flow working even in offline environments.
        console.error(
            `Warning: failed to pull and merge remote changes into the "${DRAFT_BRANCH_NAME}" branch in "${repoPath}". ` +
            'The save script will continue using the local branch state. ' +
            'Please resolve any Git issues manually and re-run the save script ' +
            'if you need the local branch to be synchronized with the remote.',
        );
    }
}

async function runDraftSaveForRepo(repoPath: string): Promise<void> {
    await ensureInsideGitRepo(repoPath);

    const remoteName = await resolveRemoteName(repoPath);

    await ensureDraftBranchExists(repoPath);
    await checkoutDraftBranch(repoPath);
    await stageAllChanges(repoPath);
    const committed = await commitIfNeeded(repoPath);

    // Always attempt to integrate remote changes (via merge pull) before pushing to keep
    // the local and remote "draft" branches in sync.
    await pullDraftBranchWithMergeIfUpstreamExists(repoPath);

    // Always attempt push to keep local and remote branches in sync, even if
    // there were no new commits (this is effectively a no-op in that case once
    // the branches are already aligned).
    await pushDraftBranch(repoPath, remoteName);

    if (!committed) {
        console.log(`Draft branch has been pushed in "${repoPath}" (no new commit was necessary).`);
    }
}

async function ensureSubmodulesInitialized(rootPath: string): Promise<void> {
    // Ensure that all submodules are populated before we try to work with them or
    // stage changes in the parent repository. This prevents errors like
    // "fatal: in unpopulated submodule '<name>'" when running "git add -A" in
    // the root repository.
    const result = await $`git submodule update --init --recursive`.cwd(rootPath).nothrow();

    if (result.exitCode !== 0) {
        // We deliberately do not fail hard here because in some environments the
        // submodule configuration may be stale or the remote may be temporarily
        // unavailable (for example, when working offline). In such cases we still
        // want the save script to operate on the main repository instead of
        // aborting completely.
        console.error(
            `Warning: failed to initialize git submodules in "${rootPath}". ` +
            'The save script will continue, but submodules may not be updated. ' +
            'Please inspect the Git output above and fix the problem if you rely on submodules.',
        );
    }
}

async function listAllSubmodulePathsRecursively(rootPath: string): Promise<string[]> {
    // We intentionally avoid "git submodule status --recursive" here because on some
    // Windows setups (Git for Windows + MSYS2) it may spawn many shell processes and
    // fail with "fork: Resource temporarily unavailable", effectively hanging the
    // save script. Instead, we read submodule paths via "git config" against
    // ".gitmodules" in each repository and recurse manually.
    const visited = new Set<string>();

    async function collectSubmodules(basePath: string): Promise<void> {
        const result = await $`git config --file .gitmodules --get-regexp path`.cwd(basePath).nothrow();

        if (result.exitCode !== 0) {
            // No .gitmodules file or no submodule paths configured in this repo.
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
            // Recurse into nested submodules, if any.
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

    // If Git reports the same root as the main repository, then this directory
    // is just a subdirectory of the main repository, not an independent
    // submodule checkout.
    if (resolvedGitRoot === resolvedRoot) {
        return false;
    }

    // Only treat the directory as an independent repository if it is its own
    // Git root. This matches the typical layout for submodules.
    return resolvedGitRoot === resolvedCandidate;
}

export async function main(): Promise<void> {
    const rootPath = process.cwd();

    await ensureSubmodulesInitialized(rootPath);

    const allSubmodulePaths = await listAllSubmodulePathsRecursively(rootPath);

    const submodulePaths: string[] = [];

    for (const submodulePath of allSubmodulePaths) {
        // Skip any entries that are not initialized as independent Git repositories.
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

    // Process deeper submodules First (more path segments), so that parents
    // can capture updated submodule commits in their own "draft" commits.
    submodulePaths.sort((a, b) => {
        const aDepth = a.split(pathSep).length;
        const bDepth = b.split(pathSep).length;
        return bDepth - aDepth;
    });

    for (const submodulePath of submodulePaths) {
        await runDraftSaveForRepo(submodulePath);
    }

    await runDraftSaveForRepo(rootPath);
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        // Indicate failure in exit code for tooling.
        process.exitCode = 1;
    });
}
