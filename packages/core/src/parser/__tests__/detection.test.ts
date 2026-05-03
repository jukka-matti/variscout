import { describe, it, expect } from 'vitest';
import { detectColumns } from '../detection';

describe('detectColumns with goalContext biasing', () => {
  const data = [
    { weight_g: 4.5, defect_count: 0, oven_temp: 178 },
    { weight_g: 4.4, defect_count: 1, oven_temp: 180 },
  ];

  it('without goal context: prefers numeric outcome candidates by name keyword', () => {
    const result = detectColumns(data);
    expect(result.outcome).toBeTruthy();
  });

  it('with goal mentioning "weight": ranks weight_g higher', () => {
    const result = detectColumns(data, {
      goalContext: 'We mold barrels and customers care about weight accuracy.',
    });
    expect(result.outcome).toBe('weight_g');
  });

  it('with goal mentioning "defect": ranks defect_count higher', () => {
    const result = detectColumns(data, {
      goalContext: 'Reduce defect rate at our line.',
    });
    expect(result.outcome).toBe('defect_count');
  });
});
