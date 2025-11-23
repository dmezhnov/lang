import { existsSync } from 'node:fs';

const isNixOS = process.platform === 'linux' && existsSync('/etc/os-release');
const inNixShell = Boolean(process.env.IN_NIX_SHELL);

const runCommand = async (command: string[]): Promise<number> => {
    const child = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
    });

    const exitCode = await child.exited;

    if (exitCode !== 0) {
        console.error(
            `Subprocess for ${command} failed with exit code ${exitCode}.`,
        );
    }

    return exitCode;
};

async function main(): Promise<void> {
    const [, ,...taskArgs] = process.argv;

    if (!taskArgs) {
        console.error(
            'devshell-run script requires at least one argument.',
        );
        process.exitCode = 1;
        return;
    }

    const command: string[] = isNixOS && !inNixShell ? ['nix', 'develop', '-c', ...taskArgs] : [...taskArgs];

    try {
        let exitCode: number;

        if (isNixOS && !inNixShell) {
            console.log('Entering Nix shell...');
            exitCode = await runCommand(command);
        } else {
            exitCode = await runCommand(command);
        }

        process.exitCode = exitCode;
    } catch (error) {
        console.error('Failed to execute devShell-wrapped task.', error);
        process.exitCode = 1;
    }
}

if (import.meta.main) {
    main().catch((error) => {
        console.error('Unexpected error in devShell-run script.', error);
        process.exitCode = 1;
    });
}
