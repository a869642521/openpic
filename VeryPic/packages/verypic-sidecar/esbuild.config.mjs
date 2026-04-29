import * as esbuild from 'esbuild';

const nativeExternals = [
  'sharp',
  '@napi-rs/image',
  '@img/*',
  '@sentry/node',
];

const commonOptions = {
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  bundle: true,
  sourcemap: false,
  minify: false,
  mainFields: ['main', 'module'],
  conditions: ['node', 'require'],
  external: nativeExternals,
};

// Main entry
await esbuild.build({
  ...commonOptions,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
});

// Worker entry (thread-pool.ts uses path.join(__dirname, 'dispatcher.js'))
await esbuild.build({
  ...commonOptions,
  entryPoints: ['src/workers/dispatcher.ts'],
  outfile: 'dist/dispatcher.js',
});

console.log('esbuild: done');
