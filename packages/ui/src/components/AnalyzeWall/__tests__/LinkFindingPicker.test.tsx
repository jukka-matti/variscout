import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkFindingPicker } from '../LinkFindingPicker';
import type { Finding } from '@variscout/core';

const findingF1 = {
  id: 'f-1',
  text: 'Nozzle temperature spike at 06:00',
  createdAt: 1,
  deletedAt: null,
} as Finding;

const findingF2 = {
  id: 'f-2',
  text: 'Night shift deviation in viscosity',
  createdAt: 2,
  deletedAt: null,
} as Finding;

const findingF3 = {
  id: 'f-3',
  text: 'Unrelated finding from another hypothesis',
  createdAt: 3,
  deletedAt: null,
} as Finding;

const hypothesis = {
  id: 'h-1',
  findingIds: ['f-1', 'f-2'],
};

describe('<LinkFindingPicker />', () => {
  it('shows only findings that belong to the hypothesis and are not already linked', () => {
    render(
      <LinkFindingPicker
        hypothesis={hypothesis}
        plan={{ id: 'mp-1', linkedFindingIds: ['f-2'] }}
        findings={[findingF1, findingF2, findingF3]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // f-1: belongs to hypothesis, not yet linked → should appear
    expect(screen.getByLabelText(/nozzle temperature spike/i)).toBeInTheDocument();
    // f-2: already linked → excluded
    expect(screen.queryByLabelText(/night shift deviation/i)).not.toBeInTheDocument();
    // f-3: not owned by this hypothesis → excluded
    expect(screen.queryByLabelText(/unrelated finding/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no findings are eligible', () => {
    render(
      <LinkFindingPicker
        hypothesis={{ id: 'h-1', findingIds: ['f-2'] }}
        plan={{ id: 'mp-1', linkedFindingIds: ['f-2'] }}
        findings={[findingF2]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/no.*findings.*available/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /link selected/i })).not.toBeInTheDocument();
  });

  it('disables Link Selected button until at least one finding is checked', () => {
    render(
      <LinkFindingPicker
        hypothesis={hypothesis}
        plan={{ id: 'mp-1' }}
        findings={[findingF1, findingF2]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const linkBtn = screen.getByRole('button', { name: /link selected/i });
    expect(linkBtn).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/nozzle temperature spike/i));
    expect(linkBtn).not.toBeDisabled();
  });

  it('fires onConfirm with the selected finding ids', () => {
    const onConfirm = vi.fn();
    render(
      <LinkFindingPicker
        hypothesis={hypothesis}
        plan={{ id: 'mp-1' }}
        findings={[findingF1, findingF2]}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText(/nozzle temperature spike/i));
    fireEvent.click(screen.getByLabelText(/night shift deviation/i));
    fireEvent.click(screen.getByRole('button', { name: /link selected/i }));
    expect(onConfirm).toHaveBeenCalledWith(['f-1', 'f-2']);
  });

  it('fires onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <LinkFindingPicker
        hypothesis={hypothesis}
        plan={{ id: 'mp-1' }}
        findings={[findingF1, findingF2]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders a Cancel button in the empty state', () => {
    const onCancel = vi.fn();
    render(
      <LinkFindingPicker
        hypothesis={{ id: 'h-1', findingIds: [] }}
        plan={{ id: 'mp-1' }}
        findings={[]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
