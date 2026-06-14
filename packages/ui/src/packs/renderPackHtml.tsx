/**
 * CL-2: Pack-renderer spine
 *
 * Produces a single self-contained, script-free HTML string suitable for:
 * - Emailing as an attachment
 * - Viewing locally in any browser (zero network calls)
 * - Printing to PDF (print stylesheet included)
 * - Sharing via Teams / SharePoint (no executable content)
 *
 * HARD CONSTRAINTS enforced:
 * - NO <script> tags with executable JavaScript
 * - NO external URLs (http / https)
 * - Charts are inline <svg> (built by staticChartSvg.ts, no React chart components)
 * - Inline <style> includes @media print rules
 * - Redaction levels: 'no-raw-rows' | 'include-raw-rows'
 *
 * WHY NOT renderToStaticMarkup:
 * The existing chart components (IChartBase, BoxplotBase) depend on
 * useChartTheme() which reads document.documentElement — a live DOM API.
 * Building the HTML via template strings avoids any React SSR dependency
 * and keeps this module framework-agnostic for future moves.
 */

import {
  renderStaticBoxplotSvg,
  renderStaticIChartSvg,
  type StaticBoxplotInput,
  type StaticIChartInput,
} from './staticChartSvg';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RedactionLevel = 'no-raw-rows' | 'include-raw-rows';

/** A condition/summary card — shows a filter label + key stats text. */
export interface ConditionSection {
  kind: 'condition';
  label: string;
  statsText: string;
}

/** A chart card — renders as an inline SVG. */
export interface ChartSection {
  kind: 'chart';
  title: string;
  chartType: 'ichart' | 'boxplot';
  /** For ichart: array of {x, y} points */
  data?: Array<{ x: number; y: number }>;
  /** For boxplot: array of group stats */
  groups?: StaticBoxplotInput['groups'];
  /** Control chart params (ichart) */
  mean?: number;
  ucl?: number;
  lcl?: number;
  /** Render dimensions */
  width: number;
  height: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

/** A question card — shown with a stable question ID and a printed answer area. */
export interface QuestionSection {
  kind: 'question';
  questionId: string;
  text: string;
  anchorLabel?: string;
}

/**
 * A raw-rows section — included only when redaction === 'include-raw-rows'.
 * Excluded entirely for 'no-raw-rows'.
 */
export interface RawRowsSection {
  kind: 'raw-rows';
  headers: string[];
  rows: string[][];
}

export type PackSection = ConditionSection | ChartSection | QuestionSection | RawRowsSection;

export interface PackMeta {
  packId: string;
  consultationId?: string;
  from?: string;
}

export interface PackModel {
  title: string;
  meta: PackMeta;
  sections: PackSection[];
  responseTemplateMarkdown?: string;
}

export interface RenderPackHtmlOptions {
  redaction: RedactionLevel;
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const PACK_STYLES = `
  /* VariScout Consultation Pack — self-contained styles */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1f2937;
    background: #fff;
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 20px;
  }

  .pack-header {
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .pack-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .pack-meta {
    font-size: 12px;
    color: #6b7280;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .pack-meta span::before { content: '·'; margin-right: 8px; }
  .pack-meta span:first-child::before { content: ''; margin-right: 0; }

  .section {
    margin-bottom: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }

  .section-header {
    background: #f9fafb;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-body {
    padding: 16px;
  }

  /* Condition card */
  .condition-label {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .condition-stats {
    font-size: 12px;
    color: #6b7280;
  }

  /* Chart card */
  .chart-title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }

  .chart-svg-wrapper {
    overflow: visible;
  }

  /* Question card */
  .question-id {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .question-anchor {
    font-size: 11px;
    color: #6366f1;
    margin-bottom: 8px;
    font-style: italic;
  }

  .question-text {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 12px;
  }

  .answer-area {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    min-height: 80px;
    padding: 8px;
    background: #fafafa;
    color: #9ca3af;
    font-size: 12px;
    font-style: italic;
  }

  /* Raw rows */
  .raw-rows-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .raw-rows-table th {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
    color: #374151;
  }

  .raw-rows-table td {
    border: 1px solid #e5e7eb;
    padding: 5px 10px;
    color: #4b5563;
  }

  .raw-rows-table tr:nth-child(even) td { background: #f9fafb; }

  /* Response template */
  .response-template-section {
    margin-top: 32px;
    border: 2px solid #6366f1;
    border-radius: 6px;
    overflow: hidden;
  }

  .response-template-header {
    background: #6366f1;
    color: #fff;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
  }

  .response-template-body {
    padding: 16px;
  }

  .response-template-pre {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 16px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
    color: #1f2937;
    margin-top: 8px;
  }

  .template-instruction {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
  }

  /* Print stylesheet */
  @media print {
    body {
      max-width: 100%;
      padding: 0;
      font-size: 11pt;
    }

    .section {
      break-inside: avoid;
      margin-bottom: 16pt;
    }

    .answer-area {
      min-height: 60pt;
      border: 1pt solid #999;
      background: #fff;
    }

    .pack-header {
      border-bottom: 1pt solid #333;
    }

    .response-template-section {
      border: 1pt solid #6366f1;
    }

    .response-template-header {
      background: #6366f1 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    a { color: inherit; text-decoration: none; }
  }
`;

// ── Section renderers ─────────────────────────────────────────────────────────

function renderConditionSection(s: ConditionSection): string {
  return `
  <div class="section">
    <div class="section-header">What I am seeing</div>
    <div class="section-body">
      <div class="condition-label">${escapeHtml(s.label)}</div>
      <div class="condition-stats">${escapeHtml(s.statsText)}</div>
    </div>
  </div>`;
}

function renderChartSection(s: ChartSection): string {
  let svgContent = '';

  if (s.chartType === 'ichart') {
    const input: StaticIChartInput = {
      data: s.data ?? [],
      mean: s.mean ?? 0,
      ucl: s.ucl ?? 0,
      lcl: s.lcl ?? 0,
      width: s.width,
      height: s.height,
      yAxisLabel: s.yAxisLabel,
      xAxisLabel: s.xAxisLabel,
    };
    svgContent = renderStaticIChartSvg(input);
  } else if (s.chartType === 'boxplot') {
    const input: StaticBoxplotInput = {
      groups: s.groups ?? [],
      width: s.width,
      height: s.height,
      yAxisLabel: s.yAxisLabel,
    };
    svgContent = renderStaticBoxplotSvg(input);
  }

  return `
  <div class="section">
    <div class="section-header">Chart</div>
    <div class="section-body">
      <div class="chart-title">${escapeHtml(s.title)}</div>
      <div class="chart-svg-wrapper">${svgContent}</div>
    </div>
  </div>`;
}

function renderQuestionSection(s: QuestionSection, index: number): string {
  const displayNum = index + 1;
  const anchorHtml = s.anchorLabel
    ? `<div class="question-anchor">Anchored to: ${escapeHtml(s.anchorLabel)}</div>`
    : '';

  return `
  <div class="section">
    <div class="section-header">Q${displayNum} [id: ${escapeHtml(s.questionId)}]</div>
    <div class="section-body">
      <div class="question-id">Question ID: ${escapeHtml(s.questionId)}</div>
      ${anchorHtml}
      <div class="question-text">${escapeHtml(s.text)}</div>
      <div class="answer-area print-answer">(type your answer here)</div>
    </div>
  </div>`;
}

function renderRawRowsSection(s: RawRowsSection): string {
  const headerCells = s.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml = s.rows
    .map(row => {
      const cells = row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
  <div class="section">
    <div class="section-header">Raw data</div>
    <div class="section-body">
      <table class="raw-rows-table">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Main renderer ─────────────────────────────────────────────────────────────

/**
 * Renders a ConsultationPack (or any PackModel) to a single self-contained
 * HTML string.
 *
 * @param model - The pack data model.
 * @param options - Render options including redaction level.
 * @returns A complete HTML document string.
 */
export function renderPackHtml(model: PackModel, options: RenderPackHtmlOptions): string {
  const { redaction } = options;

  const metaParts: string[] = [];
  if (model.meta.packId) metaParts.push(`Pack ID: ${escapeHtml(model.meta.packId)}`);
  if (model.meta.from) metaParts.push(`From: ${escapeHtml(model.meta.from)}`);
  if (model.meta.consultationId)
    metaParts.push(`Consultation: ${escapeHtml(model.meta.consultationId)}`);

  const metaHtml = metaParts.map(part => `<span>${escapeHtml(part)}</span>`).join('\n        ');

  // Count questions for the header
  const questionCount = model.sections.filter(s => s.kind === 'question').length;
  if (questionCount > 0) {
    metaParts.push(`${questionCount} question${questionCount !== 1 ? 's' : ''}`);
  }

  let questionIndex = 0;
  const sectionsHtml = model.sections
    .map(section => {
      if (section.kind === 'raw-rows') {
        if (redaction === 'no-raw-rows') return '';
        return renderRawRowsSection(section);
      }
      if (section.kind === 'condition') return renderConditionSection(section);
      if (section.kind === 'chart') return renderChartSection(section);
      if (section.kind === 'question') {
        const html = renderQuestionSection(section, questionIndex);
        questionIndex++;
        return html;
      }
      return '';
    })
    .join('');

  const responseTemplateHtml = model.responseTemplateMarkdown
    ? `
  <div class="response-template-section">
    <div class="response-template-header">How to respond — copy this template</div>
    <div class="response-template-body">
      <div class="template-instruction">
        Copy the template below into a reply, text file, or document. Fill in your answers
        under each question, then send it back.
      </div>
      <pre class="response-template-pre">${escapeHtml(model.responseTemplateMarkdown)}</pre>
    </div>
  </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(model.title)} — VariScout Consultation Pack</title>
  <style>${PACK_STYLES}</style>
</head>
<body>
  <div class="pack-header">
    <div class="pack-title">${escapeHtml(model.title)}</div>
    <div class="pack-meta">
      ${metaHtml}
    </div>
  </div>
  ${sectionsHtml}
  ${responseTemplateHtml}
</body>
</html>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
