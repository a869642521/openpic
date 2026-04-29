/**
 * Copies native/external dependencies (and their transitive deps) into a flat
 * node_modules directory that will be shipped alongside the sidecar JS bundle.
 *
 * Usage: node scripts/copy-native-deps.mjs <targetNodeModules>
 *
 * The script resolves packages from the current working directory (sidecar pkg root),
 * walks through their production dependency trees, and copies each package once.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const targetDir = resolve(process.argv[2]);
if (!targetDir) {
  console.error('Usage: node copy-native-deps.mjs <targetNodeModules>');
  process.exit(1);
}

const sidecarDir = process.cwd();

const isWin = process.platform === 'win32';
const arch = process.arch;

const SEED_PACKAGES = [
  { name: 'sharp', from: null },
  { name: '@napi-rs/image', from: null },
  { name: '@sentry/node', from: null },
];

const PLATFORM_BINDINGS = [];
if (isWin && arch === 'x64') {
  PLATFORM_BINDINGS.push(
    { name: '@img/sharp-win32-x64', parent: 'sharp' },
    { name: '@napi-rs/image-win32-x64-msvc', parent: '@napi-rs/image' },
  );
} else if (isWin && arch === 'arm64') {
  PLATFORM_BINDINGS.push(
    { name: '@img/sharp-win32-arm64', parent: 'sharp' },
    { name: '@napi-rs/image-win32-arm64-msvc', parent: '@napi-rs/image' },
  );
}

const copied = new Set();

function findPnpmStoreDir() {
  let dir = sidecarDir;
  while (dir !== dirname(dir)) {
    const candidate = join(dir, 'node_modules', '.pnpm');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  return null;
}

const pnpmStoreDir = findPnpmStoreDir();

function resolveFromPnpmStore(name) {
  if (!pnpmStoreDir) return null;
  // @img/sharp-win32-x64 → @img+sharp-win32-x64
  const prefix = name.replace('/', '+');
  try {
    const entries = readdirSync(pnpmStoreDir);
    const match = entries.find(d => d.startsWith(`${prefix}@`));
    if (match) {
      const parts = name.startsWith('@') ? name.split('/') : [name];
      const candidate = join(pnpmStoreDir, match, 'node_modules', ...parts);
      if (existsSync(join(candidate, 'package.json'))) return candidate;
    }
  } catch { /* ignore */ }
  return null;
}

function resolvePackageDir(name, fromDir) {
  const require2 = createRequire(join(fromDir, 'index.js'));
  try {
    const pkgJsonPath = require2.resolve(`${name}/package.json`);
    return dirname(pkgJsonPath);
  } catch {
    return resolveFromPnpmStore(name);
  }
}

function copyPackage(name, fromDir) {
  if (copied.has(name)) return;
  copied.add(name);

  const srcDir = resolvePackageDir(name, fromDir || sidecarDir);
  if (!srcDir) {
    console.warn(`  SKIP: ${name} (not found)`);
    return;
  }

  const parts = name.startsWith('@') ? name.split('/') : [name];
  const dstDir = join(targetDir, ...parts);

  if (existsSync(dstDir)) {
    rmSync(dstDir, { recursive: true, force: true });
  }
  mkdirSync(dirname(dstDir), { recursive: true });
  cpSync(srcDir, dstDir, { recursive: true });
  console.log(`  OK: ${name} -> ${dstDir}`);

  try {
    const pkg = JSON.parse(readFileSync(join(srcDir, 'package.json'), 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    for (const dep of deps) {
      copyPackage(dep, srcDir);
    }
  } catch {
    // no package.json or parse error
  }
}

console.log(`Copying native dependencies to ${targetDir}`);
mkdirSync(targetDir, { recursive: true });

for (const { name, from } of SEED_PACKAGES) {
  copyPackage(name, from || sidecarDir);
}

for (const { name, parent } of PLATFORM_BINDINGS) {
  const parentDir = resolvePackageDir(parent, sidecarDir);
  if (parentDir) {
    copyPackage(name, parentDir);
  } else {
    console.warn(`  SKIP: ${name} (parent ${parent} not found)`);
  }
}

console.log(`Done. Copied ${copied.size} packages.`);
