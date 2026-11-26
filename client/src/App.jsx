import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CanonicalManager from './components/CanonicalManager';
import { useAuthStore } from './store/authStore';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import ReturnsPolicy from './pages/ReturnsPolicy';
import TrackOrder from './pages/TrackOrder';

// Admin Pages (Code-split with React.lazy to reduce initial render-blocking JS on mobile)
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminNewProduct = React.lazy(() => import('./pages/admin/AdminNewProduct'));
const AdminPromo = React.lazy(() => import('./pages/admin/AdminPromo'));
const AdminRevenue = React.lazy(() => import('./pages/admin/AdminRevenue'));
const AdminInquiries = React.lazy(() => import('./pages/admin/AdminInquiries'));

// Super Admin Page (Code-split)
const SuperAdminDashboard = React.lazy(() => import('./pages/superadmin/SuperAdminDashboard'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/superadmin');

  return (
    <>
      <ScrollToTop />
      <CanonicalManager />
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <CartDrawer />}
      <main style={{ minHeight: isAdminRoute ? '100vh' : 'calc(100vh - 72px)' }}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Router>
      <Layout>
        <React.Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ash)' }}>Loading...</div>}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/returns" element={<ReturnsPolicy />} />
          <Route path="/return-policy" element={<ReturnsPolicy />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Customer Routes */}
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Back-Office / Admin Login Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/portal" element={<Navigate to="/admin/login" replace />} />
          <Route path="/manage" element={<Navigate to="/admin/login" replace />} />
          <Route path="/super-admin/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/superadmin/login" element={<Navigate to="/admin/login" replace />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/orders" replace />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="new-product" element={<AdminNewProduct />} />
            <Route path="promo" element={<AdminPromo />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="inquiries" element={<AdminInquiries />} />
          </Route>

          {/* Protected Super Admin Route */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </Layout>
  </Router>
  );
}
