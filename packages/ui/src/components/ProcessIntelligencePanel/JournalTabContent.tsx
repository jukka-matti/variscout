import React from 'react';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import { useJournalEntries, type JournalEntry } from '@variscout/hooks';
import JournalTabView from './JournalTabView';

export interface JournalTabContentProps {
  /** Called when a journal entry is clicked */
  onEntryClick?: (entry: JournalEntry) => void;
  /** Called when the "Include in Report" button is clicked */
  onIncludeInReport?: () => void;
}

/**
 * JournalTabContent — store-aware content for the "Journal" tab in the PI Panel.
 *
 * Reads from stores:
 * - findings, questions from useInvestigationStore
 * - processContext (problemStatement) from useProjectStore
 *
 * Computes journal entries via useJournalEntries hook (from @variscout/hooks).
 * Renders JournalTabView with the computed entries.
 *
 * Accepts props for callbacks that cannot come from stores.
 */
const JournalTabContent: React.FC<JournalTabContentProps> = ({
  onEntryClick,
  onIncludeInReport,
}) => {
  // Store reads
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const processContext = useProjectStore(s => s.processContext);

  // Compute journal entries
  const entries = useJournalEntries({
    findings,
    questions,
    problemStatement: processContext?.problemStatement,
  });

  return (
    <JournalTabView
      entries={entries}
      onEntryClick={onEntryClick}
      onIncludeInReport={onIncludeInReport}
    />
  );
};

export default JournalTabContent;
