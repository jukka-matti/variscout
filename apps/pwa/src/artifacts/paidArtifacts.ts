import type { ProcessHub } from '@variscout/core';
import type { Consultation } from '@variscout/core/consultations';
import {
  buildDocumentSnapshotVrs,
  parseDocumentSnapshotVrs,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores/document-snapshot-vrs';
import {
  buildConsultationPack,
  renderPackHtml,
  type ResolvedView,
} from '@variscout/ui';

interface ExportVrsOptions {
  activeHub: ProcessHub;
  appVersion: string;
}

export function exportVrs({ activeHub, appVersion }: ExportVrsOptions): void {
  const json = buildDocumentSnapshotVrs({
    activeHub,
    metadata: {
      exportSource: 'pwa',
      appVersion,
    },
  });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (activeHub.processGoal ?? 'hub').slice(0, 32).replace(/[^a-z0-9-]+/gi, '-');
  a.download = `${safeName}.vrs`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseVrsFile(file: File): Promise<DocumentSnapshotVrsFile> {
  return parseDocumentSnapshotVrs(await file.text());
}

// ── exportConsultationPack ───────────────────────────────────────────────────

interface ExportConsultationPackOptions {
  consultation: Consultation;
  views: ResolvedView[];
  from?: string;
  appVersion: string;
}

/**
 * Builds a ConsultationPack and triggers two browser downloads:
 *   1. A self-contained `.html` pack (the shareable artefact for the expert).
 *   2. A companion `.md` response template (the editable file the expert fills).
 *
 * Both downloads use the same sanitized filename stem derived from the
 * consultation title, consistent with how `exportVrs` names `.vrs` files.
 *
 * Available only in paid (individual / company) channels — the free-channel
 * stub throws with the standard "not available in this Workspace channel" error.
 */
export function exportConsultationPack({
  consultation,
  views,
  from,
  // appVersion is intentionally unused in V1 — the pack carries no build stamp yet.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appVersion: _appVersion,
}: ExportConsultationPackOptions): void {
  const model = buildConsultationPack({ consultation, views, from });
  const html = renderPackHtml(model, { redaction: 'no-raw-rows' });

  const stem = (consultation.title ?? '')
    .slice(0, 48)
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  const safeName = stem || 'consultation';

  // Download 1: HTML pack.
  triggerDownload(html, `${safeName}.html`, 'text/html');

  // Download 2: Markdown response template.
  const md = model.responseTemplateMarkdown ?? '';
  triggerDownload(md, `${safeName}-response.md`, 'text/markdown');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
