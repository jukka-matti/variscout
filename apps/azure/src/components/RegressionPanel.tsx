/**
 * RegressionPanel - Wrapper for RegressionPanelBase with Azure context and color scheme
 */
import React from 'react';
import {
  RegressionPanelBase,
  regressionPanelAzureColorScheme,
  SimpleRegressionView,
  AdvancedRegressionView,
  ExpandedScatterModal,
  regressionViewAzureColorScheme,
} from '@variscout/ui';
import type { MultiRegressionResult } from '@variscout/core';
import { useData } from '../context/DataContext';

interface RegressionPanelProps {
  initialPredictors?: string[];
  investigationFactors?: string[];
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
      renderSimpleView={props => (
        <SimpleRegressionView {...props} colorScheme={regressionViewAzureColorScheme} />
      )}
      renderAdvancedView={props => (
        <AdvancedRegressionView {...props} colorScheme={regressionViewAzureColorScheme} />
      )}
      renderExpandedModal={props => (
        <ExpandedScatterModal {...props} colorScheme={regressionViewAzureColorScheme} />
      )}
      colorScheme={regressionPanelAzureColorScheme}
      initialPredictors={initialPredictors}
      investigationFactors={investigationFactors}
      onNavigateToWhatIf={onNavigateToWhatIf}
      totalRowCount={rawData.length}
    />
  );
};

export default RegressionPanel;
