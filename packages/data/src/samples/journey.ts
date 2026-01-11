import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Journey: The 46% Story (Website Scroll Experience)
// Story: Three factors all look ~95% pass rate, but Factor C has 46% of defects
// Factor C has 3x variation and a pattern shift at observation 15
const generateJourneyData = () => {
  const data: Record<string, unknown>[] = [];
  let id = 1;

  // Generate 30 observations per factor
  for (let obs = 1; obs <= 30; obs++) {
    for (const factor of ['Factor A', 'Factor B', 'Factor C']) {
      let value: number;

      if (factor === 'Factor A') {
        // Stable, low variation, centered at 100
        value = generateNormal(100, 2);
      } else if (factor === 'Factor B') {
        // Stable, low variation, centered at 100
        value = generateNormal(100, 2.5);
      } else {
        // Factor C: 3x variation, with a shift at observation 15
        const mean = obs < 15 ? 98 : 103; // Shift upward after obs 15
        value = generateNormal(mean, 6); // 3x the variation
      }

      data.push({
        Observation: id++,
        Sequence: obs,
        Factor: factor,
        Measurement: round(value),
      });
    }
  }
  return data;
};

// Journey Before: Capability Analysis - BEFORE improvement (Cpk ~0.8)
const generateJourneyBeforeData = () => {
  const data: Record<string, unknown>[] = [];
  for (let i = 1; i <= 100; i++) {
    data.push({
      Sample: i,
      Measurement: round(generateNormal(100, 4.2)), // Cpk ~0.8
    });
  }
  return data;
};

// Journey After: Capability Analysis - AFTER improvement (Cpk ~1.5)
const generateJourneyAfterData = () => {
  const data: Record<string, unknown>[] = [];
  for (let i = 1; i <= 100; i++) {
    data.push({
      Sample: i,
      Measurement: round(generateNormal(100, 2.2)), // Cpk ~1.5
    });
  }
  return data;
};

export const journey: SampleDataset = {
  name: 'Journey: The 46% Story',
  description: 'Three factors, one hidden problem. Where is the 46%?',
  icon: 'search',
  urlKey: 'journey',
  data: generateJourneyData(),
  config: {
    outcome: 'Measurement',
    factors: ['Factor'],
    specs: { lsl: 90, usl: 110, target: 100 },
  },
};

export const journeyBefore: SampleDataset = {
  name: 'Journey: Before Improvement',
  description: 'Capability analysis before fixing Factor C (Cpk ~0.8).',
  icon: 'alert-circle',
  urlKey: 'journey-before',
  data: generateJourneyBeforeData(),
  config: {
    outcome: 'Measurement',
    factors: ['Sample'],
    specs: { lsl: 90, usl: 110, target: 100 },
  },
};

export const journeyAfter: SampleDataset = {
  name: 'Journey: After Improvement',
  description: 'Capability analysis after fixing Factor C (Cpk ~1.5).',
  icon: 'check-circle',
  urlKey: 'journey-after',
  data: generateJourneyAfterData(),
  config: {
    outcome: 'Measurement',
    factors: ['Sample'],
    specs: { lsl: 90, usl: 110, target: 100 },
  },
};
