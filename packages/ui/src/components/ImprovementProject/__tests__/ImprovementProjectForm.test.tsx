import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImprovementProjectForm } from '../ImprovementProjectForm';

const sectionNames = [
  'Project metadata',
  'Background / Current State',
  'Goal',
  'Investigation lineage',
  'Approach / Countermeasures',
  'Outcome reference',
];

describe('ImprovementProjectForm', () => {
  it('renders the six-section shell and progress indicator', () => {
    render(<ImprovementProjectForm />);

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    for (const name of sectionNames) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('opens sections one and two by default and collapses sections three through six', () => {
    render(<ImprovementProjectForm />);

    expect(screen.getByRole('button', { name: 'Project metadata' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Background / Current State' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    for (const name of sectionNames.slice(2)) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('region', { name })).not.toBeInTheDocument();
    }
  });

  it('renders supplied section bodies without app state wiring', () => {
    render(
      <ImprovementProjectForm
        sectionContent={{
          metadata: <div>Metadata fields</div>,
          background: <div>Background fields</div>,
        }}
      />
    );

    expect(screen.getByText('Metadata fields')).toBeInTheDocument();
    expect(screen.getByText('Background fields')).toBeInTheDocument();
  });

  it('renders the background section in section two when background props are provided', () => {
    render(
      <ImprovementProjectForm
        backgroundProps={{
          snapshot: { value: 'Snapshotted process state', sourceHash: 'snapshot-hash' },
          current: { value: 'Live process state', hash: 'live-hash' },
          manualNarrative: 'Manual project context',
        }}
      />
    );

    expect(screen.getByText('Snapshotted process state')).toBeInTheDocument();
    expect(screen.getByLabelText(/manual narrative/i)).toHaveValue('Manual project context');
  });

  it('keeps the sectionContent background override ahead of background props', () => {
    render(
      <ImprovementProjectForm
        backgroundProps={{
          snapshot: { value: 'Snapshotted process state', sourceHash: 'snapshot-hash' },
          current: { value: 'Live process state', hash: 'live-hash' },
          manualNarrative: 'Manual project context',
        }}
        sectionContent={{
          background: <div>Custom background override</div>,
        }}
      />
    );

    expect(screen.getByText('Custom background override')).toBeInTheDocument();
    expect(screen.queryByText('Snapshotted process state')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/manual narrative/i)).not.toBeInTheDocument();
  });
});
