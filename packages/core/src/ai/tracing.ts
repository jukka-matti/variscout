/**
 * AI observability tracing for VariScout.
 *
 * Wraps AI calls with structured tracing spans for monitoring:
 * - Latency (p50, p95, p99)
 * - Token usage (input, output, total) per call
 * - Cost estimation per feature (narration, CoScout, chart insights, reports)
 * - Error rates and types
 *
 * Data flows to Azure AI Foundry AgentOps dashboard.
 *
 * @module
 */

// ── Types ────────────────────────────────────────────────────────────────

export type AIFeature = 'narration' | 'coscout' | 'chart-insight' | 'report';

export interface TraceMetadata {
  feature: AIFeature;
  model?: string;
  /** Custom attributes for the span */
  [key: string]: unknown;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface TraceRecord {
  id: string;
  feature: AIFeature;
  model: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  tokens?: TokenUsage;
  success: boolean;
  error?: string;
}

// ── In-memory trace buffer ───────────────────────────────────────────────

/** Circular buffer of recent traces for local debugging / export */
const TRACE_BUFFER_SIZE = 100;
const traceBuffer: TraceRecord[] = [];

function addTrace(record: TraceRecord): void {
  traceBuffer.push(record);
  if (traceBuffer.length > TRACE_BUFFER_SIZE) {
    traceBuffer.shift();
  }
}

/** Get recent traces (for debugging or export to AgentOps) */
export function getRecentTraces(): readonly TraceRecord[] {
  return traceBuffer;
}

/** Clear the trace buffer */
export function clearTraces(): void {
  traceBuffer.length = 0;
}

// ── Trace wrapper ────────────────────────────────────────────────────────

let traceIdCounter = 0;

/**
 * Wrap an AI call with tracing.
 * Records latency, success/failure, and optional token usage.
 *
 * @example
 * ```ts
 * const { result, trace } = await traceAICall(
 *   { feature: 'coscout', model: 'gpt-4o' },
 *   async () => {
 *     const response = await sendResponsesTurn(config, request);
 *     return {
 *       result: extractResponseText(response),
 *       tokens: response.usage ? {
 *         inputTokens: response.usage.input_tokens,
 *         outputTokens: response.usage.output_tokens,
 *         totalTokens: response.usage.total_tokens,
 *       } : undefined,
 *     };
 *   }
 * );
 * ```
 */
export async function traceAICall<T>(
  metadata: TraceMetadata,
  fn: () => Promise<{ result: T; tokens?: TokenUsage }>
): Promise<{ result: T; trace: TraceRecord }> {
  const id = `trace-${++traceIdCounter}`;
  const startTime = Date.now();

  try {
    const { result, tokens } = await fn();
    const endTime = Date.now();

    const trace: TraceRecord = {
      id,
      feature: metadata.feature,
      model: (metadata.model as string) || 'unknown',
      startTime,
      endTime,
      durationMs: endTime - startTime,
      tokens,
      success: true,
    };

    addTrace(trace);
    return { result, trace };
  } catch (err) {
    const endTime = Date.now();

    const trace: TraceRecord = {
      id,
      feature: metadata.feature,
      model: (metadata.model as string) || 'unknown',
      startTime,
      endTime,
      durationMs: endTime - startTime,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };

    addTrace(trace);
    throw err;
  }
}

// ── Aggregate statistics ─────────────────────────────────────────────────

export interface TraceStats {
  totalCalls: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

/**
 * Compute aggregate statistics from recent traces.
 * Optionally filter by feature.
 */
export function getTraceStats(feature?: AIFeature): TraceStats {
  const traces = feature ? traceBuffer.filter(t => t.feature === feature) : traceBuffer;

  if (traces.length === 0) {
    return {
      totalCalls: 0,
      successRate: 1,
      avgDurationMs: 0,
      p95DurationMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }

  const successCount = traces.filter(t => t.success).length;
  const durations = traces.map(t => t.durationMs).sort((a, b) => a - b);
  const p95Index = Math.min(Math.ceil(durations.length * 0.95) - 1, durations.length - 1);

  return {
    totalCalls: traces.length,
    successRate: successCount / traces.length,
    avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95DurationMs: durations[p95Index],
    totalInputTokens: traces.reduce((sum, t) => sum + (t.tokens?.inputTokens ?? 0), 0),
    totalOutputTokens: traces.reduce((sum, t) => sum + (t.tokens?.outputTokens ?? 0), 0),
  };
}
