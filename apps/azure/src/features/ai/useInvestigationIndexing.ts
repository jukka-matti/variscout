/**
 * useInvestigationIndexing — Wire investigation serializer to Blob Storage
 *
 * ADR-060 Pillar 2: Automatically serializes findings and questions to
 * JSONL blobs in Blob Storage so Foundry IQ can index them for CoScout
 * knowledge retrieval.
 *
 * Only active when:
 * - `enabled` is true (Team plan + KB preview gate)
 * - `projectId` is defined
 *
 * On disable or unmount: disposes debounce timers cleanly.
 */

import { useRef, useEffect, useCallback } from 'react';
import { createInvestigationSerializer } from '../../services/investigationSerializer';
import { uploadTextBlob } from '../../services/blobClient';
import type { Finding, Question } from '@variscout/core';

export interface UseInvestigationIndexingOptions {
  /** The current project ID — determines blob path prefix */
  projectId: string | undefined;
  /** Enable serialization (Team plan + KB preview enabled) */
  enabled: boolean;
}

export interface UseInvestigationIndexingReturn {
  /** Call after findings array changes to schedule a debounced JSONL upload */
  onFindingsChange: (findings: Finding[]) => void;
  /** Call after questions array changes to schedule a debounced JSONL upload */
  onQuestionsChange: (questions: Question[]) => void;
}

export function useInvestigationIndexing({
  projectId,
  enabled,
}: UseInvestigationIndexingOptions): UseInvestigationIndexingReturn {
  const serializerRef = useRef<ReturnType<typeof createInvestigationSerializer> | null>(null);

  useEffect(() => {
    if (!enabled || !projectId) {
      serializerRef.current?.dispose();
      serializerRef.current = null;
      return;
    }

    serializerRef.current = createInvestigationSerializer({
      projectId,
      uploadBlob: async (path: string, content: string) => {
        await uploadTextBlob(path, content);
      },
    });

    return () => {
      serializerRef.current?.dispose();
      serializerRef.current = null;
    };
  }, [enabled, projectId]);

  const onFindingsChange = useCallback((findings: Finding[]) => {
    serializerRef.current?.onFindingsChange(findings);
  }, []);

  const onQuestionsChange = useCallback((questions: Question[]) => {
    serializerRef.current?.onQuestionsChange(questions);
  }, []);

  return { onFindingsChange, onQuestionsChange };
}
