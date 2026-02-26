import React from 'react';
import { SpecEditor as SpecEditorBase } from '@variscout/ui';
import type { SpecEditorProps } from '@variscout/ui';

type Props = Omit<SpecEditorProps, 'colorScheme'>;

const SpecEditor: React.FC<Props> = props => <SpecEditorBase {...props} />;

export default SpecEditor;
