import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const azureRoot = resolve(here, '..');
const workspaceRoot = resolve(azureRoot, '..', '..');

const result = spawnSync(
  'pnpm',
  ['--filter', '@variscout/workspace-app', 'build'],
  {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_VARISCOUT_CHANNEL: 'company',
      VITE_VARISCOUT_OUT_DIR: '../azure/dist',
    },
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
