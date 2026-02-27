/**
 * Tests for photo processing utility
 */
import { describe, it, expect } from 'vitest';
import { fitDimensions, sanitizeFilename } from '../photoProcessing';

describe('fitDimensions', () => {
  it('returns original dimensions when both fit within maxDim', () => {
    expect(fitDimensions(200, 150, 320)).toEqual([200, 150]);
  });

  it('scales down when width exceeds maxDim', () => {
    const [w, h] = fitDimensions(640, 480, 320);
    expect(w).toBe(320);
    expect(h).toBe(240);
  });

  it('scales down when height exceeds maxDim', () => {
    const [w, h] = fitDimensions(480, 640, 320);
    expect(w).toBe(240);
    expect(h).toBe(320);
  });

  it('scales down square images correctly', () => {
    const [w, h] = fitDimensions(1000, 1000, 320);
    expect(w).toBe(320);
    expect(h).toBe(320);
  });

  it('handles exact maxDim boundary', () => {
    expect(fitDimensions(320, 320, 320)).toEqual([320, 320]);
  });

  it('preserves aspect ratio for landscape', () => {
    const [w, h] = fitDimensions(4000, 3000, 2048);
    expect(w / h).toBeCloseTo(4000 / 3000, 1);
    expect(Math.max(w, h)).toBeLessThanOrEqual(2048);
  });

  it('preserves aspect ratio for portrait', () => {
    const [w, h] = fitDimensions(3000, 4000, 2048);
    expect(w / h).toBeCloseTo(3000 / 4000, 1);
    expect(Math.max(w, h)).toBeLessThanOrEqual(2048);
  });

  it('handles very small images', () => {
    expect(fitDimensions(1, 1, 320)).toEqual([1, 1]);
  });
});

describe('sanitizeFilename', () => {
  it('preserves safe characters', () => {
    expect(sanitizeFilename('photo_001.jpg')).toBe('photo_001.jpg');
  });

  it('removes path separators', () => {
    expect(sanitizeFilename('path/to/file.jpg')).toBe('path_to_file.jpg');
    expect(sanitizeFilename('path\\to\\file.jpg')).toBe('path_to_file.jpg');
  });

  it('removes special characters', () => {
    expect(sanitizeFilename('photo<>:*?.jpg')).toBe('photo_.jpg');
  });

  it('collapses multiple underscores', () => {
    expect(sanitizeFilename('photo___test.jpg')).toBe('photo_test.jpg');
  });

  it('replaces spaces with underscores', () => {
    expect(sanitizeFilename('my photo 2026.jpg')).toBe('my_photo_2026.jpg');
  });

  it('removes leading/trailing underscores', () => {
    expect(sanitizeFilename('_photo_')).toBe('photo');
  });

  it('returns "photo" for empty string', () => {
    expect(sanitizeFilename('')).toBe('photo');
  });

  it('handles filenames with only special chars', () => {
    expect(sanitizeFilename('***')).toBe('photo');
  });

  it('removes # % & { } ! @', () => {
    expect(sanitizeFilename('photo#1%test&file.jpg')).toBe('photo_1_test_file.jpg');
  });
});
