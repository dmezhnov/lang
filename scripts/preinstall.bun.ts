import { existsSync } from 'node:fs';

let isMisePreinstalled: boolean = Boolean(process.env.IS_MISE_PREINSTALLED);

const isNixOS = process.platform === 'linux' && existsSync('/etc/NIXOS');
const inNixShell = Boolean(process.env.IN_NIX_SHELL);

const preinstall = async (): Promise<void> => {
    if (isMisePreinstalled === true) {
        return;
    }

    const env: Record<string, string | undefined> = {
        ...process.env,
        IS_MISE_PREINSTALLED: 'true',
    };

    try {
        if (isNixOS && !inNixShell) {
            Bun.spawn(['nix', 'develop', '-c', 'mise', 'install'], { env });
        } else {
            Bun.spawn(['mise', 'run', 'preinstall'], { env });
        }
    } catch (error) {
        console.error('Failed to start mise preinstall process.', error);
        process.exitCode = 1;
    }
};


if (import.meta.main) {
    await preinstall().catch((error) => {
        console.error('Unexpected error in devShell-run script.', error);
        process.exitCode = 1;
    });
}
