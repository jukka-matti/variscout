/**
 * Image validation utilities for CoScout attachments.
 * Validates file type via magic bytes and enforces size limits.
 */

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES_PER_MESSAGE = 2;

export const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

/**
 * Validate an image file by checking magic bytes and size.
 * Returns true if the file is a valid JPEG or PNG under 2MB.
 */
export async function validateImageFile(file: File): Promise<boolean> {
  if (file.size > MAX_IMAGE_SIZE) return false;
  if (file.size < 4) return false;

  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [, magic] of Object.entries(MAGIC_BYTES)) {
    if (magic.every((b, i) => bytes[i] === b)) return true;
  }
  return false;
}

/** Convert a File to a base64 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export { MAX_IMAGE_SIZE, MAX_IMAGES_PER_MESSAGE };
