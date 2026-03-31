import { describe, it, expect } from 'vitest';
import { generateFindingText } from '../findingText';

describe('generateFindingText', () => {
  it('generates full text with factor + η² + levels + stats', () => {
    const result = generateFindingText({
      factor: 'Shift',
      etaSquared: 0.32,
      worstLevel: 'Night',
      bestLevel: 'Day',
      mean: 12.5,
      sigma: 1.23,
      samples: 200,
    });
    expect(result).toBe('Shift: η²=32%, Night is worst, Day is best, (mean=12.5, σ=1.23, n=200)');
  });

  it('generates minimal text with factor only', () => {
    const result = generateFindingText({ factor: 'Machine' });
    expect(result).toBe('Machine');
  });

  it('uses R²adj when η² is not provided', () => {
    const result = generateFindingText({
      factor: 'Operator',
      rSquaredAdj: 0.45,
      worstLevel: 'Bob',
      bestLevel: 'Alice',
    });
    expect(result).toBe('Operator: R²adj=45%, Bob is worst, Alice is best');
  });

  it('shows only worst level when best is missing', () => {
    const result = generateFindingText({
      factor: 'Temperature',
      etaSquared: 0.18,
      worstLevel: 'High',
    });
    expect(result).toBe('Temperature: η²=18%, High is worst');
  });

  it('prefers η² over R²adj when both are provided', () => {
    const result = generateFindingText({
      factor: 'Speed',
      etaSquared: 0.25,
      rSquaredAdj: 0.4,
    });
    expect(result).toBe('Speed: η²=25%');
  });

  it('includes stats context without levels', () => {
    const result = generateFindingText({
      factor: 'Humidity',
      mean: 65.0,
      sigma: 3.45,
      samples: 50,
    });
    expect(result).toBe('Humidity, (mean=65.0, σ=3.45, n=50)');
  });

  it('rounds η² percentage correctly', () => {
    const result = generateFindingText({
      factor: 'Batch',
      etaSquared: 0.076,
    });
    expect(result).toBe('Batch: η²=8%');
  });
});
