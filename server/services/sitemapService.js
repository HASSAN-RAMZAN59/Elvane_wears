import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://elvanewears.com';

/**
 * Generate real-time XML sitemap dynamically from MongoDB
 */
export async function generateSitemapXml() {
  const products = await Product.find({}).select('slug title updatedAt images colors').sort({ updatedAt: -1 });
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/shop</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/returns</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/track</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;

  for (const p of products) {
    if (!p.slug) continue;
    const date = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
    const primaryImg = p.colors?.[0]?.modelImage || p.images?.[0] || '';

    xml += `
  <url>
    <loc>${BASE_URL}/product/${p.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

    if (primaryImg && typeof primaryImg === 'string' && primaryImg.startsWith('http')) {
      const escapedTitle = (p.title || p.slug)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      const escapedImg = primaryImg.replace(/&/g, '&amp;');
      xml += `
    <image:image>
      <image:loc>${escapedImg}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>`;
    }

    xml += `\n  </url>`;
  }

  xml += `\n</urlset>`;
  return xml;
}

/**
 * Automatically sync generated sitemap to any accessible static webroot locations
 */
export async function syncSitemapToDisk() {
  try {
    const xml = await generateSitemapXml();

    const candidateDirs = [
      path.resolve(__dirname, '../../client/public'),
      path.resolve(__dirname, '../../client/dist'),
      path.resolve(__dirname, '../../../elvanewears.com'),
      path.resolve(__dirname, '../../elvanewears.com'),
      path.resolve(__dirname, '../public'),
    ];

    for (const dir of candidateDirs) {
      try {
        if (fs.existsSync(dir)) {
          const targetFile = path.join(dir, 'sitemap.xml');
          fs.writeFileSync(targetFile, xml, 'utf8');
        }
      } catch (err) {
        // Silently continue if directory is not writable
      }
    }
    return true;
  } catch (err) {
    console.error('⚠️ [sitemapService] Failed to sync sitemap to disk:', err.message);
    return false;
  }
}
