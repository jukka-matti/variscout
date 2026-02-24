/**
 * RegressionPanel - Wrapper for RegressionPanelBase with PWA context
 */
import React from 'react';
import {
  RegressionPanelBase,
  SimpleRegressionView,
  AdvancedRegressionView,
  ExpandedScatterModal,
} from '@variscout/ui';
import type { MultiRegressionResult } from '@variscout/core';
import { useData } from '../context/DataContext';

interface RegressionPanelProps {
  /** External predictors to pre-populate in Advanced mode */
  initialPredictors?: string[];
  /** Factors from investigation for suggestion banner */
  investigationFactors?: string[];
  /** Callback to navigate to What-If with model data */
  onNavigateToWhatIf?: (model: MultiRegressionResult) => void;
}

const RegressionPanel: React.FC<RegressionPanelProps> = ({
  initialPredictors,
  investigationFactors,
  onNavigateToWhatIf,
}) => {
  const { filteredData, outcome, specs, rawData } = useData();

  return (
    <RegressionPanelBase
      filteredData={filteredData}
      outcome={outcome}
      specs={specs}
      renderSimpleView={props => <SimpleRegressionView {...props} />}
      renderAdvancedView={props => <AdvancedRegressionView {...props} />}
      renderExpandedModal={props => <ExpandedScatterModal {...props} />}
      initialPredictors={initialPredictors}
      investigationFactors={investigationFactors}
      onNavigateToWhatIf={onNavigateToWhatIf}
      totalRowCount={rawData.length}
    />
  );
};

export default RegressionPanel;
