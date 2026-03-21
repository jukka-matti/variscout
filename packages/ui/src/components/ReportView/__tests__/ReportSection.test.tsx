import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReportSection } from '../ReportSection';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeRef(): React.RefObject<HTMLDivElement | null> {
  return { current: null };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportSection', () => {
  it('renders the title', () => {
    render(
      <ReportSection
        id="s1"
        stepNumber={1}
        title="What does the process look like?"
        status="active"
        sectionRef={makeRef()}
      >
        <p>Content here</p>
      </ReportSection>
    );
    expect(screen.getByText('What does the process look like?')).toBeDefined();
  });

  it('renders the step marker', () => {
    render(
      <ReportSection id="s1" stepNumber={2} title="Step 2" status="active" sectionRef={makeRef()}>
        <p>Child</p>
      </ReportSection>
    );
    // Active status renders step number
    expect(screen.getByText('2')).toBeDefined();
  });

  it('shows children content when status is active (expanded by default)', () => {
    render(
      <ReportSection id="s1" stepNumber={1} title="Step 1" status="active" sectionRef={makeRef()}>
        <p>Section content</p>
      </ReportSection>
    );
    expect(screen.getByText('Section content')).toBeDefined();
  });

  it('collapses content when header is clicked', () => {
    render(
      <ReportSection id="s1" stepNumber={1} title="Step 1" status="active" sectionRef={makeRef()}>
        <p>Section content</p>
      </ReportSection>
    );

    // Initially expanded (active defaults to open)
    expect(screen.getByText('Section content')).toBeDefined();

    // Click to collapse — find the header div (role=button)
    const header = screen.getByRole('button', { name: /step 1/i });
    // Fallback: find the div with role button
    fireEvent.click(header);

    expect(screen.queryByText('Section content')).toBeNull();
  });

  it('expands collapsed section when header is clicked again', () => {
    render(
      <ReportSection id="s1" stepNumber={1} title="Step 1" status="active" sectionRef={makeRef()}>
        <p>Section content</p>
      </ReportSection>
    );

    const header = screen.getByRole('button', { name: /step 1/i });
    fireEvent.click(header); // collapse
    fireEvent.click(header); // expand

    expect(screen.getByText('Section content')).toBeDefined();
  });

  describe('future status', () => {
    it('applies opacity-50 dimming for future sections', () => {
      const { container } = render(
        <ReportSection
          id="s1"
          stepNumber={5}
          title="Future step"
          status="future"
          sectionRef={makeRef()}
        >
          <p>Future content</p>
        </ReportSection>
      );
      const section = container.firstChild as HTMLElement;
      expect(section.className).toContain('opacity-50');
    });

    it('does not show children for future sections', () => {
      render(
        <ReportSection
          id="s1"
          stepNumber={5}
          title="Future step"
          status="future"
          sectionRef={makeRef()}
        >
          <p>Future content</p>
        </ReportSection>
      );
      // Future sections are closed by default and not expandable
      expect(screen.queryByText('Future content')).toBeNull();
    });

    it('does not expand when future section header is clicked', () => {
      render(
        <ReportSection
          id="s1"
          stepNumber={5}
          title="Future step"
          status="future"
          sectionRef={makeRef()}
        >
          <p>Future content</p>
        </ReportSection>
      );

      // Click the header area
      const title = screen.getByText('Future step');
      fireEvent.click(title);

      // Content should still not appear
      expect(screen.queryByText('Future content')).toBeNull();
    });
  });

  describe('copy button', () => {
    it('renders copy button when onCopyAsSlide is provided and status is not future', () => {
      const onCopy = vi.fn();
      render(
        <ReportSection
          id="s1"
          stepNumber={1}
          title="Step 1"
          status="active"
          sectionRef={makeRef()}
          onCopyAsSlide={onCopy}
        >
          <p>Content</p>
        </ReportSection>
      );
      const copyBtn = screen.getByRole('button', { name: /copy.*slide/i });
      expect(copyBtn).toBeDefined();
    });

    it('copy button is marked with data-export-hide', () => {
      const onCopy = vi.fn();
      render(
        <ReportSection
          id="s1"
          stepNumber={1}
          title="Step 1"
          status="active"
          sectionRef={makeRef()}
          onCopyAsSlide={onCopy}
        >
          <p>Content</p>
        </ReportSection>
      );
      const copyBtn = screen.getByRole('button', { name: /copy.*slide/i });
      expect(copyBtn.hasAttribute('data-export-hide')).toBe(true);
    });

    it('does not render copy button for future sections', () => {
      const onCopy = vi.fn();
      render(
        <ReportSection
          id="s1"
          stepNumber={5}
          title="Step 5"
          status="future"
          sectionRef={makeRef()}
          onCopyAsSlide={onCopy}
        >
          <p>Content</p>
        </ReportSection>
      );
      expect(screen.queryByRole('button', { name: /copy.*slide/i })).toBeNull();
    });

    it('calls onCopyAsSlide when copy button is clicked', () => {
      const onCopy = vi.fn();
      render(
        <ReportSection
          id="s1"
          stepNumber={1}
          title="Step 1"
          status="active"
          sectionRef={makeRef()}
          onCopyAsSlide={onCopy}
        >
          <p>Content</p>
        </ReportSection>
      );
      const copyBtn = screen.getByRole('button', { name: /copy.*slide/i });
      fireEvent.click(copyBtn);
      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });
});
