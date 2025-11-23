import { existsSync } from "node:fs";

const DEV_SHELL_LABEL = "nix develop devShell";
const DIRECT_LABEL = "direct mise task";

async function main(): Promise<void> {
    const [, , innerTaskName, ...innerTaskArgs] = process.argv;

    if (!innerTaskName) {
        console.error(
            "Usage: bun run scripts/devshell-run.bun.ts <inner-task-name> [task-args...]",
        );
        process.exitCode = 1;
        return;
    }

    const isNixOS = process.platform === "linux" && existsSync("/etc/NIXOS");
    const inNixShell = Boolean(process.env.IN_NIX_SHELL);

    const baseCommand: string[] = ["mise", "run", innerTaskName, ...innerTaskArgs];

    const runCommand = async (command: string[], contextLabel: string): Promise<number> => {
        const child = Bun.spawn(command, {
            stdin: "inherit",
            stdout: "inherit",
            stderr: "inherit",
        });

        const exitCode = await child.exited;

        if (exitCode !== 0) {
            console.error(
                `Subprocess for ${contextLabel} failed with exit code ${exitCode}.`,
            );
        }

        return exitCode;
    };

    try {
        let exitCode: number;

        if (isNixOS && !inNixShell) {
            const command = ["nix", "develop", "-c", ...baseCommand];
            exitCode = await runCommand(command, DEV_SHELL_LABEL);
        } else {
            exitCode = await runCommand(baseCommand, DIRECT_LABEL);
        }

        process.exitCode = exitCode;
    } catch (error) {
        console.error("Failed to execute devShell-wrapped task.", error);
        process.exitCode = 1;
    }
}

if (import.meta.main) {
    main().catch((error) => {
        console.error("Unexpected error in devShell-run script.", error);
        process.exitCode = 1;
    });
}


