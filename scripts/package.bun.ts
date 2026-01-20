import { $ } from 'bun';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';
import packageJson from '../vscode-extension/package.json'; // Import from extension dir

const version = packageJson.version;
const releaseDir = `release/${version}`; // Root relative

console.log(`Packaging version ${version}...`);

// Ensure release directory exists
await mkdir(releaseDir, { recursive: true });

// Setup packaging: copy icon.png to vscode-extension
await $`cp icon.png vscode-extension/`;

// Run vsce package
const vsixName = `${packageJson.name}-${version}.vsix`;
// Resolve absolute path for output because we change cwd
const outputPath = resolve(`${releaseDir}/${vsixName}`);

// Run vsce inside vscode-extension directory
await $`bun x vsce package --no-dependencies --out ${outputPath}`.cwd('vscode-extension');

console.log(`VSIX created at ${outputPath}`);
