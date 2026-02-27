import React from 'react';
import { useData } from '../context/DataContext';
import { WhatIfPageBase } from '@variscout/ui';

interface WhatIfPageProps {
  onBack: () => void;
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({ onBack }) => {
  const { filteredData, rawData, outcome, specs, filters, factors, cpkTarget } = useData();
  const filterCount = Object.keys(filters).length;

  return (
    <WhatIfPageBase
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
