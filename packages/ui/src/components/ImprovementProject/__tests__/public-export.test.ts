import { describe, expect, it } from 'vitest';

import {
  CollapsibleSection,
  HeaderMetadataSection,
  ImprovementProjectForm,
  ProgressIndicator,
} from '../../../index';
import type {
  CollapsibleSectionProps,
  HeaderMetadataSectionProps,
  ImprovementProjectFormProps,
  ImprovementProjectSectionKey,
  ProgressIndicatorProps,
} from '../../../index';

describe('ImprovementProject public exports', () => {
  it('exposes the ImprovementProject component group from @variscout/ui', () => {
    const sectionKey: ImprovementProjectSectionKey = 'metadata';
    const metadataProps: HeaderMetadataSectionProps = { title: 'Reduce rework' };
    const formProps: ImprovementProjectFormProps = { metadataProps };
    const sectionProps: CollapsibleSectionProps = { title: 'Project metadata', children: null };
    const progressProps: ProgressIndicatorProps = { currentStep: 1 };

    expect(sectionKey).toBe('metadata');
    expect(metadataProps.title).toBe('Reduce rework');
    expect(formProps.metadataProps).toBe(metadataProps);
    expect(sectionProps.title).toBe('Project metadata');
    expect(progressProps.currentStep).toBe(1);
    expect(ImprovementProjectForm).toBeTypeOf('function');
    expect(HeaderMetadataSection).toBeTypeOf('function');
    expect(CollapsibleSection).toBeTypeOf('function');
    expect(ProgressIndicator).toBeTypeOf('function');
  });
});
