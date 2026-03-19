import React, { useState, useCallback } from 'react';
import { Check, X, Filter, FileText, GitBranch, Zap, Share2, FileUp, Bell } from 'lucide-react';
import type { ActionProposal, ActionToolName, ProposalStatus } from '@variscout/core';

export interface ActionProposalCardProps {
  proposal: ActionProposal;
  onExecute: (proposal: ActionProposal, editedText?: string) => void;
  onDismiss: (proposalId: string) => void;
}

/** Tool display config */
const TOOL_CONFIG: Record<
  ActionToolName,
  { label: string; icon: React.ElementType; editable: boolean }
> = {
  apply_filter: { label: 'Apply filter', icon: Filter, editable: false },
  clear_filters: { label: 'Clear all filters', icon: Filter, editable: false },
  switch_factor: { label: 'Switch factor', icon: Filter, editable: false },
  create_finding: { label: 'Record finding', icon: FileText, editable: true },
  create_hypothesis: { label: 'Add hypothesis', icon: GitBranch, editable: true },
  suggest_action: { label: 'Suggest action', icon: Zap, editable: true },
  share_finding: { label: 'Share to Teams', icon: Share2, editable: false },
  publish_report: { label: 'Publish report', icon: FileUp, editable: false },
  notify_action_owners: { label: 'Notify action owners', icon: Bell, editable: false },
};

/** Format preview data for display */
function formatPreview(
  tool: ActionToolName,
  params: Record<string, unknown>,
  preview: Record<string, unknown>
): string[] {
  const lines: string[] = [];

  switch (tool) {
    case 'apply_filter':
      lines.push(`${params.factor} → ${params.value}`);
      if (preview.samples !== undefined) {
        lines.push(`Preview: n=${preview.samples}, mean=${formatNum(preview.mean as number)}`);
        if (preview.cpk !== undefined)
          lines[lines.length - 1] += `, Cpk=${formatNum(preview.cpk as number)}`;
      }
      break;

    case 'clear_filters':
      if (preview.samples !== undefined) {
        lines.push(`Full dataset: n=${preview.samples}, mean=${formatNum(preview.mean as number)}`);
      }
      break;

    case 'switch_factor':
      lines.push(`Switch Boxplot to: ${params.factor}`);
      break;

    case 'create_hypothesis': {
      if (preview.parentText) lines.push(`Under: "${preview.parentText}"`);
      if (preview.predictedStatus) {
        lines.push(`Predicted: ${preview.predictedStatus}`);
        if (preview.etaSquared !== undefined) {
          lines[lines.length - 1] +=
            ` (Contribution ${Math.round((preview.etaSquared as number) * 100)}%)`;
        }
      }
      if (preview.validationType && preview.validationType !== 'data') {
        lines.push(
          `Validation: ${preview.validationType}${preview.validationTask ? ` — ${preview.validationTask}` : ''}`
        );
      }
      break;
    }

    case 'suggest_action':
      if (preview.findingText)
        lines.push(`Finding: "${(preview.findingText as string).slice(0, 60)}..."`);
      if (preview.source) lines.push(`Source: ${preview.source}`);
      break;

    case 'share_finding':
      if (preview.findingText) lines.push(`"${(preview.findingText as string).slice(0, 80)}..."`);
      break;

    case 'notify_action_owners': {
      const actions = preview.actions as
        | Array<{ text: string; assigneeDisplayName?: string }>
        | undefined;
      if (actions) {
        lines.push(`${actions.length} notification${actions.length !== 1 ? 's' : ''}`);
        for (const a of actions.slice(0, 3)) {
          lines.push(`  ${a.assigneeDisplayName ?? 'Unassigned'}: ${a.text.slice(0, 50)}`);
        }
      }
      if ((preview.unassignedCount as number) > 0) {
        lines.push(`${preview.unassignedCount} action(s) without assignee`);
      }
      break;
    }

    default:
      break;
  }

  return lines;
}

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '—';
}

/** Status-specific styling */
function getStatusStyle(status: ProposalStatus): string {
  switch (status) {
    case 'applied':
      return 'border-green-500/30 bg-green-500/5';
    case 'dismissed':
      return 'border-edge/30 bg-surface-tertiary/30 opacity-60';
    case 'expired':
      return 'border-amber-500/30 bg-amber-500/5 opacity-60';
    default:
      return 'border-blue-500/30 bg-blue-500/5';
  }
}

const ActionProposalCard: React.FC<ActionProposalCardProps> = ({
  proposal,
  onExecute,
  onDismiss,
}) => {
  const config = TOOL_CONFIG[proposal.tool];
  const Icon = config.icon;
  const isPending = proposal.status === 'pending';
  const isEditable = config.editable && isPending;
  const [editText, setEditText] = useState(proposal.editableText ?? '');

  const handleApply = useCallback(() => {
    onExecute(proposal, isEditable ? editText : undefined);
  }, [proposal, onExecute, isEditable, editText]);

  const handleDismiss = useCallback(() => {
    onDismiss(proposal.id);
  }, [proposal.id, onDismiss]);

  const previewLines = formatPreview(proposal.tool, proposal.params, proposal.preview);

  return (
    <div
      className={`rounded-lg border p-3 ${getStatusStyle(proposal.status)}`}
      data-testid={`action-proposal-${proposal.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} className="text-blue-400 flex-shrink-0" />
        <span className="text-[11px] font-medium text-content-secondary">
          CoScout suggests: {config.label}
        </span>
        {proposal.status === 'applied' && <Check size={10} className="text-green-400 ml-auto" />}
        {proposal.status === 'expired' && (
          <span className="text-[9px] text-amber-400 ml-auto">Expired</span>
        )}
      </div>

      {/* Editable text */}
      {isEditable && (
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          className="w-full text-[11px] text-content bg-surface border border-edge rounded p-2 mb-2 resize-none focus:outline-none focus:border-blue-500"
          rows={2}
          data-testid={`action-proposal-edit-${proposal.id}`}
        />
      )}

      {/* Preview lines */}
      {previewLines.length > 0 && (
        <div className="text-[10px] text-content-muted space-y-0.5 mb-2">
          {previewLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            data-testid={`action-proposal-apply-${proposal.id}`}
          >
            <Check size={10} />
            Apply
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-content-muted hover:text-content-secondary rounded hover:bg-surface-tertiary transition-colors"
            data-testid={`action-proposal-dismiss-${proposal.id}`}
          >
            <X size={10} />
            Dismiss
          </button>
        </div>
      )}

      {/* Applied state */}
      {proposal.status === 'applied' && (
        <div className="text-[10px] text-green-400 flex items-center gap-1">
          <Check size={10} />
          Applied
        </div>
      )}

      {/* Dismissed state */}
      {proposal.status === 'dismissed' && (
        <div className="text-[10px] text-content-muted">Dismissed</div>
      )}
    </div>
  );
};

export { ActionProposalCard };
