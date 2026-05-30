import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProcessMap } from '@variscout/core/frame';
import type { ProcessHubId } from '@variscout/core/processHub';
import type { DataRow, Finding, Hypothesis } from '@variscout/core';
import { SystemLevelView } from '../SystemLevelView';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

const map: ProcessMap = {
  version: 1,
  ctsColumn: 'Fill Weight',
  nodes: [
    { id: 'mix', name: 'Mix', order: 0 },
    { id: 'fill', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const rows: DataRow[] = [
  { 'Fill Weight': 99.8, Timestamp: 1 },
  { 'Fill Weight': 100.1, Timestamp: 2 },
  { 'Fill Weight': 100.4, Timestamp: 3 },
  { 'Fill Weight': 101.3, Timestamp: 4 },
  { 'Fill Weight': 99.9, Timestamp: 5 },
];

const findings = [
  {
    id: 'finding-1',
    createdAt: 1,
    deletedAt: null,
    text: 'High fill variation',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    investigationId: 'inv-1',
  },
  {
    id: 'finding-2',
    createdAt: 2,
    deletedAt: null,
    text: 'Mixer setup stable',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'analyzed',
    comments: [],
    statusChangedAt: 2,
    investigationId: 'inv-1',
  },
] as Finding[];

const hypothesis = (id: string, status: Hypothesis['status']): Hypothesis => ({
  id,
  createdAt: 1,
  deletedAt: null,
  name: id,
  synthesis: 'Candidate mechanism',
  findingIds: [],
  updatedAt: 1,
  investigationId: 'inv-1',
  status,
});

const hypotheses = [
  hypothesis('hypothesis-1', 'proposed'),
  hypothesis('hypothesis-2', 'evidenced'),
  hypothesis('hypothesis-3', 'refuted'),
];

describe('SystemLevelView', () => {
  it('renders the hub outcome panel from the hub outcome series without response-path CTAs', () => {
    render(
      <SystemLevelView
        hubId={h('hub-fill')}
        map={map}
        rows={rows}
        measureSpecs={{ 'Fill Weight': { lsl: 99, usl: 101, target: 100, cpkTarget: 1.33 } }}
        hypotheses={hypotheses}
        findings={findings}
      />
    );

    expect(screen.getByText(h('hub-fill'))).toBeInTheDocument();
    expect(screen.getByText('Fill Weight')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-distribution')).toHaveTextContent('n=5');
    expect(screen.getByTestId('drift-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-time-series')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Cp');
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Cpk');
    // ADR-084: Pp/Ppk must not leak back into the L1 row.
    expect(screen.getByTestId('outcome-capability')).not.toHaveTextContent(/\bPpk?\b/);
    expect(screen.getByTestId('inbox-digest')).toHaveTextContent('1 prompt');
    // IM-1: activeSummary now counts hypotheses + findings (Question entity retired)
    expect(screen.getByTestId('active-analyzes-summary')).toHaveTextContent('2 active hypotheses');
    expect(screen.getByTestId('active-analyzes-summary')).toHaveTextContent('1 open finding');
    expect(screen.getByRole('button', { name: /Open SCOUT/i })).toBeDisabled();
    expect(screen.queryByText('Quick Action')).not.toBeInTheDocument();
    expect(screen.queryByText('Focused Investigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Improvement Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Control')).not.toBeInTheDocument();
    expect(screen.queryByText('Handoff')).not.toBeInTheDocument();
  });

  it('falls back when no outcome is selected and calls the optional SCOUT callback', async () => {
    const onOpenScout = vi.fn();
    render(
      <SystemLevelView
        hubId={h('hub-unframed')}
        map={{ ...map, ctsColumn: undefined }}
        rows={rows}
        hypotheses={[]}
        findings={[]}
        onOpenScout={onOpenScout}
      />
    );

    expect(screen.getByText('Outcome not selected')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-distribution')).toHaveTextContent('No numeric outcome');

    fireEvent.click(screen.getByRole('button', { name: /Open SCOUT/i }));

    expect(onOpenScout).toHaveBeenCalledWith('hub-unframed');
  });

  /**
   * ADR-073 contract: L1 Cpk must be computed against the outcome's own spec.
   * These tests verify that measureSpecs[ctsColumn] is authoritative and that
   * a missing key resolves to undefined (no silent fallback to a wrong spec).
   */
  describe('ADR-073 — specLimits anchored to outcome measureSpecs[ctsColumn]', () => {
    it('uses measureSpecs[ctsColumn] to compute Cpk (sanity: correct spec, Cpk renders)', () => {
      // Wide spec → all 5 rows in-spec → outOfSpec = 0 → inbox has no prompts
      render(
        <SystemLevelView
          hubId={h('hub-spec')}
          map={map}
          rows={rows}
          measureSpecs={{ 'Fill Weight': { lsl: 98, usl: 102, cpkTarget: 1.33 } }}
          hypotheses={[]}
          findings={[]}
        />
      );
      // Cpk metric is rendered (not '--')
      const capabilitySection = screen.getByTestId('outcome-capability');
      expect(capabilitySection).toHaveTextContent('Cpk');
      // All rows are in spec → inbox shows no prompts
      expect(screen.getByTestId('inbox-digest')).not.toHaveTextContent('out of spec');
    });

    it('resolves to undefined when measureSpecs has no entry for ctsColumn → Cpk renders as --', () => {
      // First render with correct measureSpecs to capture the happy-path output for
      // a sanity comparison; then re-render with a measureSpecs entry keyed by the
      // wrong column (simulates a caller that forgets to key by the outcome column).
      const { rerender } = render(
        <SystemLevelView
          hubId={h('hub-leak')}
          map={map}
          rows={rows}
          measureSpecs={{ 'Fill Weight': { lsl: 98, usl: 102, cpkTarget: 1.33 } }}
          hypotheses={[]}
          findings={[]}
        />
      );
      const capabilityFromMeasureSpecs = screen.getByTestId('outcome-capability').textContent;

      // Re-render with a measureSpecs entry for a wrong column (no entry for 'Fill Weight')
      // — simulates a caller that forgets to key by the outcome column
      rerender(
        <SystemLevelView
          hubId={h('hub-leak')}
          map={map}
          rows={rows}
          measureSpecs={{ 'Step Mix Diameter': { lsl: 0, usl: 1, cpkTarget: 1.67 } }}
          hypotheses={[]}
          findings={[]}
        />
      );
      // When measureSpecs doesn't have the ctsColumn key, resolvedSpecLimits is
      // undefined → Cpk renders as '--' (no spec → no capability index)
      expect(screen.getByTestId('outcome-capability')).toHaveTextContent('--');
      // Sanity: the original measureSpecs render had actual Cpk values
      expect(capabilityFromMeasureSpecs).toMatch(/\d/);
    });
  });
});
