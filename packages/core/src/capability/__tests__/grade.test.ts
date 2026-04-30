import { describe, it, expect } from 'vitest';
import { gradeCpk } from '../grade';

describe('gradeCpk', () => {
  // Boundary at green: cpk == target
  it('green when cpk equals target (1.33)', () => {
    expect(gradeCpk(1.33, 1.33)).toBe('green');
  });

  it('green when cpk equals target (2.0)', () => {
    expect(gradeCpk(2.0, 2.0)).toBe('green');
  });

  // Boundary at amber: cpk == target * 0.75
  it('amber when cpk equals target * 0.75 (target=1.33)', () => {
    expect(gradeCpk(1.33 * 0.75, 1.33)).toBe('amber');
  });

  it('amber when cpk equals target * 0.75 (target=1.0)', () => {
    expect(gradeCpk(0.75, 1.0)).toBe('amber');
  });

  it('amber when cpk equals target * 0.75 (target=2.0)', () => {
    expect(gradeCpk(1.5, 2.0)).toBe('amber');
  });

  // Red region: cpk < target * 0.5 (well below target * 0.75)
  it('red when cpk is target * 0.5 (well below 75% bar)', () => {
    expect(gradeCpk(0.5 * 1.33, 1.33)).toBe('red');
  });

  it('red when cpk is target * 0.5 with target=1.67', () => {
    expect(gradeCpk(0.5 * 1.67, 1.67)).toBe('red');
  });

  it('red when cpk is 0 regardless of target', () => {
    expect(gradeCpk(0, 1.33)).toBe('red');
    expect(gradeCpk(0, 2.0)).toBe('red');
  });

  // Above-target sanity
  it('green when cpk well above target (target=1.0)', () => {
    expect(gradeCpk(1.5, 1.0)).toBe('green');
  });
});
