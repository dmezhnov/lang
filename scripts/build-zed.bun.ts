import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { $ } from 'bun';

// Read version from extension.toml
const extensionToml = await readFile('zed-extension/extension.toml', 'utf-8');
const versionMatch = extensionToml.match(/^version\s*=\s*"([^"]+)"/m);
if (!versionMatch) {
    throw new Error('Could not find version in zed-extension/extension.toml');
}

const version = versionMatch[1];
const releaseDir = `release/${version}`;
const wasmSource = 'zed-extension/target/wasm32-wasi/release/lang.wasm';
const wasmOutput = join(releaseDir, `lang-zed-${version}.wasm`);

console.log(`Building Zed extension v${version}...`);

// 1. Build WASM module
await $`nix develop --command cargo build --target wasm32-wasi --release --manifest-path zed-extension/Cargo.toml`;

// 2. Download WASI adapter if not present
const adapterPath = 'wasi_snapshot_preview1.reactor.wasm';
try {
    await Bun.file(adapterPath).exists();
} catch {
    console.log('Downloading WASI adapter...');
    await $`curl -L -O https://github.com/bytecodealliance/wasmtime/releases/download/v18.0.2/wasi_snapshot_preview1.reactor.wasm`;
}

// 3. Convert to WASM Component
await mkdir(releaseDir, { recursive: true });
await $`nix-shell -p wasm-tools --run "wasm-tools component new ${wasmSource} -o ${wasmOutput} --adapt ${adapterPath}"`;

// 4. Copy documentation and assets
const assetsToCopy = [
    { src: 'zed-extension/README.md', dest: join(releaseDir, 'README.md') },
    { src: 'LICENSE', dest: join(releaseDir, 'LICENSE') },
    { src: 'icon.png', dest: join(releaseDir, 'icon.png') },
    { src: 'CHANGELOG.md', dest: join(releaseDir, 'CHANGELOG.md') },
];

for (const {src, dest} of assetsToCopy) {
    try {
        await $`cp ${src} ${dest}`;
        console.log(`✓ Copied ${src} to release`);
    } catch (e) {
        console.warn(`⚠ Failed to copy ${src}:`, e);
    }
}

console.log(`✓ Built: ${wasmOutput}`);
console.log('\nTo publish: Update zed-extension/extension.toml version, then push to \'zed\' branch');
