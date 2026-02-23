import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  WhatIfPageBase,
  whatIfPageAzureColorScheme,
  whatIfSimulatorAzureColorScheme,
} from '@variscout/ui';
import type { FilterAction } from '@variscout/core';

interface WhatIfPageProps {
  onBack: () => void;
  filterCount?: number;
  filterStack?: FilterAction[];
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({ onBack, filterCount = 0, filterStack }) => {
  const { filteredData, rawData, outcome, specs, columnAliases } = useData();

  const filterNames = useMemo(() => {
    if (!filterStack || filterStack.length === 0) return undefined;
    return filterStack
      .filter(f => f.factor)
      .map(f => {
        const alias = (f.factor && columnAliases[f.factor]) || f.factor || '';
        return `${alias} = ${f.values.join(', ')}`;
      });
  }, [filterStack, columnAliases]);

  return (
    <WhatIfPageBase
      filteredData={filteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      filterCount={filterCount}
      filterNames={filterNames}
      onBack={onBack}
      colorScheme={whatIfPageAzureColorScheme}
      simulatorColorScheme={whatIfSimulatorAzureColorScheme}
    />
  );
};

export default WhatIfPage;
