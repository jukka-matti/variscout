/**
 * CL-2: Pack-renderer spine tests
 *
 * Tests enforce the HARD CONSTRAINTS from the spec:
 * - No executable <script> tags
 * - No external URLs (no http/https)
 * - Charts render as inline <svg>
 * - Questions render with id + text + answer area
 * - Redaction levels work correctly
 * - Structural snapshot for layout stability
 */
import { describe, expect, it } from 'vitest';
import type { PackModel, PackSection } from '../renderPackHtml';
import { renderPackHtml } from '../renderPackHtml';
import { renderStaticBoxplotSvg, renderStaticIChartSvg } from '../staticChartSvg';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const conditionSection: PackSection = {
  kind: 'condition',
  label: 'Day_of_Week = Monday',
  statsText: 'Cpk 0.77 · 12 events',
};

const chartSection: PackSection = {
  kind: 'chart',
  title: 'Individual Values — Line 3',
  chartType: 'ichart',
  data: [
    { x: 1, y: 10.2 },
    { x: 2, y: 10.5 },
    { x: 3, y: 9.8 },
    { x: 4, y: 10.1 },
    { x: 5, y: 10.4 },
  ],
  mean: 10.2,
  ucl: 11.0,
  lcl: 9.4,
  width: 480,
  height: 240,
};

const questionSection: PackSection = {
  kind: 'question',
  questionId: 'q-abc-123',
  text: 'Does the Monday startup differ from other days?',
  anchorLabel: 'Hypothesis: warm-up variation',
};

const rawRowsSection: PackSection = {
  kind: 'raw-rows',
  headers: ['Date', 'Value', 'Shift'],
  rows: [
    ['2026-06-01', '10.2', 'A'],
    ['2026-06-02', '10.5', 'B'],
  ],
};

const minimalModel: PackModel = {
  title: 'Why does Line 3 drift on Mondays?',
  meta: {
    packId: 'c-8f2a',
    consultationId: 'cons-001',
    from: 'Anna Analyst',
  },
  sections: [conditionSection, chartSection, questionSection],
};

const modelWithRawRows: PackModel = {
  ...minimalModel,
  sections: [...minimalModel.sections, rawRowsSection],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('renderPackHtml — hard constraints', () => {
  it('(a) output contains NO <script tag at all (strictly script-free)', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    // The pack is a static document — no scripts of any kind, inert or executable.
    expect(html).not.toContain('<script');
  });

  it('(b) output contains NO http:// or https:// URLs', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('(c) chart section renders an inline <svg> element', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).toContain('<svg');
  });

  it('(d) question section renders question id, text, and an answer area', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    // Question id visible
    expect(html).toContain('q-abc-123');
    // Question text visible
    expect(html).toContain('Does the Monday startup differ from other days?');
    // An answer area (textarea or similar printable area)
    expect(html).toMatch(/answer|textarea|answer-area|print-answer/i);
  });

  it('(e) no-raw-rows excludes raw row data; include-raw-rows includes it', () => {
    const htmlNoRaw = renderPackHtml(modelWithRawRows, { redaction: 'no-raw-rows' });
    const htmlWithRaw = renderPackHtml(modelWithRawRows, { redaction: 'include-raw-rows' });

    // no-raw-rows must omit the raw-rows section entirely — assert the table
    // marker (class) is absent, which is strictly stronger than checking one value.
    expect(htmlNoRaw).not.toContain('class="raw-rows-table"');
    expect(htmlNoRaw).not.toContain('2026-06-01');

    // include-raw-rows must contain the table and the data
    expect(htmlWithRaw).toContain('class="raw-rows-table"');
    expect(htmlWithRaw).toContain('2026-06-01');
    expect(htmlWithRaw).toContain('10.2');
  });

  it('(f) inline <style> block with @media print is present', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).toContain('<style');
    expect(html).toContain('@media print');
  });
});

describe('renderPackHtml — structural content', () => {
  it('renders the pack title in the output', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).toContain('Why does Line 3 drift on Mondays?');
  });

  it('renders the pack id and from metadata', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).toContain('c-8f2a');
    expect(html).toContain('Anna Analyst');
  });

  it('renders the condition card label and stats text', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    expect(html).toContain('Day_of_Week = Monday');
    expect(html).toContain('Cpk 0.77');
  });

  it('(f-snapshot) stable structural snapshot of a minimal pack', () => {
    const html = renderPackHtml(
      {
        title: 'Snapshot Test Pack',
        meta: { packId: 'snap-001' },
        sections: [
          { kind: 'condition', label: 'Condition A', statsText: 'Cpk 1.2 · 5 events' },
          {
            kind: 'chart',
            title: 'Values',
            chartType: 'ichart',
            data: [
              { x: 1, y: 5 },
              { x: 2, y: 6 },
            ],
            mean: 5.5,
            ucl: 7,
            lcl: 4,
            width: 300,
            height: 150,
          },
          {
            kind: 'question',
            questionId: 'q-snap-1',
            text: 'What do you think?',
          },
        ],
      },
      { redaction: 'no-raw-rows' }
    );

    // Verify key structural elements rather than exact HTML (resilient to whitespace)
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('Snapshot Test Pack');
    expect(html).toContain('snap-001');
    expect(html).toContain('Condition A');
    expect(html).toContain('<svg');
    expect(html).toContain('q-snap-1');
    expect(html).toContain('What do you think?');
    expect(html).not.toMatch(/https?:\/\//);
  });
});


// ── IMPORTANT-1: single-escaping of header meta ────────────────────────────────

describe('renderPackHtml — meta escaping (IMPORTANT-1)', () => {
  it('escapes special chars in meta.from / packId exactly ONCE (no double-escape)', () => {
    const html = renderPackHtml(
      {
        title: 'Escape Test',
        meta: { packId: "c<1>'&", from: 'Anna & Bob' },
        sections: [],
      },
      { redaction: 'no-raw-rows' }
    );
    // "Anna & Bob" must render as "Anna &amp; Bob", NOT "Anna &amp;amp; Bob"
    expect(html).toContain('Anna &amp; Bob');
    expect(html).not.toContain('&amp;amp;');
    // packId special chars escaped once
    expect(html).toContain("c&lt;1&gt;&#39;&amp;");
    expect(html).not.toContain('&amp;lt;');
  });
});

// ── IMPORTANT-2: questionCount chip renders ────────────────────────────────────

describe('renderPackHtml — question count chip (IMPORTANT-2)', () => {
  it('renders the question count in the header meta when questions exist', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    // minimalModel has exactly one question section
    expect(html).toContain('1 question');
  });

  it('pluralizes and renders count for multiple questions', () => {
    const html = renderPackHtml(
      {
        title: 'Multi-Q',
        meta: { packId: 'p1' },
        sections: [
          { kind: 'question', questionId: 'q1', text: 'A?' },
          { kind: 'question', questionId: 'q2', text: 'B?' },
          { kind: 'question', questionId: 'q3', text: 'C?' },
        ],
      },
      { redaction: 'no-raw-rows' }
    );
    expect(html).toContain('3 questions');
  });

  it('omits the question count chip when there are no questions', () => {
    const html = renderPackHtml(
      {
        title: 'No Q',
        meta: { packId: 'p1' },
        sections: [{ kind: 'condition', label: 'L', statsText: 'S' }],
      },
      { redaction: 'no-raw-rows' }
    );
    expect(html).not.toMatch(/\d+ questions?/);
  });
});

// ── IMPORTANT-3: NaN / Infinity never reach SVG coordinates ────────────────────

describe('staticChartSvg — NaN/Infinity safety (IMPORTANT-3)', () => {
  it('I-Chart with a NaN y value emits no NaN substring', () => {
    const svg = renderStaticIChartSvg({
      data: [
        { x: 1, y: 10 },
        { x: 2, y: NaN },
        { x: 3, y: 12 },
      ],
      mean: 11,
      ucl: 13,
      lcl: 9,
      width: 400,
      height: 200,
    });
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
  });

  it('I-Chart with NaN mean/ucl/lcl emits no NaN substring', () => {
    const svg = renderStaticIChartSvg({
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 11 },
      ],
      mean: NaN,
      ucl: NaN,
      lcl: NaN,
      width: 400,
      height: 200,
    });
    expect(svg).not.toContain('NaN');
  });

  it('I-Chart with n=1 (all-equal) emits no NaN substring', () => {
    const svg = renderStaticIChartSvg({
      data: [{ x: 1, y: 5 }],
      mean: 5,
      ucl: 5,
      lcl: 5,
      width: 400,
      height: 200,
    });
    expect(svg).not.toContain('NaN');
  });

  it('boxplot with a NaN stat emits no NaN substring', () => {
    const svg = renderStaticBoxplotSvg({
      groups: [
        { key: 'A', q1: 1, median: 2, q3: 3, min: 0, max: 4 },
        { key: 'B', q1: NaN, median: NaN, q3: NaN, min: NaN, max: NaN },
      ],
      width: 400,
      height: 200,
    });
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
  });

  it('boxplot all-equal degenerate group emits no NaN substring', () => {
    const svg = renderStaticBoxplotSvg({
      groups: [{ key: 'A', q1: 5, median: 5, q3: 5, min: 5, max: 5 }],
      width: 400,
      height: 200,
    });
    expect(svg).not.toContain('NaN');
  });
});

// ── IMPORTANT-4: boxplot box width vs band geometry ────────────────────────────

describe('staticChartSvg — boxplot band geometry (IMPORTANT-4)', () => {
  it('3-group boxes do not overflow into the next band', () => {
    const width = 600;
    const height = 300;
    const groups = [
      { key: 'A', q1: 1, median: 2, q3: 3, min: 0, max: 4 },
      { key: 'B', q1: 2, median: 3, q3: 4, min: 1, max: 5 },
      { key: 'C', q1: 3, median: 4, q3: 5, min: 2, max: 6 },
    ];
    const svg = renderStaticBoxplotSvg({ groups, width, height });

    // Extract all IQR rects (x + width). The box class is the only <rect> emitted.
    const rectRe = /<rect x="(-?\d+)" y="-?\d+" width="(-?\d+)"/g;
    const rects: Array<{ x: number; w: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = rectRe.exec(svg)) !== null) {
      rects.push({ x: Number(m[1]), w: Number(m[2]) });
    }
    expect(rects.length).toBe(3);

    // For each adjacent pair, the box right edge must not exceed the next box's left edge.
    for (let i = 0; i < rects.length - 1; i++) {
      const rightEdge = rects[i].x + rects[i].w;
      const nextLeft = rects[i + 1].x;
      expect(rightEdge).toBeLessThanOrEqual(nextLeft);
    }
  });
});

// ── IMPORTANT-5: strengthened coordinate + boxplot + degenerate coverage ───────

describe('staticChartSvg — computed coordinate correctness (IMPORTANT-5a)', () => {
  it('I-Chart mean control-line y equals expected pixel and SVG Y is inverted', () => {
    const width = 400;
    const height = 200;
    // MARGIN = { top: 16, right: 16, bottom: 36, left: 48 }
    const innerH = height - 16 - 36; // 148
    const data = [
      { x: 1, y: 0 },
      { x: 2, y: 10 },
    ];
    const mean = 5;
    const ucl = 10;
    const lcl = 0;
    const svg = renderStaticIChartSvg({ data, mean, ucl, lcl, width, height });

    // Domain: yMin=0, yMax=10, yPad = 10*0.1 = 1 -> domain [-1, 11], range [innerH, 0]
    // scale(v) = innerH + ((v - (-1)) / (11 - (-1))) * (0 - innerH)
    const scale = (v: number) => innerH + ((v - -1) / (11 - -1)) * (0 - innerH);
    const expectedMeanY = Math.round(scale(mean));

    // The mean line is the solid gray meanLine (no dasharray). Capture its y1.
    const meanLineRe = new RegExp(
      `<line x1="0" y1="(-?\\d+)"[^>]*stroke="#6b7280" stroke-width="1.5"/>`
    );
    const meanMatch = svg.match(meanLineRe);
    expect(meanMatch).not.toBeNull();
    expect(Number(meanMatch![1])).toBe(expectedMeanY);

    // Y inversion: a higher data value maps to a SMALLER pixel-y.
    const circleRe = /<circle cx="(-?\d+)" cy="(-?\d+)"/g;
    const circles: Array<{ cx: number; cy: number }> = [];
    let cm: RegExpExecArray | null;
    while ((cm = circleRe.exec(svg)) !== null) {
      circles.push({ cx: Number(cm[1]), cy: Number(cm[2]) });
    }
    expect(circles.length).toBe(2);
    // data[1].y (10) > data[0].y (0) -> circles[1].cy < circles[0].cy
    expect(circles[1].cy).toBeLessThan(circles[0].cy);
  });
});

describe('staticChartSvg — boxplot section coverage (IMPORTANT-5b)', () => {
  it('renders IQR box, median line, and whiskers with sane coordinates', () => {
    const width = 400;
    const height = 200;
    const innerH = height - 16 - 36; // 148
    const svg = renderStaticBoxplotSvg({
      groups: [{ key: 'A', q1: 2, median: 4, q3: 6, min: 0, max: 8 }],
      width,
      height,
    });

    // IQR box present
    const rect = svg.match(/<rect x="(-?\d+)" y="(-?\d+)" width="(-?\d+)" height="(-?\d+)"/);
    expect(rect).not.toBeNull();
    const [, rx, ry, rw, rh] = rect!.map(Number) as unknown as number[];
    expect(rx).toBeGreaterThanOrEqual(0);
    expect(ry).toBeGreaterThanOrEqual(0);
    expect(rw).toBeGreaterThan(0);
    expect(rh).toBeGreaterThan(0);
    expect(ry + rh).toBeLessThanOrEqual(innerH + 1);

    // Median line present (blue-700 stroke, width 2)
    const medRe = /<line x1="-?\d+" y1="(-?\d+)" x2="-?\d+" y2="-?\d+" stroke="#1d4ed8" stroke-width="2"\/>/;
    const med = svg.match(medRe);
    expect(med).not.toBeNull();
    const medY = Number(med![1]);
    // median (4) sits between q1 (2) and q3 (6) -> medY between q3y (top) and q1y (bottom)
    expect(medY).toBeGreaterThanOrEqual(ry);
    expect(medY).toBeLessThanOrEqual(ry + rh);

    // Whisker caps (dashed connectors + solid caps) present
    expect(svg).toContain('stroke-dasharray="3 2"');
  });
});

describe('staticChartSvg — degenerate inputs do not throw or emit NaN (IMPORTANT-5c)', () => {
  it('empty I-Chart data renders a No-data placeholder, no NaN', () => {
    const svg = renderStaticIChartSvg({
      data: [],
      mean: 0,
      ucl: 0,
      lcl: 0,
      width: 300,
      height: 150,
    });
    expect(svg).toContain('No data');
    expect(svg).not.toContain('NaN');
  });

  it('empty boxplot groups renders a No-data placeholder, no NaN', () => {
    const svg = renderStaticBoxplotSvg({ groups: [], width: 300, height: 150 });
    expect(svg).toContain('No data');
    expect(svg).not.toContain('NaN');
  });

  it('width smaller than horizontal margins (negative innerW) does not throw or emit NaN', () => {
    // MARGIN.left + MARGIN.right = 64; width 40 -> innerW = -24
    expect(() =>
      renderStaticIChartSvg({
        data: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
        mean: 1.5,
        ucl: 2,
        lcl: 1,
        width: 40,
        height: 150,
      })
    ).not.toThrow();
    const svg = renderStaticIChartSvg({
      data: [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      mean: 1.5,
      ucl: 2,
      lcl: 1,
      width: 40,
      height: 150,
    });
    expect(svg).not.toContain('NaN');

    const boxSvg = renderStaticBoxplotSvg({
      groups: [{ key: 'A', q1: 1, median: 2, q3: 3, min: 0, max: 4 }],
      width: 40,
      height: 150,
    });
    expect(boxSvg).not.toContain('NaN');
  });
});
