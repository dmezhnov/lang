import { existsSync } from 'node:fs';
import path from 'node:path';

export async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: bun run scripts/trunk.bun.ts -- <trunk-args...>');
        process.exitCode = 1;
        return;
    }

    // Determine whether "trunk" is available on PATH in the current environment.
    const isWindows = process.platform === 'win32';
    const rawPath = process.env.PATH ?? process.env.Path ?? '';
    const pathDelimiter = path.delimiter;
    const pathDirs = rawPath.split(pathDelimiter).filter((dir) => dir.length > 0);

    const trunkExecutables = isWindows ? ['trunk.exe', 'trunk.bat', 'trunk.cmd'] : ['trunk'];

    const hasTrunkOnPath = pathDirs.some((dir) =>
        trunkExecutables.some((exe) => existsSync(path.join(dir, exe))),
    );

    const isNixOsEnv = process.env.IS_NIX_OS ?? 'undefined';
    const inNixShellEnv = process.env.IN_NIX_SHELL ?? 'undefined';
    const isTrunkInstalledEnv = process.env.IS_TRUNK_INSTALLED ?? 'undefined';

    const command: string[] = hasTrunkOnPath
        ? ['trunk', ...args]
        : ['bun', 'x', 'trunk', ...args];

    const label = hasTrunkOnPath
        ? `[trunk-script] branch=trunk-on-path -> trunk ${args.join(' ')}`
        : `[trunk-script] branch=bun-x-trunk -> bun x trunk ${args.join(' ')}`;

    console.log(
        `[trunk-script] env: IS_NIX_OS=${isNixOsEnv} IN_NIX_SHELL=${inNixShellEnv} IS_TRUNK_INSTALLED=${isTrunkInstalledEnv}`,
    );
    console.log(label);

    try {
        const subprocess = Bun.spawn({
            cmd: command,
            stdout: 'inherit',
            stderr: 'inherit',
        });

        const exitCode = await subprocess.exited;
        if (exitCode !== 0) {
            process.exitCode = exitCode;
        }
    } catch (error) {
        console.error(
            '[trunk-script] Failed to run trunk command in the current environment.',
            error,
        );
        process.exitCode = 1;
    }
}

if (import.meta.main) {
    main().catch((error) => {
        console.error('[trunk-script] Unexpected error while running trunk task.', error);
        process.exitCode = 1;
    });
}


