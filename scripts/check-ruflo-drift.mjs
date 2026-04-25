#!/usr/bin/env node
// Verifies that current Ruflo docs/scripts use the version pinned by the Codex check.

import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pinFile = resolve(root, 'scripts/check-codex-ruflo.sh');
const pinSource = readFileSync(pinFile, 'utf8');
const pinMatch = pinSource.match(/^RUFLO_VERSION="(?<version>\d+\.\d+\.\d+)"$/m);

if (!pinMatch?.groups?.version) {
  console.error('Could not find RUFLO_VERSION in scripts/check-codex-ruflo.sh');
  process.exit(1);
}

const expectedVersion = pinMatch.groups.version;
const searchRoots = [
  'AGENTS.md',
  '.claude/settings.json',
  '.claude/skills/using-ruflo/SKILL.md',
  'scripts',
  'docs/05-technical',
  'docs/07-decisions',
];

const files = execFileSync('git', [
  'ls-files',
  ...searchRoots,
], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((file) => file !== 'scripts/check-ruflo-drift.mjs');

const mismatches = [];
const versionPattern = /ruflo@(?<version>\d+\.\d+\.\d+)/g;

for (const file of files) {
  const absolutePath = resolve(root, file);
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const match of line.matchAll(versionPattern)) {
      const actualVersion = match.groups.version;
      if (actualVersion !== expectedVersion) {
        mismatches.push({
          file: relative(root, absolutePath),
          line: index + 1,
          actualVersion,
        });
      }
    }
  });
}

if (mismatches.length > 0) {
  console.error(`Ruflo version drift found. Expected ruflo@${expectedVersion}.`);
  for (const mismatch of mismatches) {
    console.error(
      `  ${mismatch.file}:${mismatch.line} uses ruflo@${mismatch.actualVersion}`,
    );
  }
  process.exit(1);
}

console.log(`Ruflo version drift check passed: ruflo@${expectedVersion}`);
