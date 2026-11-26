import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://elvanewears.com';

const ROUTE_META = {
  '/': {
    title: 'Elvane Wear — Luxury Minimalist Tracksuit Sets Pakistan',
    description: 'Discover luxury minimalist tracksuit sets crafted from pure cashmere-touch, merino wool, and heavyweight French terry. Handcrafted in Pakistan with Cash on Delivery.',
    canonical: `${BASE_URL}/`,
  },
  '/shop': {
    title: 'Shop Luxury Minimalist Tracksuits & Sets | Elvane Wear',
    description: 'Explore all limited-edition luxury tracksuits, premium heavyweight French terry sets, and refined loungewear crafted by Elvane Wear Atelier.',
    canonical: `${BASE_URL}/shop`,
  },
  '/about': {
    title: 'About Our Brand & Faisalabad Heritage Craftsmanship | Elvane Wear',
    description: 'Learn about Elvane Wear Atelier: engineered for movement, designed for stillness. Textile heritage, slow fashion, and architectural tailoring in Faisalabad, Pakistan.',
    canonical: `${BASE_URL}/about`,
  },
  '/contact': {
    title: 'Client Care & Atelier Inquiries | Elvane Wear',
    description: 'Get in touch with the Elvane Wear Atelier team for styling guidance, sizing consultations, bespoke orders, and order assistance.',
    canonical: `${BASE_URL}/contact`,
  },
  '/returns': {
    title: 'Returns & Exchange Policy | Elvane Wear Client Care Guarantee',
    description: 'Read our comprehensive client care guarantee and hassle-free returns & exchange policy for luxury tracksuit sets across Pakistan.',
    canonical: `${BASE_URL}/returns`,
  },
  '/return-policy': {
    title: 'Returns & Exchange Policy | Elvane Wear Client Care Guarantee',
    description: 'Read our comprehensive client care guarantee and hassle-free returns & exchange policy for luxury tracksuit sets across Pakistan.',
    canonical: `${BASE_URL}/returns`,
  },
  '/track': {
    title: 'Track Your Order Status | Elvane Wear Pakistan',
    description: 'Track the real-time shipping and courier delivery status of your Elvane Wear luxury tracksuit order.',
    canonical: `${BASE_URL}/track`,
  },
};

const NOINDEX_PREFIXES = [
  '/admin',
  '/super-admin',
  '/superadmin',
  '/portal',
  '/manage',
  '/checkout',
  '/account',
  '/wishlist',
  '/login',
  '/register',
  '/verify-email',
];

export default function CanonicalManager() {
  const location = useLocation();

  useEffect(() => {
    const rawPath = location.pathname || '/';
    // Clean trailing slashes (except root '/')
    const cleanPath = rawPath.length > 1 && rawPath.endsWith('/')
      ? rawPath.replace(/\/+$/, '')
      : rawPath;

    // 1. Robots Meta Tag handling (noindex for private routes, clean for public)
    const isPrivate = NOINDEX_PREFIXES.some((prefix) => cleanPath.startsWith(prefix));
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (isPrivate) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // 2. Canonical URL resolution
    let canonicalUrl = `${BASE_URL}${cleanPath === '/' ? '/' : cleanPath}`;

    if (ROUTE_META[cleanPath]?.canonical) {
      canonicalUrl = ROUTE_META[cleanPath].canonical;
    } else if (cleanPath.startsWith('/product/')) {
      const slug = cleanPath.replace('/product/', '');
      canonicalUrl = `${BASE_URL}/product/${slug}`;
    }

    // Update or create <link rel="canonical">
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update or create <meta property="og:url">
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalUrl);

    // 3. Titles and meta descriptions for standard pages (product page manages its own)
    if (!cleanPath.startsWith('/product/') && ROUTE_META[cleanPath]) {
      const meta = ROUTE_META[cleanPath];
      if (meta.title) {
        document.title = meta.title;
      }
      if (meta.description) {
        let descMeta = document.querySelector('meta[name="description"]');
        if (!descMeta) {
          descMeta = document.createElement('meta');
          descMeta.setAttribute('name', 'description');
          document.head.appendChild(descMeta);
        }
        descMeta.setAttribute('content', meta.description);

        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
          ogDesc = document.createElement('meta');
          ogDesc.setAttribute('property', 'og:description');
          document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', meta.description);
      }

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', meta.title);
    }
  }, [location.pathname]);

  return null;
}
