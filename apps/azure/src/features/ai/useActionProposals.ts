/**
 * useActionProposals - AI action proposal state machine.
 *
 * Manages the lifecycle of action proposals from CoScout AI responses:
 * parsing action markers, deduplication, execution, and dismissal (ADR-029).
 */
import { useState, useCallback, useEffect } from 'react';
import {
  parseActionMarkers as coreParseActionMarkers,
  isDuplicateProposal as coreIsDuplicateProposal,
} from '@variscout/core';
import type { ActionProposal, FilterSource, FindingSource, Finding } from '@variscout/core';
import type { UseHypothesesReturn } from '@variscout/hooks';

// ── Interfaces ────────────────────────────────────────────────────────────

interface CoScoutMessage {
  role: string;
  content: string;
}

interface FilterNavSlice {
  applyFilter: (action: {
    type: 'filter';
    source: FilterSource;
    factor: string;
    values: string[];
  }) => void;
  clearFilters: () => void;
}

interface FindingsStateSlice {
  addFinding: (
    text: string,
    context: {
      activeFilters: Record<string, (string | number)[]>;
      cumulativeScope: null;
      stats?: { mean: number; median?: number; cpk?: number; samples: number };
    },
    source?: FindingSource
  ) => Finding;
  addAction: (findingId: string, text: string) => void;
  linkHypothesis: (
    findingId: string,
    hypothesisId: string,
    validationStatus?: 'supports' | 'contradicts' | 'inconclusive'
  ) => void;
  addFindingComment: (findingId: string, text: string, author?: string) => void;
}

interface StatsSlice {
  mean: number;
  median: number;
  cpk?: number | null;
}

export interface UseActionProposalsOptions {
  /** CoScout messages to scan for action markers */
  messages: CoScoutMessage[];
  /** Filter navigation for apply_filter / clear_filters actions */
  filterNav: FilterNavSlice;
  /** Findings state for create_finding / suggest_action actions */
  findingsState: FindingsStateSlice;
  /** Hypotheses state for create_hypothesis / suggest_improvement_idea actions */
  hypothesesState: UseHypothesesReturn;
  /** Current filters for finding context */
  filters: Record<string, (string | number)[]>;
  /** Current stats for finding context */
  stats: StatsSlice | null;
  /** Current filtered data length for finding context */
  filteredDataLength: number;
}

export interface UseActionProposalsReturn {
  /** Current list of action proposals */
  actionProposals: ActionProposal[];
  /** Execute a proposal (apply its action) */
  handleExecuteAction: (proposal: ActionProposal, editedText?: string) => void;
  /** Dismiss a proposal */
  handleDismissAction: (proposalId: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useActionProposals({
  messages,
  filterNav,
  findingsState,
  hypothesesState,
  filters,
  stats,
  filteredDataLength,
}: UseActionProposalsOptions): UseActionProposalsReturn {
  const [actionProposals, setActionProposals] = useState<ActionProposal[]>([]);

  // Parse action markers from new assistant messages and collect proposals
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content) return;

    const markers = coreParseActionMarkers(lastMsg.content);
    if (markers.length === 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to new AI message arriving (external async event)
    setActionProposals(prev => {
      const newProposals = [...prev];
      for (const marker of markers) {
        if (!coreIsDuplicateProposal(newProposals, marker.tool, marker.params)) {
          const existing = newProposals.find(
            p =>
              p.tool === marker.tool && JSON.stringify(p.params) === JSON.stringify(marker.params)
          );
          if (!existing) {
            newProposals.push({
              id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              tool: marker.tool,
              params: marker.params,
              preview: marker.params,
              status: 'pending',
              filterStackHash: '',
              timestamp: Date.now(),
              editableText: (marker.params.text as string) || undefined,
            });
          }
        }
      }
      return newProposals;
    });
  }, [messages]);

  const handleExecuteAction = useCallback(
    (proposal: ActionProposal, editedText?: string) => {
      switch (proposal.tool) {
        case 'apply_filter': {
          const { factor, value } = proposal.params as { factor: string; value: string };
          filterNav.applyFilter({
            type: 'filter',
            source: 'coscout',
            factor,
            values: [value],
          });
          break;
        }
        case 'clear_filters':
          filterNav.clearFilters();
          break;
        case 'create_finding': {
          const text = editedText || (proposal.params.text as string);
          if (text) {
            const findingContext = {
              activeFilters: filters,
              cumulativeScope: null,
              stats: stats
                ? {
                    mean: stats.mean,
                    median: stats.median,
                    cpk: stats.cpk ?? undefined,
                    samples: filteredDataLength,
                  }
                : undefined,
            };
            findingsState.addFinding(text, findingContext);
          }
          break;
        }
        case 'create_hypothesis': {
          const text = editedText || (proposal.params.text as string);
          const factor = proposal.params.factor as string | undefined;
          const level = proposal.params.level as string | undefined;
          const parentId = proposal.params.parent_id as string | undefined;
          const validationType = (proposal.params.validation_type as string) || 'data';
          if (text) {
            if (parentId) {
              hypothesesState.addSubHypothesis(
                parentId,
                text,
                factor,
                level,
                validationType as 'data' | 'gemba' | 'expert'
              );
            } else {
              hypothesesState.addHypothesis(text, factor, level);
            }
          }
          break;
        }
        case 'suggest_action': {
          const findingId = proposal.params.finding_id as string;
          const text = editedText || (proposal.params.text as string);
          if (findingId && text) findingsState.addAction(findingId, text);
          break;
        }
        case 'suggest_save_finding': {
          const text = editedText || (proposal.params.insight_text as string);
          const suggestedHypothesisId = proposal.params.suggested_hypothesis_id as
            | string
            | undefined;
          if (text) {
            const findingContext = {
              activeFilters: filters,
              cumulativeScope: null as null,
              stats: stats
                ? {
                    mean: stats.mean,
                    median: stats.median,
                    cpk: stats.cpk ?? undefined,
                    samples: filteredDataLength,
                  }
                : undefined,
            };
            // Create finding with coscout source — use a generated messageId
            // since tool-call proposals don't carry the parent message ID
            const source: FindingSource = {
              chart: 'coscout',
              messageId: `tool-${proposal.id}`,
            };
            const newFinding = findingsState.addFinding(text, findingContext, source);
            // Link to hypothesis if suggested
            if (suggestedHypothesisId && newFinding) {
              findingsState.linkHypothesis(newFinding.id, suggestedHypothesisId);
            }
          }
          break;
        }
        case 'suggest_improvement_idea': {
          const hypothesisId = proposal.params.hypothesis_id as string;
          const ideaText = editedText || (proposal.params.text as string);
          const direction = proposal.params.direction as string;
          const timeframe = proposal.params.timeframe as string;
          if (hypothesisId && ideaText) {
            const idea = hypothesesState.addIdea(hypothesisId, ideaText);
            if (idea) {
              hypothesesState.updateIdea(hypothesisId, idea.id, {
                ...(direction && {
                  direction: direction as 'prevent' | 'detect' | 'simplify' | 'eliminate',
                }),
                ...(timeframe && {
                  timeframe: timeframe as 'just-do' | 'days' | 'weeks' | 'months',
                }),
              });
            }
          }
          break;
        }
        default:
          break;
      }

      // Mark proposal as applied
      setActionProposals(prev =>
        prev.map(p => (p.id === proposal.id ? { ...p, status: 'applied' as const } : p))
      );
    },
    [filterNav, findingsState, hypothesesState, filters, stats, filteredDataLength]
  );

  const handleDismissAction = useCallback((proposalId: string) => {
    setActionProposals(prev =>
      prev.map(p => (p.id === proposalId ? { ...p, status: 'dismissed' as const } : p))
    );
  }, []);

  return {
    actionProposals,
    handleExecuteAction,
    handleDismissAction,
  };
}
