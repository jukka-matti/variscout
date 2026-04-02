import React, { useState, useCallback, useEffect } from 'react';
import {
  Check,
  X,
  Filter,
  FileText,
  GitBranch,
  Zap,
  Share2,
  FileUp,
  Bell,
  Lightbulb,
  BookmarkPlus,
  Navigation,
  CircleCheck,
} from 'lucide-react';
import type { ActionProposal, ActionToolName, ProposalStatus, Locale } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { useTranslation } from '@variscout/hooks';

export interface ActionProposalCardProps {
  proposal: ActionProposal;
  onExecute: (proposal: ActionProposal, editedText?: string) => void;
  onDismiss: (proposalId: string) => void;
  /** ADR-050 visual grounding: auto-highlight relevant chart element on render */
  onHighlight?: (targetType: string, targetId?: string) => void;
}

/** Tool display config — labels resolved via t() at render time */
const TOOL_CONFIG: Record<
  ActionToolName,
  {
    labelKey: keyof import('@variscout/core').MessageCatalog;
    icon: React.ElementType;
    editable: boolean;
  }
> = {
  apply_filter: { labelKey: 'ai.tool.applyFilter', icon: Filter, editable: false },
  clear_filters: { labelKey: 'ai.tool.clearFilters', icon: Filter, editable: false },
  switch_factor: { labelKey: 'ai.tool.switchFactor', icon: Filter, editable: false },
  create_finding: { labelKey: 'ai.tool.createFinding', icon: FileText, editable: true },
  create_question: { labelKey: 'ai.tool.createQuestion', icon: GitBranch, editable: true },
  suggest_action: { labelKey: 'ai.tool.suggestAction', icon: Zap, editable: true },
  suggest_improvement_idea: { labelKey: 'ai.tool.suggestIdea', icon: Lightbulb, editable: true },
  suggest_save_finding: {
    labelKey: 'ai.tool.suggestSaveFinding',
    icon: BookmarkPlus,
    editable: true,
  },
  share_finding: { labelKey: 'ai.tool.shareFinding', icon: Share2, editable: false },
  publish_report: { labelKey: 'ai.tool.publishReport', icon: FileUp, editable: false },
  notify_action_owners: { labelKey: 'ai.tool.notifyOwners', icon: Bell, editable: false },
  navigate_to: { labelKey: 'ai.tool.navigateTo', icon: Navigation, editable: false },
  answer_question: { labelKey: 'ai.tool.answerQuestion', icon: CircleCheck, editable: true },
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

    case 'create_question': {
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

    case 'suggest_improvement_idea': {
      if (preview.questionText)
        lines.push(`Question: "${(preview.questionText as string).slice(0, 60)}..."`);
      if (preview.direction) {
        const directionLabels: Record<string, string> = {
          prevent: 'Prevent (stop the cause)',
          detect: 'Detect (catch it sooner)',
          simplify: 'Simplify (reduce complexity)',
          eliminate: 'Eliminate (remove the step)',
        };
        lines.push(
          `Direction: ${directionLabels[preview.direction as string] ?? preview.direction}`
        );
      }
      if (params.timeframe || preview.timeframe) {
        const timeframe = (params.timeframe ?? preview.timeframe) as string;
        const timeframeLabels: Record<string, string> = {
          'just-do': 'Just Do \u2014 immediate, no approval needed',
          days: 'Days \u2014 quick turnaround',
          weeks: 'Weeks \u2014 some coordination needed',
          months: 'Months \u2014 significant planning required',
        };
        lines.push(`Timeframe: ${timeframeLabels[timeframe] ?? timeframe}`);
      }
      if (params.cost || preview.cost) {
        const cost = (params.cost ?? preview.cost) as string;
        const costLabels: Record<string, string> = {
          none: 'None \u2014 no additional cost',
          low: 'Low \u2014 minor budget, within team authority',
          medium: 'Medium \u2014 requires budget approval',
          high: 'High \u2014 capital investment, executive approval',
        };
        lines.push(`Cost: ${costLabels[cost] ?? cost}`);
      }
      if (params.risk_axis1 != null && params.risk_axis2 != null) {
        lines.push(
          `Risk: Process ${params.risk_axis1} \u00d7 Safety ${params.risk_axis2} (suggested)`
        );
      }
      if (typeof preview.existingIdeasCount === 'number' && preview.existingIdeasCount > 0) {
        lines.push(
          `${preview.existingIdeasCount} existing idea${preview.existingIdeasCount !== 1 ? 's' : ''}`
        );
      }
      break;
    }

    case 'suggest_save_finding': {
      if (preview.suggestedQuestionText)
        lines.push(`Related: "${(preview.suggestedQuestionText as string).slice(0, 60)}..."`);
      if (preview.contextSnapshot) {
        const snap = preview.contextSnapshot as Record<string, unknown>;
        if (snap.cpk !== undefined) lines.push(`Cpk=${formatNum(snap.cpk as number)}`);
      }
      break;
    }

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

function formatNum(n: number, locale: Locale = 'en'): string {
  return formatStatistic(n, locale, 2);
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
  onHighlight,
}) => {
  const { t } = useTranslation();
  const config = TOOL_CONFIG[proposal.tool];
  const Icon = config.icon;
  const isPending = proposal.status === 'pending';
  const isEditable = config.editable && isPending;
  const [editText, setEditText] = useState(proposal.editableText ?? '');

  // Auto-highlight relevant chart element on mount (ADR-050)
  useEffect(() => {
    if (!onHighlight) return;
    const toolName = proposal.tool;
    if (toolName === 'apply_filter' && proposal.params.value) {
      onHighlight('boxplot', String(proposal.params.value));
    } else if (toolName === 'switch_factor') {
      onHighlight('boxplot');
    } else if (toolName === 'create_finding' || toolName === 'suggest_save_finding') {
      onHighlight('finding');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

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
        <span className="text-[0.6875rem] font-medium text-content-secondary">
          CoScout suggests: {t(config.labelKey)}
        </span>
        {proposal.status === 'applied' && <Check size={10} className="text-green-400 ml-auto" />}
        {proposal.status === 'expired' && (
          <span className="text-[0.5625rem] text-amber-400 ml-auto">{t('ai.expired')}</span>
        )}
      </div>

      {/* Editable text */}
      {isEditable && (
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          className="w-full text-[0.6875rem] text-content bg-surface border border-edge rounded p-2 mb-2 resize-none focus:outline-none focus:border-blue-500"
          rows={2}
          data-testid={`action-proposal-edit-${proposal.id}`}
        />
      )}

      {/* Preview lines */}
      {previewLines.length > 0 && (
        <div className="text-[0.625rem] text-content-muted space-y-0.5 mb-2">
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
            className="flex items-center gap-1 px-2.5 py-1 text-[0.6875rem] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            data-testid={`action-proposal-apply-${proposal.id}`}
          >
            <Check size={10} />
            {t('action.apply')}
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1 px-2.5 py-1 text-[0.6875rem] text-content-muted hover:text-content-secondary rounded hover:bg-surface-tertiary transition-colors"
            data-testid={`action-proposal-dismiss-${proposal.id}`}
          >
            <X size={10} />
            Dismiss
          </button>
        </div>
      )}

      {/* Applied state */}
      {proposal.status === 'applied' && (
        <div className="text-[0.625rem] text-green-400 flex items-center gap-1">
          <Check size={10} />
          {t('ai.applied')}
        </div>
      )}

      {/* Dismissed state */}
      {proposal.status === 'dismissed' && (
        <div className="text-[0.625rem] text-content-muted">{t('ai.dismissed')}</div>
      )}
    </div>
  );
};

export { ActionProposalCard };
