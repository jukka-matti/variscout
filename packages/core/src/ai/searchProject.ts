import type { Finding, Hypothesis } from '../findings';

export interface SearchProjectOptions {
  query: string;
  findings: Finding[];
  hypotheses: Hypothesis[];
  artifactType?: 'finding' | 'hypothesis' | 'idea' | 'action' | 'all';
  findingStatus?: string;
  hypothesisStatus?: string;
}

export interface SearchResult {
  type: 'finding' | 'hypothesis' | 'idea' | 'action';
  id: string;
  text: string;
  status: string;
  etaSquared?: number;
  factor?: string;
  linkedFindingCount?: number;
  childCount?: number;
  tag?: 'key-driver' | 'low-impact';
  filterContext?: string;
  parentHypothesisText?: string;
  timeframe?: string;
  dueDate?: string;
  completed?: boolean;
  parentFindingText?: string;
  createdAt?: number;
}

const MAX_RESULTS = 5;

export function searchProjectArtifacts(options: SearchProjectOptions): SearchResult[] {
  const {
    query,
    findings,
    hypotheses,
    artifactType = 'all',
    findingStatus,
    hypothesisStatus,
  } = options;

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search findings
  if (artifactType === 'all' || artifactType === 'finding') {
    for (const f of findings) {
      if (findingStatus && findingStatus !== 'any' && f.status !== findingStatus) continue;
      if (q && !f.text.toLowerCase().includes(q)) continue;
      results.push({
        type: 'finding',
        id: f.id,
        text: f.text,
        status: f.status,
        tag: f.tag,
        filterContext: formatFilterContext(f.context?.activeFilters),
        createdAt: new Date(f.createdAt).getTime(),
      });
    }
  }

  // Search hypotheses (suspected causes)
  if (artifactType === 'all' || artifactType === 'hypothesis') {
    for (const hypothesis of hypotheses) {
      if (hypothesisStatus && hypothesisStatus !== 'any' && hypothesis.status !== hypothesisStatus)
        continue;
      if (q && !hypothesis.name.toLowerCase().includes(q)) continue;
      results.push({
        type: 'hypothesis',
        id: hypothesis.id,
        text: hypothesis.name,
        status: hypothesis.status,
        linkedFindingCount: hypothesis.findingIds?.length ?? 0,
        createdAt: new Date(hypothesis.createdAt).getTime(),
      });
    }
  }

  // Search improvement ideas (nested in hypotheses)
  if (artifactType === 'all' || artifactType === 'idea') {
    for (const hypothesis of hypotheses) {
      for (const idea of hypothesis.ideas ?? []) {
        if (q && !idea.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'idea',
          id: idea.id,
          text: idea.text,
          status: 'idea',
          timeframe: idea.timeframe,
          parentHypothesisText: hypothesis.name,
          createdAt: new Date(hypothesis.createdAt).getTime(),
        });
      }
    }
  }

  // Search actions (nested in findings)
  if (artifactType === 'all' || artifactType === 'action') {
    for (const finding of findings) {
      for (const action of finding.actions ?? []) {
        if (q && !action.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'action',
          id: action.id,
          text: action.text,
          status: action.completedAt ? 'completed' : 'open',
          completed: !!action.completedAt,
          dueDate: action.dueDate,
          parentFindingText: finding.text,
          createdAt: new Date(finding.createdAt).getTime(),
        });
      }
    }
  }

  // Sort: exact match > starts-with > contains, then by recency (entity-agnostic)
  results.sort((a, b) => {
    if (!q) return 0;
    const aLower = a.text.toLowerCase();
    const bLower = b.text.toLowerCase();
    const aExact = aLower === q;
    const bExact = bLower === q;
    if (aExact !== bExact) return aExact ? -1 : 1;
    const aStarts = aLower.startsWith(q);
    const bStarts = bLower.startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    const aTime = a.createdAt ?? 0;
    const bTime = b.createdAt ?? 0;
    return bTime - aTime; // newest first
  });

  return results.slice(0, MAX_RESULTS);
}

function formatFilterContext(filters?: Record<string, (string | number)[]>): string | undefined {
  if (!filters) return undefined;
  const parts = Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([factor, values]) => `${factor} → ${values.join(', ')}`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}
