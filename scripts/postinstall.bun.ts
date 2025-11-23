let isMisePostinstalled: boolean = Boolean(process.env.IS_MISE_POSTINSTALLED);

const postinstall = async (): Promise<void> => {
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

if (import.meta.main) {
    await postinstall().catch((error) => {
        console.error('Unexpected error in devShell-run script.', error);
        process.exitCode = 1;
    });
}
