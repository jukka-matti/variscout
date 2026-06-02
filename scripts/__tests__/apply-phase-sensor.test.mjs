import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkApplyPhase } from '../apply-phase-sensor.mjs';

const SPEC = 'docs/superpowers/specs/2026-05-28-foo-design.md';

test('warns when a delivered spec target has no last-verified', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/x.md'] };
  const read = (p) => (p === 'docs/x.md' ? { title: 'X' } : null); // no last-verified
  const out = checkApplyPhase(SPEC, fm, read);
  assert.equal(out.length, 1);
  assert.match(out[0], /no Apply-phase update/);
});

test('warns when target last-verified predates the spec date', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/x.md'] };
  const out = checkApplyPhase(SPEC, fm, () => ({ 'last-verified': '2026-05-01' }));
  assert.equal(out.length, 1);
});

test('does NOT warn when target was applied (last-verified >= spec date)', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/x.md'] };
  assert.equal(checkApplyPhase(SPEC, fm, () => ({ 'last-verified': '2026-05-28' })).length, 0);
});

test('handles multiple targets, flags only the un-applied one', () => {
  const fm = {
    status: 'delivered',
    date: '2026-05-28',
    implements: ['docs/applied.md', 'docs/stale.md'],
  };
  const read = (p) =>
    p === 'docs/applied.md' ? { 'last-verified': '2026-06-01' } : { 'last-verified': '2026-04-01' };
  const out = checkApplyPhase(SPEC, fm, read);
  assert.equal(out.length, 1);
  assert.match(out[0], /docs\/stale\.md/);
});

test('does NOT warn for non-delivered specs (draft)', () => {
  const fm = { status: 'draft', date: '2026-05-28', implements: ['docs/x.md'] };
  assert.equal(checkApplyPhase(SPEC, fm, () => ({ title: 'X' })).length, 0);
});

test('does NOT warn for non-spec docs', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/x.md'] };
  assert.equal(checkApplyPhase('docs/03-features/foo.md', fm, () => ({})).length, 0);
});

test('does NOT warn for spec index files', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/x.md'] };
  assert.equal(
    checkApplyPhase('docs/superpowers/specs/index.md', fm, () => ({})).length,
    0,
  );
});

test('skips unreadable/missing targets (owned by broken-implements check)', () => {
  const fm = { status: 'delivered', date: '2026-05-28', implements: ['docs/missing.md'] };
  assert.equal(checkApplyPhase(SPEC, fm, () => null).length, 0);
});

test('tolerates null frontmatter', () => {
  assert.equal(checkApplyPhase(SPEC, null, () => ({})).length, 0);
});
