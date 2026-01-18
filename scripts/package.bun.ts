import { $ } from 'bun';
import { mkdir } from 'fs/promises';
import packageJson from '../package.json'; // bun handles json imports

const version = packageJson.version;
const releaseDir = `release/${version}`;

console.log(`Packaging version ${version}...`);

// Ensure release directory exists
await mkdir(releaseDir, { recursive: true });

// Run vsce package
// We use --out to specify the output directory directly if vsce supports it,
// or move it afterwards. vsce package --out <path> specifies the output file path.
const vsixName = `${packageJson.name}-${version}.vsix`;
const outputPath = `${releaseDir}/${vsixName}`;

await $`bun x vsce package --out ${outputPath}`;

console.log(`VSIX created at ${outputPath}`);
