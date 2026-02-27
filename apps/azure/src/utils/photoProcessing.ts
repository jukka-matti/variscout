/**
 * Photo processing utility — EXIF stripping, thumbnail generation, and resizing.
 *
 * Belt-and-suspenders EXIF removal:
 * 1. Canvas re-encoding (drawImage → toBlob) strips EXIF as a side effect
 * 2. Explicit byte-level stripExifFromBlob catches anything the canvas path misses
 *
 * Both layers run on the full-res blob. Thumbnails use toDataURL which cannot
 * carry EXIF metadata.
 */

import { stripExifFromBlob } from '@variscout/core';

// ── Constants ────────────────────────────────────────────────────────────

const THUMBNAIL_MAX_DIM = 320;
const THUMBNAIL_QUALITY = 0.7;
const FULLRES_MAX_DIM = 2048;
const FULLRES_QUALITY = 0.85;

// ── Types ────────────────────────────────────────────────────────────────

export interface ProcessedPhoto {
  fullResBlob: Blob;
  thumbnailDataUrl: string;
  filename: string;
}

// ── Pure helpers (testable without browser APIs) ─────────────────────────

/**
 * Calculate aspect-ratio-preserving dimensions that fit within maxDim.
 * Returns [width, height].
 */
export function fitDimensions(w: number, h: number, maxDim: number): [number, number] {
  if (w <= maxDim && h <= maxDim) return [w, h];
  const ratio = Math.min(maxDim / w, maxDim / h);
  return [Math.round(w * ratio), Math.round(h * ratio)];
}

/**
 * Remove unsafe characters from a filename for OneDrive compatibility.
 * Keeps alphanumeric, hyphens, underscores, dots.
 */
export function sanitizeFilename(name: string): string {
  // Remove path separators and unsafe chars
  const cleaned = name
    .replace(/[/\\:*?"<>|#%&{}!@]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned || 'photo';
}

// ── Browser-dependent helpers ────────────────────────────────────────────

/** Load a File into an HTMLImageElement via object URL */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** Re-encode an image to JPEG Blob at given dimensions and quality. Strips all EXIF. */
function resizeToBlob(img: HTMLImageElement, maxDim: number, quality: number): Promise<Blob> {
  const [w, h] = fitDimensions(img.naturalWidth, img.naturalHeight, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      quality
    );
  });
}

/** Re-encode an image to a base64 data URL at given dimensions and quality. */
function resizeToDataUrl(img: HTMLImageElement, maxDim: number, quality: number): string {
  const [w, h] = fitDimensions(img.naturalWidth, img.naturalHeight, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

// ── Main entry point ─────────────────────────────────────────────────────

/**
 * Process a photo file:
 * 1. Load as HTMLImageElement
 * 2. Generate full-res JPEG Blob (EXIF stripped, max 2048px)
 * 3. Generate thumbnail data URL (max 320px, ~50KB base64)
 * 4. Sanitize filename
 */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const img = await loadImage(file);

  const [rawBlob, thumbnailDataUrl] = await Promise.all([
    resizeToBlob(img, FULLRES_MAX_DIM, FULLRES_QUALITY),
    Promise.resolve(resizeToDataUrl(img, THUMBNAIL_MAX_DIM, THUMBNAIL_QUALITY)),
  ]);

  // Defense-in-depth: explicit byte-level EXIF strip after canvas re-encoding
  const fullResBlob = await stripExifFromBlob(rawBlob);

  // Ensure filename has .jpg extension
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const filename = sanitizeFilename(baseName) + '.jpg';

  return { fullResBlob, thumbnailDataUrl, filename };
}
