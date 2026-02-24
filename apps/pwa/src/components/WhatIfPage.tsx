import React from 'react';
import { useData } from '../context/DataContext';
import { WhatIfPageBase } from '@variscout/ui';
import type { MultiRegressionResult } from '@variscout/core';

interface WhatIfPageProps {
  onBack: () => void;
  regressionModel?: MultiRegressionResult;
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({ onBack, regressionModel }) => {
  const { filteredData, rawData, outcome, specs, filters } = useData();
  const filterCount = Object.keys(filters).length;

  return (
    <WhatIfPageBase
      filteredData={filteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      filterCount={filterCount}
      onBack={onBack}
      regressionModel={regressionModel}
    />
  );
};

export default WhatIfPage;
