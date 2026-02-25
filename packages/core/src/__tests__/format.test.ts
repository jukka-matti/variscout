import { describe, it, expect } from 'vitest';
import { formatPValue, getStars } from '../format';

describe('formatPValue', () => {
  it('returns "< 0.001" for very small p-values', () => {
    expect(formatPValue(0.0001)).toBe('< 0.001');
    expect(formatPValue(0.0009)).toBe('< 0.001');
  });

  it('returns "< 0.001" for p = 0', () => {
    expect(formatPValue(0)).toBe('< 0.001');
  });

  it('formats to 3 decimal places for normal values', () => {
    expect(formatPValue(0.05)).toBe('0.050');
    expect(formatPValue(0.123)).toBe('0.123');
  });

  it('formats p = 1 correctly', () => {
    expect(formatPValue(1)).toBe('1.000');
  });

  it('formats boundary value p = 0.001 as normal (not "< 0.001")', () => {
    expect(formatPValue(0.001)).toBe('0.001');
  });
});

describe('getStars', () => {
  it('returns correct star string for rating 3 of 5', () => {
    expect(getStars(3, 5)).toBe('★★★☆☆');
  });

  it('returns all empty stars for rating 0', () => {
    expect(getStars(0)).toBe('☆☆☆☆☆');
  });

  it('returns all filled stars for max rating', () => {
    expect(getStars(5)).toBe('★★★★★');
  });

  it('clamps rating above max to max', () => {
    expect(getStars(7, 5)).toBe('★★★★★');
  });

  it('treats negative rating as 0 filled stars', () => {
    expect(getStars(-2)).toBe('☆☆☆☆☆');
  });

  it('supports custom maxStars', () => {
    expect(getStars(2, 3)).toBe('★★☆');
    expect(getStars(0, 3)).toBe('☆☆☆');
  });

  it('floors fractional ratings', () => {
    expect(getStars(2.7, 5)).toBe('★★☆☆☆');
    expect(getStars(4.9, 5)).toBe('★★★★☆');
  });
});
