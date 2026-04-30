import React from 'react';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';
import { WhatIfExplorerPage } from '@variscout/ui';
import { resolveCpkTarget } from '@variscout/core/capability';

interface WhatIfPageProps {
  onBack: () => void;
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({ onBack }) => {
  const { filteredData } = useFilteredData();
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const filters = useProjectStore(s => s.filters);
  const factors = useProjectStore(s => s.factors);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const cpkTarget = resolveCpkTarget(outcome ?? '', {
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
      activeFactor={factors[0] ?? null}
    />
  );
};

export default WhatIfPage;
