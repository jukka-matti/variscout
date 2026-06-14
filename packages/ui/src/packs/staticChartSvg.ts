/**
 * Dedicated static SVG renderers for the consultation pack.
 *
 * WHY NOT THE EXISTING CHART COMPONENTS:
 * The existing IChartBase / BoxplotBase components depend on `useChartTheme()`,
 * which calls `document.documentElement.getAttribute('data-theme')` and
 * `getComputedStyle(document.documentElement)` — live DOM APIs that either
 * throw or return stale values in a non-browser renderToStaticMarkup context.
 * Additionally, `withResponsiveSize` uses ResizeObserver + requestAnimationFrame,
 * both of which are browser-only. Rather than mock or polyfill the whole chain,
 * we produce real SVG geometry here from the same input data — no React, no
 * hooks, no DOM reads, fully deterministic.
 *
 * Output is a self-contained SVG string that:
 * - Uses only explicit numeric attributes (no CSS variables)
 * - Carries all styles inline (no external stylesheet needed)
 * - Is suitable for embedding directly in the HTML pack body
 */

export interface StaticIChartInput {
  data: Array<{ x: number; y: number }>;
  mean: number;
  ucl: number;
  lcl: number;
  width: number;
  height: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export interface StaticBoxplotInput {
  groups: Array<{
    key: string;
    q1: number;
    median: number;
    q3: number;
    min: number;
    max: number;
  }>;
  width: number;
  height: number;
  yAxisLabel?: string;
}

// ── Colour tokens (static — no CSS variables) ─────────────────────────────────
const COLORS = {
  point: '#3b82f6', // blue-500
  controlLine: '#ef4444', // red-500
  meanLine: '#6b7280', // gray-500
  axis: '#374151', // gray-700
  grid: '#e5e7eb', // gray-200
  box: '#bfdbfe', // blue-200
  median: '#1d4ed8', // blue-700
  whisker: '#374151', // gray-700
  text: '#374151',
};

const MARGIN = { top: 16, right: 16, bottom: 36, left: 48 };

function clamp(v: number, lo: number, hi: number): number {
  // Non-finite (NaN / Infinity) coordinates produce invalid SVG attributes
  // (e.g. cy="NaN"). Degenerate conditions (n=1, all-equal y, missing limits)
  // legitimately yield non-finite scale outputs, so clamp to the low bound
  // rather than emitting NaN.
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Coerce a possibly non-finite number to a finite fallback. Used at the input
 * boundary before any arithmetic so NaN/Infinity never propagate into scales
 * or SVG coordinate attributes.
 */
function safeNum(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

function linearScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): (v: number) => number {
  const d = domainMax - domainMin;
  if (d === 0) {
    return () => (rangeMin + rangeMax) / 2;
  }
  return (v: number) => rangeMin + ((v - domainMin) / d) * (rangeMax - rangeMin);
}

function bandScale(
  keys: string[],
  rangeMin: number,
  rangeMax: number,
  padding = 0.3
): (key: string) => number {
  const n = keys.length;
  if (n === 0) return () => rangeMin;
  const step = (rangeMax - rangeMin) / (n + padding * (n - 1));
  const bandwidth = step;
  return (key: string) => {
    const i = keys.indexOf(key);
    return rangeMin + i * (bandwidth * (1 + padding));
  };
}

// NOTE: intentionally diverges from renderPackHtml.tsx's escapeHtml — this one
// escapes only the four XML entities (no `'`) since it targets SVG text-node
// content, not HTML attributes. Kept separate deliberately (no cross-file shared
// module) to avoid an export-wiring ripple; the divergence is intentional.
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a tick-label number to 1 decimal place.
 * Uses Number.isFinite guard per ADR-069 before calling .toFixed().
 */
function formatTickLabel(v: number): string {
  if (Number.isFinite(v)) return v.toFixed(1);
  return '?';
}

/** Renders an I-Chart (individual values + control limits) as a static SVG string. */
export function renderStaticIChartSvg(input: StaticIChartInput): string {
  const {
    data: rawData,
    width,
    height,
    yAxisLabel = 'Value',
    xAxisLabel = 'Index',
  } = input;

  // Sanitize every numeric input at the boundary so non-finite values
  // (NaN / Infinity) never poison the min/max domain or reach SVG coords.
  const mean = safeNum(input.mean);
  const ucl = safeNum(input.ucl);
  const lcl = safeNum(input.lcl);
  const data = rawData.map(d => ({ x: safeNum(d.x), y: safeNum(d.y) }));

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  if (data.length === 0) {
    return `<svg width="${width}" height="${height}"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${COLORS.text}" font-size="12">No data</text></svg>`;
  }

  const yValues = data.map(d => d.y).concat([ucl, lcl, mean]);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yPad = (yMax - yMin) * 0.1 || 1;

  const xValues = data.map(d => d.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  const scaleX = linearScale(xMin, xMax, 0, innerW);
  const yScaled = linearScale(yMin - yPad, yMax + yPad, innerH, 0);

  // Grid lines at UCL/mean/LCL
  const gridLines = [ucl, mean, lcl]
    .map(v => {
      const y = clamp(Math.round(yScaled(v)), 0, innerH);
      return `<line x1="0" y1="${y}" x2="${innerW}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1" stroke-dasharray="4 2"/>`;
    })
    .join('\n    ');

  // Control lines
  const uclY = clamp(Math.round(yScaled(ucl)), 0, innerH);
  const meanY = clamp(Math.round(yScaled(mean)), 0, innerH);
  const lclY = clamp(Math.round(yScaled(lcl)), 0, innerH);

  const controlLines = [
    `<line x1="0" y1="${uclY}" x2="${innerW}" y2="${uclY}" stroke="${COLORS.controlLine}" stroke-width="1.5" stroke-dasharray="6 3"/>`,
    `<line x1="0" y1="${meanY}" x2="${innerW}" y2="${meanY}" stroke="${COLORS.meanLine}" stroke-width="1.5"/>`,
    `<line x1="0" y1="${lclY}" x2="${innerW}" y2="${lclY}" stroke="${COLORS.controlLine}" stroke-width="1.5" stroke-dasharray="6 3"/>`,
  ].join('\n    ');

  // Data line path
  const pointCoords = data.map(d => ({
    px: clamp(Math.round(scaleX(d.x)), 0, innerW),
    py: clamp(Math.round(yScaled(d.y)), 0, innerH),
  }));

  const linePath =
    pointCoords.length > 1
      ? `<path d="M ${pointCoords.map(p => `${p.px},${p.py}`).join(' L ')} " fill="none" stroke="${COLORS.point}" stroke-width="1.5" opacity="0.7"/>`
      : '';

  const dots = pointCoords
    .map(p => `<circle cx="${p.px}" cy="${p.py}" r="3" fill="${COLORS.point}" opacity="0.9"/>`)
    .join('\n    ');

  // Axis tick labels (Y: 5 ticks, X: up to 6)
  const yTicks = 5;
  const yTickStep = (yMax + yPad - (yMin - yPad)) / yTicks;
  const yTickLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = yMin - yPad + i * yTickStep;
    const y = clamp(Math.round(yScaled(val)), 0, innerH);
    return `<text x="-6" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" fill="${COLORS.text}">${formatTickLabel(val)}</text>`;
  }).join('\n    ');

  const xTickCount = Math.min(data.length, 6);
  const xStep = Math.max(1, Math.floor(data.length / xTickCount));
  const xTickLabels = data
    .filter((_, i) => i % xStep === 0)
    .map(d => {
      const px = clamp(Math.round(scaleX(d.x)), 0, innerW);
      return `<text x="${px}" y="${innerH + 14}" text-anchor="middle" font-size="9" fill="${COLORS.text}">${d.x}</text>`;
    })
    .join('\n    ');

  // Control line labels
  const uclLabel = `<text x="${innerW + 4}" y="${uclY}" font-size="8" fill="${COLORS.controlLine}" dominant-baseline="middle">UCL</text>`;
  const lclLabel = `<text x="${innerW + 4}" y="${lclY}" font-size="8" fill="${COLORS.controlLine}" dominant-baseline="middle">LCL</text>`;
  const meanLabel = `<text x="${innerW + 4}" y="${meanY}" font-size="8" fill="${COLORS.meanLine}" dominant-baseline="middle">X̄</text>`;

  // Axis labels
  const yLabelSvg = `<text transform="translate(-36, ${innerH / 2}) rotate(-90)" text-anchor="middle" font-size="10" fill="${COLORS.text}">${escapeXml(yAxisLabel)}</text>`;
  const xLabelSvg = `<text x="${innerW / 2}" y="${innerH + 30}" text-anchor="middle" font-size="10" fill="${COLORS.text}">${escapeXml(xAxisLabel)}</text>`;

  // Axes
  const axes = [
    `<line x1="0" y1="${innerH}" x2="${innerW}" y2="${innerH}" stroke="${COLORS.axis}" stroke-width="1"/>`,
    `<line x1="0" y1="0" x2="0" y2="${innerH}" stroke="${COLORS.axis}" stroke-width="1"/>`,
  ].join('\n    ');

  // Note: xmlns omitted — not needed when SVG is embedded in HTML5 documents.
  // Including xmlns="http://www.w3.org/2000/svg" would add a URL to the output,
  // violating the "no external URLs" pack constraint (even though xmlns is an XML
  // namespace identifier that never triggers a network call, the constraint is
  // checked as a substring test for safety).
  return `<svg width="${width}" height="${height}" style="overflow:visible">
  <g transform="translate(${MARGIN.left},${MARGIN.top})">
    ${gridLines}
    ${axes}
    ${controlLines}
    ${linePath}
    ${dots}
    ${yTickLabels}
    ${xTickLabels}
    ${uclLabel}
    ${lclLabel}
    ${meanLabel}
    ${yLabelSvg}
    ${xLabelSvg}
  </g>
</svg>`;
}

/** Renders a boxplot as a static SVG string. */
export function renderStaticBoxplotSvg(input: StaticBoxplotInput): string {
  const { groups: rawGroups, width, height, yAxisLabel = 'Value' } = input;

  // Sanitize every numeric stat at the boundary so non-finite values never
  // poison the min/max domain or reach SVG coords.
  const groups = rawGroups.map(g => ({
    key: g.key,
    q1: safeNum(g.q1),
    median: safeNum(g.median),
    q3: safeNum(g.q3),
    min: safeNum(g.min),
    max: safeNum(g.max),
  }));

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  if (groups.length === 0) {
    return `<svg width="${width}" height="${height}"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${COLORS.text}" font-size="12">No data</text></svg>`;
  }

  const allVals = groups.flatMap(g => [g.q1, g.median, g.q3, g.min, g.max]);
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const yPad = (yMax - yMin) * 0.1 || 1;

  const keys = groups.map(g => g.key);
  const scaleX = bandScale(keys, 0, innerW);
  const scaleY = linearScale(yMin - yPad, yMax + yPad, innerH, 0);
  const boxWidth = (innerW / (keys.length * (1 + 0.3))) * 0.7;

  const boxes = groups
    .map(g => {
      const cx = Math.round(scaleX(g.key) + boxWidth / 2);
      const q1y = clamp(Math.round(scaleY(g.q1)), 0, innerH);
      const medY = clamp(Math.round(scaleY(g.median)), 0, innerH);
      const q3y = clamp(Math.round(scaleY(g.q3)), 0, innerH);
      const minY = clamp(Math.round(scaleY(g.min)), 0, innerH);
      const maxY = clamp(Math.round(scaleY(g.max)), 0, innerH);
      const lx = Math.round(scaleX(g.key));
      const bw = Math.round(boxWidth);
      const hw = Math.round(bw * 0.3);

      return [
        // IQR box
        `<rect x="${lx}" y="${q3y}" width="${bw}" height="${Math.abs(q1y - q3y)}" fill="${COLORS.box}" stroke="${COLORS.whisker}" stroke-width="1"/>`,
        // Median line
        `<line x1="${lx}" y1="${medY}" x2="${lx + bw}" y2="${medY}" stroke="${COLORS.median}" stroke-width="2"/>`,
        // Lower whisker
        `<line x1="${cx}" y1="${q1y}" x2="${cx}" y2="${minY}" stroke="${COLORS.whisker}" stroke-width="1" stroke-dasharray="3 2"/>`,
        `<line x1="${cx - hw}" y1="${minY}" x2="${cx + hw}" y2="${minY}" stroke="${COLORS.whisker}" stroke-width="1"/>`,
        // Upper whisker
        `<line x1="${cx}" y1="${q3y}" x2="${cx}" y2="${maxY}" stroke="${COLORS.whisker}" stroke-width="1" stroke-dasharray="3 2"/>`,
        `<line x1="${cx - hw}" y1="${maxY}" x2="${cx + hw}" y2="${maxY}" stroke="${COLORS.whisker}" stroke-width="1"/>`,
        // X-axis label
        `<text x="${cx}" y="${innerH + 14}" text-anchor="middle" font-size="9" fill="${COLORS.text}">${escapeXml(g.key)}</text>`,
      ].join('\n    ');
    })
    .join('\n    ');

  const yTicks = 5;
  const yTickStep = (yMax + yPad - (yMin - yPad)) / yTicks;
  const yTickLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = yMin - yPad + i * yTickStep;
    const y = clamp(Math.round(scaleY(val)), 0, innerH);
    return `<text x="-6" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" fill="${COLORS.text}">${formatTickLabel(val)}</text>`;
  }).join('\n    ');

  const axes = [
    `<line x1="0" y1="${innerH}" x2="${innerW}" y2="${innerH}" stroke="${COLORS.axis}" stroke-width="1"/>`,
    `<line x1="0" y1="0" x2="0" y2="${innerH}" stroke="${COLORS.axis}" stroke-width="1"/>`,
  ].join('\n    ');

  const yLabelSvg = `<text transform="translate(-36, ${innerH / 2}) rotate(-90)" text-anchor="middle" font-size="10" fill="${COLORS.text}">${escapeXml(yAxisLabel)}</text>`;

  // Note: xmlns omitted — not needed when SVG is embedded in HTML5 documents.
  return `<svg width="${width}" height="${height}" style="overflow:visible">
  <g transform="translate(${MARGIN.left},${MARGIN.top})">
    ${axes}
    ${boxes}
    ${yTickLabels}
    ${yLabelSvg}
  </g>
</svg>`;
}
