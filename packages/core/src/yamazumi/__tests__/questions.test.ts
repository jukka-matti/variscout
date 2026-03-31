import { describe, it, expect } from 'vitest';
import { generateYamazumiQuestions } from '../questions';
import type { YamazumiBarData } from '../types';

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

function buildSampleBars(): YamazumiBarData[] {
  return [
    {
      key: 'Pick',
      totalTime: 45,
      segments: [
        { activityType: 'va', totalTime: 25, percentage: 55.6, count: 3 },
        { activityType: 'waste', totalTime: 15, percentage: 33.3, count: 2 },
        { activityType: 'wait', totalTime: 5, percentage: 11.1, count: 1 },
      ],
    },
    {
      key: 'Pack',
      totalTime: 30,
      segments: [
        { activityType: 'va', totalTime: 20, percentage: 66.7, count: 2 },
        { activityType: 'nva-required', totalTime: 10, percentage: 33.3, count: 1 },
      ],
    },
    {
      key: 'Ship',
      totalTime: 20,
      segments: [
        { activityType: 'va', totalTime: 18, percentage: 90, count: 2 },
        { activityType: 'waste', totalTime: 2, percentage: 10, count: 1 },
      ],
    },
  ];
}

function buildZeroWasteBars(): YamazumiBarData[] {
  return [
    {
      key: 'Step1',
      totalTime: 30,
      segments: [{ activityType: 'va', totalTime: 30, percentage: 100, count: 3 }],
    },
    {
      key: 'Step2',
      totalTime: 20,
      segments: [{ activityType: 'va', totalTime: 20, percentage: 100, count: 2 }],
    },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateYamazumiQuestions', () => {
  it('generates questions from sample yamazumi data', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars);

    expect(questions.length).toBeGreaterThan(0);

    // All questions should have factor-intel source
    for (const q of questions) {
      expect(q.source).toBe('factor-intel');
    }
  });

  it('generates takt compliance question when taktTime is provided', () => {
    const bars = buildSampleBars();
    // takt = 25 → Pick (45) and Pack (30) exceed it
    const questions = generateYamazumiQuestions(bars, 25);

    const taktQ = questions.find(q => q.text.includes('takt time'));
    expect(taktQ).toBeDefined();
    expect(taktQ!.text).toContain('2 of 3 steps');
    expect(taktQ!.factors).toContain('Pick');
    expect(taktQ!.factors).toContain('Pack');
  });

  it('does not generate takt question when taktTime is not provided', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars);

    const taktQ = questions.find(q => q.text.includes('takt time'));
    expect(taktQ).toBeUndefined();
  });

  it('does not generate takt question when no steps exceed takt', () => {
    const bars = buildSampleBars();
    // takt = 100 → no step exceeds it
    const questions = generateYamazumiQuestions(bars, 100);

    const taktQ = questions.find(q => q.text.includes('takt time'));
    expect(taktQ).toBeUndefined();
  });

  it('generates bottleneck waste composition question for the highest-time step', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars);

    // Pick has highest totalTime (45)
    const bottleneckQ = questions.find(q => q.text.includes('bottleneck'));
    expect(bottleneckQ).toBeDefined();
    expect(bottleneckQ!.text).toContain('Pick');
    expect(bottleneckQ!.factors).toEqual(['Pick']);
  });

  it('generates kaizen targeting question for the step with most waste', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars);

    // Pick has 15 waste, Ship has 2 waste → Pick should be kaizen target
    const kaizenQ = questions.find(q => q.text.includes('kaizen'));
    expect(kaizenQ).toBeDefined();
    expect(kaizenQ!.text).toContain('Pick');
  });

  it('auto-rules-out questions for steps with zero waste', () => {
    const bars = buildZeroWasteBars();
    const questions = generateYamazumiQuestions(bars);

    const ruledOut = questions.filter(q => q.autoAnswered);
    expect(ruledOut.length).toBeGreaterThan(0);

    for (const q of ruledOut) {
      expect(q.autoStatus).toBe('ruled-out');
      expect(q.rSquaredAdj).toBe(0);
    }
  });

  it('sorts questions by waste contribution descending', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars);

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].rSquaredAdj).toBeLessThanOrEqual(questions[i - 1].rSquaredAdj);
    }
  });

  it('returns empty array for empty data', () => {
    expect(generateYamazumiQuestions([])).toEqual([]);
  });

  it('returns empty array when all step times are zero', () => {
    const bars: YamazumiBarData[] = [{ key: 'Empty', totalTime: 0, segments: [] }];
    expect(generateYamazumiQuestions(bars)).toEqual([]);
  });

  it('all questions have type single-factor', () => {
    const bars = buildSampleBars();
    const questions = generateYamazumiQuestions(bars, 25);

    for (const q of questions) {
      expect(q.type).toBe('single-factor');
    }
  });
});
