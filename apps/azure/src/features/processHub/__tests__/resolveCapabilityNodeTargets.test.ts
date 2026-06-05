import { describe, it, expect } from 'vitest';
import { DEFAULT_CPK_TARGET } from '@variscout/core/capability';
import { resolveCapabilityNodeTargets } from '../resolveCapabilityNodeTargets';
import type { CapabilityInputNode } from '../resolveCapabilityNodeTargets';

// ── Helpers ────────────────────────────────────────────────────────────────────

function node(nodeId: string): CapabilityInputNode {
  return { nodeId, label: nodeId, result: {} };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('resolveCapabilityNodeTargets', () => {
  // (a) Per-column measure-spec cpkTarget beats hub default.
  it('per-column measure-spec override beats the hub default', () => {
    const nodes = [node('fill')];
    const canonicalNodes = [{ id: 'fill', ctqColumn: 'Weight' }];
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: {
        measureSpecs: { Weight: { cpkTarget: 1.67 } },
        hubCpkTarget: 1.33,
        projectCpkTarget: 1.0,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].targetCpk).toBe(1.67);
  });

  // (b) Hub default applies when no per-column spec override exists.
  it('hub default applies when no column override is present', () => {
    const nodes = [node('seal')];
    const canonicalNodes = [{ id: 'seal', ctqColumn: 'SealForce' }];
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: {
        measureSpecs: {}, // no override for SealForce
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.0,
      },
    });

    expect(result[0].targetCpk).toBe(1.5);
  });

  // (c) Fallthrough when neither spec nor hub is set — must match DEFAULT_CPK_TARGET (1.33).
  it('falls through to the built-in default when neither spec nor hub is set', () => {
    const nodes = [node('cap')];
    const canonicalNodes = [{ id: 'cap', ctqColumn: 'TorqueNm' }];
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: {
        // No measureSpecs, no hubCpkTarget, no projectCpkTarget
      },
    });

    expect(result[0].targetCpk).toBe(DEFAULT_CPK_TARGET);
  });

  // Negative control: a node whose column has NO override must NOT get another
  // column's override — each node's resolution is strictly column-scoped.
  it('negative control: another columns spec override does not bleed onto an unrelated node', () => {
    const nodes = [node('fill'), node('label')];
    const canonicalNodes = [
      { id: 'fill', ctqColumn: 'Weight' },
      { id: 'label', ctqColumn: 'Adhesion' }, // no spec for Adhesion
    ];
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: {
        measureSpecs: { Weight: { cpkTarget: 2.0 } }, // only 'fill' has an override
        hubCpkTarget: 1.33,
      },
    });

    // 'fill' gets the spec override
    expect(result[0].nodeId).toBe('fill');
    expect(result[0].targetCpk).toBe(2.0);

    // 'label' must fall back to hub default, NOT inherit Weight's 2.0
    expect(result[1].nodeId).toBe('label');
    expect(result[1].targetCpk).toBe(1.33);
    expect(result[1].targetCpk).not.toBe(2.0);
  });

  // Node with no ctqColumn → targetCpk must be undefined (no tick drawn).
  it('returns undefined targetCpk for a node with no ctqColumn', () => {
    const nodes = [node('unmapped')];
    const canonicalNodes = [{ id: 'unmapped', ctqColumn: undefined }]; // no column
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: { hubCpkTarget: 1.5 },
    });

    expect(result[0].targetCpk).toBeUndefined();
  });

  // Node not found in canonicalNodes at all → treated as no-column, undefined.
  it('returns undefined targetCpk for a node absent from the canonical map', () => {
    const nodes = [node('ghost')];
    const canonicalNodes: Array<{ id: string; ctqColumn?: string }> = []; // ghost is not listed
    const result = resolveCapabilityNodeTargets(nodes, {
      canonicalNodes,
      context: { hubCpkTarget: 1.5 },
    });

    expect(result[0].targetCpk).toBeUndefined();
  });
});
