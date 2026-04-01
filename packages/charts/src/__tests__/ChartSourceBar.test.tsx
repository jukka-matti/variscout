import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ChartSourceBar, { getSourceBarHeight } from '../ChartSourceBar';

describe('getSourceBarHeight', () => {
  it('returns positive height when showBranding is true', () => {
    const height = getSourceBarHeight(true);
    expect(height).toBeGreaterThan(0);
    expect(height).toBe(28); // BAR_HEIGHT (20) + padding (8)
  });

  it('returns 0 when showBranding is false', () => {
    const height = getSourceBarHeight(false);
    expect(height).toBe(0);
  });

  it('defaults to showing branding (no argument)', () => {
    const height = getSourceBarHeight();
    expect(height).toBe(28);
  });
});

/** Wrap in SVG since ChartSourceBar renders SVG elements */
function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe('ChartSourceBar rendering', () => {
  it('renders branding text', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="VariScout Lite" />
    );

    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('VariScout Lite'))).toBe(true);
  });

  it('returns null when brandingText is empty and forceShow is false', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="" forceShow={false} />
    );

    // The component returns null, so no <g> elements from ChartSourceBar
    // Only the wrapper <svg> remains
    const groups = container.querySelectorAll('g');
    expect(groups.length).toBe(0);
  });

  it('renders when forceShow is true even without brandingText', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="" forceShow={true} />
    );

    // Should render the badge container (Group elements)
    const groups = container.querySelectorAll('g');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('shows sample size when n is provided', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="VariScout" n={42} />
    );

    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('n=42'))).toBe(true);
  });

  it('does not show sample size when n is not provided', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="VariScout" />
    );

    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('n='))).toBe(false);
  });

  it('renders accent color dot', () => {
    const { container } = renderInSvg(
      <ChartSourceBar width={400} top={0} brandingText="VariScout" accentColor="#ff0000" />
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(circle!.getAttribute('fill')).toBe('#ff0000');
  });
});
