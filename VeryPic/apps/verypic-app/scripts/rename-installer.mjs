#!/usr/bin/env node
/**
 * 将 NSIS 安装包重命名为 VeryPicInstall{major}.{minor}.exe（版本来自 package.json）
 */
import { readdir, readFile, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// target 在 monorepo 根目录 (apps/verypic-app 的上级的上级)
const nsisDir = join(__dirname, '..', '..', '..', 'target', 'release', 'bundle', 'nsis');
const pkgPath = join(__dirname, '..', 'package.json');

try {
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  const [major, minor] = String(pkg.version ?? '1.0.0').split('.');
  const destName = `VeryPicInstall${major}.${minor}.exe`;

  const files = await readdir(nsisDir);
  const setupExe = files.find((f) => f.endsWith('-setup.exe'));
  if (!setupExe) {
    console.warn('No NSIS setup.exe found in', nsisDir);
    process.exit(1);
  }
  const src = join(nsisDir, setupExe);
  const dest = join(nsisDir, destName);
  await rename(src, dest);
  console.log(`Renamed to ${destName}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
