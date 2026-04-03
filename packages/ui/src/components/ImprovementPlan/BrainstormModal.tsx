import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { IdeaDirection } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';
import { useTranslation } from '@variscout/hooks';
import { useIsMobile } from '../../hooks';
import { BrainstormQuadrant } from './BrainstormQuadrant';
import { VoteButton } from './VoteButton';

export interface BrainstormModalProps {
  isOpen: boolean;
  causeName: string;
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
  hmwPrompts: Record<IdeaDirection, string>;
  ideas: BrainstormIdea[];
  onAddIdea: (direction: IdeaDirection, text: string) => void;
  onEditIdea: (ideaId: string, text: string) => void;
  onRemoveIdea: (ideaId: string) => void;
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
  onSparkMore?: () => void;
  coScoutInsight?: string;
  session?: {
    participantCount: number;
    onInvite?: () => void;
    onCopyLink?: () => void;
  };
  voting?: {
    votedByMe: Set<string>;
    onVote: (ideaId: string) => void;
  };
}

const DIRECTIONS: IdeaDirection[] = ['prevent', 'detect', 'simplify', 'eliminate'];

const DIRECTION_LABELS: Record<IdeaDirection, string> = {
  prevent: 'Prevent',
  detect: 'Detect',
  simplify: 'Simplify',
  eliminate: 'Eliminate',
};

export const BrainstormModal: React.FC<BrainstormModalProps> = ({
  isOpen,
  causeName,
  evidence,
  hmwPrompts,
  ideas,
  onAddIdea,
  onEditIdea,
  onRemoveIdea,
  onClose,
  onDone,
  onSparkMore,
  coScoutInsight,
  session,
  voting,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'brainstorm' | 'select'>('brainstorm');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<IdeaDirection>('prevent');
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const ideasByDirection = (d: IdeaDirection) => ideas.filter(i => i.direction === d);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const evidenceText = (() => {
    if (evidence?.rSquaredAdj != null) {
      return `R²adj ${Math.round(evidence.rSquaredAdj * 100)}%`;
    }
    if (evidence?.etaSquared != null) {
      return `η² ${Math.round(evidence.etaSquared * 100)}%`;
    }
    return null;
  })();

  const handleDone = () => {
    onDone(Array.from(selectedIds));
  };

  return (
    <div
      data-testid="brainstorm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-surface flex flex-col w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl border border-edge overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-edge flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-content truncate">{causeName}</span>
              {evidenceText && (
                <span className="text-xs px-2 py-0.5 rounded bg-surface-secondary text-content/60 border border-edge">
                  {evidenceText}
                </span>
              )}
            </div>
            <p className="text-xs text-content/50 mt-0.5">
              {step === 'brainstorm' ? t('brainstorm.subtitle') : t('brainstorm.selectSubtitle')}
            </p>
          </div>
          {session && session.onInvite && (
            <button
              onClick={session.onInvite}
              className="text-xs px-3 py-1.5 rounded bg-surface-secondary border border-edge text-content/70 hover:text-content transition-colors flex-shrink-0"
            >
              {t('brainstorm.inviteTeam')} ({session.participantCount})
            </button>
          )}
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-content/40 hover:text-content transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'brainstorm' ? (
            <div className="p-4 flex flex-col gap-4">
              {isMobile ? (
                <>
                  {/* Mobile: tab bar + single active quadrant */}
                  <div className="flex border-b border-edge -mx-4 px-4">
                    {DIRECTIONS.map(d => (
                      <button
                        key={d}
                        data-testid={`brainstorm-tab-${d}`}
                        onClick={() => setActiveTab(d)}
                        className={`flex-1 py-2 text-center text-xs transition-colors ${
                          activeTab === d
                            ? 'border-b-2 border-blue-400 text-content font-semibold'
                            : 'text-content/40'
                        }`}
                      >
                        <div>{DIRECTION_LABELS[d]}</div>
                        <div className="text-[10px] opacity-50">{ideasByDirection(d).length}</div>
                      </button>
                    ))}
                  </div>
                  <div className="border border-edge rounded-lg bg-surface-secondary overflow-hidden">
                    <BrainstormQuadrant
                      direction={activeTab}
                      hmwPrompt={hmwPrompts[activeTab]}
                      ideas={ideasByDirection(activeTab)}
                      onAddIdea={onAddIdea}
                      onEditIdea={onEditIdea}
                      onRemoveIdea={onRemoveIdea}
                    />
                  </div>
                </>
              ) : (
                /* Desktop: 2×2 grid */
                <div className="grid grid-cols-2 gap-3">
                  {DIRECTIONS.map(direction => (
                    <div
                      key={direction}
                      className="border border-edge rounded-lg bg-surface-secondary overflow-hidden"
                    >
                      <BrainstormQuadrant
                        direction={direction}
                        hmwPrompt={hmwPrompts[direction]}
                        ideas={ideasByDirection(direction)}
                        onAddIdea={onAddIdea}
                        onEditIdea={onEditIdea}
                        onRemoveIdea={onRemoveIdea}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* CoScout insight bar */}
              {coScoutInsight && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-edge text-xs text-content/70">
                  <Sparkles size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>{coScoutInsight}</span>
                </div>
              )}
            </div>
          ) : (
            /* Select step: flat list grouped by direction */
            <div className="p-4 flex flex-col gap-4">
              {DIRECTIONS.map(direction => {
                const dirIdeas = ideasByDirection(direction);
                if (dirIdeas.length === 0) return null;
                return (
                  <div key={direction}>
                    <p className="text-xs font-semibold text-content/50 uppercase tracking-wide mb-2">
                      {DIRECTION_LABELS[direction]}
                    </p>
                    <div className="flex flex-col gap-1">
                      {dirIdeas.map(idea => {
                        const isSelected = selectedIds.has(idea.id);
                        return (
                          <button
                            key={idea.id}
                            onClick={() => toggleSelect(idea.id)}
                            className={`flex items-center gap-3 text-left w-full px-3 py-2 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-amber-400/40 bg-amber-400/10 text-content'
                                : 'border-edge bg-surface-secondary text-content/70 hover:text-content hover:border-edge/70'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-400 text-white'
                                  : 'border-edge/50 bg-transparent'
                              }`}
                              aria-hidden="true"
                            >
                              {isSelected && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            <span className="flex-1 text-sm">{idea.text}</span>
                            {voting && (
                              <span onClick={e => e.stopPropagation()}>
                                <VoteButton
                                  voteCount={idea.voteCount}
                                  votedByMe={voting.votedByMe.has(idea.id)}
                                  onToggle={() => voting.onVote(idea.id)}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-edge flex-shrink-0">
          {step === 'brainstorm' ? (
            <>
              <span className="text-xs text-content/40 flex-1">
                {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
              </span>
              {onSparkMore && (
                <button
                  data-testid="brainstorm-spark-btn"
                  onClick={onSparkMore}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-edge bg-surface-secondary text-content/70 hover:text-content transition-colors"
                >
                  <Sparkles size={12} />
                  {t('brainstorm.sparkMore')}
                </button>
              )}
              <button
                data-testid="brainstorm-done-btn"
                onClick={() => setStep('select')}
                className="text-xs px-4 py-1.5 rounded-lg bg-surface-secondary border border-edge text-content/70 hover:text-content transition-colors"
              >
                {t('brainstorm.doneBrainstorming')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('brainstorm')}
                className="text-xs px-3 py-1.5 rounded-lg border border-edge bg-surface-secondary text-content/70 hover:text-content transition-colors"
              >
                {t('brainstorm.back')}
              </button>
              <span className="text-xs text-content/40 flex-1">{selectedIds.size} selected</span>
              <button
                data-testid="brainstorm-add-btn"
                onClick={handleDone}
                disabled={selectedIds.size === 0}
                className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedIds.size > 0 ? selectedIds.size : ''} to plan →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
