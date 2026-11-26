import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://elvanewears.com';
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');

if (!fs.existsSync(indexHtmlPath)) {
  console.warn('⚠️  client/dist/index.html not found. Skipping static page generation.');
  process.exit(0);
}

const template = fs.readFileSync(indexHtmlPath, 'utf8');

const STATIC_ROUTES = [
  {
    path: 'shop',
    canonical: `${BASE_URL}/shop`,
    title: 'Shop Luxury Minimalist Tracksuits & Sets | Elvane Wear',
    description: 'Explore all limited-edition luxury tracksuits, premium heavyweight French terry sets, and refined loungewear crafted by Elvane Wear Atelier in Pakistan.',
  },
  {
    path: 'about',
    canonical: `${BASE_URL}/about`,
    title: 'About Our Brand & Faisalabad Heritage Craftsmanship | Elvane Wear',
    description: 'Learn about Elvane Wear Atelier: engineered for movement, designed for stillness. Textile heritage, slow fashion, and architectural tailoring in Faisalabad, Pakistan.',
  },
  {
    path: 'contact',
    canonical: `${BASE_URL}/contact`,
    title: 'Client Care & Atelier Inquiries | Elvane Wear',
    description: 'Get in touch with the Elvane Wear Atelier team for styling guidance, sizing consultations, bespoke orders, and order assistance.',
  },
  {
    path: 'returns',
    canonical: `${BASE_URL}/returns`,
    title: 'Returns & Exchange Policy | Elvane Wear Client Care Guarantee',
    description: 'Read our comprehensive client care guarantee and hassle-free returns & exchange policy for luxury tracksuit sets across Pakistan.',
  },
  {
    path: 'track',
    canonical: `${BASE_URL}/track`,
    title: 'Track Your Order Status | Elvane Wear Pakistan',
    description: 'Track the real-time shipping and courier delivery status of your Elvane Wear luxury tracksuit order.',
  },
];

function formatSlugTitle(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Extract product slugs from API if running, or fallback to public/sitemap.xml
let productRoutes = [];
try {
  const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:5001';
  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  const response = await fetch(`${cleanApiUrl}/api/products`, { signal: AbortSignal.timeout(2000) });
  if (response.ok) {
    const data = await response.json();
    const products = Array.isArray(data) ? data : data.products || [];
    if (products.length > 0) {
      productRoutes = products.map((p) => ({
        path: `product/${p.slug}`,
        canonical: `${BASE_URL}/product/${p.slug}`,
        title: `${p.seoTitle || formatSlugTitle(p.slug)} | Luxury Tracksuits Pakistan | Elvane Wear`,
        description: p.metaDescription || `Shop the ${p.title || formatSlugTitle(p.slug)} complete luxury minimalist tracksuit set crafted in Pakistan with Cash on Delivery.`,
      }));
    }
  }
} catch (err) {
  // Fallback to sitemap.xml if backend is offline during build
}

if (productRoutes.length === 0 && fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const locRegex = /<loc>https:\/\/elvanewears\.com\/product\/([a-zA-Z0-9-_]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(sitemapContent)) !== null) {
    const slug = match[1];
    productRoutes.push({
      path: `product/${slug}`,
      canonical: `${BASE_URL}/product/${slug}`,
      title: `${formatSlugTitle(slug)} | Luxury Tracksuits Pakistan | Elvane Wear`,
      description: `Shop the ${formatSlugTitle(slug)} complete luxury minimalist tracksuit set crafted for comfort, style, and everyday elegance in Pakistan with Cash on Delivery.`,
    });
  }
}

const allRoutes = [...STATIC_ROUTES, ...productRoutes];

function renderPage(route) {
  let html = template;

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" id="canonical-url" href="${route.canonical}" />`
  );

  // Replace or Add og:url
  if (/<meta property="og:url"[^>]*>/i.test(html)) {
    html = html.replace(
      /<meta property="og:url"[^>]*>/i,
      `<meta property="og:url" id="og-url" content="${route.canonical}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `  <meta property="og:url" id="og-url" content="${route.canonical}" />\n  </head>`
    );
  }

  // Replace Title
  if (route.title) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`);
  }

  // Replace Description
  if (route.description) {
    html = html.replace(
      /<meta name="description" content=".*?"/i,
      `<meta name="description" content="${route.description}"`
    );
  }

  const targetDir = path.join(distDir, route.path);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

console.log(`🚀 Pre-generating ${allRoutes.length} static page shells with self-referencing canonicals...`);
for (const route of allRoutes) {
  renderPage(route);
  console.log(`  ✓ Generated /${route.path} -> canonical: ${route.canonical}`);
}
console.log('✅ All static route shells generated successfully in client/dist/');
