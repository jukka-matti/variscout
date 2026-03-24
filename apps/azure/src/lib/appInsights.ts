/**
 * Azure Application Insights browser SDK integration.
 *
 * Telemetry goes to the customer's own App Insights instance
 * (connection string from their Azure deployment). No-ops in local dev.
 *
 * Also handles AI call tracing: exports in-memory AI traces from @variscout/core
 * as custom events. No PII is sent — only aggregate statistics and anonymized
 * trace metadata (feature name, model, duration, token counts, success/failure).
 */

import type { ApplicationInsights } from '@microsoft/applicationinsights-web';
import type { TraceRecord } from '@variscout/core';
import { getRecentTraces, clearTraces, getTraceStats } from '@variscout/core';

let appInsights: ApplicationInsights | null = null;
let flushIntervalId: ReturnType<typeof setInterval> | null = null;
let lastFlushedTraceId: string | null = null;

/**
 * Initialize App Insights with the customer's connection string.
 * Call once at app startup after loading runtime config.
 * No-ops if connectionString is empty (local dev, tests).
 *
 * Sets up: SDK init, periodic AI trace flushing, beforeunload handler.
 */
export async function initAppInsights(connectionString: string): Promise<void> {
  if (!connectionString || appInsights) return;

  // Dynamic import — SDK loads as async chunk after first paint.
  // Same deferred pattern as Microsoft's SDK Loader Script (CDN).
  const { ApplicationInsights } = await import('@microsoft/applicationinsights-web');

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      disableFetchTracking: false,
      disableAjaxTracking: false,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
    },
  });

  appInsights.loadAppInsights();

  // Set up periodic AI trace flush every 5 minutes
  flushIntervalId = setInterval(flushTraces, 5 * 60 * 1000);

  // Flush on page unload
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Send an initial summary after 30 seconds to confirm connectivity
  setTimeout(() => flushSummary(), 30_000);
}

/**
 * Track an exception (e.g., from ErrorBoundary).
 */
export function trackException(error: Error, severityLevel?: number): void {
  appInsights?.trackException({ exception: error, severityLevel });
}

/**
 * Flush pending AI traces to Application Insights as custom events.
 * Reads from the in-memory trace buffer and sends only new traces
 * since the last flush.
 */
export function flushTraces(): void {
  if (!appInsights) return;

  const traces = getRecentTraces();
  if (traces.length === 0) return;

  // Find traces added since last flush
  let startIndex = 0;
  if (lastFlushedTraceId) {
    const idx = traces.findIndex(t => t.id === lastFlushedTraceId);
    if (idx >= 0) {
      startIndex = idx + 1;
    }
  }

  const newTraces = traces.slice(startIndex);
  if (newTraces.length === 0) return;

  for (const trace of newTraces) {
    trackAICall(trace);
  }

  lastFlushedTraceId = newTraces[newTraces.length - 1].id;

  // Also send a periodic summary
  flushSummary();

  // Clear the buffer to prevent re-sending on next flush
  clearTraces();
  lastFlushedTraceId = null;
}

/**
 * Track an individual AI call as a custom event in Application Insights.
 * Sends only non-PII metadata: feature, model, duration, token counts, success.
 */
export function trackAICall(trace: TraceRecord): void {
  if (!appInsights) return;

  appInsights.trackEvent({
    name: 'AI.Call',
    properties: {
      feature: trace.feature,
      model: trace.model,
      success: String(trace.success),
      // Send error type but not the full message (may contain user data)
      hasError: String(!!trace.error),
    },
    measurements: {
      durationMs: trace.durationMs,
      inputTokens: trace.tokens?.inputTokens ?? 0,
      outputTokens: trace.tokens?.outputTokens ?? 0,
      totalTokens: trace.tokens?.totalTokens ?? 0,
      cachedTokens: trace.tokens?.cachedTokens ?? 0,
      reasoningTokens: trace.tokens?.reasoningTokens ?? 0,
    },
  });
}

/**
 * Send aggregate trace statistics as a summary event.
 * Provides a high-level view of AI usage without individual call details.
 */
function flushSummary(): void {
  if (!appInsights) return;

  const stats = getTraceStats();
  if (stats.totalCalls === 0) return;

  appInsights.trackEvent({
    name: 'AI.Summary',
    properties: {},
    measurements: {
      totalCalls: stats.totalCalls,
      successRate: stats.successRate,
      avgDurationMs: stats.avgDurationMs,
      p95DurationMs: stats.p95DurationMs,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
    },
  });

  appInsights.flush();
}

/** Handle page unload — flush remaining traces synchronously */
function handleBeforeUnload(): void {
  flushTraces();
}

/**
 * Tear down telemetry. Used in tests and cleanup.
 */
export function teardownTelemetry(): void {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
  appInsights = null;
  lastFlushedTraceId = null;
}
