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
  it('(a) output contains NO executable <script> tag', () => {
    const html = renderPackHtml(minimalModel, { redaction: 'no-raw-rows' });
    // <script type="application/json"> is allowed (inert data), but NO script without type
    // and no script with executable types
    const executableScriptPattern = /<script(?!\s+type=["']application\/json["'])[^>]*>/gi;
    const matches = html.match(executableScriptPattern);
    expect(matches).toBeNull();
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

    // no-raw-rows must not contain the table header or cell values
    expect(htmlNoRaw).not.toContain('2026-06-01');

    // include-raw-rows must contain the data
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
