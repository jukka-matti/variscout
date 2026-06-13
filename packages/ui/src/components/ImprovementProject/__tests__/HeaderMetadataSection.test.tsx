import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderMetadataSection } from '../sections/HeaderMetadataSection';
import { ImprovementProjectForm } from '../ImprovementProjectForm';

describe('HeaderMetadataSection', () => {
  it('renders title required validation for a blank title and clears it for a nonblank title', () => {
    const { rerender } = render(<HeaderMetadataSection title="   " />);

    const titleInput = screen.getByLabelText(/project title/i);
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/project title is required/i)).toBeInTheDocument();

    rerender(<HeaderMetadataSection title="Reduce rework" />);

    expect(screen.getByLabelText(/project title/i)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/project title is required/i)).not.toBeInTheDocument();
  });

  it('calls the business case callback when the textarea changes', () => {
    const onBusinessCaseChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        businessCase="Current case"
        onBusinessCaseChange={onBusinessCaseChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/business case/i), {
      target: { value: 'Expected savings from fewer escalations' },
    });

    expect(onBusinessCaseChange).toHaveBeenCalledWith('Expected savings from fewer escalations');
  });

  it('calls the financial impact callback with merged amount and currency values', () => {
    const onFinancialImpactChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        financialImpact={{ amount: 12000, currency: 'USD' }}
        onFinancialImpactChange={onFinancialImpactChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/financial impact amount/i), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(/financial impact currency/i), {
      target: { value: 'EUR' },
    });
    fireEvent.change(screen.getByLabelText(/financial impact amount/i), {
      target: { value: '1e309' },
    });

    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(1, {
      amount: 25000,
      currency: 'USD',
    });
    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(2, {
      amount: 12000,
      currency: 'EUR',
    });
    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(3, {
      amount: undefined,
      currency: 'USD',
    });
  });

  it('calls the investigation callback with selected ids and undefined when cleared', () => {
    const onProjectIdChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        projectId="inv-1"
        projectOptions={[
          { id: 'inv-1', name: 'Returns spike' },
          { id: 'inv-2', name: 'Late handoffs' },
        ]}
        onProjectIdChange={onProjectIdChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/linked investigation/i), {
      target: { value: 'inv-2' },
    });
    fireEvent.change(screen.getByLabelText(/linked investigation/i), {
      target: { value: '' },
    });

    expect(onProjectIdChange).toHaveBeenNthCalledWith(1, 'inv-2');
    expect(onProjectIdChange).toHaveBeenNthCalledWith(2, undefined);
  });
});

describe('ImprovementProjectForm metadata integration', () => {
  it('renders HeaderMetadataSection in Section 1 when metadataProps are provided', () => {
    render(<ImprovementProjectForm metadataProps={{ title: 'Reduce rework' }} />);

    expect(screen.getByLabelText(/project title/i)).toHaveValue('Reduce rework');
  });

  it('keeps sectionContent.metadata override compatibility when metadataProps are provided', () => {
    render(
      <ImprovementProjectForm
        metadataProps={{ title: 'Reduce rework' }}
        sectionContent={{ metadata: <div>Custom metadata override</div> }}
      />
    );

    expect(screen.getByText('Custom metadata override')).toBeInTheDocument();
    expect(screen.queryByLabelText(/project title/i)).not.toBeInTheDocument();
  });
});
