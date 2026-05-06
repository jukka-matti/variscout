import { describe, it, expect } from 'vitest';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';
import {
  formatSustainmentVerdict,
  formatSustainmentDue,
  formatHandoffSurface,
  sustainmentBandAnswer,
} from '../ProcessHubFormat';

describe('ProcessHubFormat sustainment helpers', () => {
  describe('formatSustainmentVerdict', () => {
    it('formats holding verdict', () => {
      expect(formatSustainmentVerdict('holding')).toBe('Holding');
    });

    it('formats drifting verdict', () => {
      expect(formatSustainmentVerdict('drifting')).toBe('Drifting');
    });

    it('formats broken verdict', () => {
      expect(formatSustainmentVerdict('broken')).toBe('Broken');
    });

    it('formats inconclusive verdict', () => {
      expect(formatSustainmentVerdict('inconclusive')).toBe('Inconclusive');
    });
  });

  describe('formatSustainmentDue', () => {
    const baseDate = new Date('2026-04-27T12:00:00Z');

    it('returns "No cadence set" for undefined', () => {
      expect(formatSustainmentDue(undefined, baseDate)).toBe('No cadence set');
    });

    it('returns "Due today" for same day', () => {
      const dueDate = new Date('2026-04-27T18:00:00Z');
      expect(formatSustainmentDue(dueDate.toISOString(), baseDate)).toBe('Due today');
    });

    it('formats future date with plural days', () => {
      const dueDate = new Date('2026-04-29T12:00:00Z');
      expect(formatSustainmentDue(dueDate.toISOString(), baseDate)).toBe('Due in 2 days');
    });

    it('formats future date with singular day', () => {
      const dueDate = new Date('2026-04-28T12:00:00Z');
      expect(formatSustainmentDue(dueDate.toISOString(), baseDate)).toBe('Due in 1 day');
    });

    it('formats past date with plural days overdue', () => {
      const dueDate = new Date('2026-04-25T12:00:00Z');
      expect(formatSustainmentDue(dueDate.toISOString(), baseDate)).toBe('2 days overdue');
    });

    it('formats past date with singular day overdue', () => {
      const dueDate = new Date('2026-04-26T12:00:00Z');
      expect(formatSustainmentDue(dueDate.toISOString(), baseDate)).toBe('1 day overdue');
    });
  });

  describe('sustainmentBandAnswer', () => {
    const NOW = new Date('2026-04-26T00:00:00.000Z');

    const makeRollup = (
      investigationStatuses: Array<string | undefined>,
      records: Array<{
        latestVerdict?: string;
        nextReviewDue?: string;
        deletedAt?: number | null;
      }>,
      evidenceSnapshots?: Array<{
        capturedAt: string;
        latestSignals?: Array<{ severity: string; label: string; value: number }>;
      }>
    ) =>
      ({
        investigations: investigationStatuses.map(s => ({
          metadata: s ? { investigationStatus: s } : undefined,
        })),
        sustainmentRecords: records.map(r => ({ deletedAt: null, ...r })),
        evidenceSnapshots: evidenceSnapshots ?? [],
      }) as unknown as ProcessHubRollup<ProcessHubInvestigation>;

    it('returns null when no investigations are resolved or controlled', () => {
      const rollup = makeRollup(['scouting'], []);
      expect(sustainmentBandAnswer(rollup, NOW)).toBeNull();
    });

    it('returns setup message when eligible but no records', () => {
      const rollup = makeRollup(['resolved'], []);
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        'Set up sustainment cadence to monitor this.'
      );
    });

    it('returns singular holding message when 1 record is holding and none due', () => {
      const rollup = makeRollup(
        ['controlled'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-05-01T00:00:00.000Z' }]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe('1 investigation is holding; no review due.');
    });

    it('returns plural holding message when 2 records are holding and none due', () => {
      const rollup = makeRollup(
        ['resolved'],
        [
          { latestVerdict: 'holding', nextReviewDue: '2026-05-01T00:00:00.000Z' },
          { latestVerdict: 'holding', nextReviewDue: '2026-05-02T00:00:00.000Z' },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        '2 investigations are holding; no review due.'
      );
    });

    it('returns singular due message when 1 record is past due', () => {
      const rollup = makeRollup(
        ['resolved'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-04-25T00:00:00.000Z' }]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe('1 sustainment review due now.');
    });

    it('returns plural due message when 2 records are past due', () => {
      const rollup = makeRollup(
        ['resolved'],
        [
          { latestVerdict: 'holding', nextReviewDue: '2026-04-20T00:00:00.000Z' },
          { latestVerdict: 'holding', nextReviewDue: '2026-04-25T00:00:00.000Z' },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe('2 sustainment reviews due now.');
    });

    it('ignores soft-deleted records (deletedAt !== null)', () => {
      const rollup = makeRollup(
        ['resolved'],
        [
          {
            latestVerdict: 'holding',
            nextReviewDue: '2026-04-25T00:00:00.000Z',
            deletedAt: 1745020800000, // 2026-04-24T00:00:00.000Z
          },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        'Set up sustainment cadence to monitor this.'
      );
    });

    it('appends latest snapshot signal to the holding answer when snapshot is present', () => {
      const rollup = makeRollup(
        ['controlled'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-05-01T00:00:00.000Z' }],
        [
          {
            capturedAt: '2026-04-26T08:00:00.000Z',
            latestSignals: [{ severity: 'amber', label: 'Cpk', value: 1.21 }],
          },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        '1 investigation is holding; no review due. Latest signal: amber Cpk=1.21 (Apr 26).'
      );
    });

    it('appends latest snapshot signal to the due answer when snapshot is present', () => {
      const rollup = makeRollup(
        ['resolved'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-04-25T00:00:00.000Z' }],
        [
          {
            capturedAt: '2026-04-26T08:00:00.000Z',
            latestSignals: [{ severity: 'red', label: 'Defect rate', value: 0.08 }],
          },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        '1 sustainment review due now. Latest signal: red Defect rate=0.08 (Apr 26).'
      );
    });

    it('selects the most recent snapshot when multiple are present', () => {
      const rollup = makeRollup(
        ['resolved'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-04-25T00:00:00.000Z' }],
        [
          {
            capturedAt: '2026-04-20T00:00:00.000Z',
            latestSignals: [{ severity: 'green', label: 'Old', value: 1 }],
          },
          {
            capturedAt: '2026-04-26T08:00:00.000Z',
            latestSignals: [{ severity: 'amber', label: 'New', value: 2 }],
          },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        '1 sustainment review due now. Latest signal: amber New=2.00 (Apr 26).'
      );
    });

    it('does not append snapshot context to the setup message', () => {
      const rollup = makeRollup(
        ['resolved'],
        [],
        [
          {
            capturedAt: '2026-04-26T08:00:00.000Z',
            latestSignals: [{ severity: 'red', label: 'Audit', value: 0.5 }],
          },
        ]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe(
        'Set up sustainment cadence to monitor this.'
      );
    });

    it('omits snapshot context when latestSignals is empty', () => {
      const rollup = makeRollup(
        ['resolved'],
        [{ latestVerdict: 'holding', nextReviewDue: '2026-04-25T00:00:00.000Z' }],
        [{ capturedAt: '2026-04-26T08:00:00.000Z', latestSignals: [] }]
      );
      expect(sustainmentBandAnswer(rollup, NOW)).toBe('1 sustainment review due now.');
    });
  });

  describe('formatHandoffSurface', () => {
    it('formats mes-recipe surface', () => {
      expect(formatHandoffSurface('mes-recipe')).toBe('MES recipe');
    });

    it('formats scada-alarm surface', () => {
      expect(formatHandoffSurface('scada-alarm')).toBe('SCADA alarm');
    });

    it('formats qms-procedure surface', () => {
      expect(formatHandoffSurface('qms-procedure')).toBe('QMS procedure');
    });

    it('formats work-instruction surface', () => {
      expect(formatHandoffSurface('work-instruction')).toBe('Work instruction');
    });

    it('formats training-record surface', () => {
      expect(formatHandoffSurface('training-record')).toBe('Training record');
    });

    it('formats audit-program surface', () => {
      expect(formatHandoffSurface('audit-program')).toBe('Audit program');
    });

    it('formats dashboard-only surface', () => {
      expect(formatHandoffSurface('dashboard-only')).toBe('Dashboard only');
    });

    it('formats ticket-queue surface', () => {
      expect(formatHandoffSurface('ticket-queue')).toBe('Ticket queue');
    });

    it('formats other surface', () => {
      expect(formatHandoffSurface('other')).toBe('Other');
    });
  });
});
