/**
 * File validation utilities for finding comment attachments.
 * Validates non-image file types via magic bytes and enforces per-type size limits.
 * Complements imageValidation.ts which handles JPEG/PNG for CoScout chat.
 */

// ── Magic Bytes ──────────────────────────────────────────────────────────────

/**
 * Magic byte signatures for binary file types that require content verification.
 * Text-based types (CSV, TXT) have no magic bytes and are validated by size only.
 */
export const FILE_MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }> = {
  'application/pdf': { bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    bytes: [0x50, 0x4b, 0x03, 0x04], // PK (ZIP-based)
  },
};

// ── Size Limits ──────────────────────────────────────────────────────────────

/** Per-type maximum file size in bytes for finding attachments */
export const FILE_SIZE_LIMITS: Record<string, number> = {
  'image/jpeg': 2 * 1024 * 1024, // 2 MB
  'image/png': 2 * 1024 * 1024, // 2 MB
  'application/pdf': 10 * 1024 * 1024, // 10 MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024, // 10 MB
  'text/csv': 5 * 1024 * 1024, // 5 MB
  'text/plain': 1 * 1024 * 1024, // 1 MB
};

/** All MIME types accepted as finding attachments */
export const SUPPORTED_ATTACHMENT_TYPES: readonly string[] = Object.keys(FILE_SIZE_LIMITS);

// ── Extension → MIME Inference ───────────────────────────────────────────────

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/**
 * Infer MIME type from file extension when `file.type` is empty.
 * Returns an empty string if the extension is unrecognised.
 */
export function inferMimeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  return EXT_TO_MIME[ext] ?? '';
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface AttachmentValidationResult {
  valid: boolean;
  /** Human-readable rejection reason; undefined when valid */
  reason?: string;
}

/**
 * Validate a file for attachment to a finding comment.
 *
 * Checks, in order:
 * 1. MIME type is in the supported list (falls back to extension inference)
 * 2. File size is within the per-type limit
 * 3. Magic bytes match for binary types (PDF, XLSX)
 *
 * Text-based types (CSV, TXT) skip the magic-byte check.
 */
export async function validateAttachmentFile(file: File): Promise<AttachmentValidationResult> {
  const mimeType = file.type || inferMimeFromExtension(file.name);

  if (!SUPPORTED_ATTACHMENT_TYPES.includes(mimeType)) {
    return {
      valid: false,
      reason: `Unsupported file type: ${mimeType || 'unknown'}`,
    };
  }

  const limit = FILE_SIZE_LIMITS[mimeType];
  if (limit !== undefined && file.size > limit) {
    const limitMb = Math.round(limit / 1024 / 1024);
    return { valid: false, reason: `File exceeds ${limitMb} MB limit` };
  }

  const magicSpec = FILE_MAGIC_BYTES[mimeType];
  if (magicSpec) {
    if (file.size < 4) {
      return { valid: false, reason: 'File too small to verify format' };
    }
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const offset = magicSpec.offset ?? 0;
    const matches = magicSpec.bytes.every((b, i) => bytes[offset + i] === b);
    if (!matches) {
      return { valid: false, reason: 'File content does not match expected format' };
    }
  }

  return { valid: true };
}

// ── Filename Sanitization ────────────────────────────────────────────────────

/**
 * Sanitize a filename for safe storage in OneDrive / IndexedDB.
 *
 * Rules applied in order:
 * 1. Strip path separators (`/` and `\`)
 * 2. Remove leading dots (hidden-file prevention)
 * 3. Replace characters outside `[a-zA-Z0-9._-]` with underscores
 * 4. Collapse consecutive underscores to a single one
 * 5. Fall back to `"attachment"` if the result is empty
 */
export function sanitizeFilename(filename: string): string {
  let clean = filename.replace(/[/\\]/g, '');
  clean = clean.replace(/^\.+/, '');
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
  clean = clean.replace(/_+/g, '_');
  return clean || 'attachment';
}
