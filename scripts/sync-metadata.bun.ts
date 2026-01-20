import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function syncVSCodePackage(rootPkgPath: string, vscodeExtPkgPath: string) {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const vscodeExtPkg = JSON.parse(readFileSync(vscodeExtPkgPath, 'utf-8'));

    // Sync metadata from root to vscode-extension
    vscodeExtPkg.name = rootPkg.name;
    vscodeExtPkg.displayName = rootPkg.displayName;
    vscodeExtPkg.publisher = rootPkg.publisher;
    vscodeExtPkg.description = rootPkg.description;
    vscodeExtPkg.version = rootPkg.version;
    vscodeExtPkg.repository = rootPkg.repository;
    vscodeExtPkg.license = rootPkg.license;

    writeFileSync(vscodeExtPkgPath, JSON.stringify(vscodeExtPkg, null, 4) + '\n');
    console.log('✓ Synced metadata to vscode-extension/package.json');
}

function syncZedExtension(rootPkgPath: string, zedTomlPath: string) {
    if (!existsSync(zedTomlPath)) {
        console.log('⚠ Skipping Zed sync (extension.toml not found)');
        return;
    }

    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    let tomlContent = readFileSync(zedTomlPath, 'utf-8');

    // Sync metadata from root to zed-extension/extension.toml
    tomlContent = tomlContent.replace(/^version = "[\d.]+"$/m, `version = "${rootPkg.version}"`);
    tomlContent = tomlContent.replace(/^description = ".*"$/m, `description = "${rootPkg.description}"`);

    // Handle repository URL (extract from object if needed)
    const repoUrl = typeof rootPkg.repository === 'string'
        ? rootPkg.repository
        : rootPkg.repository?.url || '';
    tomlContent = tomlContent.replace(/^repository = ".*"$/m, `repository = "${repoUrl}"`);

    // Update authors array (convert publisher to authors)
    if (rootPkg.publisher) {
        tomlContent = tomlContent.replace(/^authors = \[.*\]$/m, `authors = ["${rootPkg.publisher}"]`);
    }

    writeFileSync(zedTomlPath, tomlContent);
    console.log('✓ Synced metadata to zed-extension/extension.toml');
}

// Main execution
const root = resolve('package.json');
console.log('Syncing metadata from root package.json...');
syncVSCodePackage(root, resolve('vscode-extension/package.json'));
syncZedExtension(root, resolve('zed-extension/extension.toml'));
console.log('✅ Metadata sync completed\n');
