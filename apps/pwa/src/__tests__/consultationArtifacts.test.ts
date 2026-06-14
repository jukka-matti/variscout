/**
 * CL-3: Gated exportConsultationPack tests
 *
 * Test intent:
 * - The free-artifact stub throws the expected error message.
 * - The paid-artifact module exports an exportConsultationPack function.
 *
 * Note: in Vitest, the @pwa-artifacts alias resolves to paidArtifacts.ts
 * (channel=individual per vite.config.ts test block).  We import both modules
 * directly by path to test both sides of the gate independently.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  exportConsultationPack as freeExportConsultationPack,
  exportVrs as freeExportVrs,
} from '../artifacts/freeArtifacts';
import { exportConsultationPack as paidExportConsultationPack } from '../artifacts/paidArtifacts';
import { createConsultation } from '@variscout/core/consultations';

// ── Free-stub gate ───────────────────────────────────────────────────────────

describe('freeArtifacts — gate throws', () => {
  it('exportVrs throws "not available in this Workspace channel"', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      freeExportVrs({ activeHub: {} as any, appVersion: '0.0.0' })
    ).toThrow('not available in this Workspace channel');
  });

  it('exportConsultationPack throws "not available in this Workspace channel"', () => {
    const consultation = createConsultation('Test');
    expect(() =>
      freeExportConsultationPack({
        consultation,
        views: [],
        appVersion: '0.0.0',
      })
    ).toThrow('not available in this Workspace channel');
  });
});

// ── Paid-module exports ──────────────────────────────────────────────────────

describe('paidArtifacts — exportConsultationPack is a function', () => {
  it('exports exportConsultationPack as a function', () => {
    expect(typeof paidExportConsultationPack).toBe('function');
  });

  it('exportConsultationPack triggers two Blob downloads (html + md)', () => {
    // Mock the DOM download mechanism.
    const createdUrls: string[] = [];
    const revokedUrls: string[] = [];
    const clicks: string[] = [];

    const mockCreateObjectURL = vi.fn((blob: Blob) => {
      const url = `blob:mock-${createdUrls.length}`;
      createdUrls.push(url);
      // Store the blob type for assertion.
      (blob as { __type?: string }).__type = blob.type;
      return url;
    });
    const mockRevokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url);
    });

    const clickedAnchors: Array<{ href: string; download: string }> = [];
    const originalCreateElement = document.createElement.bind(document);
    const mockCreateElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        const a = originalCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          clickedAnchors.push({ href: a.href, download: a.download });
          clicks.push(a.download);
          origClick();
        };
        return a;
      }
      return originalCreateElement(tag);
    });

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
    vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement);

    const consultation = createConsultation('Line 3 Monday drift');

    paidExportConsultationPack({
      consultation,
      views: [],
      appVersion: '1.0.0',
    });

    // Two downloads: one .html and one .md.
    expect(createdUrls).toHaveLength(2);
    expect(revokedUrls).toHaveLength(2);
    expect(clicks).toHaveLength(2);
    // One download ends with .html, one with .md.
    const downloadNames = clicks;
    expect(downloadNames.some(n => n.endsWith('.html'))).toBe(true);
    expect(downloadNames.some(n => n.endsWith('.md'))).toBe(true);

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
