import { describe, it, expect } from 'vitest';
import { validateImageFile, MAX_IMAGE_SIZE, MAX_IMAGES_PER_MESSAGE } from '../imageValidation';

describe('validateImageFile', () => {
  it('accepts valid JPEG', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)]);
    const file = new File([bytes], 'photo.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(true);
  });

  it('accepts valid PNG', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(100).fill(0)]);
    const file = new File([bytes], 'photo.png', { type: 'image/png' });
    expect(await validateImageFile(file)).toBe(true);
  });

  it('rejects file with wrong magic bytes', async () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const file = new File([bytes], 'fake.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(false);
  });

  it('rejects file over 2MB', async () => {
    // Create a file just over the limit
    const size = MAX_IMAGE_SIZE + 1;
    const bytes = new Uint8Array(size);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const file = new File([bytes], 'huge.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(false);
  });

  it('rejects file smaller than 4 bytes', async () => {
    const bytes = new Uint8Array([0xff, 0xd8]);
    const file = new File([bytes], 'tiny.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(false);
  });

  it('rejects GIF files (unsupported format)', async () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, ...new Array(100).fill(0)]);
    const file = new File([bytes], 'image.gif', { type: 'image/gif' });
    expect(await validateImageFile(file)).toBe(false);
  });
});

describe('constants', () => {
  it('MAX_IMAGE_SIZE is 2MB', () => {
    expect(MAX_IMAGE_SIZE).toBe(2 * 1024 * 1024);
  });

  it('MAX_IMAGES_PER_MESSAGE is 2', () => {
    expect(MAX_IMAGES_PER_MESSAGE).toBe(2);
  });
});
