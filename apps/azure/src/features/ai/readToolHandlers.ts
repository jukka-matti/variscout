/**
 * Read tool handlers — auto-execute and return data to CoScout.
 *
 * Pure data queries with no side effects or store mutations.
 */
import type { StatsResult, SpecLimits, DataRow, Finding, Question } from '@variscout/core';
import {
  getEtaSquared,
  groupDataByFactor,
  calculateStats,
  formatKnowledgeContext,
  searchProjectArtifacts,
} from '@variscout/core';
import type { UseKnowledgeSearchReturn } from '@variscout/hooks';
import type { ToolHandlerMap } from '@variscout/core';

export interface ReadToolDeps {
  stats?: StatsResult;
  filteredData: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  questions: Question[];
  factors: string[];
  filters: Record<string, (string | number)[]>;
  knowledgeSearch: UseKnowledgeSearchReturn;
}

export function buildReadToolHandlers({
  stats,
  filteredData,
  outcome,
  specs,
  findings,
  questions,
  factors,
  filters,
  knowledgeSearch,
}: ReadToolDeps): Partial<ToolHandlerMap> {
  return {
    get_chart_data: async (args: Record<string, unknown>) => {
      const chart = args.chart as string;
      if (!stats) return JSON.stringify({ error: 'No data loaded' });
      const data: Record<string, unknown> = { chart, samples: filteredData.length };
      if (chart === 'ichart') {
        data.mean = stats.mean;
        data.ucl = stats.ucl;
        data.lcl = stats.lcl;
        data.stdDev = stats.stdDev;
      } else if (chart === 'boxplot' || chart === 'pareto') {
        data.factors = factors;
        data.filterCount = Object.keys(filters).length;
      } else if (chart === 'capability') {
        data.cpk = stats.cpk;
        data.cp = stats.cp;
        data.mean = stats.mean;
        data.stdDev = stats.stdDev;
      }
      return JSON.stringify(data);
    },

    get_statistical_summary: async () => {
      if (!stats) return JSON.stringify({ error: 'No data loaded' });
      return JSON.stringify({
        mean: stats.mean,
        stdDev: stats.stdDev,
        cpk: stats.cpk,
        cp: stats.cp,
        samples: filteredData.length,
        ucl: stats.ucl,
        lcl: stats.lcl,
      });
    },

    search_knowledge_base: async (args: Record<string, unknown>) => {
      const query = args.query as string;
      if (!query) return JSON.stringify({ error: 'No query provided' });
      const { findings: kbFindings, documents } = await knowledgeSearch.search(query);
      const formatted = formatKnowledgeContext(kbFindings, documents);
      return formatted || JSON.stringify({ results: 0 });
    },

    get_available_factors: async () => {
      if (!filteredData.length) return JSON.stringify({ error: 'No data loaded' });
      const result = factors.map(f => {
        const uniqueVals = [...new Set(filteredData.map(row => String(row[f])))].sort();
        const activeFilter = filters[f] ? filters[f].map(String) : undefined;
        return { name: f, categories: uniqueVals, activeFilter };
      });
      return JSON.stringify({ factors: result });
    },

    compare_categories: async (args: Record<string, unknown>) => {
      const factor = args.factor as string;
      if (!factor || !factors.includes(factor)) {
        return JSON.stringify({
          error: `Unknown factor: ${factor}. Available: ${factors.join(', ')}`,
        });
      }
      if (!outcome || !filteredData.length) {
        return JSON.stringify({ error: 'No data loaded' });
      }

      const groups = groupDataByFactor(filteredData, factor, outcome);
      const categoryStats: Array<{
        name: string;
        mean: number;
        stdDev: number;
        count: number;
        cpk?: number;
      }> = [];

      groups.forEach((values, name) => {
        if (values.length === 0) return;
        const catStats = calculateStats(values, specs?.usl, specs?.lsl);
        categoryStats.push({
          name,
          mean: catStats.mean,
          stdDev: catStats.stdDev,
          count: values.length,
          cpk: catStats.cpk ?? undefined,
        });
      });

      const etaSquared = getEtaSquared(filteredData, factor, outcome);

      return JSON.stringify({
        factor,
        etaSquared: Math.round(etaSquared * 1000) / 1000,
        contributionPct: Math.round(etaSquared * 100),
        categories: categoryStats,
      });
    },

    get_finding_attachment: async (args: Record<string, unknown>) => {
      const findingId = (args as { finding_id: string }).finding_id;
      const finding = findings.find(f => f.id === findingId);
      if (!finding) {
        return JSON.stringify({ error: `Finding ${findingId} not found` });
      }

      const photoAttachments = (finding.comments ?? [])
        .filter(c => c.photos && c.photos.length > 0)
        .flatMap(c =>
          (c.photos ?? []).map(p => ({
            type: 'photo' as const,
            commentText: c.text,
            commentDate: new Date(c.createdAt).toISOString(),
            filename: p.filename,
            uploadStatus: p.uploadStatus,
            hasThumbnail: Boolean(p.thumbnailDataUrl),
          }))
        );

      const fileAttachments = (finding.comments ?? [])
        .filter(c => c.attachments && c.attachments.length > 0)
        .flatMap(c =>
          (c.attachments ?? []).map(a => ({
            type: 'file' as const,
            commentText: c.text,
            commentDate: new Date(c.createdAt).toISOString(),
            filename: a.filename,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            uploadStatus: a.uploadStatus,
          }))
        );

      const allAttachments = [...photoAttachments, ...fileAttachments];

      return JSON.stringify({
        findingId,
        findingText: finding.text,
        attachmentCount: allAttachments.length,
        attachments: allAttachments,
      });
    },

    search_project: async (args: Record<string, unknown>) => {
      const results = searchProjectArtifacts({
        query: (args.query as string) ?? '',
        findings,
        questions,
        artifactType: args.artifact_type as string as
          | 'finding'
          | 'question'
          | 'idea'
          | 'action'
          | 'all'
          | undefined,
        findingStatus: (args.finding_status as string) ?? 'any',
        questionStatus: (args.question_status as string) ?? 'any',
      });
      return JSON.stringify({ results });
    },
  };
}
