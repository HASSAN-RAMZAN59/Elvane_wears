import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import announcementRoutes from './routes/announcements.js';
import superAdminRoutes from './routes/superAdmin.js';
import inquiryRoutes from './routes/inquiries.js';
import Product from './models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173,https://client-seven-puce-qd31gkp9ny.vercel.app')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'http://localhost:3000',
  'https://client-seven-puce-qd31gkp9ny.vercel.app',
  ...clientUrls,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.endsWith('.elvanewear.com') ||
      cleanOrigin.endsWith('.elvanewears.com');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS policy for origin: ${origin}`));
  },
  credentials: true,
}));

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-email', authLimiter);

const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: 'Too many contact inquiries sent. Please wait a few minutes before submitting another.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/inquiries', '/inquiries'], inquiryLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Ensure uploads directory exists on server startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/seed', express.static(path.join(__dirname, 'uploads', 'seed')));

// Root & Health check
app.get(['/', '/api'], (req, res) => res.json({ status: 'ok', message: 'Elvane Wear API is running' }));
app.get(['/health', '/api/health'], (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Dynamic XML Sitemap for Google Search Console
app.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
  try {
    const products = await Product.find({}).select('slug updatedAt');
    const baseUrl = 'https://elvanewears.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/returns</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/track</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;

    products.forEach((p) => {
      const date = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '2026-11-10';
      xml += `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic robots.txt
app.get(['/robots.txt', '/api/robots.txt'], (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /superadmin
Disallow: /checkout
Disallow: /api/

Sitemap: https://elvanewears.com/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Routes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/orders', '/orders'], orderRoutes);
app.use(['/api/announcements', '/announcements'], announcementRoutes);
app.use(['/api/super-admin', '/super-admin'], superAdminRoutes);
app.use(['/api/inquiries', '/inquiries'], inquiryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏛️  Elvane Wear Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
