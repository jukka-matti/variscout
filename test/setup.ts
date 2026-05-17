import '@testing-library/jest-dom';
// Install fake-indexeddb globally so tests that pull in Dexie-backed stores
// (e.g. canvasViewportStore via Canvas.test.tsx in packages/ui) don't hang
// waiting for an IndexedDB that jsdom doesn't provide. Previously only the
// stores package + the dedicated canvasViewportStore.test.ts registered this,
// so the @variscout/ui suite stalled on Canvas.test.tsx under concurrent
// turbo load (decision-log line 57, 2026-05-14).
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
