import express from 'express';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, authorize, requireVerifiedEmail } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createAuditLog } from '../utils/auditLog.js';
import { sendOrderPlacedEmail, sendOrderStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

// Optional token middleware for guest or registered checkout
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null;
    }
  }
  next();
};

// Create order (Guests allowed without login/account, or registered users)
router.post('/', optionalAuth, upload.single('jazzCashScreenshot'), async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const parsedItems = JSON.parse(items);
    
    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    let subtotal = 0;
    const orderItems = [];
    for (const item of parsedItems) {
      const qty = Math.floor(Number(item.quantity));
      if (!qty || qty < 1 || isNaN(qty)) {
        return res.status(400).json({ message: 'Each item quantity must be at least 1' });
      }
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.inventoryCount < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
      }
      const matchedColor = product.colors?.find(
        (c) => c.name?.toLowerCase() === String(item.color || '').toLowerCase()
      );
      const colorImg =
        matchedColor?.modelImage ||
        matchedColor?.imageUrl ||
        matchedColor?.articleImage ||
        product.images?.[0] ||
        '';

      orderItems.push({
        product: product._id,
        title: product.title,
        image: colorImg,
        color: String(item.color || ''),
        size: String(item.size || ''),
        quantity: qty,
        price: product.price,
      });
      subtotal += product.price * qty;
      product.inventoryCount -= qty;
      await product.save();
    }

    const parsedAddress = JSON.parse(shippingAddress);
    if (parsedAddress && typeof parsedAddress === 'object') {
      parsedAddress.state = parsedAddress.state || parsedAddress.city || 'Pakistan';
      parsedAddress.zip = parsedAddress.zip || '00000';
    }

    const recipientEmail = parsedAddress.email || req.user?.email || '';
    const recipientName = parsedAddress.fullName || req.user?.name || 'Valued Customer';

    const order = await Order.create({
      user: req.user?._id || null,
      items: orderItems,
      shippingAddress: parsedAddress,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      subtotal,
      total: subtotal,
    });

    // Trigger instant Order Placed email notification
    if (recipientEmail) {
      sendOrderPlacedEmail(order, recipientEmail, recipientName).catch((err) => {
        console.warn('Order placed email notification error:', err.message);
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my orders (customer)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all orders
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.orderStatus = status;
    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update order status
router.put('/:id/status', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const before = { orderStatus: order.orderStatus };
    order.orderStatus = req.body.orderStatus;
    if (req.body.adminNotes) order.adminNotes = req.body.adminNotes;
    await order.save();
    await order.populate('user', 'name email');

    // Trigger status update email (Confirmed, Dispatched, Delivered, Cancelled)
    const recipientEmail = order.user?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      sendOrderStatusUpdateEmail(order, recipientEmail, order.orderStatus).catch((err) => {
        console.warn('Status update email error:', err.message);
      });
    }

    await createAuditLog({
      admin: req.user,
      actionType: 'ORDER_STATUS_UPDATED',
      targetType: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      before,
      after: { orderStatus: order.orderStatus },
      description: `Order ${order.orderNumber} status: ${before.orderStatus} → ${order.orderStatus}`
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public: Track order by orderNumber (no login required)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const rawRef = req.params.orderNumber.toUpperCase().trim();
    const order = await Order.findOne({ orderNumber: rawRef });
    if (!order) {
      return res.status(404).json({ message: `No active order found with reference: ${rawRef}` });
    }

    res.json({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemsCount: order.items?.length,
      items: order.items.map((it) => ({
        title: it.title,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        image: it.image,
        price: it.price,
      })),
      city: order.shippingAddress?.city,
      recipientName: order.shippingAddress?.fullName,
      total: order.total,
      paymentMethod: order.paymentMethod,
      adminNotes: order.adminNotes || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Verify JazzCash payment
router.put('/:id/verify-payment', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const before = { paymentStatus: order.paymentStatus };
    order.paymentStatus = req.body.paymentStatus; // 'Verified' or 'Rejected'
    await order.save();

    await createAuditLog({
      admin: req.user,
      actionType: req.body.paymentStatus === 'Verified' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      targetType: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      before,
      after: { paymentStatus: order.paymentStatus },
      description: `JazzCash payment ${req.body.paymentStatus.toLowerCase()} for ${order.orderNumber}`
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Apply discount to order
router.put('/:id/discount', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const before = { discountPercent: order.discountPercent, discountAmount: order.discountAmount, total: order.total };
    const { discountPercent, discountAmount } = req.body;
    
    if (discountPercent) {
      order.discountPercent = Number(discountPercent);
      order.discountAmount = Math.round(order.subtotal * (Number(discountPercent) / 100));
    } else if (discountAmount) {
      order.discountAmount = Number(discountAmount);
      order.discountPercent = Math.round((Number(discountAmount) / order.subtotal) * 100);
    }
    order.total = order.subtotal - order.discountAmount;
    await order.save();

    await createAuditLog({
      admin: req.user,
      actionType: 'DISCOUNT_APPLIED',
      targetType: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      before,
      after: { discountPercent: order.discountPercent, discountAmount: order.discountAmount, total: order.total },
      description: `Applied ${order.discountPercent}% discount (Rs. ${order.discountAmount}) to ${order.orderNumber}`
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Revenue stats
router.get('/stats/revenue', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { period } = req.query; // daily, weekly, monthly
    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      orderStatus: { $nin: ['Cancelled'] }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const codOrders = orders.filter(o => o.paymentMethod === 'COD').length;
    const jazzCashOrders = orders.filter(o => o.paymentMethod === 'JazzCash').length;
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
    const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;

    // Group by date
    const revenueByDate = {};
    orders.forEach(o => {
      let key;
      if (period === 'monthly') {
        key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const weekStart = new Date(o.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = o.createdAt.toISOString().split('T')[0];
      }
      if (!revenueByDate[key]) revenueByDate[key] = { date: key, revenue: 0, orders: 0 };
      revenueByDate[key].revenue += o.total;
      revenueByDate[key].orders += 1;
    });

    // Top selling products
    const productSales = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const id = item.product.toString();
        if (!productSales[id]) productSales[id] = { title: item.title, totalSold: 0, totalRevenue: 0 };
        productSales[id].totalSold += item.quantity;
        productSales[id].totalRevenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

    res.json({
      totalRevenue, totalOrders, codOrders, jazzCashOrders, deliveredOrders, pendingOrders,
      revenueChart: Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
