import { describe, it, expect } from 'vitest';
import {
  validateAttachmentFile,
  sanitizeFilename,
  inferMimeFromExtension,
  FILE_SIZE_LIMITS,
  FILE_MAGIC_BYTES,
  SUPPORTED_ATTACHMENT_TYPES,
} from '../fileValidation';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFile(bytes: number[], filename: string, type: string, extraSize = 0): File {
  const full = new Uint8Array([...bytes, ...new Array(extraSize).fill(0)]);
  return new File([full], filename, { type });
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK

// ── validateAttachmentFile ───────────────────────────────────────────────────

describe('validateAttachmentFile', () => {
  describe('PDF', () => {
    it('accepts a valid PDF (correct magic bytes, under limit)', async () => {
      const file = makeFile(PDF_MAGIC, 'report.pdf', 'application/pdf', 100);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('rejects a PDF with wrong magic bytes', async () => {
      const file = makeFile([0x00, 0x00, 0x00, 0x00], 'fake.pdf', 'application/pdf', 100);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/does not match/);
    });

    it('rejects a PDF exceeding 10 MB', async () => {
      const oversized = FILE_SIZE_LIMITS['application/pdf'] + 1;
      const bytes = new Uint8Array(oversized);
      bytes.set(PDF_MAGIC);
      const file = new File([bytes], 'huge.pdf', { type: 'application/pdf' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/10 MB/);
    });

    it('rejects a PDF smaller than 4 bytes', async () => {
      const file = new File([new Uint8Array([0x25, 0x50])], 'tiny.pdf', {
        type: 'application/pdf',
      });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/too small/);
    });
  });

  describe('XLSX', () => {
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    it('accepts a valid XLSX (PK magic bytes, under limit)', async () => {
      const file = makeFile(XLSX_MAGIC, 'data.xlsx', XLSX_MIME, 200);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects XLSX with wrong magic bytes', async () => {
      const file = makeFile([0x00, 0x00, 0x00, 0x00], 'fake.xlsx', XLSX_MIME, 100);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/does not match/);
    });

    it('rejects XLSX over 10 MB', async () => {
      const oversized = FILE_SIZE_LIMITS[XLSX_MIME] + 1;
      const bytes = new Uint8Array(oversized);
      bytes.set(XLSX_MAGIC);
      const file = new File([bytes], 'big.xlsx', { type: XLSX_MIME });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/10 MB/);
    });
  });

  describe('CSV', () => {
    it('accepts a valid CSV (text, no magic bytes required)', async () => {
      const content = new TextEncoder().encode('col1,col2\n1,2\n3,4');
      const file = new File([content], 'data.csv', { type: 'text/csv' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects CSV over 5 MB', async () => {
      const oversized = FILE_SIZE_LIMITS['text/csv'] + 1;
      const file = new File([new Uint8Array(oversized)], 'big.csv', {
        type: 'text/csv',
      });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/5 MB/);
    });
  });

  describe('TXT', () => {
    it('accepts a valid plain text file', async () => {
      const content = new TextEncoder().encode('Hello world');
      const file = new File([content], 'notes.txt', { type: 'text/plain' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects TXT over 1 MB', async () => {
      const oversized = FILE_SIZE_LIMITS['text/plain'] + 1;
      const file = new File([new Uint8Array(oversized)], 'wall.txt', {
        type: 'text/plain',
      });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/1 MB/);
    });
  });

  describe('unsupported types', () => {
    it('rejects an MP4 video file', async () => {
      const file = makeFile([0x00, 0x00, 0x00, 0x00], 'video.mp4', 'video/mp4', 100);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/Unsupported file type/);
    });

    it('rejects an unknown type with no MIME set, using extension inference', async () => {
      // A .docx file is not in the supported list
      const file = new File([new Uint8Array(10)], 'report.docx', { type: '' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
    });

    it('rejects a file with empty type and unrecognised extension', async () => {
      const file = new File([new Uint8Array(10)], 'archive.zip', { type: '' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/Unsupported file type/);
    });
  });

  describe('MIME inference fallback', () => {
    it('accepts a PDF with empty type when extension is .pdf', async () => {
      const file = makeFile(PDF_MAGIC, 'report.pdf', '', 100);
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a CSV with empty type when extension is .csv', async () => {
      const content = new TextEncoder().encode('a,b\n1,2');
      const file = new File([content], 'data.csv', { type: '' });
      const result = await validateAttachmentFile(file);
      expect(result.valid).toBe(true);
    });
  });
});

// ── sanitizeFilename ─────────────────────────────────────────────────────────

describe('sanitizeFilename', () => {
  it('leaves a clean filename unchanged', () => {
    expect(sanitizeFilename('report_2024.pdf')).toBe('report_2024.pdf');
  });

  it('strips forward slashes (path traversal)', () => {
    // Slashes removed first, then leading dots removed → remaining chars cleaned
    // '../../etc/passwd' → '....etcpasswd' → 'etcpasswd'
    expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
  });

  it('strips backslashes', () => {
    expect(sanitizeFilename('folder\\file.txt')).toBe('folderfile.txt');
  });

  it('removes leading dots', () => {
    expect(sanitizeFilename('...hidden.txt')).toBe('hidden.txt');
  });

  it('replaces special characters with underscores and collapses runs', () => {
    // Spaces and parens become underscores, consecutive underscores collapse
    // 'my file (v2)!.pdf' → 'my_file__v2__.pdf' → 'my_file_v2_.pdf'
    expect(sanitizeFilename('my file (v2)!.pdf')).toBe('my_file_v2_.pdf');
  });

  it('collapses multiple consecutive underscores', () => {
    expect(sanitizeFilename('my   file.csv')).toBe('my_file.csv');
  });

  it('returns "attachment" for an empty result', () => {
    expect(sanitizeFilename('')).toBe('attachment');
  });

  it('replaces special-char-only names with a single underscore (not "attachment")', () => {
    // '!!!' → '___' → '_' (a single underscore is not empty, so no fallback)
    expect(sanitizeFilename('!!!')).toBe('_');
  });

  it('preserves hyphens and dots', () => {
    expect(sanitizeFilename('data-export-2024.csv')).toBe('data-export-2024.csv');
  });
});

// ── inferMimeFromExtension ───────────────────────────────────────────────────

describe('inferMimeFromExtension', () => {
  it('infers image/jpeg from .jpg', () => {
    expect(inferMimeFromExtension('photo.jpg')).toBe('image/jpeg');
  });

  it('infers image/jpeg from .jpeg', () => {
    expect(inferMimeFromExtension('photo.jpeg')).toBe('image/jpeg');
  });

  it('infers image/png from .png', () => {
    expect(inferMimeFromExtension('chart.png')).toBe('image/png');
  });

  it('infers application/pdf from .pdf', () => {
    expect(inferMimeFromExtension('report.pdf')).toBe('application/pdf');
  });

  it('infers xlsx MIME from .xlsx', () => {
    expect(inferMimeFromExtension('data.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  it('infers text/csv from .csv', () => {
    expect(inferMimeFromExtension('export.csv')).toBe('text/csv');
  });

  it('infers text/plain from .txt', () => {
    expect(inferMimeFromExtension('notes.txt')).toBe('text/plain');
  });

  it('returns empty string for unknown extension', () => {
    expect(inferMimeFromExtension('archive.zip')).toBe('');
  });

  it('is case-insensitive', () => {
    expect(inferMimeFromExtension('PHOTO.JPG')).toBe('image/jpeg');
  });
});

// ── constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('FILE_SIZE_LIMITS covers all SUPPORTED_ATTACHMENT_TYPES', () => {
    for (const mime of SUPPORTED_ATTACHMENT_TYPES) {
      expect(FILE_SIZE_LIMITS[mime]).toBeGreaterThan(0);
    }
  });

  it('FILE_MAGIC_BYTES entries are subsets of SUPPORTED_ATTACHMENT_TYPES', () => {
    for (const mime of Object.keys(FILE_MAGIC_BYTES)) {
      expect(SUPPORTED_ATTACHMENT_TYPES).toContain(mime);
    }
  });

  it('PDF size limit is 10 MB', () => {
    expect(FILE_SIZE_LIMITS['application/pdf']).toBe(10 * 1024 * 1024);
  });

  it('CSV size limit is 5 MB', () => {
    expect(FILE_SIZE_LIMITS['text/csv']).toBe(5 * 1024 * 1024);
  });

  it('TXT size limit is 1 MB', () => {
    expect(FILE_SIZE_LIMITS['text/plain']).toBe(1 * 1024 * 1024);
  });
});
