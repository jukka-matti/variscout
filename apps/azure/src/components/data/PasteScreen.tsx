import React from 'react';
import { PasteScreenBase, type PasteScreenBaseProps } from '@variscout/ui';

/**
 * Azure PasteScreen — uses default semantic-token-based color scheme from @variscout/ui
 */
const PasteScreen: React.FC<Omit<PasteScreenBaseProps, 'colorScheme'>> = props => (
  <PasteScreenBase {...props} />
);

export default PasteScreen;
