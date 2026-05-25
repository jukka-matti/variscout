import '@testing-library/jest-dom';
// Install fake-indexeddb globally for ALL test files that load this shared
// setup. Any test that transitively imports a Dexie-backed store — most
// notably `useCanvasViewportStore` (which Canvas tests in packages/ui pull
// in) — will hang silently in jsdom without an IndexedDB implementation.
// The hang has no stack trace: the test never starts. Decision-log line 57
// (2026-05-14) and `.claude/rules/testing.md` document the trap.
// Do NOT remove this import — leaving the shim global is cheap insurance.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// HTMLDialogElement not implemented in jsdom
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close ??= vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
  HTMLDialogElement.prototype.show ??= vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
}

// matchMedia not implemented in jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// window.confirm not defined in happy-dom (jsdom defines it as a no-op returning false).
// Default to false (no auto-confirm). Tests that need true must vi.spyOn(window, 'confirm').mockReturnValue(true).
if (typeof window !== 'undefined' && typeof window.confirm !== 'function') {
  window.confirm = vi.fn(() => false);
}

// MouseEvent / WheelEvent constructor coords polyfill — happy-dom 20.x ignores
// clientX/clientY from MouseEventInit, leaving them undefined. d3-zoom + visx
// rely on these. Wrap the constructors so the options are honored.
if (typeof globalThis.MouseEvent === 'function') {
  const OriginalMouseEvent = globalThis.MouseEvent;
  class PatchedMouseEvent extends OriginalMouseEvent {
    constructor(type: string, init?: MouseEventInit) {
      super(type, init);
      if (init) {
        if (init.clientX !== undefined && this.clientX === undefined) {
          Object.defineProperty(this, 'clientX', { value: init.clientX, configurable: true });
        }
        if (init.clientY !== undefined && this.clientY === undefined) {
          Object.defineProperty(this, 'clientY', { value: init.clientY, configurable: true });
        }
      }
    }
  }
  globalThis.MouseEvent = PatchedMouseEvent as typeof MouseEvent;

  if (typeof globalThis.WheelEvent === 'function') {
    const OriginalWheelEvent = globalThis.WheelEvent;
    class PatchedWheelEvent extends OriginalWheelEvent {
      constructor(type: string, init?: WheelEventInit) {
        super(type, init);
        if (init) {
          if (init.clientX !== undefined && this.clientX === undefined) {
            Object.defineProperty(this, 'clientX', { value: init.clientX, configurable: true });
          }
          if (init.clientY !== undefined && this.clientY === undefined) {
            Object.defineProperty(this, 'clientY', { value: init.clientY, configurable: true });
          }
        }
      }
    }
    globalThis.WheelEvent = PatchedWheelEvent as typeof WheelEvent;
  }
}

// SVGPoint.matrixTransform polyfill — happy-dom's SVGPoint doesn't implement it.
// d3-zoom uses it for SVG coordinate transforms. Standard 2x3 matrix math.
// Reads either a/b/c/d/e/f (DOMMatrix spec aliases) OR m11/m21/m12/m22/m41/m42
// (the canonical names happy-dom actually exposes).
if (typeof globalThis.SVGPoint !== 'undefined' && !globalThis.SVGPoint.prototype.matrixTransform) {
  globalThis.SVGPoint.prototype.matrixTransform = function (matrix?: {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    f?: number;
    m11?: number;
    m12?: number;
    m21?: number;
    m22?: number;
    m41?: number;
    m42?: number;
  }) {
    // 2D transform component: [a c e; b d f; 0 0 1]
    //   a = m11, b = m12, c = m21, d = m22, e = m41, f = m42
    const a = matrix?.a ?? matrix?.m11 ?? 1;
    const b = matrix?.b ?? matrix?.m12 ?? 0;
    const c = matrix?.c ?? matrix?.m21 ?? 0;
    const d = matrix?.d ?? matrix?.m22 ?? 1;
    const e = matrix?.e ?? matrix?.m41 ?? 0;
    const f = matrix?.f ?? matrix?.m42 ?? 0;
    const newX = this.x * a + this.y * c + e;
    const newY = this.x * b + this.y * d + f;
    const result = Object.create(globalThis.SVGPoint.prototype);
    result.x = newX;
    result.y = newY;
    return result;
  };
}
