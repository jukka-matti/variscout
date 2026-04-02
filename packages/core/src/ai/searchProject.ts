import type { Finding, Question } from '../findings';

export interface SearchProjectOptions {
  query: string;
  findings: Finding[];
  questions: Question[];
  artifactType?: 'finding' | 'question' | 'idea' | 'action' | 'all';
  findingStatus?: string;
  questionStatus?: string;
}

export interface SearchResult {
  type: 'finding' | 'question' | 'idea' | 'action';
  id: string;
  text: string;
  status: string;
  etaSquared?: number;
  factor?: string;
  linkedFindingCount?: number;
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
  childCount?: number;
  tag?: 'key-driver' | 'low-impact';
  filterContext?: string;
  parentQuestionText?: string;
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
    questions,
    artifactType = 'all',
    findingStatus,
    questionStatus,
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
        createdAt: f.createdAt,
      });
    }
  }

  // Search questions
  if (artifactType === 'all' || artifactType === 'question') {
    for (const question of questions) {
      if (questionStatus && questionStatus !== 'any' && question.status !== questionStatus)
        continue;
      if (q && !question.text.toLowerCase().includes(q)) continue;
      results.push({
        type: 'question',
        id: question.id,
        text: question.text,
        status: question.status,
        factor: question.factor,
        linkedFindingCount: question.linkedFindingIds?.length ?? 0,
        causeRole: question.causeRole,
        childCount: 0,
        createdAt: new Date(question.createdAt).getTime(),
      });
    }
  }

  // Search improvement ideas (nested in questions)
  if (artifactType === 'all' || artifactType === 'idea') {
    for (const question of questions) {
      for (const idea of question.ideas ?? []) {
        if (q && !idea.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'idea',
          id: idea.id,
          text: idea.text,
          status: idea.selected ? 'selected' : 'proposed',
          parentQuestionText: question.text,
          timeframe: idea.timeframe,
          createdAt: new Date(question.createdAt).getTime(),
        });
      }
    }
  }

  // Search actions (nested in findings)
  if (artifactType === 'all' || artifactType === 'action') {
    for (const f of findings) {
      for (const action of f.actions ?? []) {
        if (q && !action.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'action',
          id: action.id,
          text: action.text,
          status: action.completedAt ? 'completed' : 'pending',
          completed: !!action.completedAt,
          dueDate: action.dueDate,
          parentFindingText: f.text,
          createdAt: f.createdAt,
        });
      }
    }
  }

  // Sort: exact match > starts-with > contains, then by recency
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
