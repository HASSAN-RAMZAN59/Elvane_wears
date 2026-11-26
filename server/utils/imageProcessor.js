import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Automatically converts an uploaded JPG/PNG image into WebP format
 * while preserving the original file.
 * 
 * @param {string} filePath - Absolute path to the uploaded image file
 * @returns {Promise<{ originalPath: string, webpPath: string, webpFilename: string }>}
 */
export async function convertToWebP(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { originalPath: filePath, webpPath: null, webpFilename: null };
  }

  const ext = path.extname(filePath).toLowerCase();
  
  // If already webp, nothing to convert
  if (ext === '.webp') {
    return {
      originalPath: filePath,
      webpPath: filePath,
      webpFilename: path.basename(filePath),
    };
  }

  // Only convert standard raster formats (jpg, jpeg, png)
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return { originalPath: filePath, webpPath: null, webpFilename: null };
  }

  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  const webpFilename = `${baseName}.webp`;
  const webpPath = path.join(dir, webpFilename);

  try {
    await sharp(filePath)
      .webp({ quality: 82, effort: 4 })
      .toFile(webpPath);

    return {
      originalPath: filePath,
      webpPath,
      webpFilename,
    };
  } catch (error) {
    console.error('⚠️ [imageProcessor] WebP conversion error:', error.message);
    // Graceful fallback to original file if sharp fails
    return {
      originalPath: filePath,
      webpPath: null,
      webpFilename: null,
    };
  }
}
