import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      tf: (key: string) => key,
      locale: 'en' as const,
      formatNumber: (v: number) => String(v),
    }),
  };
});

import { getSample } from '@variscout/data';
import SampleSection from '../SampleSection';

describe('SampleSection — curated PWA demos', () => {
  it('renders Syringe and Bottleneck as first-class guided demo cards', () => {
    render(<SampleSection onLoadSample={vi.fn()} variant="web" />);

    expect(screen.getByTestId('sample-curated-syringe-barrel-weight')).toHaveTextContent(
      'End-to-end GB case'
    );
    expect(screen.getByTestId('sample-curated-bottleneck')).toHaveTextContent('Process-flow case');
    expect(screen.queryByTestId('sample-featured-syringe-barrel-weight')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sample-featured-bottleneck')).not.toBeInTheDocument();
  });

  it('loads the selected curated sample when clicked', () => {
    const onLoadSample = vi.fn();
    render(<SampleSection onLoadSample={onLoadSample} variant="web" />);

    fireEvent.click(screen.getByTestId('sample-curated-bottleneck'));

    expect(onLoadSample).toHaveBeenCalledWith(getSample('bottleneck'));
  });
});
