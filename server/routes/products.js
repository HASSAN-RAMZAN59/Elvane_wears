import express from 'express';
import fs from 'fs';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createAuditLog } from '../utils/auditLog.js';
import { uploadFileToCloudinary } from '../config/cloudinary.js';
import { syncSitemapToDisk } from '../services/sitemapService.js';
import { convertToWebP } from '../utils/imageProcessor.js';

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, sort, search, featured } = req.query;
    let filter = {};
    if (category && category !== 'All Sets') {
      if (category === 'Newest Release') {
        filter.$or = [
          { category: 'Newest Release' },
          { isNewArrival: true }
        ];
      } else if (category === 'Limited Sets' || category === 'Limited Set') {
        filter.$or = [
          { category: 'Limited Sets' },
          { category: 'Limited Set' },
          { category: 'Limited Edition' }
        ];
      } else {
        filter.category = category;
      }
    }
    if (search) {
      // Escape special regex characters to prevent ReDoS injection attacks
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: safeSearch, $options: 'i' };
    }
    if (featured === 'true') filter.isFeatured = true;

    let query = Product.find(filter);
    if (sort === 'price-asc') query = query.sort({ price: 1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    // Strip inventoryCount for non-admin requests
    const publicProducts = products.map(p => {
      const obj = p.toObject();
      delete obj.inventoryCount;
      // Only return active colors and sizes
      obj.colors = obj.colors.filter(c => c.active);
      obj.sizes = obj.sizes.filter(s => s.active);
      return obj;
    });
    res.json(publicProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get 4 related products for a given slug (public)
router.get('/slug/:slug/related', async (req, res) => {
  try {
    const current = await Product.findOne({ slug: req.params.slug });
    if (!current) return res.status(404).json({ message: 'Product not found' });

    // 1. Fetch products in same category first, excluding the currently viewed product
    let related = await Product.find({
      _id: { $ne: current._id },
      slug: { $ne: current.slug },
      category: current.category,
    })
      .select('title slug price originalPrice images colors category isNewArrival isBestseller')
      .limit(4);

    // 2. If fewer than 4 in same category, fill remaining slots from other products
    if (related.length < 4) {
      const needed = 4 - related.length;
      const existingIds = [current._id, ...related.map((p) => p._id)];
      const others = await Product.find({
        _id: { $nin: existingIds },
        slug: { $ne: current.slug },
      })
        .select('title slug price originalPrice images colors category isNewArrival isBestseller')
        .limit(needed);
      related = [...related, ...others];
    }

    const publicRelated = related.map((p) => {
      const obj = p.toObject();
      if (obj.colors) obj.colors = obj.colors.filter((c) => c.active);
      return obj;
    });

    res.json(publicRelated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.find({ slug: req.params.slug });
    if (!product.length) return res.status(404).json({ message: 'Product not found' });
    const obj = product[0].toObject();
    delete obj.inventoryCount;
    obj.colors = obj.colors.filter(c => c.active);
    obj.sizes = obj.sizes.filter(s => s.active);
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const obj = product.toObject();
    delete obj.inventoryCount;
    obj.colors = obj.colors.filter(c => c.active);
    obj.sizes = obj.sizes.filter(s => s.active);
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all products with full details
router.get('/admin/all', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Upload single image for color variant
router.post('/upload-image', protect, authorize('admin', 'superadmin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Automatically convert JPG/PNG into WebP format while preserving the original file
    const { webpPath, webpFilename } = await convertToWebP(req.file.path);
    const fileToUpload = webpPath || req.file.path;
    let url = `/uploads/${webpFilename || req.file.filename}`;

    try {
      const cloudUrl = await uploadFileToCloudinary(fileToUpload, 'elvena_wear/products');
      if (cloudUrl) {
        url = cloudUrl;
      }
    } catch (err) {
      console.warn('Cloudinary upload fallback to local storage:', err.message);
    }
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create product
router.post('/', protect, authorize('admin', 'superadmin'), upload.array('images', 6), async (req, res) => {
  try {
    const {
      title, slug, description, price, originalPrice, category, fabric, care,
      colors, sizes, inventoryCount, isFeatured, isNewArrival, isBestseller,
      seoTitle, metaDescription, focusKeyword, additionalKeywords, imageAlt, canonicalUrl
    } = req.body;
    let images = [];
    if (req.body.images !== undefined) {
      const bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      if (Array.isArray(bodyImages)) images = bodyImages.filter(Boolean);
    }
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        try {
          const { webpPath, webpFilename } = await convertToWebP(f.path);
          const fileToUpload = webpPath || f.path;
          const cloudUrl = await uploadFileToCloudinary(fileToUpload, 'elvena_wear/products');
          images.push(cloudUrl || `/uploads/${webpFilename || f.filename}`);
        } catch {
          images.push(`/uploads/${f.filename}`);
        }
      }
    }

    const rawColors = typeof colors === 'string' ? JSON.parse(colors || '[]') : (colors || []);
    const parsedColors = rawColors.map(c => ({
      name: c.name,
      hex: c.hex,
      active: c.active !== false,
      modelImage: c.modelImage || c.imageUrl || '',
      articleImage: c.articleImage || c.imageUrl || c.modelImage || '',
      imageUrl: c.imageUrl || c.modelImage || c.articleImage || '',
    }));

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes || '[]') : (sizes || []);

    const product = await Product.create({
      title, slug, description,
      price: Number(price),
      originalPrice: (originalPrice && Number(originalPrice) > 0) ? Number(originalPrice) : null,
      category, fabric, care,
      images,
      colors: parsedColors,
      sizes: parsedSizes,
      inventoryCount: Number(inventoryCount) || 0,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      isBestseller: isBestseller === 'true' || isBestseller === true,
      seoTitle: seoTitle ? seoTitle.trim() : '',
      metaDescription: metaDescription ? metaDescription.trim() : '',
      focusKeyword: focusKeyword ? focusKeyword.trim() : '',
      additionalKeywords: additionalKeywords ? additionalKeywords.trim() : '',
      imageAlt: imageAlt ? imageAlt.trim() : '',
      canonicalUrl: canonicalUrl ? canonicalUrl.trim() : '',
    });

    await createAuditLog({
      admin: req.user,
      actionType: 'PRODUCT_ADDED',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.title,
      after: { title, price, category },
      description: `Added new product: ${title}`
    });

    // Auto-update sitemap on product addition
    syncSitemapToDisk().catch((err) => console.error('Sitemap sync error:', err.message));

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update product (A to Z Edit: title, price, category, description, fabric, care, colors, sizes, images, stock, badges)
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const before = {
      title: product.title,
      price: product.price,
      category: product.category,
      inventoryCount: product.inventoryCount,
      colorsCount: product.colors?.length || 0,
      sizesCount: product.sizes?.length || 0,
    };

    const {
      title, slug, description, price, originalPrice, category, fabric, care,
      colors, sizes, inventoryCount, isFeatured, isNewArrival, isBestseller,
      existingImages,
      seoTitle, metaDescription, focusKeyword, additionalKeywords, imageAlt, canonicalUrl
    } = req.body;

    if (title) product.title = title.trim();
    if (slug) product.slug = slug.trim().toLowerCase();
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) {
      product.originalPrice = (originalPrice === '' || originalPrice === null || Number(originalPrice) <= 0) ? null : Number(originalPrice);
      product.markModified('originalPrice');
    }
    if (category) product.category = category;
    if (fabric !== undefined) product.fabric = fabric;
    if (care !== undefined) product.care = care;

    // SEO updates
    if (seoTitle !== undefined) product.seoTitle = seoTitle.trim();
    if (metaDescription !== undefined) product.metaDescription = metaDescription.trim();
    if (focusKeyword !== undefined) product.focusKeyword = focusKeyword.trim();
    if (additionalKeywords !== undefined) product.additionalKeywords = additionalKeywords.trim();
    if (imageAlt !== undefined) product.imageAlt = imageAlt.trim();
    if (canonicalUrl !== undefined) product.canonicalUrl = canonicalUrl.trim();

    if (sizes) {
      const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      product.sizes = parsedSizes;
    }

    if (colors) {
      const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      product.colors = parsedColors.map(c => ({
        name: c.name,
        hex: c.hex,
        active: c.active !== false,
        modelImage: c.modelImage || c.imageUrl || '',
        articleImage: c.articleImage || c.imageUrl || c.modelImage || '',
        imageUrl: c.imageUrl || c.modelImage || c.articleImage || '',
      }));
    }

    if (inventoryCount !== undefined) product.inventoryCount = Number(inventoryCount);
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isNewArrival !== undefined) product.isNewArrival = isNewArrival === 'true' || isNewArrival === true;
    if (isBestseller !== undefined) product.isBestseller = isBestseller === 'true' || isBestseller === true;

    // Handle Image uploads and gallery array updates
    let uploadedCloudImages = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        try {
          const { webpPath, webpFilename } = await convertToWebP(f.path);
          const fileToUpload = webpPath || f.path;
          const cloudUrl = await uploadFileToCloudinary(fileToUpload, 'elvena_wear/products');
          uploadedCloudImages.push(cloudUrl || `/uploads/${webpFilename || f.filename}`);
        } catch {
          uploadedCloudImages.push(`/uploads/${f.filename}`);
        }
      }
    }

    if (existingImages !== undefined) {
      const parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      product.images = [...parsedExisting, ...uploadedCloudImages];
    } else if (req.body.images !== undefined) {
      const parsedImgs = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      product.images = [...parsedImgs, ...uploadedCloudImages];
    } else if (uploadedCloudImages.length > 0) {
      product.images = [...product.images, ...uploadedCloudImages];
    }

    await product.save();

    await createAuditLog({
      admin: req.user,
      actionType: 'PRODUCT_UPDATED',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.title,
      before,
      after: {
        title: product.title,
        price: product.price,
        category: product.category,
        inventoryCount: product.inventoryCount,
        colorsCount: product.colors?.length || 0,
        sizesCount: product.sizes?.length || 0,
      },
      description: `Admin updated product details: "${product.title}" (Price: Rs. ${product.price}, Stock: ${product.inventoryCount})`
    });

    // Auto-update sitemap on product update
    syncSitemapToDisk().catch((err) => console.error('Sitemap sync error:', err.message));

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete product
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await createAuditLog({
      admin: req.user,
      actionType: 'PRODUCT_DELETED',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.title,
      before: { title: product.title, price: product.price },
      description: `Deleted product: ${product.title}`
    });

    await Product.findByIdAndDelete(req.params.id);

    // Auto-update sitemap on product deletion
    syncSitemapToDisk().catch((err) => console.error('Sitemap sync error:', err.message));

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review (Guest & Member friendly)
router.post('/:id/reviews', async (req, res) => {
  try {
    const { rating, comment, name } = req.body;
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const cleanComment = String(comment || '').trim().slice(0, 500);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reviewerName = String(name || 'Verified Buyer').trim().slice(0, 50) || 'Verified Buyer';

    product.reviews.push({ user: null, name: reviewerName, rating: numRating, comment: cleanComment });
    product.calculateAverageRating();
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
