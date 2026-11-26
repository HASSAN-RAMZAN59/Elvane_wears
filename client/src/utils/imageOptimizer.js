/**
 * Utility for optimizing images, serving modern WebP/AVIF formats,
 * generating responsive widths, and stripping unnecessary bytes.
 */

/**
 * Optimizes an image URL (Cloudinary or local) with responsive resizing and WebP/AVIF format.
 * 
 * @param {string} url - Original image URL
 * @param {object} options - Options { width, quality, format, crop }
 * @returns {string} - Optimized URL
 */
export function optimizeImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return '';

  const {
    width,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
  } = options;

  // Cloudinary URL Optimization
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    const parts = url.split('/image/upload/');
    if (parts.length === 2) {
      const prefix = parts[0] + '/image/upload/';
      let rest = parts[1];

      const transforms = [];
      transforms.push(`f_${format}`);
      transforms.push(`q_${quality}`);

      if (width) {
        transforms.push(`w_${width}`);
        transforms.push(`c_${crop}`);
      }

      const transformStr = transforms.join(',');

      // If already has some transformations immediately after /upload/
      if (rest.startsWith('v') && /^\/upload\/v\d+/.test(url.slice(parts[0].length))) {
        return `${prefix}${transformStr}/${rest}`;
      } else if (!rest.startsWith('v')) {
        // May already have transformation segment like f_auto,q_auto/v...
        const slashIdx = rest.indexOf('/');
        if (slashIdx !== -1 && !rest.slice(0, slashIdx).startsWith('v')) {
          // Replace existing transformation segment
          const pathAfterTransform = rest.slice(slashIdx + 1);
          return `${prefix}${transformStr}/${pathAfterTransform}`;
        }
      }

      return `${prefix}${transformStr}/${rest}`;
    }
  }

  // Local uploads fallback (.jpg / .png -> .webp if available)
  if (url.startsWith('/uploads/') && /\.(jpg|jpeg|png)$/i.test(url)) {
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  return url;
}

/**
 * Generates responsive srcset string for responsive <img> elements.
 * 
 * @param {string} url - Base image URL
 * @param {number[]} widths - Array of viewport candidate widths (e.g. [360, 640, 960, 1280])
 * @returns {string} - srcset string
 */
export function getResponsiveSrcSet(url, widths = [360, 640, 960, 1280]) {
  if (!url || typeof url !== 'string') return '';
  return widths
    .map((w) => `${optimizeImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
