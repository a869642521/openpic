import fs from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`[postbuild-smokecheck] ${message}`);
  process.exit(1);
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} is missing: ${filePath}`);
  }
  if (!fs.statSync(filePath).isFile()) {
    fail(`${label} is not a file: ${filePath}`);
  }
}

function assertDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    fail(`${label} is missing: ${dirPath}`);
  }
  if (!fs.statSync(dirPath).isDirectory()) {
    fail(`${label} is not a directory: ${dirPath}`);
  }
}

const [sidecarBinaryPath, sharpRuntimeDir, resourcesDir] = process.argv.slice(2);
if (!sidecarBinaryPath || !sharpRuntimeDir || !resourcesDir) {
  fail('usage: node scripts/postbuild-smokecheck.mjs <sidecarBinaryPath> <sharpRuntimeDir> <resourcesDir>');
}

assertFile(sidecarBinaryPath, 'sidecar binary');
assertDir(resourcesDir, 'resources dir');
assertDir(sharpRuntimeDir, 'sharp runtime dir');

const sharpNode = path.join(sharpRuntimeDir, 'lib', 'sharp-win32-x64.node');
const libvipsDll = path.join(sharpRuntimeDir, 'lib', 'libvips-42.dll');
assertFile(sharpNode, 'sharp runtime native module');
assertFile(libvipsDll, 'sharp runtime libvips dll');

console.log('[postbuild-smokecheck] OK');
