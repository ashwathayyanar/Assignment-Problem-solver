import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server.cjs',
  format: 'cjs',
  external: ['better-sqlite3', 'express', 'vite'],
}).catch(() => process.exit(1));
