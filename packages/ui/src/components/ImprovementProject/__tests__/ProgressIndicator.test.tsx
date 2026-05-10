import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders exactly six PR-RPS-6 progress segments by default', () => {
    render(<ProgressIndicator currentStep={2} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('list', { name: 'Improvement project progress' })).toBeInTheDocument();
  });

  it('exposes segment state through accessible labels', () => {
    render(<ProgressIndicator currentStep={2} />);

    expect(screen.getByLabelText('Step 1 of 6, Project metadata, complete')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Step 2 of 6, Background / Current State, current')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Step 3 of 6, Goal, upcoming')).toBeInTheDocument();
  });
});
