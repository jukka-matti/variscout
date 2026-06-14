import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withResponsiveSize } from '../withResponsiveSize';

/**
 * Controllable ResizeObserver mock.
 *
 * Captures the callback passed to the constructor so tests can drive
 * synthetic resize events. Stores all live instances so a test can fire
 * a measurement at will.
 */
type ROCallback = (entries: Array<{ contentRect: { width: number; height: number } }>) => void;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ROCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(cb: ROCallback) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter(o => o !== el);
  }

  disconnect() {
    this.disconnected = true;
  }

  /** Test helper — drive a synthetic measurement through the captured callback. */
  emit(width: number, height: number) {
    this.callback([{ contentRect: { width, height } }]);
  }
}

/** Base component that simply prints the injected dimensions for assertions. */
interface ProbeProps {
  parentWidth: number;
  parentHeight: number;
  label?: string;
}

const Probe: React.FC<ProbeProps> = ({ parentWidth, parentHeight, label }) => (
  <div data-testid="probe" data-w={parentWidth} data-h={parentHeight}>
    {label ?? 'probe'} {parentWidth}x{parentHeight}
  </div>
);

let rafSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  MockResizeObserver.instances = [];
  // @ts-expect-error — install mock on the global
  globalThis.ResizeObserver = MockResizeObserver;
  // Make requestAnimationFrame synchronous so post-observe measurement is deterministic.
  rafSpy = vi
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((cb: (t: number) => void) => {
      cb(0);
      return 0;
    });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  rafSpy?.mockRestore();
  vi.restoreAllMocks();
});

describe('withResponsiveSize', () => {
  it('renders the wrapped component at initial dims BEFORE any measurement (never blank)', () => {
    const Wrapped = withResponsiveSize(Probe);
    render(<Wrapped />);

    // Child must exist immediately — this is the core difference vs withParentSize,
    // which renders nothing until the ResizeObserver delivers a measurement.
    const probe = screen.getByTestId('probe');
    expect(probe).toBeInTheDocument();
    expect(Number(probe.getAttribute('data-w'))).toBeGreaterThan(0);
    expect(Number(probe.getAttribute('data-h'))).toBeGreaterThan(0);
  });

  it('honors initialWidth / initialHeight overrides for the first paint', () => {
    const Wrapped = withResponsiveSize(Probe);
    render(<Wrapped initialWidth={321} initialHeight={123} />);

    const probe = screen.getByTestId('probe');
    expect(probe.getAttribute('data-w')).toBe('321');
    expect(probe.getAttribute('data-h')).toBe('123');
  });

  it('updates injected parentWidth/parentHeight when the observer reports a real size', () => {
    const Wrapped = withResponsiveSize(Probe);
    render(<Wrapped initialWidth={640} initialHeight={400} />);

    expect(MockResizeObserver.instances.length).toBeGreaterThan(0);
    const observer = MockResizeObserver.instances[0];

    act(() => {
      observer.emit(1000, 700);
    });

    const probe = screen.getByTestId('probe');
    expect(probe.getAttribute('data-w')).toBe('1000');
    expect(probe.getAttribute('data-h')).toBe('700');
  });

  it('REGRESSION GUARD: a 0×0 (or 0-width) measurement after a real one does NOT blank the chart', () => {
    const Wrapped = withResponsiveSize(Probe);
    render(<Wrapped initialWidth={640} initialHeight={400} />);
    const observer = MockResizeObserver.instances[0];

    // First a real measurement.
    act(() => {
      observer.emit(1200, 800);
    });
    let probe = screen.getByTestId('probe');
    expect(probe.getAttribute('data-w')).toBe('1200');
    expect(probe.getAttribute('data-h')).toBe('800');

    // Now the transient degenerate 0×0 that withParentSize would latch onto.
    act(() => {
      observer.emit(0, 0);
    });
    probe = screen.getByTestId('probe');
    // Last good dims must be preserved — NOT zeroed.
    expect(probe.getAttribute('data-w')).toBe('1200');
    expect(probe.getAttribute('data-h')).toBe('800');

    // A zero-width-only measurement is also degenerate and ignored.
    act(() => {
      observer.emit(0, 800);
    });
    probe = screen.getByTestId('probe');
    expect(probe.getAttribute('data-w')).toBe('1200');
    expect(probe.getAttribute('data-h')).toBe('800');
  });

  it('disconnects the observer on unmount', () => {
    const Wrapped = withResponsiveSize(Probe);
    const { unmount } = render(<Wrapped />);
    const observer = MockResizeObserver.instances[0];
    unmount();
    expect(observer.disconnected).toBe(true);
  });

  it('forwards extra props through to the base component', () => {
    const Wrapped = withResponsiveSize(Probe);
    render(<Wrapped label="hello" />);
    expect(screen.getByTestId('probe').textContent).toContain('hello');
  });
});
