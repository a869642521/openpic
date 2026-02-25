#!/usr/bin/env node
/**
 * 启动 Vite 并等待其就绪后再退出，确保 Tauri 连接时服务已可用
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 1420;
const MAX_ATTEMPTS = 60;
const INTERVAL = 500;

async function waitForServer() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`, {
        signal: AbortSignal.timeout(1000),
      });
      if (res.ok) return true;
    } catch (e) {
      await new Promise((r) => setTimeout(r, INTERVAL));
    }
  }
  return false;
}

const vite = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['run', 'dev'], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  detached: true,
});

vite.unref();

const ready = await waitForServer();
if (ready) {
  console.log(`[dev-with-wait] Vite 已在 http://localhost:${PORT} 就绪`);
} else {
  console.error(`[dev-with-wait] 超时：Vite 未在 ${MAX_ATTEMPTS * INTERVAL}ms 内就绪`);
  process.exit(1);
}
