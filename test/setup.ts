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
