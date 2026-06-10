import React from 'react';
import { useProjectStore, useAnalysisScopeStore } from '@variscout/stores';
import { useFilteredData, useSpecsForMeasure } from '@variscout/hooks';
import { WhatIfExplorerPage } from '@variscout/ui';
import { resolveCpkTarget } from '@variscout/core/capability';

interface WhatIfPageProps {
  onBack: () => void;
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({ onBack }) => {
  const { filteredData } = useFilteredData();
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const filters = useProjectStore(s => s.filters);
  const factors = useProjectStore(s => s.factors);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  // Per-measure spec resolution (measureSpecs[outcome] ?? global specs).
  const specsFor = useSpecsForMeasure();
  const specs = specsFor(outcome ?? '');
  // Bind to the actually-analyzed boxplot factor (not the first MAPPED factor).
  // The Explore picker mirrors its selection into analysisScopeStore (see PWA
  // useDashboardCharts); fall back to factors[0] before any selection.
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const filterCount = Object.keys(filters).length;

  return (
    <WhatIfExplorerPage
      filteredData={filteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      filterCount={filterCount}
      onBack={onBack}
      cpkTarget={cpkTarget}
      activeFactor={boxplotFactor ?? factors[0] ?? null}
    />
  );
};

export default WhatIfPage;
