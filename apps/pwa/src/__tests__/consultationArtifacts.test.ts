/**
 * CL-3: Gated exportConsultationPack tests
 *
 * Test intent:
 * - The free-artifact stub throws the expected error message.
 * - The paid-artifact module exports an exportConsultationPack function.
 * - The paid export asserts no-raw-rows redaction (HTML privacy guarantee).
 * - The paid export embeds [id: <questionId>] anchors in the .md blob.
 * - An empty/punctuation-only title falls back to the "consultation" stem.
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
import {
  createConsultation,
  createConsultationQuestion,
} from '@variscout/core/consultations';
import type { ResolvedView } from '@variscout/ui';
import * as uiPacks from '@variscout/ui';

/**
 * Capture the real document.createElement at module load time, BEFORE any
 * vi.spyOn call in any test can replace the property.  Using this reference
 * inside mocks avoids infinite recursion when the spy wraps the method.
 */
const realCreateElement = document.createElement.bind(document);

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
    const mockCreateElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        const a = realCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          clickedAnchors.push({ href: a.href, download: a.download });
          clicks.push(a.download);
          origClick();
        };
        return a;
      }
      return realCreateElement(tag);
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

// ── Privacy guarantee + MD anchors ───────────────────────────────────────────

describe('paidArtifacts — no-raw-rows redaction + md anchors', () => {
  it('HTML blob does NOT contain raw-rows-table (redaction: no-raw-rows)', async () => {
    const capturedBlobs: Blob[] = [];
    const capturedNames: string[] = [];

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        const url = `blob:mock-${capturedBlobs.length}`;
        capturedBlobs.push(blob);
        return url;
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = realCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          capturedNames.push(a.download);
          origClick();
        };
        return a;
      }
      return realCreateElement(tag);
    });

    // Spy on renderPackHtml so we can (a) capture the options it was called with
    // and (b) inject a raw-rows section into the model before calling through.
    // Injecting raw-rows makes the HTML assertion non-tautological: if
    // paidArtifacts.ts is flipped to 'include-raw-rows', the table element IS
    // rendered and the `.not.toContain` assertion below fails.
    const realRenderPackHtml = uiPacks.renderPackHtml;
    vi.spyOn(uiPacks, 'renderPackHtml').mockImplementation((model, options) => {
      const modelWithRawRows = {
        ...model,
        sections: [
          ...model.sections,
          {
            kind: 'raw-rows' as const,
            headers: ['x', 'y'],
            rows: [['1', '2'], ['3', '4']],
          },
        ],
      };
      return realRenderPackHtml(modelWithRawRows, options);
    });

    const q1 = createConsultationQuestion('Does the Monday startup differ?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    const q2 = createConsultationQuestion('What is the machine warm-up time?');
    const consultation = {
      ...createConsultation('Line 3 Monday drift'),
      questions: [q1, q2],
    };

    const conditionView: ResolvedView = {
      kind: 'condition',
      label: 'Day_of_Week = Monday',
      statsText: 'Cpk 0.77 · 12 events',
    };

    paidExportConsultationPack({
      consultation,
      views: [conditionView],
      appVersion: '1.0.0',
    });

    // renderPackHtml must have been called with redaction: 'no-raw-rows'.
    expect(uiPacks.renderPackHtml).toHaveBeenCalledWith(
      expect.anything(),
      { redaction: 'no-raw-rows' }
    );

    expect(capturedBlobs).toHaveLength(2);
    const htmlIdx = capturedNames.findIndex(n => n.endsWith('.html'));
    expect(htmlIdx).toBeGreaterThanOrEqual(0);

    const htmlText = await capturedBlobs[htmlIdx].text();
    // PRIVACY GUARANTEE: 'no-raw-rows' redaction must suppress the <table> element
    // with class "raw-rows-table".  The CSS class name appears in the inline <style>
    // block regardless of redaction; only the rendered table element is suppressed.
    // This assertion FAILS if paidArtifacts.ts is flipped to 'include-raw-rows'
    // because the injected raw-rows section above would then be rendered as a table.
    expect(htmlText).not.toContain('<table class="raw-rows-table">');

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('MD blob contains [id: <questionId>] for each question', async () => {
    const capturedBlobs: Blob[] = [];
    const capturedNames: string[] = [];

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        const url = `blob:mock-${capturedBlobs.length}`;
        capturedBlobs.push(blob);
        return url;
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = realCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          capturedNames.push(a.download);
          origClick();
        };
        return a;
      }
      return realCreateElement(tag);
    });

    const q1 = createConsultationQuestion('Does the Monday startup differ?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    const q2 = createConsultationQuestion('What is the machine warm-up time?');
    const consultation = {
      ...createConsultation('Line 3 Monday drift'),
      questions: [q1, q2],
    };

    paidExportConsultationPack({
      consultation,
      views: [],
      appVersion: '1.0.0',
    });

    expect(capturedBlobs).toHaveLength(2);
    const mdIdx = capturedNames.findIndex(n => n.endsWith('.md'));
    expect(mdIdx).toBeGreaterThanOrEqual(0);

    const mdText = await capturedBlobs[mdIdx].text();
    // Each question's real id must appear as a stable anchor.
    for (const q of consultation.questions) {
      expect(mdText).toContain(`[id: ${q.id}]`);
    }

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

// ── Filename fallback ─────────────────────────────────────────────────────────

describe('paidArtifacts — filename fallback for empty/non-ASCII title', () => {
  it('uses "consultation" stem when title is empty string', () => {
    const names: string[] = [];

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = realCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          names.push(a.download);
          origClick();
        };
        return a;
      }
      return realCreateElement(tag);
    });

    const consultation = createConsultation('');
    paidExportConsultationPack({ consultation, views: [], appVersion: '1.0.0' });

    expect(names.some(n => n.startsWith('consultation'))).toBe(true);

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses "consultation" stem when title is punctuation-only', () => {
    const names: string[] = [];

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = realCreateElement('a');
        const origClick = a.click.bind(a);
        a.click = () => {
          names.push(a.download);
          origClick();
        };
        return a;
      }
      return realCreateElement(tag);
    });

    const consultation = createConsultation('!!! ???');
    paidExportConsultationPack({ consultation, views: [], appVersion: '1.0.0' });

    expect(names.some(n => n.startsWith('consultation'))).toBe(true);

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
