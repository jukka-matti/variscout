import { describe, it, expect } from 'vitest';
import {
  formatSustainmentVerdict,
  formatSustainmentDue,
  formatHandoffSurface,
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
