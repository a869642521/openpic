import 'dotenv/config';
import './apm';
import { startServer } from './server';
import { loadConfig } from './config';
import { captureError } from './utils';
import fs from 'node:fs';
import path from 'node:path';

// #region agent log
function sendDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === 'production') return;
  fetch('http://127.0.0.1:7318/ingest/75a54541-45a0-44fe-af7e-5197dacb917b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'fe4f29',
    },
    body: JSON.stringify({
      sessionId: 'fe4f29',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

async function main() {
  try {
    // #region agent log
    const exeDir = path.dirname(process.execPath);
    sendDebugLog('H4', 'packages/picsharp-sidecar/src/index.ts:main', 'sidecar-runtime-env', {
      cwd: process.cwd(),
      execPath: process.execPath,
      exeDir,
      arch: process.arch,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV || '',
      nodePath: process.env.NODE_PATH || '',
      isPkg: Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg),
    });
    // #endregion

    // #region agent log
    try {
      require('sharp');
      sendDebugLog('H1', 'packages/picsharp-sidecar/src/index.ts:sharp', 'sharp-preflight-ok', {});
    } catch (error: any) {
      sendDebugLog('H1', 'packages/picsharp-sidecar/src/index.ts:sharp', 'sharp-preflight-failed', {
        message: error?.message || String(error),
        stack: String(error?.stack || '').slice(0, 1200),
      });
      throw error;
    }
    // #endregion

    const config = await loadConfig();
    if (!config.enable) {
      process.exit(0);
    }
    if (config.mode === 'cli') {
      console.log(
        JSON.stringify({
          mode: 'cli',
          message: 'PicSharp Sidecar CLI is under construction.',
        }),
      );
      return;
    } else {
      await startServer(config);
    }
  } catch (error: any) {
    captureError(error);
    process.exit(1);
  }
}

main();
