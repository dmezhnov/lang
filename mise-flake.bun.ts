import { existsSync } from 'node:fs';

let isMiseInstalled: boolean = Boolean(process.env.ENV_IS_MISE_INSTALED);

const isNixOS = process.platform === 'linux' && existsSync('/etc/NIXOS');
const inNixShell = Boolean(process.env.IN_NIX_SHELL);

const preinstall = (): void => {
    if (isMiseInstalled != true) {
        if (isNixOS && !inNixShell) {
            Bun.spawn(['nix', 'develop', '-c', 'ENV_IS_MISE_INSTALED && mise install'])
        } else {
            // Выполняем тут код, который сейчас выполняется в preinstall
        }
    }
};

const postinstall = (): void => {
    if (isMiseInstalled != true) {
        // Выполняем тут код, который сейчас выполняется в postinstall
    }

    isMiseInstalled = true;
};

process.env.ENV_IS_MISE_INSTALED = isMiseInstalled.toString();

export { preinstall, postinstall };
