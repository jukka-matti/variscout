import React from 'react';
import { SpecEditor as SpecEditorBase, specEditorAzureColorScheme } from '@variscout/ui';
import type { SpecEditorProps } from '@variscout/ui';

type Props = Omit<SpecEditorProps, 'colorScheme'>;

const SpecEditor: React.FC<Props> = props => (
  <SpecEditorBase {...props} colorScheme={specEditorAzureColorScheme} />
);

export default SpecEditor;
