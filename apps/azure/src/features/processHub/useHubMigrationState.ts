import { useCallback, useMemo, useState } from 'react';
import { useB0AnalyzesInHub, type UseB0AnalyzesInHubResult } from '@variscout/hooks';
import type {
  ProcessStepCapabilityMember,
  ProcessStepCapabilityMemberMetadata,
  ProcessMap,
} from '@variscout/core';
import { suggestNodeMappings } from '@variscout/core/stats';
import type { ProductionLineGlanceMigrationModalEntry } from '@variscout/ui';

export interface UseHubMigrationStateInput {
  hubId: string;
  members: readonly ProcessStepCapabilityMember[];
  canonicalMap?: ProcessMap;
  persistInvestigation: (next: ProcessStepCapabilityMember) => void;
}

export interface UseHubMigrationStateResult extends UseB0AnalyzesInHubResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalEntries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>;
  handleSave: (
    mappings: ReadonlyArray<{ investigationId: string; nodeId: string; measurementColumn: string }>
  ) => void;
  handleDecline: (investigationId: string) => void;
}

export function useHubMigrationState(input: UseHubMigrationStateInput): UseHubMigrationStateResult {
  const { hubId, members, canonicalMap, persistInvestigation } = input;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const b0 = useB0AnalyzesInHub({ hubId, members });

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const modalEntries = useMemo<ProductionLineGlanceMigrationModalEntry[]>(
    () =>
      b0.unmapped.map(inv => {
        // CS-P2 seam: the portfolio source carries no rows, so no dataset
        // columns are reachable here; the editor's live rawData wires in at lift.
        const cols: string[] = [];
        const engineSuggestions = canonicalMap ? suggestNodeMappings(canonicalMap, cols) : [];
        const suggestions = engineSuggestions.map(s => {
          const node = canonicalMap?.nodes.find(n => n.id === s.nodeId);
          return { nodeId: s.nodeId, label: node?.name ?? s.nodeId, confidence: 1.0 };
        });
        const measurementColumn = engineSuggestions[0]?.measurementColumn ?? '';
        return {
          investigationId: inv.id,
          investigationName: inv.name,
          measurementColumn,
          suggestions,
        };
      }),
    [b0.unmapped, canonicalMap]
  );

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
        const existing = inv.metadata;
        const meta: ProcessStepCapabilityMemberMetadata = existing
          ? { ...existing, processHubId: hubId }
          : { processHubId: hubId };
        const next: ProcessStepCapabilityMember = {
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
      const existing = inv.metadata;
      const meta: ProcessStepCapabilityMemberMetadata = existing
        ? { ...existing, processHubId: hubId }
        : { processHubId: hubId };
      const next: ProcessStepCapabilityMember = {
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
