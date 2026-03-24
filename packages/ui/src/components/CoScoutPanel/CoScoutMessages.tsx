import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, ExternalLink, AlertTriangle, Bookmark } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { CoScoutMessage, CoScoutError, ActionProposal } from '@variscout/core';
import { parseActionMarkers, stripActionMarkers } from '@variscout/core';
import { ActionProposalCard } from './ActionProposalCard';
import { SaveInsightDialog } from './SaveInsightDialog';

/**
 * Parse [Source: name] markers in assistant text and render as styled inline badges.
 * Only applied to assistant messages. User messages pass through unchanged.
 */
function renderWithSourceBadges(text: string): React.ReactNode {
  const SOURCE_REGEX = /\[Source:\s*([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SOURCE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`source-${match.index}`}
        className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 text-[9px] font-medium mx-0.5"
      >
        {match[1].trim()}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export interface KnowledgeDocumentResult {
  title: string;
  snippet: string;
  source: string;
  url?: string;
}

function formatRelativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

/** Check if a message contains keywords suggesting knowledge base search intent. */
function detectKnowledgeIntent(text: string): boolean {
  const INTENT_KEYWORDS = [
    'root cause',
    'sop',
    'procedure',
    'happened before',
    'previous',
    'historical',
    'fault tree',
    '8d',
    'fmea',
    'control plan',
    'work instruction',
    'similar',
    'last time',
    'past report',
    'corrective action',
  ];
  const lower = text.toLowerCase();
  return INTENT_KEYWORDS.some(kw => lower.includes(kw));
}

export interface CoScoutMessagesProps {
  messages: CoScoutMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  onRetry?: () => void;
  knowledgeResultCount?: number;
  /** ADR-026: On-demand knowledge search */
  knowledgeAvailable?: boolean;
  knowledgeSearching?: boolean;
  knowledgeDocuments?: KnowledgeDocumentResult[];
  onSearchKnowledge?: () => void;
  /** Parent can override intent detection (e.g., always show). Falls back to keyword heuristic. */
  knowledgeIntentDetected?: boolean;
  /** Friendly label for the KB search scope (e.g., folder name) */
  knowledgeSearchScope?: string;
  /** Timestamp of last KB search completion */
  knowledgeSearchTimestamp?: number;
  /** Show warning when SharePoint admin consent is missing */
  knowledgePermissionWarning?: boolean;
  /** ADR-029: Action proposals for inline confirmation */
  actionProposals?: ActionProposal[];
  onExecuteAction?: (proposal: ActionProposal, editedText?: string) => void;
  onDismissAction?: (proposalId: string) => void;
  /** ADR-049: Insight capture — save message as finding or comment */
  onSaveAsNewFinding?: (text: string, sourceMessageId: string) => void;
  onAddCommentToFinding?: (findingId: string, text: string) => void;
  onAddCommentToHypothesis?: (hypothesisId: string, text: string) => void;
  /** Existing findings for comment target selection */
  insightFindings?: Array<{ id: string; text: string }>;
  /** Existing hypotheses for comment target selection */
  insightHypotheses?: Array<{ id: string; text: string }>;
}

const CoScoutMessages: React.FC<CoScoutMessagesProps> = ({
  messages,
  isLoading,
  isStreaming,
  onRetry,
  knowledgeResultCount,
  knowledgeAvailable,
  knowledgeSearching,
  knowledgeDocuments,
  onSearchKnowledge,
  knowledgeIntentDetected,
  knowledgeSearchScope,
  knowledgeSearchTimestamp,
  knowledgePermissionWarning,
  actionProposals,
  onExecuteAction,
  onDismissAction,
  onSaveAsNewFinding,
  onAddCommentToFinding,
  onAddCommentToHypothesis,
  insightFindings,
  insightHypotheses,
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [insightDialogMessage, setInsightDialogMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);

  const getTranslatedErrorText = (error: CoScoutError): string => {
    switch (error.type) {
      case 'rate-limit':
        return t('coscout.rateLimit');
      case 'content-filter':
        return t('coscout.contentFilter');
      default:
        return t('coscout.error');
    }
  };

  // Auto-scroll on new messages or streaming content
  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1]?.content : '';
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length, isLoading, lastMessageContent]);

  const showLoadingDots =
    isLoading &&
    (!isStreaming ||
      (isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === ''));

  return (
    <div
      className="flex-1 overflow-y-auto p-3 space-y-3"
      data-testid="coscout-messages"
      role="log"
      aria-live="polite"
    >
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          data-testid={`coscout-message-${index}`}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.error ? (
            <div className="max-w-[90%] bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{getTranslatedErrorText(msg.error)}</p>
              {msg.error.retryable && onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-[11px] text-red-300 hover:text-red-200 underline"
                >
                  {t('action.retry')}
                </button>
              )}
            </div>
          ) : msg.role === 'user' ? (
            <div className="max-w-[85%] group relative">
              <div className="bg-surface-tertiary rounded-lg p-3">
                <p className="text-xs text-content leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
              {onSaveAsNewFinding && (
                <button
                  onClick={() => setInsightDialogMessage({ id: msg.id, text: msg.content })}
                  className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 p-1 text-content-muted hover:text-content transition-opacity"
                  title="Save as insight"
                  aria-label="Save message as insight"
                  data-testid={`bookmark-message-${index}`}
                >
                  <Bookmark size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-[90%] space-y-2 group relative">
              {/* Assistant text with action markers stripped */}
              {(() => {
                const markers = parseActionMarkers(msg.content);
                const cleanText =
                  markers.length > 0 ? stripActionMarkers(msg.content) : msg.content;
                return (
                  <>
                    {cleanText && (
                      <div className="border border-edge rounded-lg p-3">
                        <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-wrap">
                          {renderWithSourceBadges(cleanText)}
                        </p>
                      </div>
                    )}
                    {/* Inline action proposal cards */}
                    {markers.map(marker => {
                      const matchingProposal = actionProposals?.find(
                        p =>
                          p.tool === marker.tool &&
                          JSON.stringify(p.params) === JSON.stringify(marker.params)
                      );
                      if (!matchingProposal || !onExecuteAction || !onDismissAction) return null;
                      return (
                        <ActionProposalCard
                          key={matchingProposal.id}
                          proposal={matchingProposal}
                          onExecute={onExecuteAction}
                          onDismiss={onDismissAction}
                        />
                      );
                    })}
                  </>
                );
              })()}
              {onSaveAsNewFinding && (
                <button
                  onClick={() => setInsightDialogMessage({ id: msg.id, text: msg.content })}
                  className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 p-1 text-content-muted hover:text-content transition-opacity"
                  title="Save as insight"
                  aria-label="Save message as insight"
                  data-testid={`bookmark-message-${index}`}
                >
                  <Bookmark size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Knowledge Base search indicator (legacy — backwards compat) */}
      {knowledgeResultCount != null && knowledgeResultCount > 0 && isLoading && (
        <div className="flex justify-start" data-testid="coscout-knowledge-indicator">
          <div className="text-[10px] text-violet-400 flex items-center gap-1 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
            Searching {knowledgeResultCount} related findings...
          </div>
        </div>
      )}

      {/* ADR-026: On-demand Knowledge Base search button — shown when intent detected or parent overrides */}
      {knowledgeAvailable &&
        !isLoading &&
        !isStreaming &&
        !knowledgeSearching &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === 'assistant' &&
        (!knowledgeDocuments || knowledgeDocuments.length === 0) &&
        (knowledgeIntentDetected ??
          (() => {
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            return lastUserMsg ? detectKnowledgeIntent(lastUserMsg.content) : false;
          })()) && (
          <div className="flex justify-start" data-testid="coscout-knowledge-search-action">
            <button
              onClick={onSearchKnowledge}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors border border-violet-500/20 hover:border-violet-500/40"
            >
              <Search size={12} />
              💡 Search Knowledge Base?
            </button>
          </div>
        )}

      {/* Admin consent warning (Item 4) */}
      {knowledgePermissionWarning && knowledgeAvailable && (
        <div className="flex items-center gap-1 px-3 py-1 text-[10px] text-amber-400">
          <AlertTriangle size={10} />
          SharePoint access unavailable — ask your admin to grant consent
        </div>
      )}

      {/* Knowledge search loading */}
      {knowledgeSearching && (
        <div className="flex justify-start" data-testid="coscout-knowledge-searching">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-violet-400">
            <Loader2 size={12} className="animate-spin" />
            Searching knowledge base…
          </div>
        </div>
      )}

      {/* Knowledge search results */}
      {knowledgeDocuments && knowledgeDocuments.length > 0 && (
        <div className="flex justify-start" data-testid="coscout-knowledge-results">
          <div className="max-w-[90%] space-y-1.5">
            <p className="text-[10px] text-violet-400 font-medium px-1">
              📄 Knowledge Base — {knowledgeDocuments.length} document
              {knowledgeDocuments.length !== 1 ? 's' : ''} found
            </p>
            {(knowledgeSearchScope || knowledgeSearchTimestamp) && (
              <p className="text-[9px] text-content-muted px-1 mt-0.5">
                {knowledgeSearchScope && <>Searched: {knowledgeSearchScope}</>}
                {knowledgeSearchScope && knowledgeSearchTimestamp && <> · </>}
                {knowledgeSearchTimestamp && <>{formatRelativeTime(knowledgeSearchTimestamp)}</>}
              </p>
            )}
            {knowledgeDocuments.slice(0, 5).map((doc, i) => (
              <div key={i} className="border border-violet-500/20 bg-violet-500/5 rounded-lg p-2.5">
                <div className="flex items-start gap-1.5">
                  <FileText size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-violet-300 truncate">{doc.title}</p>
                    <p className="text-[10px] text-content-secondary leading-relaxed mt-0.5 line-clamp-3">
                      {doc.snippet}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] text-content-muted">{doc.source}</span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator — show when loading and not yet streaming content */}
      {showLoadingDots && (
        <div className="flex justify-start" data-testid="coscout-loading-dots">
          <div className="border border-edge rounded-lg p-3">
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Save Insight Dialog */}
      {onSaveAsNewFinding && (
        <SaveInsightDialog
          isOpen={insightDialogMessage !== null}
          messageText={insightDialogMessage?.text ?? ''}
          messageId={insightDialogMessage?.id ?? ''}
          findings={insightFindings}
          hypotheses={insightHypotheses}
          onSaveAsNewFinding={onSaveAsNewFinding}
          onAddCommentToFinding={onAddCommentToFinding}
          onAddCommentToHypothesis={onAddCommentToHypothesis}
          onClose={() => setInsightDialogMessage(null)}
        />
      )}
    </div>
  );
};

export { CoScoutMessages };
