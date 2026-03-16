/**
 * Copy a DOM section's content as rich HTML to clipboard.
 * Strips elements marked with data-export-hide before copying.
 * Falls back to text/plain if ClipboardItem API is not available.
 */
export async function copySectionAsHTML(element: HTMLElement): Promise<boolean> {
  try {
    const clone = element.cloneNode(true) as HTMLElement;

    clone.querySelectorAll('[data-export-hide]').forEach(el => el.remove());

    const htmlContent = clone.innerHTML;
    const plainText = clone.innerText;

    if (typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
      ]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }

    return true;
  } catch {
    return false;
  }
}
