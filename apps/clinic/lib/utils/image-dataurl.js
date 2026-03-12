/**
 * Load an image from URL and return as a data URL (base64) for use in PDFs.
 * Returns null if the image fails to load (e.g. CORS, 404) so callers can fallback to text.
 * @param {string} url - Image URL (can be external or same-origin).
 * @returns {Promise<string|null>} Data URL or null.
 */
export function loadImageAsDataUrl(url) {
  if (!url || typeof url !== 'string') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
