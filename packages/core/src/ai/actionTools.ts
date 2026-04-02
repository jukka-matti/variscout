/**
 * Action Tools for CoScout — types, parsing, and preview computation.
 *
 * Action tools let CoScout propose UI state changes (filters, questions, findings)
 * that the analyst confirms via ActionProposalCard. No state mutation happens during
 * the tool loop — proposals are computed from rawData and returned as previews.
 *
 * ADR-029: AI Action Tools for CoScout
 */

import type { DataRow, SpecLimits } from '../types';
import type { FilterAction } from '../navigation';
import { filterStackToFilters } from '../navigation';
import { calculateStats } from '../stats/basic';
import { toNumericValue } from '../types';

// ── Types ────────────────────────────────────────────────────────────────

/** Names of all action tools (require user confirmation) */
export type ActionToolName =
  | 'apply_filter'
  | 'clear_filters'
  | 'switch_factor'
  | 'create_question'
  | 'answer_question'
  | 'create_finding'
  | 'suggest_action'
  | 'suggest_improvement_idea'
  | 'suggest_save_finding'
  | 'share_finding'
  | 'publish_report'
  | 'notify_action_owners'
  | 'navigate_to'; // Project dashboard navigation

/** Names of all read tools (auto-execute) */
export type ReadToolName =
  | 'get_chart_data'
  | 'get_statistical_summary'
  | 'suggest_knowledge_search'
  | 'get_available_factors'
  | 'compare_categories'
  | 'search_project' // Project dashboard search
  | 'get_finding_attachment'; // Retrieve photos and file metadata from findings

/** All CoScout tool names */
export type CoScoutToolName = ActionToolName | ReadToolName;

/** Proposal status for ActionProposalCard rendering */
export type ProposalStatus = 'pending' | 'applied' | 'dismissed' | 'expired';

/** An action proposal returned by an action tool handler */
export interface ActionProposal {
  /** Unique ID for deduplication and tracking */
  id: string;
  /** Which action tool generated this proposal */
  tool: ActionToolName;
  /** The original params passed to the tool */
  params: Record<string, unknown>;
  /** Preview data (tool-specific) */
  preview: Record<string, unknown>;
  /** Current status */
  status: ProposalStatus;
  /** Hash of filterStack at creation time — used for expiry detection */
  filterStackHash: string;
  /** Timestamp of creation */
  timestamp: number;
  /** Editable text (for create_finding, create_question, suggest_action) */
  editableText?: string;
}

// ── ACTION Marker Parsing ────────────────────────────────────────────────

/**
 * Regex to match [ACTION:tool_name:{...}] markers in assistant text.
 * Supports multiple markers per message.
 */
const ACTION_MARKER_REGEX = /\[ACTION:(\w+):([\s\S]*?)\]/g;

/** A parsed action marker from assistant text */
export interface ParsedActionMarker {
  /** Full match string (for replacement) */
  fullMatch: string;
  /** Tool name */
  tool: ActionToolName;
  /** Parsed params JSON */
  params: Record<string, unknown>;
  /** Start index in the original text */
  startIndex: number;
}

/**
 * Parse [ACTION:tool_name:{params_json}] markers from assistant message text.
 * Returns array of parsed markers. Invalid JSON is silently skipped.
 */
export function parseActionMarkers(text: string): ParsedActionMarker[] {
  const markers: ParsedActionMarker[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(ACTION_MARKER_REGEX.source, ACTION_MARKER_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    try {
      const params = JSON.parse(match[2]) as Record<string, unknown>;
      markers.push({
        fullMatch: match[0],
        tool: match[1] as ActionToolName,
        params,
        startIndex: match.index,
      });
    } catch {
      // Skip malformed JSON
    }
  }

  return markers;
}

/**
 * Strip [ACTION:...] markers from text, returning clean display text.
 */
export function stripActionMarkers(text: string): string {
  const regex = new RegExp(ACTION_MARKER_REGEX.source, ACTION_MARKER_REGEX.flags);
  return text.replace(regex, '').trim();
}

// ── Preview Computation ──────────────────────────────────────────────────

/** Stats preview for filter proposals */
export interface FilterPreview {
  samples: number;
  mean: number;
  stdDev: number;
  cpk?: number;
}

/**
 * Compute preview stats for a hypothetical filter application.
 * Filters rawData with the current filterStack + proposed filter,
 * then calculates stats. No React state is mutated.
 */
export function computeFilterPreview(
  rawData: DataRow[],
  outcome: string,
  currentFilterStack: FilterAction[],
  proposedFilter: { factor: string; value: string } | null,
  specs?: SpecLimits
): FilterPreview {
  // Build filter map from current stack + proposed filter
  const filters = filterStackToFilters(currentFilterStack);
  if (proposedFilter) {
    filters[proposedFilter.factor] = [proposedFilter.value];
  }

  // Apply filters to raw data
  let filtered = rawData;
  for (const [factor, values] of Object.entries(filters)) {
    const valueSet = new Set(values.map(String));
    filtered = filtered.filter(row => valueSet.has(String(row[factor])));
  }

  // Extract numeric values
  const values = filtered
    .map(row => toNumericValue(row[outcome]))
    .filter((v): v is number => v !== undefined);

  if (values.length === 0) {
    return { samples: 0, mean: 0, stdDev: 0 };
  }

  const stats = calculateStats(values, specs?.usl, specs?.lsl);

  return {
    samples: values.length,
    mean: stats.mean,
    stdDev: stats.stdDev,
    cpk: stats.cpk ?? undefined,
  };
}

/**
 * Generate a simple hash from the filter stack for expiry detection.
 * Uses factor+values to detect when the analysis state has changed.
 */
export function hashFilterStack(stack: FilterAction[]): string {
  const key = stack
    .filter(a => a.type === 'filter' && a.factor)
    .map(a => `${a.factor}:${a.values.join(',')}`)
    .join('|');
  // djb2 hash
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * Generate a unique proposal ID.
 */
export function generateProposalId(): string {
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Check if a proposal is a duplicate of an existing pending proposal.
 */
export function isDuplicateProposal(
  existing: ActionProposal[],
  tool: ActionToolName,
  params: Record<string, unknown>
): boolean {
  const paramsKey = JSON.stringify(params);
  return existing.some(
    p => p.status === 'pending' && p.tool === tool && JSON.stringify(p.params) === paramsKey
  );
}
