import { useMemo, useRef } from 'react';
import type { Finding } from '@variscout/core';

export interface JournalEntry {
  id: string;
  timestamp: string;
  type: 'finding-created' | 'note-added' | 'problem-statement';
  text: string;
  detail?: string;
  relatedFindingId?: string;
}

interface UseJournalEntriesOptions {
  findings: Finding[];
  problemStatement?: string;
}

export function useJournalEntries({
  findings,
  problemStatement,
}: UseJournalEntriesOptions): JournalEntry[] {
  const problemTimestampRef = useRef<string | null>(null);
  if (problemStatement && !problemTimestampRef.current) {
    problemTimestampRef.current = new Date().toISOString();
  } else if (!problemStatement) {
    problemTimestampRef.current = null;
  }

  return useMemo(() => {
    const entries: JournalEntry[] = [];

    for (const f of findings) {
      entries.push({
        id: `j-f-${f.id}`,
        timestamp: new Date(f.createdAt).toISOString(),
        type: 'finding-created',
        text: f.text,
        relatedFindingId: f.id,
      });

      for (const c of f.comments) {
        entries.push({
          id: `j-c-${f.id}-${c.id}`,
          timestamp: new Date(c.createdAt).toISOString(),
          type: 'note-added',
          text: c.text,
          detail: `On: ${f.text}`,
          relatedFindingId: f.id,
        });
      }
    }

    if (problemStatement) {
      entries.push({
        id: 'j-ps',
        timestamp: problemTimestampRef.current ?? new Date().toISOString(),
        type: 'problem-statement',
        text: 'Problem statement formed',
        detail: problemStatement,
      });
    }

    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return entries;
  }, [findings, problemStatement]);
}
