import { useCallback, useState } from 'react';
import { useB0InvestigationsInHub, type UseB0InvestigationsInHubResult } from '@variscout/hooks';
import type {
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
  ProcessMap,
} from '@variscout/core';
import { suggestNodeMappings } from '@variscout/core/stats';
import type { ProductionLineGlanceMigrationModalEntry } from '@variscout/ui';

export interface UseHubMigrationStateInput {
  hubId: string;
  members: readonly ProcessHubInvestigation[];
  canonicalMap?: ProcessMap;
  persistInvestigation: (next: ProcessHubInvestigation) => void;
}

export interface UseHubMigrationStateResult extends UseB0InvestigationsInHubResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalEntries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>;
  handleSave: (
    mappings: ReadonlyArray<{ investigationId: string; nodeId: string; measurementColumn: string }>
  ) => void;
  handleDecline: (investigationId: string) => void;
}

function getDatasetColumns(inv: ProcessHubInvestigation): string[] {
  const rows = (inv as { rows?: ReadonlyArray<Record<string, unknown>> }).rows ?? [];
  if (rows.length === 0) return [];
  const cols = new Set<string>();
  for (const row of rows.slice(0, 10)) {
    for (const k of Object.keys(row)) cols.add(k);
  }
  return [...cols];
}

export function useHubMigrationState(input: UseHubMigrationStateInput): UseHubMigrationStateResult {
  const { hubId, members, canonicalMap, persistInvestigation } = input;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const b0 = useB0InvestigationsInHub({ hubId, members });

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const modalEntries = b0.unmapped.map<ProductionLineGlanceMigrationModalEntry>(inv => {
    const cols = getDatasetColumns(inv);
    const engineSuggestions = canonicalMap ? suggestNodeMappings(canonicalMap, cols) : [];
    const suggestions = engineSuggestions.map(s => {
      const node = canonicalMap?.nodes.find(n => n.id === s.nodeId);
      return {
        nodeId: s.nodeId,
        label: node?.name ?? s.nodeId,
        confidence: 1.0,
      };
    });
    // First suggestion's column, or empty string if none
    const measurementColumn = engineSuggestions[0]?.measurementColumn ?? '';
    return {
      investigationId: inv.id,
      investigationName: inv.name,
      measurementColumn,
      suggestions,
    };
  });

  const handleSave = useCallback(
    (
      mappings: ReadonlyArray<{
        investigationId: string;
        nodeId: string;
        measurementColumn: string;
      }>
    ) => {
      const byId = new Map(mappings.map(m => [m.investigationId, m]));
      for (const inv of members) {
        const m = byId.get(inv.id);
        if (!m) continue;
        const existing = (inv as { metadata?: ProcessHubInvestigationMetadata }).metadata;
        const meta: ProcessHubInvestigationMetadata = existing
          ? { ...existing, processHubId: hubId }
          : { processHubId: hubId };
        const next: ProcessHubInvestigation = {
          ...inv,
          metadata: {
            ...meta,
            nodeMappings: [{ nodeId: m.nodeId, measurementColumn: m.measurementColumn }],
          },
        };
        persistInvestigation(next);
      }
      setIsModalOpen(false);
    },
    [hubId, members, persistInvestigation]
  );

  const handleDecline = useCallback(
    (investigationId: string) => {
      const inv = members.find(m => m.id === investigationId);
      if (!inv) return;
      const existing = (inv as { metadata?: ProcessHubInvestigationMetadata }).metadata;
      const meta: ProcessHubInvestigationMetadata = existing
        ? { ...existing, processHubId: hubId }
        : { processHubId: hubId };
      const next: ProcessHubInvestigation = {
        ...inv,
        metadata: {
          ...meta,
          migrationDeclinedAt: new Date().toISOString(),
        },
      };
      persistInvestigation(next);
    },
    [hubId, members, persistInvestigation]
  );

  return {
    ...b0,
    isModalOpen,
    openModal,
    closeModal,
    modalEntries,
    handleSave,
    handleDecline,
  };
}
