#!/usr/bin/env node
/**
 * VariScout Statusline — compact dev status for Claude Code
 * Runs every 5s via .claude/settings.json; must complete in <500ms.
 *
 * This is a dev-tooling CLI script, not app code.
 * execSync is used with hardcoded commands only (no user input).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 400, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

const root = path.resolve(__dirname, '..');

// Git branch
const branch = run('git rev-parse --abbrev-ref HEAD') || '?';

// Dirty indicator
const dirty = run('git status --porcelain') ? `${c.yellow}*${c.reset}` : '';

// Workspace count (fast: count dirs in packages/ + apps/)
let wsCount = 0;
try {
  const pkgsDir = path.join(root, 'packages');
  const appsDir = path.join(root, 'apps');
  if (fs.existsSync(pkgsDir)) {
    wsCount += fs.readdirSync(pkgsDir).filter(d =>
      fs.statSync(path.join(pkgsDir, d)).isDirectory()
    ).length;
  }
  if (fs.existsSync(appsDir)) {
    wsCount += fs.readdirSync(appsDir).filter(d =>
      fs.statSync(path.join(appsDir, d)).isDirectory()
    ).length;
  }
} catch {
  wsCount = 9;
}

// Ruflo intelligence score from trend cache (if available)
let intel = '';
try {
  const cache = JSON.parse(
    fs.readFileSync(path.join(root, '.ruflo', '.trend-cache.json'), 'utf8')
  );
  if (cache.intelligence != null) {
    intel = `${c.dim}intel:${cache.intelligence}${c.reset}`;
  }
} catch {
  // No ruflo cache — skip
}

// Compose single line
const parts = [
  `${c.cyan}\u258a${c.reset} VariScout`,
  `${c.dim}${branch}${c.reset}${dirty}`,
  `${c.dim}${wsCount} ws${c.reset}`,
];
if (intel) parts.push(intel);

process.stdout.write(parts.join('  ') + '\n');
