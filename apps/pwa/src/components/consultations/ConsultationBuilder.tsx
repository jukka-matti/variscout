/**
 * CL-5b: ConsultationBuilder
 *
 * The analyst-facing composer for a single "active" consultation. It:
 *   - creates an active consultation on first mount (when none exists),
 *   - lets the analyst edit the title + add/remove/edit questions
 *     (each question may carry an anchor, e.g. a finding from "Ask an expert"),
 *   - shows a read-only summary of the views the pack will include
 *     (the caller resolves these via `resolveConsultationViews`),
 *   - exports the pack (gated dynamic import of `exportConsultationPack`) and
 *     marks the consultation `sent`,
 *   - imports an expert response file and feeds it to `importResponse`.
 *
 * Mounted in the Analyze tab alongside `ConsultationReviewPanel` (CL-5b §3).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Upload, Send } from 'lucide-react';
import { useAnalyzeStore } from '@variscout/stores';
import { useTranslation } from '@variscout/hooks';
import type { ResolvedView } from '@variscout/ui';
import type { Consultation } from '@variscout/core/consultations';
import { importConsultationResponseFile } from '../../consultations/importConsultationResponse';

// The same artifact gate App.tsx uses (App.tsx:119). Computed locally to avoid
// deep prop-drilling; the actual export is a gated dynamic import.
declare const __WORKSPACE_ARTIFACTS__: boolean;
const artifactControlsEnabled =
  (typeof __WORKSPACE_ARTIFACTS__ !== 'undefined' && __WORKSPACE_ARTIFACTS__) ||
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITEST === 'true';

export interface ConsultationBuilderProps {
  /**
   * The views the pack will include, resolved by the caller from current
   * analysis data via `resolveConsultationViews`.
   */
  resolvedViews: ResolvedView[];
  /**
   * Optional id of an already-active consultation (e.g. seeded by the
   * "Ask an expert" entry). When omitted, the builder creates one on mount.
   */
  activeConsultationId?: string;
}

export const ConsultationBuilder: React.FC<ConsultationBuilderProps> = ({
  resolvedViews,
  activeConsultationId,
}) => {
  const { t } = useTranslation();

  const consultations = useAnalyzeStore(s => s.consultations);
  const createConsultation = useAnalyzeStore(s => s.createConsultation);
  const addConsultationQuestion = useAnalyzeStore(s => s.addConsultationQuestion);
  const markConsultationSent = useAnalyzeStore(s => s.markConsultationSent);

  const [localId, setLocalId] = useState<string | undefined>(activeConsultationId);

  // Resolve the working consultation: the explicit prop wins, else our local id.
  const consultation: Consultation | undefined = useMemo(() => {
    const id = activeConsultationId ?? localId;
    return consultations.find(c => c.id === id);
  }, [consultations, activeConsultationId, localId]);

  // Create an active consultation on first mount when neither prop nor store has one.
  useEffect(() => {
    if (activeConsultationId) return; // caller owns the id
    if (localId && consultations.some(c => c.id === localId)) return;
    const created = createConsultation('');
    setLocalId(created.id);
    // createConsultation is store-stable; consultations is read fresh each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConsultationId]);

  const importInputRef = useRef<HTMLInputElement>(null);

  if (!consultation) {
    // Brief gap between mount effect and the next render — render the shell.
    return (
      <div
        data-testid="consultation-builder-panel"
        className="flex flex-col bg-surface-secondary border-l border-edge overflow-y-auto"
      />
    );
  }

  const consultationId = consultation.id;

  const handleAddQuestion = () => {
    addConsultationQuestion(consultationId, '');
  };

  const handleRemoveQuestion = (questionId: string) => {
    useAnalyzeStore.setState(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? { ...c, questions: c.questions.filter(q => q.id !== questionId) }
          : c
      ),
    }));
  };

  const handleEditQuestionText = (questionId: string, text: string) => {
    useAnalyzeStore.setState(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              questions: c.questions.map(q => (q.id === questionId ? { ...q, text } : q)),
            }
          : c
      ),
    }));
  };

  const handleEditTitle = (title: string) => {
    useAnalyzeStore.setState(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId ? { ...c, title } : c
      ),
    }));
  };

  const handleExport = async () => {
    if (!artifactControlsEnabled) return;
    const latest = useAnalyzeStore.getState().consultations.find(c => c.id === consultationId);
    if (!latest) return;
    const { exportConsultationPack } = await import('@pwa-artifacts');
    exportConsultationPack({
      consultation: latest,
      views: resolvedViews,
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
    });
    markConsultationSent(consultationId);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-selecting the same file fires change
    if (!file) return;
    const latest = useAnalyzeStore.getState().consultations.find(c => c.id === consultationId);
    if (!latest) return;
    try {
      const parsed = await importConsultationResponseFile(file, latest);
      useAnalyzeStore.getState().importResponse(consultationId, {
        source: 'typed',
        respondentLabel: parsed.respondentLabel,
        rawArtifactRef: file.name,
        insights: parsed.insights,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.alert(t('consultation.builder.importError').replace('{error}', message));
    }
  };

  return (
    <div
      data-testid="consultation-builder-panel"
      className="flex flex-col bg-surface-secondary border-l border-edge overflow-y-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <h2 className="text-sm font-semibold text-content mb-2">
          {t('consultation.builder.title')}
        </h2>
        <label className="block text-xs text-content-secondary mb-1">
          {t('consultation.builder.titleLabel')}
        </label>
        <input
          type="text"
          value={consultation.title}
          onChange={e => handleEditTitle(e.target.value)}
          placeholder={t('consultation.builder.titlePlaceholder')}
          data-testid="consultation-title-input"
          className="w-full text-sm text-content bg-surface border border-edge rounded px-2 py-1"
        />
      </div>

      {/* Questions */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-content-secondary">
            {t('consultation.builder.questions')}
          </span>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-1 rounded border border-edge px-2 py-0.5 text-xs text-content-secondary hover:text-content"
          >
            <Plus size={12} />
            {t('consultation.builder.addQuestion')}
          </button>
        </div>

        {consultation.questions.map(q => (
          <div key={q.id} className="mb-2">
            <div className="flex items-start gap-1">
              <input
                type="text"
                value={q.text}
                onChange={e => handleEditQuestionText(q.id, e.target.value)}
                placeholder={t('consultation.builder.questionPlaceholder')}
                className="flex-1 text-sm text-content bg-surface border border-edge rounded px-2 py-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveQuestion(q.id)}
                aria-label={t('consultation.builder.removeQuestion')}
                className="p-1 rounded text-content-muted hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
            {q.anchor?.kind === 'finding' && (
              <p className="text-[0.625rem] text-content-muted mt-0.5 pl-1">
                {t('consultation.builder.anchoredToFinding')}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Views included */}
      <div className="px-4 py-3 border-b border-edge">
        <span className="text-xs font-medium text-content-secondary">
          {t('consultation.builder.viewsIncluded')}
        </span>
        {resolvedViews.length === 0 ? (
          <p className="text-xs text-content-muted mt-1">{t('consultation.builder.noViews')}</p>
        ) : (
          <ul className="mt-1 space-y-1" data-testid="consultation-views-summary">
            {resolvedViews.map((v, i) => (
              <li key={i} className="text-xs text-content">
                {v.kind === 'condition' ? (
                  <>
                    <span className="font-medium">{v.label}</span>
                    <span className="text-content-muted"> · {v.statsText}</span>
                  </>
                ) : (
                  <span className="font-medium">{v.title}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {/* TODO(CL-5): add chart views — condition view ships reliably; I-Chart
            / boxplot series plumbing is deferred to a follow-up. */}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1 flex-1 justify-center rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
        >
          <Send size={12} />
          {t('consultation.builder.exportPack')}
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="flex items-center gap-1 rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:text-content"
        >
          <Upload size={12} />
          {t('consultation.builder.importResponse')}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".md,.json,.txt"
          onChange={handleImportFile}
          data-testid="consultation-import-input"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ConsultationBuilder;
