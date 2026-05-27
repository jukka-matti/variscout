import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnGroup } from '../ColumnGroup';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

describe('ColumnGroup', () => {
  it('renders the label with the count and one chip per profile', () => {
    const profiles = [
      createTestColumnParsingProfile({ columnName: 'A' }),
      createTestColumnParsingProfile({ columnName: 'B' }),
      createTestColumnParsingProfile({ columnName: 'C' }),
    ];
    render(
      <DndContext>
        <ColumnGroup
          groupKey="numeric"
          label="Numeric"
          profiles={profiles}
          numericValuesByColumn={{}}
        />
      </DndContext>
    );
    expect(screen.getByText('Numeric · 3')).toBeInTheDocument();
    expect(screen.getByTestId('palette-group-numeric')).toBeInTheDocument();
    expect(screen.getAllByTestId('column-chip')).toHaveLength(3);
  });
});
