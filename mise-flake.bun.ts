import { existsSync } from 'node:fs';

let isMisePreinstalled: boolean = Boolean(process.env.IS_MISE_PREINSTALLED);
let isMisePostinstalled: boolean = Boolean(process.env.IS_MISE_POSTINSTALLED);

const isNixOS = process.platform === 'linux' && existsSync('/etc/NIXOS');
const inNixShell = Boolean(process.env.IN_NIX_SHELL);

const preinstall = (): void => {
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

const postinstall = (): void => {
    if (isMisePostinstalled === true) {
        return;
    }

    const env: Record<string, string | undefined> = {
        ...process.env,
        IS_MISE_POSTINSTALLED: 'true',
    };

    try {
        Bun.spawn(['mise', 'run', 'postinstall'], { env });
    } catch (error) {
        console.error('Failed to start mise postinstall process.', error);
        process.exitCode = 1;
    }
};

export { preinstall, postinstall };
