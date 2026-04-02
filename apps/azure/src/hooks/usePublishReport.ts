/**
 * usePublishReport — Report publishing hook.
 *
 * SharePoint upload removed per ADR-059. Returns an error status
 * directing users to use local export instead.
 */

import { useState, useCallback } from 'react';
import type { StatsResult, ProcessContext, Question } from '@variscout/core';
import type { ReportSectionDescriptor, ReportType } from '@variscout/hooks';

// ── Types ───────────────────────────────────────────────────────────────

export type PublishStatus = 'idle' | 'rendering' | 'uploading' | 'success' | 'error' | 'exists';

export interface UsePublishReportOptions {
  projectName: string;
  processName?: string;
  analyst?: string;
  reportType: ReportType;
  sections: ReportSectionDescriptor[];
  questions: Question[];
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
  /** SharePoint web URL of the published report (available after success) */
  publishedUrl: string | null;
  reset: () => void;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function usePublishReport(_options: UsePublishReportOptions): UsePublishReportReturn {
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(async () => {
    setStatus('error');
    setError('SharePoint upload removed — use local export');
  }, []);

  const publishReplace = useCallback(async () => {
    setStatus('error');
    setError('SharePoint upload removed — use local export');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { publish, publishReplace, status, error, publishedUrl: null, reset };
}
