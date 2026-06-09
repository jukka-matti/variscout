import type {
  DataRow,
  ProcessHub,
  ProcessStepCapabilityMember,
  ProcessStepCapabilitySource,
} from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export interface BuildEditorCapabilitySourceInput {
  hubId: string;
  hubName: string;
  processMap: ProcessMap | null | undefined;
  workspaceProject: ImprovementProject | null | undefined;
  rows: readonly DataRow[];
}

export interface EditorCapabilitySource extends ProcessStepCapabilitySource {
  rowsByAnalyze: ReadonlyMap<string, readonly DataRow[]>;
}

export function buildEditorCapabilitySource({
  hubId,
  hubName,
  processMap,
  workspaceProject,
  rows,
}: BuildEditorCapabilitySourceInput): EditorCapabilitySource {
  const hub: ProcessHub = {
    id: hubId,
    name: hubName,
    createdAt: 0,
    deletedAt: null,
    ...(processMap ? { canonicalProcessMap: processMap } : {}),
  };

  if (!processMap || !workspaceProject) {
    return {
      hub,
      members: [],
      rowsByAnalyze: new Map(),
    };
  }

  const nodeMappings = processMap.nodes
    .filter(node => typeof node.ctqColumn === 'string' && node.ctqColumn.trim().length > 0)
    .map(node => ({
      nodeId: node.id,
      measurementColumn: node.ctqColumn!,
    }));

  const member: ProcessStepCapabilityMember = {
    id: workspaceProject.id,
    name: workspaceProject.metadata.title,
    metadata: {
      processHubId: hubId,
      nodeMappings,
    },
  };

  return {
    hub,
    members: [member],
    rowsByAnalyze: new Map([[workspaceProject.id, rows]]),
  };
}
