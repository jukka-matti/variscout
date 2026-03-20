import { describe, it, expect, vi } from 'vitest';

import { classifyActivityType, isActivityTypeValue } from '../classify';

describe('classifyActivityType', () => {
  describe('Value-Adding (va)', () => {
    it.each([
      ['VA', 'va'],
      ['Value-Adding', 'va'],
      ['Value-Added', 'va'],
      ['value added', 'va'],
      ['valueadding', 'va'],
      ['value adding', 'va'],
      ['valueadded', 'va'],
    ])('classifies "%s" as "%s"', (raw, expected) => {
      expect(classifyActivityType(raw)).toBe(expected);
    });

    it('handles case-insensitive VA', () => {
      expect(classifyActivityType('va')).toBe('va');
      expect(classifyActivityType('Va')).toBe('va');
    });

    it('handles whitespace trimming', () => {
      expect(classifyActivityType('  VA  ')).toBe('va');
    });
  });

  describe('NVA Required (nva-required)', () => {
    it.each([
      ['NVA-Required', 'nva-required'],
      ['NVA Required', 'nva-required'],
      ['nvarequired', 'nva-required'],
      ['Incidental', 'nva-required'],
      ['NVA-R', 'nva-required'],
      ['NVA Req', 'nva-required'],
      ['non-value-adding required', 'nva-required'],
      ['necessary non-value-adding', 'nva-required'],
      ['required nva', 'nva-required'],
    ])('classifies "%s" as "%s"', (raw, expected) => {
      expect(classifyActivityType(raw)).toBe(expected);
    });
  });

  describe('Waste (waste)', () => {
    it.each([
      ['Waste', 'waste'],
      ['NVA', 'waste'],
      ['Muda', 'waste'],
      ['Non-Value-Adding', 'waste'],
      ['non-value-added', 'waste'],
      ['non value adding', 'waste'],
      ['non value added', 'waste'],
      ['nonvalueadding', 'waste'],
      ['nonvalueadded', 'waste'],
    ])('classifies "%s" as "%s"', (raw, expected) => {
      expect(classifyActivityType(raw)).toBe(expected);
    });

    it('matches partial "waste" substring', () => {
      expect(classifyActivityType('pure waste')).toBe('waste');
    });

    it('matches partial "muda" substring', () => {
      expect(classifyActivityType('type-1 muda')).toBe('waste');
    });
  });

  describe('Wait (wait)', () => {
    it.each([
      ['Wait', 'wait'],
      ['Waiting', 'wait'],
      ['Queue', 'wait'],
      ['Idle', 'wait'],
      ['Delay', 'wait'],
    ])('classifies "%s" as "%s"', (raw, expected) => {
      expect(classifyActivityType(raw)).toBe(expected);
    });

    it('matches partial wait prefix', () => {
      expect(classifyActivityType('wait-for-input')).toBe('wait');
    });

    it('matches partial queue/idle/delay substrings', () => {
      expect(classifyActivityType('in queue')).toBe('wait');
      expect(classifyActivityType('machine idle')).toBe('wait');
      expect(classifyActivityType('process delay')).toBe('wait');
    });
  });

  describe('unknown values', () => {
    it('defaults unknown strings to waste with console.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = classifyActivityType('foobar');

      expect(result).toBe('waste');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown activity type "foobar"')
      );

      warnSpy.mockRestore();
    });

    it('defaults empty string to waste with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(classifyActivityType('')).toBe('waste');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});

describe('isActivityTypeValue', () => {
  describe('returns true for known values', () => {
    it.each([
      'VA',
      'Value-Adding',
      'NVA',
      'Waste',
      'Wait',
      'Muda',
      'Idle',
      'Queue',
      'Delay',
      'Incidental',
      'nva-required',
      'waiting',
    ])('recognizes "%s"', raw => {
      expect(isActivityTypeValue(raw)).toBe(true);
    });
  });

  describe('returns false for unknown values', () => {
    it.each(['foobar', 'assembly', 'inspection', ''])('rejects "%s"', raw => {
      expect(isActivityTypeValue(raw)).toBe(false);
    });
  });

  it('does not console.warn for unknown values', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    isActivityTypeValue('unknown-thing');

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
