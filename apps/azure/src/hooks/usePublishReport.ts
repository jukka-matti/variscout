/**
 * usePublishReport — Orchestrates publishing a scouting report to SharePoint.
 *
 * Flow:
 *   1. Render report sections → Markdown document
 *   2. Upload to channel's SharePoint folder (alongside .vrs files)
 *   3. Handle versioning (ask user if file exists)
 *
 * ADR-026: Reports are published to the same folder as .vrs files.
 * Uses getGraphTokenWithScopes() for SharePoint write access.
 */

import { useState, useCallback } from 'react';
import type { StatsResult, ProcessContext, Hypothesis } from '@variscout/core';
import type { ReportSectionDescriptor, ReportType } from '@variscout/hooks';
import {
  renderReportMarkdown,
  generateReportFilename,
  type ReportMetadata,
} from '../services/reportExport';
import { uploadReportToSharePoint } from '../services/reportUpload';

// ── Types ───────────────────────────────────────────────────────────────

export type PublishStatus = 'idle' | 'rendering' | 'uploading' | 'success' | 'error' | 'exists';

export interface UsePublishReportOptions {
  projectName: string;
  processName?: string;
  analyst?: string;
  reportType: ReportType;
  sections: ReportSectionDescriptor[];
  hypotheses: Hypothesis[];
  processContext?: ProcessContext;
  stats?: StatsResult;
  sampleCount?: number;
  aiNarrative?: string;
}

export interface UsePublishReportReturn {
  publish: () => Promise<void>;
  publishReplace: () => Promise<void>;
  status: PublishStatus;
  error: string | null;
  reset: () => void;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function usePublishReport(options: UsePublishReportOptions): UsePublishReportReturn {
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const doPublish = useCallback(
    async (replaceExisting: boolean) => {
      try {
        // 1. Render
        setStatus('rendering');
        setError(null);

        const date = new Date().toISOString().substring(0, 10);
        const metadata: ReportMetadata = {
          projectName: options.projectName,
          processName: options.processName,
          analyst: options.analyst,
          date,
          reportType: options.reportType,
          cpk: options.stats?.cpk,
          mean: options.stats?.mean,
          sampleCount: options.sampleCount,
        };

        const markdown = renderReportMarkdown({
          metadata,
          sections: options.sections,
          processContext: options.processContext,
          stats: options.stats,
          aiNarrative: options.aiNarrative,
        });

        const filename = generateReportFilename(options.projectName, date);

        // 2. Upload
        setStatus('uploading');

        const result = await uploadReportToSharePoint(markdown, filename, replaceExisting);

        if (result.exists && !replaceExisting) {
          setStatus('exists');
          return;
        }

        setStatus('success');
      } catch (err) {
        console.error('[PublishReport] Failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to publish report');
        setStatus('error');
      }
    },
    [options]
  );

  const publish = useCallback(() => doPublish(false), [doPublish]);
  const publishReplace = useCallback(() => doPublish(true), [doPublish]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { publish, publishReplace, status, error, reset };
}
