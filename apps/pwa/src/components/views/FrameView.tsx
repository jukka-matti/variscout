/**
 * FrameView — PWA FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The PWA shell only
 * reads app/store state and wires the app-specific Analysis navigation.
 */
import React from 'react';
import { CanvasWorkspace } from '@variscout/ui';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import type { CanvasInvestigationFocus } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const suspectedCauses = useInvestigationStore(s => s.suspectedCauses);
  const causalLinks = useInvestigationStore(s => s.causalLinks);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleQuickAction = React.useCallback(() => {
    usePanelsStore.getState().showImprovement();
  }, []);

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showInvestigation();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasInvestigationFocus) => {
    if (focus.questionId)
      useInvestigationFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showInvestigation();
  }, []);

  return (
    <CanvasWorkspace
      rawData={rawData}
      outcome={outcome}
      factors={factors}
      setOutcome={setOutcome}
      setFactors={setFactors}
      measureSpecs={measureSpecs}
      setMeasureSpec={setMeasureSpec}
      processContext={processContext}
      setProcessContext={setProcessContext}
      onSeeData={handleSeeData}
      onQuickAction={handleQuickAction}
      onFocusedInvestigation={handleFocusedInvestigation}
      findings={findings}
      questions={questions}
      suspectedCauses={suspectedCauses}
      causalLinks={causalLinks}
      onOpenInvestigationFocus={handleOpenInvestigationFocus}
    />
  );
};

export default FrameView;
