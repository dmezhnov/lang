// Git helper script to save all changes into the "draft" branch.
// Behavior:
// - Ensure we are inside a Git repository.
// - Ensure a local "draft" branch exists (create it if missing).
// - Check out the "draft" branch.
// - Stage all modifications.
// - If there are staged changes, create a commit with a unique message
//   in the format "draft-YYYY-MM-DD-HH-MM-SS".
// - If an upstream is configured for the "draft" branch, merge remote changes via
//   "git pull --no-rebase" before pushing.
// - Push the "draft" branch to the remote (create remote branch if missing).

const $ = Bun.$;

const DRAFT_BRANCH_NAME = 'draft';

async function ensureInsideGitRepo(): Promise<void> {
    const result = await $`git rev-parse --is-inside-work-tree`.nothrow();
    if (result.exitCode !== 0) {
        throw new Error('Current directory is not inside a Git repository.');
    }
}

async function resolveRemoteName(): Promise<string> {
    const output = await $`git remote`.text();
    const remotes = output
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

    if (remotes.length === 0) {
        throw new Error('No Git remotes configured. Please add a remote (for example, "origin").');
    }

    if (remotes.includes('origin')) {
        return 'origin';
    }

    if (remotes.length === 1) {
        return remotes[0]!;
    }

    throw new Error(
        `Multiple Git remotes detected (${remotes.join(
            ', ',
        )}). Please add "origin" or adjust the script to select a remote explicitly.`,
    );
}

async function ensureDraftBranchExists(): Promise<void> {
    const result = await $`git rev-parse --verify ${DRAFT_BRANCH_NAME}`.nothrow();
    if (result.exitCode === 0) {
        return;
    }

    // Create local draft branch from current HEAD.
    await $`git branch ${DRAFT_BRANCH_NAME}`;
}

async function checkoutDraftBranch(): Promise<void> {
    const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
    if (currentBranch === DRAFT_BRANCH_NAME) {
        return;
    }

    await $`git checkout ${DRAFT_BRANCH_NAME}`;
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

async function stageAllChanges(): Promise<void> {
    await $`git add -A`;
}

async function hasStagedChanges(): Promise<boolean> {
    // git diff --cached --quiet returns exit code 1 when there are staged changes.
    const result = await $`git diff --cached --quiet`.nothrow();
    return result.exitCode !== 0;
}

async function commitIfNeeded(): Promise<boolean> {
    const hasChanges = await hasStagedChanges();
    if (!hasChanges) {
        console.log('No changes to commit on the "draft" branch.');
        return false;
    }

    const message = formatDraftCommitMessage(new Date());
    await $`git commit -m ${message}`;
    console.log(`Created commit with message: ${message}`);
    return true;
}

async function pushDraftBranch(remoteName: string): Promise<void> {
    const result = await $`git push -u ${remoteName} ${DRAFT_BRANCH_NAME}`.nothrow();

    if (result.exitCode !== 0) {
        throw new Error(
            `Failed to push "${DRAFT_BRANCH_NAME}" branch to the "${remoteName}" remote. ` +
                'Please inspect the Git output above, fix the problem, and run the save script again.',
        );
    }
}

async function pullDraftBranchWithMergeIfUpstreamExists(): Promise<void> {
    // Check whether the draft branch has an upstream configured. If there is no upstream yet
    // (for example, on the very first push), we skip the pull step and go straight to push.
    const upstreamCheck = await $`git rev-parse --abbrev-ref --symbolic-full-name ${DRAFT_BRANCH_NAME}@{u}`.nothrow();

    if (upstreamCheck.exitCode !== 0) {
        console.log(
            `No upstream is configured for the "${DRAFT_BRANCH_NAME}" branch yet. ` +
                'Skipping "git pull" before push.',
        );
        return;
    }

    // Upstream exists – pull with merge (no rebase) to integrate remote changes before pushing.
    const pullResult = await $`git pull --no-rebase`.nothrow();

    if (pullResult.exitCode !== 0) {
        throw new Error(
            `Failed to pull and merge remote changes into the "${DRAFT_BRANCH_NAME}" branch. ` +
                'Please resolve any Git conflicts manually and run the save script again.',
        );
    }
}

export async function main(): Promise<void> {
    await ensureInsideGitRepo();

    const remoteName = await resolveRemoteName();

    await ensureDraftBranchExists();
    await checkoutDraftBranch();
    await stageAllChanges();
    const committed = await commitIfNeeded();

    // Always attempt to integrate remote changes (via merge pull) before pushing to keep
    // the local and remote "draft" branches in sync.
    await pullDraftBranchWithMergeIfUpstreamExists();

    // Always attempt push to keep local and remote branches in sync, even if
    // there were no new commits (this is effectively a no-op in that case once
    // the branches are already aligned).
    await pushDraftBranch(remoteName);

    if (!committed) {
        console.log('Draft branch has been pushed (no new commit was necessary).');
    }
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        // Indicate failure in exit code for tooling.
        process.exitCode = 1;
    });
}
