import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Edit2, Trash2, Check, X, ShieldAlert, Sparkles,
  Image as ImageIcon, Upload, Eye, CheckCircle2, AlertCircle, Layers, Link2
} from 'lucide-react';
import api, { formatPKR } from '../../utils/api';
import Button3D from '../../components/Button3D';

const CATEGORIES = [
  'Sportswear',
  'Limited Sets',
  'Newest Release'
];

const MASTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PRESET_COLORS = [
  { name: 'Forest Deep Teal', hex: '#374F4F' },
  { name: 'Obsidian & Cream', hex: '#181818' },
  { name: 'Midnight Pitch Black', hex: '#1E1E1E' },
  { name: 'Warm Taupe Sand', hex: '#7A7167' },
  { name: 'Platinum Pearl White', hex: '#D3CAC1' },
  { name: 'Champagne Almond', hex: '#C5AF98' },
  { name: 'Terracotta Rust', hex: '#85462C' },
  { name: 'Washed Olive Sage', hex: '#827F5E' },
];

const isValidHex = (hex) => {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex?.trim() || '');
};

const normalizeHex = (hex) => {
  if (!hex) return '#000000';
  let clean = hex.trim();
  if (!clean.startsWith('#')) clean = '#' + clean;
  if (clean.length === 4) {
    clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
  }
  return clean.toUpperCase();
};

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline quick stock edit
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(0);

  // Color Images Quick Modal
  const [colorModalProduct, setColorModalProduct] = useState(null);
  const [modalColors, setModalColors] = useState([]);
  const [savingColors, setSavingColors] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');
  const [showUrlInputs, setShowUrlInputs] = useState({});

  // ----------------------------------------------------
  // FULL A-TO-Z PRODUCT EDIT MODAL STATE
  // ----------------------------------------------------
  const [editProduct, setEditProduct] = useState(null);
  const [editTab, setEditTab] = useState('general'); // 'general' | 'colors' | 'sizes' | 'images' | 'details'
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editCategory, setEditCategory] = useState('Essential Set');
  const [editInventoryCount, setEditInventoryCount] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editFabric, setEditFabric] = useState('');
  const [editCare, setEditCare] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsNewArrival, setEditIsNewArrival] = useState(false);
  const [editIsBestseller, setEditIsBestseller] = useState(false);
  // SEO state
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');
  const [editFocusKeyword, setEditFocusKeyword] = useState('');
  const [editAdditionalKeywords, setEditAdditionalKeywords] = useState('');
  const [editImageAlt, setEditImageAlt] = useState('');
  const [editCanonicalUrl, setEditCanonicalUrl] = useState('');
  const [editColors, setEditColors] = useState([]);
  const [editSizes, setEditSizes] = useState([]);
  const [editImages, setEditImages] = useState([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#2A2A2A');
  const [customColorNotice, setCustomColorNotice] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products/admin/all');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load admin products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Prevent background scrolling when edit or color modal is open
  useEffect(() => {
    if (editProduct || colorModalProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editProduct, colorModalProduct]);

  // Quick Color Toggle in table
  const handleToggleColor = async (product, colorName) => {
    const updatedColors = product.colors.map((c) =>
      c.name === colorName ? { ...c, active: !c.active } : c
    );
    try {
      await api.put(`/products/${product._id}`, {
        colors: JSON.stringify(updatedColors),
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle color');
    }
  };

  // Quick Size Toggle in table
  const handleToggleSize = async (product, sizeName) => {
    const updatedSizes = product.sizes.map((s) =>
      s.name === sizeName ? { ...s, active: !s.active } : s
    );
    try {
      await api.put(`/products/${product._id}`, {
        sizes: JSON.stringify(updatedSizes),
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle size');
    }
  };

  // Quick Inventory Save
  const handleSaveInventory = async (productId) => {
    try {
      await api.put(`/products/${productId}`, {
        inventoryCount: inventoryValue,
      });
      setEditingInventoryId(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update inventory count');
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action will generate an audit log.`)) {
      return;
    }
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // ----------------------------------------------------
  // OPEN FULL EDIT MODAL WITH PRODUCT DATA
  // ----------------------------------------------------
  const handleOpenEditModal = (prod) => {
    setEditProduct(prod);
    setEditTab('general');
    setEditTitle(prod.title || '');
    setEditSlug(prod.slug || '');
    setEditPrice(prod.price || 0);
    setEditOriginalPrice(prod.originalPrice || '');
    setEditCategory(prod.category || 'Essential Set');
    setEditInventoryCount(prod.inventoryCount || 0);
    setEditDescription(prod.description || '');
    setEditFabric(prod.fabric || '');
    setEditCare(prod.care || '');
    setEditIsFeatured(prod.isFeatured || false);
    setEditIsNewArrival(prod.isNewArrival || false);
    setEditIsBestseller(prod.isBestseller || false);
    setEditSeoTitle(prod.seoTitle || '');
    setEditMetaDescription(prod.metaDescription || '');
    setEditFocusKeyword(prod.focusKeyword || '');
    setEditAdditionalKeywords(prod.additionalKeywords || '');
    setEditImageAlt(prod.imageAlt || '');
    setEditCanonicalUrl(prod.canonicalUrl || '');
    setEditColors(prod.colors ? JSON.parse(JSON.stringify(prod.colors)) : []);
    
    // Ensure all master sizes are represented
    const prodSizesMap = {};
    (prod.sizes || []).forEach((s) => {
      prodSizesMap[s.name] = s.active !== false;
    });
    setEditSizes(
      MASTER_SIZES.map((name) => ({
        name,
        active: prodSizesMap[name] !== undefined ? prodSizesMap[name] : false,
      }))
    );
    setEditImages(prod.images ? [...prod.images] : []);
    setCustomColorNotice(null);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  };

  // Upload an image for a specific color in Edit Modal
  const handleColorImageUpload = async (colorName, field, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingKey(`${colorName}-${field}`);
    try {
      const { data } = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditColors((prev) =>
        prev.map((c) => {
          if (c.name === colorName) {
            const updated = { ...c, [field]: data.url };
            if (field === 'modelImage' && !c.imageUrl) updated.imageUrl = data.url;
            return updated;
          }
          return c;
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image file');
    } finally {
      setUploadingKey('');
    }
  };

  // Upload new gallery image
  const handleGalleryUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingKey('gallery-upload');
    try {
      const { data } = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditImages((prev) => [...prev, data.url]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload gallery image');
    } finally {
      setUploadingKey('');
    }
  };

  const handleRemoveGalleryImage = (idx) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCustomHexChange = (val) => {
    let cleaned = val.trim();
    if (cleaned && !cleaned.startsWith('#')) {
      cleaned = '#' + cleaned;
    }
    setCustomColorHex(cleaned.toUpperCase());
    if (customColorNotice) setCustomColorNotice(null);
  };

  const handleCustomNameChange = (val) => {
    setCustomColorName(val);
    if (customColorNotice) setCustomColorNotice(null);

    // If user typed a hex code in the name field, automatically sync hex & graph
    const trimmed = val.trim();
    if (/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$/.test(trimmed)) {
      const formatted = (trimmed.startsWith('#') ? trimmed : '#' + trimmed).toUpperCase();
      setCustomColorHex(formatted);
    }
  };

  const handleAddCustomColor = (e) => {
    if (e) e.preventDefault();
    setCustomColorNotice(null);

    let finalHex = customColorHex.trim();
    if (finalHex && !finalHex.startsWith('#')) finalHex = '#' + finalHex;

    const trimmedName = customColorName.trim();
    if (/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$/.test(trimmedName)) {
      finalHex = (trimmedName.startsWith('#') ? trimmedName : '#' + trimmedName).toUpperCase();
    }

    if (!isValidHex(finalHex)) {
      setCustomColorNotice({
        type: 'error',
        text: 'Please enter a valid Hex color code (e.g. #2A2A2A).',
      });
      return;
    }

    finalHex = normalizeHex(finalHex);

    const isNameHex = /^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$/.test(trimmedName);
    const colorName = trimmedName && !isNameHex ? trimmedName : `Custom ${finalHex}`;

    const exists = editColors.find(
      (c) =>
        c.name.toLowerCase() === colorName.toLowerCase() ||
        (!trimmedName && c.hex?.toLowerCase() === finalHex.toLowerCase())
    );
    if (exists) {
      setCustomColorNotice({
        type: 'error',
        text: `Color "${exists.name}" already exists in this tracksuit set.`,
      });
      return;
    }

    setEditColors((prev) => [
      ...prev,
      {
        name: colorName,
        hex: finalHex,
        active: true,
        modelImage: '',
        articleImage: '',
        imageUrl: '',
      },
    ]);
    setCustomColorName('');
    setCustomColorNotice({
      type: 'success',
      text: `Added "${colorName}" (${finalHex}).`,
    });
  };

  const handleAddPresetColor = (preset) => {
    const exists = editColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) return;
    setEditColors((prev) => [
      ...prev,
      {
        name: preset.name,
        hex: preset.hex,
        active: true,
        modelImage: '',
        articleImage: '',
        imageUrl: '',
      },
    ]);
  };

  const handleRemoveColor = (colorName) => {
    setEditColors((prev) => prev.filter((c) => c.name !== colorName));
  };

  const handleToggleEditColorActive = (colorName) => {
    setEditColors((prev) =>
      prev.map((c) => (c.name === colorName ? { ...c, active: !c.active } : c))
    );
  };

  const handleToggleEditSizeActive = (sizeName) => {
    setEditSizes((prev) =>
      prev.map((s) => (s.name === sizeName ? { ...s, active: !s.active } : s))
    );
  };

  // Save all product changes
  const handleSaveFullProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const payload = {
        title: editTitle,
        slug: editSlug,
        price: Number(editPrice),
        originalPrice: editOriginalPrice ? Number(editOriginalPrice) : null,
        category: editCategory,
        inventoryCount: Number(editInventoryCount),
        description: editDescription,
        fabric: editFabric,
        care: editCare,
        isFeatured: editIsFeatured,
        isNewArrival: editIsNewArrival,
        isBestseller: editIsBestseller,
        seoTitle: editSeoTitle,
        metaDescription: editMetaDescription,
        focusKeyword: editFocusKeyword,
        additionalKeywords: editAdditionalKeywords,
        imageAlt: editImageAlt,
        canonicalUrl: editCanonicalUrl,
        colors: JSON.stringify(editColors),
        sizes: JSON.stringify(editSizes),
        existingImages: JSON.stringify(editImages),
      };

      const { data } = await api.put(`/products/${editProduct._id}`, payload);
      setSaveSuccessMsg('Product details updated successfully! Audit log generated.');
      
      // Update local products table
      setProducts((prev) => prev.map((p) => (p._id === editProduct._id ? data : p)));
      
      setTimeout(() => {
        setEditProduct(null);
        setSaveSuccessMsg('');
      }, 1200);
    } catch (err) {
      setSaveErrorMsg(err.response?.data?.message || 'Failed to update product details');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--champagne)' }}>
            Catalog Governance
          </span>
          <h1 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 600, color: 'var(--graphite)', marginTop: '4px' }}>
            Store Tracksuits ({products.length})
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--ash)', marginTop: '4px' }}>
            Full A to Z editing: title, price, category, colors, variant photos, sizes, and inventory stock.
          </p>
        </div>

        <Button3D
          variant="primary"
          size="md"
          onClick={() => navigate('/admin/new-product')}
          icon={Plus}
        >
          Add New Tracksuit Set
        </Button3D>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ash)' }}>Loading Catalog...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--cloud)', borderRadius: '16px' }}>
          No tracksuit products found. Click "+ Add New Tracksuit Set" to create one.
        </div>
      ) : (
        <div
          style={{
            background: 'var(--snow)',
            borderRadius: '20px',
            border: '1px solid var(--hairline)',
            boxShadow: '0 4px 20px rgba(26,26,26,0.03)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--cloud)', borderBottom: '1px solid var(--hairline)', color: 'var(--ash)' }}>
                  <th style={{ padding: '16px 20px' }}>Tracksuit Set</th>
                  <th style={{ padding: '16px 20px' }}>Category</th>
                  <th style={{ padding: '16px 20px' }}>Price (PKR)</th>
                  <th style={{ padding: '16px 20px' }}>Active Colors (Click to Toggle)</th>
                  <th style={{ padding: '16px 20px' }}>Active Sizes (Click to Toggle)</th>
                  <th style={{ padding: '16px 20px' }}>Backend Stock</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} style={{ borderBottom: '1px solid var(--hairline)', transition: 'background 0.2s ease' }}>
                    {/* Title */}
                    <td style={{ padding: '18px 20px' }}>
                      <div
                        onClick={() => handleOpenEditModal(product)}
                        style={{ cursor: 'pointer' }}
                        title="Click to edit full product details"
                      >
                        <p style={{ fontWeight: 600, color: 'var(--graphite)', fontSize: '14px', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = 'var(--champagne)')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = 'transparent')}
                        >
                          {product.title}
                        </p>
                        <span style={{ fontSize: '11px', color: 'var(--ash)' }}>/{product.slug}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '18px 20px' }}>
                      <span className="eyebrow" style={{ fontSize: '10px' }}>{product.category}</span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '18px 20px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatPKR(product.price)}</div>
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <div style={{ fontSize: '12px', color: 'var(--ash)', textDecoration: 'line-through' }}>
                          {formatPKR(product.originalPrice)}
                        </div>
                      )}
                    </td>

                    {/* Active Colors with Quick Toggle */}
                    <td style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {product.colors?.map((col) => (
                          <button
                            key={col.name}
                            onClick={() => handleToggleColor(product, col.name)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              background: col.active ? 'var(--snow)' : 'var(--cloud)',
                              border: col.active ? '1px solid var(--graphite)' : '1px dashed var(--mist)',
                              opacity: col.active ? 1 : 0.5,
                              cursor: 'pointer',
                            }}
                            title={`Click to ${col.active ? 'disable' : 'enable'} for customers`}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.hex }} />
                            <span>{col.name}</span>
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Active Sizes with Quick Toggle */}
                    <td style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {product.sizes?.map((sz) => (
                          <button
                            key={sz.name}
                            onClick={() => handleToggleSize(product, sz.name)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              background: sz.active ? 'var(--graphite)' : 'var(--cloud)',
                              color: sz.active ? 'var(--snow)' : 'var(--mist)',
                              border: sz.active ? '1px solid var(--graphite)' : '1px dashed var(--mist)',
                            }}
                            title={`Click to ${sz.active ? 'disable' : 'enable'} size`}
                          >
                            {sz.name}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Backend Inventory Stock */}
                    <td style={{ padding: '18px 20px' }}>
                      {editingInventoryId === product._id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            value={inventoryValue}
                            onChange={(e) => setInventoryValue(Number(e.target.value))}
                            style={{ width: '70px', padding: '4px 8px', fontSize: '12px' }}
                          />
                          <button
                            onClick={() => handleSaveInventory(product._id)}
                            style={{ background: 'var(--success)', color: '#FFF', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingInventoryId(null)}
                            style={{ background: 'var(--cloud)', border: '1px solid var(--hairline)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: product.inventoryCount < 10 ? 'var(--danger)' : 'var(--graphite)' }}>
                            {product.inventoryCount} units
                          </span>
                          <button
                            onClick={() => {
                              setEditingInventoryId(product._id);
                              setInventoryValue(product.inventoryCount);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', padding: '2px' }}
                            title="Quick edit stock count"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions: Full Edit Product Button Added! */}
                    <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Button3D
                          variant="dark"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEditModal(product)}
                          title="Edit all product details (Colors, Price, Photos, Sizes, Stock)"
                        >
                          Edit Product
                        </Button3D>

                        <button
                          onClick={() => {
                            setColorModalProduct(product);
                            setModalColors(product.colors || []);
                          }}
                          style={{
                            background: 'var(--snow)',
                            border: '1px solid var(--hairline)',
                            borderRadius: '8px',
                            color: 'var(--graphite)',
                            cursor: 'pointer',
                            padding: '6px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          }}
                          title="Configure color images for this tracksuit"
                        >
                          <ImageIcon size={13} />
                          <span>Color Images</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product._id, product.title)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--mist)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete Product Set"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. FULL A-TO-Z PRODUCT EDIT MODAL (CENTERED VIEWPORT)  */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {editProduct && (
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditProduct(null)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 15, 15, 0.65)',
                backdropFilter: 'blur(6px)',
              }}
            />

            <motion.div
              data-lenis-prevent="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'var(--snow)',
                borderRadius: '24px',
                border: '1px solid var(--hairline)',
                padding: 'clamp(20px, 3.5vw, 36px)',
                width: '100%',
                maxWidth: '840px',
                maxHeight: '90vh',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                zIndex: 1,
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--hairline)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit2 size={18} color="var(--champagne)" />
                    <span className="eyebrow" style={{ color: 'var(--champagne)' }}>Product Master Editor</span>
                  </div>
                  <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '20px', fontWeight: 600, color: 'var(--graphite)', marginTop: '4px' }}>
                    Edit: {editTitle || editProduct.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--ash)', marginTop: '2px' }}>
                    Changes will be published immediately to the storefront and recorded in Super Admin audit logs.
                  </p>
                </div>
                <button
                  onClick={() => setEditProduct(null)}
                  style={{ background: 'var(--cloud)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ash)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status messages */}
              {saveSuccessMsg && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(90,138,106,0.12)', color: 'var(--success)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {saveErrorMsg && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(163,64,64,0.12)', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* Section Tabs inside Edit Modal */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--cloud)', padding: '4px', borderRadius: '12px', marginBottom: '24px', overflowX: 'auto' }}>
                {[
                  { id: 'general', label: '1. Title & Pricing' },
                  { id: 'colors', label: `2. Colors & Photos (${editColors.length})` },
                  { id: 'sizes', label: `3. Sizes (${editSizes.filter(s => s.active).length} Active)` },
                  { id: 'images', label: `4. Gallery (${editImages.length})` },
                  { id: 'details', label: '5. Fabric & Details' },
                  { id: 'seo', label: '6. SEO & Google' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEditTab(t.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      background: editTab === t.id ? 'var(--snow)' : 'transparent',
                      color: editTab === t.id ? 'var(--graphite)' : 'var(--ash)',
                      boxShadow: editTab === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveFullProduct}>
                {/* TAB 1: TITLE, CATEGORY, PRICE, STOCK, BADGES */}
                {editTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Tracksuit Title *</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="e.g. Signature Velour Gold Tracksuit"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '14px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Category *</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px', cursor: 'pointer' }}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Selling Price in PKR *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="e.g. 4000"
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Original / Cut Price (Optional)</label>
                        <input
                          type="number"
                          min="0"
                          value={editOriginalPrice}
                          onChange={(e) => setEditOriginalPrice(e.target.value)}
                          placeholder="e.g. 8000 (Crossed out)"
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Backend Stock Units *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editInventoryCount}
                          onChange={(e) => setEditInventoryCount(e.target.value)}
                          placeholder="e.g. 50"
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '14px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>URL Slug</label>
                      <input
                        type="text"
                        required
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                        placeholder="slug-url"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Badges toggles */}
                    <div style={{ background: 'var(--cloud)', padding: '16px 20px', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={editIsNewArrival}
                          onChange={(e) => setEditIsNewArrival(e.target.checked)}
                        />
                        <span>New Release Badge</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={editIsBestseller}
                          onChange={(e) => setEditIsBestseller(e.target.checked)}
                        />
                        <span>Bestseller Badge</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={editIsFeatured}
                          onChange={(e) => setEditIsFeatured(e.target.checked)}
                        />
                        <span>Feature on Homepage</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: COLORS & COLOR-SPECIFIC PHOTOS */}
                {editTab === 'colors' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Add Color row */}
                    <div style={{ background: 'var(--cloud)', padding: '16px 20px', borderRadius: '14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                        <span className="eyebrow" style={{ fontSize: '10px' }}>Add Color:</span>
                        <input
                          type="text"
                          placeholder="Color Name (e.g. Royal Navy)"
                          value={customColorName}
                          onChange={(e) => handleCustomNameChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomColor(e);
                            }
                          }}
                          style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hairline)', fontSize: '12px' }}
                        />
                        {/* Editable Hex Code Input + Synchronized Color Picker Graph */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--snow)', padding: '2px 6px', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
                          <input
                            type="text"
                            placeholder="#2A2A2A"
                            value={customColorHex}
                            onChange={(e) => handleCustomHexChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomColor(e);
                              }
                            }}
                            style={{
                              width: '85px',
                              height: '32px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: 'var(--graphite)',
                              border: 'none',
                              background: 'transparent',
                              padding: '0 4px',
                              textTransform: 'uppercase',
                            }}
                            title="Type or paste Hex code (e.g. #3B82F6)"
                          />
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid rgba(0,0,0,0.15)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isValidHex(customColorHex) ? normalizeHex(customColorHex) : '#2A2A2A',
                              cursor: 'pointer',
                            }}
                            title="Click to open color palette graph"
                          >
                            <input
                              type="color"
                              value={isValidHex(customColorHex) && normalizeHex(customColorHex).length === 7 ? normalizeHex(customColorHex) : '#2A2A2A'}
                              onChange={(e) => {
                                setCustomColorHex(e.target.value.toUpperCase());
                                if (customColorNotice) setCustomColorNotice(null);
                              }}
                              style={{
                                position: 'absolute',
                                top: -8,
                                left: -8,
                                width: '44px',
                                height: '44px',
                                opacity: 0,
                                cursor: 'pointer',
                              }}
                            />
                          </div>
                        </div>
                        <Button3D type="button" variant="dark" size="sm" onClick={handleAddCustomColor}>
                          + Add Color
                        </Button3D>
                      </div>
                      {customColorNotice && (
                        <p
                          style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: customColorNotice.type === 'error' ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          {customColorNotice.text}
                        </p>
                      )}
                    </div>

                    {/* Presets shortcut */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--ash)', display: 'block', marginBottom: '8px' }}>
                        Quick Presets:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map((p) => {
                          const isAlreadyAdded = editColors.some((c) => c.name.toLowerCase() === p.name.toLowerCase());
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => handleAddPresetColor(p)}
                              disabled={isAlreadyAdded}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                border: '1px solid var(--hairline)',
                                background: isAlreadyAdded ? 'var(--cloud)' : 'var(--snow)',
                                opacity: isAlreadyAdded ? 0.4 : 1,
                                cursor: isAlreadyAdded ? 'default' : 'pointer',
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.hex }} />
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Colors List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                      {editColors.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ash)', background: 'var(--cloud)', borderRadius: '12px' }}>
                          No colors added yet. Please add at least 1 color variant above.
                        </div>
                      ) : (
                        editColors.map((col, idx) => {
                          const isUploadingModel = uploadingKey === `${col.name}-modelImage`;
                          const isUploadingFlat = uploadingKey === `${col.name}-articleImage`;

                          return (
                            <div
                              key={col.name}
                              style={{
                                background: 'var(--snow)',
                                borderRadius: '16px',
                                border: '1px solid var(--hairline)',
                                padding: '18px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                              }}
                            >
                              {/* Color header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: col.hex, border: '1px solid rgba(0,0,0,0.15)' }} />
                                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--graphite)' }}>{col.name}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--ash)', fontFamily: 'monospace' }}>({col.hex})</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEditColorActive(col.name)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      border: 'none',
                                      background: col.active ? 'rgba(90,138,106,0.15)' : 'var(--cloud)',
                                      color: col.active ? 'var(--success)' : 'var(--ash)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {col.active ? '● Active' : '○ Hidden'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColor(col.name)}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                    title="Remove this color"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Images for this color */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', background: 'var(--cloud)', padding: '14px 16px', borderRadius: '12px' }}>
                                {/* Model Photo */}
                                <div style={{ background: 'var(--snow)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F0ECE4', border: '1px solid var(--hairline)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {col.modelImage ? (
                                          <img src={col.modelImage} alt="Model" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        ) : (
                                          <ImageIcon size={18} color="var(--mist)" />
                                        )}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--graphite)' }}>Model Photo</div>
                                        <div style={{ fontSize: '10px', color: col.modelImage ? 'var(--success)' : 'var(--ash)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          {col.modelImage ? (
                                            <>
                                              <Check size={11} color="var(--success)" />
                                              <span>Photo Ready</span>
                                            </>
                                          ) : (
                                            <span>No photo</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <label style={{ background: isUploadingModel ? 'var(--ash)' : 'var(--graphite)', color: 'var(--snow)', borderRadius: '6px', padding: '6px 10px', cursor: isUploadingModel ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        <Upload size={11} />
                                        <span>{isUploadingModel ? '...' : col.modelImage ? 'Change' : 'Upload'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          disabled={isUploadingModel}
                                          onChange={(e) => handleColorImageUpload(col.name, 'modelImage', e.target.files?.[0])}
                                        />
                                      </label>
                                      {col.modelImage && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditColors((prev) =>
                                              prev.map((c) => (c.name === col.name ? { ...c, modelImage: '', imageUrl: '' } : c))
                                            );
                                          }}
                                          style={{ background: 'none', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '5px 7px', color: 'var(--ash)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                          title="Remove photo"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setShowUrlInputs(prev => ({ ...prev, [`edit-${col.name}-model`]: !prev[`edit-${col.name}-model`] }))}
                                        style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                                        title="Paste link manually"
                                      >
                                        <Link2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {showUrlInputs[`edit-${col.name}-model`] && (
                                    <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--hairline)' }}>
                                      <input
                                        type="text"
                                        placeholder="Paste custom image URL..."
                                        value={col.modelImage || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditColors((prev) =>
                                            prev.map((c) => (c.name === col.name ? { ...c, modelImage: val, imageUrl: val } : c))
                                          );
                                        }}
                                        style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--hairline)', fontSize: '11px' }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Flat-lay photo */}
                                <div style={{ background: 'var(--snow)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F0ECE4', border: '1px solid var(--hairline)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {col.articleImage ? (
                                          <img src={col.articleImage} alt="Flatlay" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        ) : (
                                          <ImageIcon size={18} color="var(--mist)" />
                                        )}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--graphite)' }}>Flat-Lay Photo</div>
                                        <div style={{ fontSize: '10px', color: col.articleImage ? 'var(--success)' : 'var(--ash)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          {col.articleImage ? (
                                            <>
                                              <Check size={11} color="var(--success)" />
                                              <span>Photo Ready</span>
                                            </>
                                          ) : (
                                            <span>No photo</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <label style={{ background: isUploadingFlat ? 'var(--ash)' : 'var(--graphite)', color: 'var(--snow)', borderRadius: '6px', padding: '6px 10px', cursor: isUploadingFlat ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        <Upload size={11} />
                                        <span>{isUploadingFlat ? '...' : col.articleImage ? 'Change' : 'Upload'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          disabled={isUploadingFlat}
                                          onChange={(e) => handleColorImageUpload(col.name, 'articleImage', e.target.files?.[0])}
                                        />
                                      </label>
                                      {col.articleImage && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditColors((prev) =>
                                              prev.map((c) => (c.name === col.name ? { ...c, articleImage: '' } : c))
                                            );
                                          }}
                                          style={{ background: 'none', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '5px 7px', color: 'var(--ash)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                          title="Remove photo"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setShowUrlInputs(prev => ({ ...prev, [`edit-${col.name}-flat`]: !prev[`edit-${col.name}-flat`] }))}
                                        style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                                        title="Paste link manually"
                                      >
                                        <Link2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {showUrlInputs[`edit-${col.name}-flat`] && (
                                    <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--hairline)' }}>
                                      <input
                                        type="text"
                                        placeholder="Paste custom image URL..."
                                        value={col.articleImage || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditColors((prev) =>
                                            prev.map((c) => (c.name === col.name ? { ...c, articleImage: val } : c))
                                          );
                                        }}
                                        style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--hairline)', fontSize: '11px' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SIZES */}
                {editTab === 'sizes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--ash)' }}>
                      Click on any size pill below to enable or disable it for customer selection on the storefront.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '14px' }}>
                      {editSizes.map((sz) => (
                        <button
                          key={sz.name}
                          type="button"
                          onClick={() => handleToggleEditSizeActive(sz.name)}
                          style={{
                            padding: '16px 12px',
                            borderRadius: '14px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: sz.active ? '2px solid var(--graphite)' : '1px dashed var(--mist)',
                            background: sz.active ? 'var(--graphite)' : 'var(--snow)',
                            color: sz.active ? 'var(--snow)' : 'var(--ash)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: '18px', fontWeight: 700 }}>{sz.name}</div>
                          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                            {sz.active ? 'Available' : 'Disabled'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: GALLERY PHOTOS */}
                {editTab === 'images' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--graphite)' }}>Product Photo Gallery</h4>
                        <p style={{ fontSize: '12px', color: 'var(--ash)' }}>
                          These images display in the product detail page carousel for customers.
                        </p>
                      </div>

                      <label style={{ background: 'var(--graphite)', color: 'var(--snow)', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} />
                        <span>{uploadingKey === 'gallery-upload' ? 'Uploading...' : '+ Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleGalleryUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>

                    {editImages.length === 0 ? (
                      <div style={{ padding: '36px', textAlign: 'center', background: 'var(--cloud)', borderRadius: '14px', color: 'var(--ash)' }}>
                        No gallery photos yet. Click "+ Upload Photo" to add images.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '14px' }}>
                        {editImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              aspectRatio: '3/4',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              border: '1px solid var(--hairline)',
                              background: 'var(--cloud)',
                            }}
                          >
                            <img src={imgUrl} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.65)',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Delete this image"
                            >
                              <X size={13} />
                            </button>
                            <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.5)', color: '#FFF', fontSize: '10px', padding: '1px 6px', borderRadius: '4px' }}>
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: FABRIC, CARE, DESCRIPTION */}
                {editTab === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Product Description</label>
                      <textarea
                        rows={4}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Detailed tracksuit set description..."
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px', lineHeight: 1.6 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Fabric Details & Composition</label>
                        <input
                          type="text"
                          value={editFabric}
                          onChange={(e) => setEditFabric(e.target.value)}
                          placeholder="e.g. 100% Pima Cotton, 380 GSM Heavyweight Terry"
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Care Instructions</label>
                        <input
                          type="text"
                          value={editCare}
                          onChange={(e) => setEditCare(e.target.value)}
                          placeholder="e.g. Hand wash cold or gentle cycle. Lay flat to dry."
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: SEO & GOOGLE RANKING */}
                {editTab === 'seo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Google Search Live SERP Preview */}
                    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--hairline)', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ash)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Google Search Result Preview
                      </span>
                      <div style={{ fontSize: '13px', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--champagne)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#FFF', fontWeight: 700 }}>E</span>
                        <span style={{ color: '#202124', fontSize: '12px' }}>elvanewears.com</span>
                        <span style={{ color: '#5f6368', fontSize: '12px' }}>› product › {editSlug || 'tracksuit-slug'}</span>
                      </div>
                      <h4 style={{ fontSize: '18px', color: '#1a0dab', fontWeight: 500, fontFamily: 'Arial, sans-serif', lineHeight: 1.3, marginBottom: '4px' }}>
                        {editSeoTitle || (editTitle ? `${editTitle} — Luxury Tracksuit Pakistan | Elvane Wear` : 'Tracksuit Set Title — Elvane Wear')}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#4d5156', fontFamily: 'Arial, sans-serif', lineHeight: 1.4, margin: 0 }}>
                        {editMetaDescription || (editDescription ? editDescription.slice(0, 155) + '...' : 'Shop luxury minimalist tracksuit sets crafted from French terry, merino wool, and organic cotton in Pakistan with Cash on Delivery.')}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="eyebrow" style={{ margin: 0 }}>SEO Title (Target: 50–60 Chars)</label>
                        <span style={{ fontSize: '11px', color: editSeoTitle.length > 60 ? 'var(--danger)' : 'var(--ash)' }}>
                          {editSeoTitle.length} / 60
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. French Terry Heavyweight Set — Luxury Tracksuits Pakistan"
                        value={editSeoTitle}
                        onChange={(e) => setEditSeoTitle(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="eyebrow" style={{ margin: 0 }}>Meta Description (Target: 130–160 Chars)</label>
                        <span style={{ fontSize: '11px', color: editMetaDescription.length > 160 ? 'var(--danger)' : 'var(--ash)' }}>
                          {editMetaDescription.length} / 160
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Brief search summary enticing buyers in Pakistan to click..."
                        value={editMetaDescription}
                        onChange={(e) => setEditMetaDescription(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Focus Keyword</label>
                        <input
                          type="text"
                          placeholder="e.g. French Terry Tracksuit Pakistan"
                          value={editFocusKeyword}
                          onChange={(e) => setEditFocusKeyword(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Additional Keywords (Comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. heavyweight tracksuit, men winter set, luxury hoodie"
                          value={editAdditionalKeywords}
                          onChange={(e) => setEditAdditionalKeywords(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Image ALT Text (For Google Image Search)</label>
                        <input
                          type="text"
                          placeholder="e.g. Midnight Black French Terry Tracksuit Set Model View"
                          value={editImageAlt}
                          onChange={(e) => setEditImageAlt(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Canonical URL (Optional override)</label>
                        <input
                          type="url"
                          placeholder={`https://elvanewears.com/product/${editSlug || 'product-slug'}`}
                          value={editCanonicalUrl}
                          onChange={(e) => setEditCanonicalUrl(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--hairline)', paddingTop: '20px', marginTop: '28px' }}>
                  <Button3D
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setEditProduct(null)}
                  >
                    Cancel
                  </Button3D>

                  <Button3D
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={savingProduct}
                    icon={Check}
                  >
                    {savingProduct ? 'Saving All Changes...' : 'Save All Changes'}
                  </Button3D>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* 2. COLOR VARIANT IMAGES QUICK MODAL (LEGACY MODAL)     */}
      {/* ---------------------------------------------------- */}
      {colorModalProduct && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 26, 26, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setColorModalProduct(null)}
        >
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{
              background: 'var(--snow)',
              borderRadius: '24px',
              border: '1px solid var(--hairline)',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--champagne)' }}>Visual Assets Governance</span>
                <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '20px', fontWeight: 600, color: 'var(--graphite)', marginTop: '4px' }}>
                  {colorModalProduct.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ash)', marginTop: '2px' }}>
                  Assign primary and flat-lay photos for each color variant. When customers hover over the color dot on the storefront, the card will display this image.
                </p>
              </div>
              <button
                onClick={() => setColorModalProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mist)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Colors list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {modalColors.map((col) => {
                const isUploadingModel = uploadingKey === `${col.name}-modelImage`;
                const isUploadingArticle = uploadingKey === `${col.name}-articleImage`;

                return (
                  <div
                    key={col.name}
                    style={{
                      background: 'var(--cloud)',
                      borderRadius: '16px',
                      border: '1px solid var(--hairline)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: col.hex, border: '1px solid rgba(0,0,0,0.2)' }} />
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--graphite)' }}>{col.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ash)', fontFamily: 'monospace' }}>({col.hex})</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: col.active ? 'var(--forest)' : 'var(--ash)', fontWeight: 600 }}>
                        {col.active ? '● Active on Store' : '○ Inactive'}
                      </span>
                    </div>

                    {/* Primary Photo */}
                    <div style={{ background: 'var(--snow)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '8px', background: '#F0ECE4', border: '1px solid var(--hairline)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {col.modelImage ? (
                              <img src={col.modelImage} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <ImageIcon size={18} color="var(--mist)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--graphite)' }}>Model Photo (Front)</div>
                            <div style={{ fontSize: '10px', color: col.modelImage ? 'var(--success)' : 'var(--ash)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {col.modelImage ? (
                                <>
                                  <Check size={11} color="var(--success)" />
                                  <span>Photo Ready</span>
                                </>
                              ) : (
                                <span>No photo</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label
                            style={{
                              background: isUploadingModel ? 'var(--ash)' : 'var(--graphite)',
                              color: 'var(--snow)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: isUploadingModel ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Upload size={11} />
                            <span>{isUploadingModel ? '...' : col.modelImage ? 'Change' : 'Upload'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={isUploadingModel}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append('image', file);
                                  setUploadingKey(`${col.name}-modelImage`);
                                  api.post('/products/upload-image', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                  }).then(({ data }) => {
                                    setModalColors((prev) =>
                                      prev.map((c) => (c.name === col.name ? { ...c, modelImage: data.url, imageUrl: data.url } : c))
                                    );
                                  }).catch((err) => alert('Upload failed')).finally(() => setUploadingKey(''));
                                }
                              }}
                            />
                          </label>

                          {col.modelImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalColors((prev) =>
                                  prev.map((c) => (c.name === col.name ? { ...c, modelImage: '', imageUrl: '' } : c))
                                );
                              }}
                              style={{ background: 'none', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '5px 7px', color: 'var(--ash)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              title="Remove photo"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowUrlInputs(prev => ({ ...prev, [`modal-${col.name}-model`]: !prev[`modal-${col.name}-model`] }))}
                            style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                            title="Paste link manually"
                          >
                            <Link2 size={12} />
                          </button>
                        </div>
                      </div>

                      {showUrlInputs[`modal-${col.name}-model`] && (
                        <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--hairline)' }}>
                          <input
                            type="text"
                            placeholder="Paste custom image URL..."
                            value={col.modelImage || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalColors((prev) =>
                                prev.map((c) => (c.name === col.name ? { ...c, modelImage: val, imageUrl: val } : c))
                              );
                            }}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--hairline)', fontSize: '11px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Flat-Lay Photo */}
                    <div style={{ background: 'var(--snow)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '8px', background: '#F0ECE4', border: '1px solid var(--hairline)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {col.articleImage ? (
                              <img src={col.articleImage} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <ImageIcon size={18} color="var(--mist)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--graphite)' }}>Flat-Lay Photo (Detail)</div>
                            <div style={{ fontSize: '10px', color: col.articleImage ? 'var(--success)' : 'var(--ash)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {col.articleImage ? (
                                <>
                                  <Check size={11} color="var(--success)" />
                                  <span>Photo Ready</span>
                                </>
                              ) : (
                                <span>No photo</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label
                            style={{
                              background: isUploadingArticle ? 'var(--ash)' : 'var(--graphite)',
                              color: 'var(--snow)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: isUploadingArticle ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Upload size={11} />
                            <span>{isUploadingArticle ? '...' : col.articleImage ? 'Change' : 'Upload'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={isUploadingArticle}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append('image', file);
                                  setUploadingKey(`${col.name}-articleImage`);
                                  api.post('/products/upload-image', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                  }).then(({ data }) => {
                                    setModalColors((prev) =>
                                      prev.map((c) => (c.name === col.name ? { ...c, articleImage: data.url } : c))
                                    );
                                  }).catch((err) => alert('Upload failed')).finally(() => setUploadingKey(''));
                                }
                              }}
                            />
                          </label>

                          {col.articleImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalColors((prev) =>
                                  prev.map((c) => (c.name === col.name ? { ...c, articleImage: '' } : c))
                                );
                              }}
                              style={{ background: 'none', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '5px 7px', color: 'var(--ash)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              title="Remove photo"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowUrlInputs(prev => ({ ...prev, [`modal-${col.name}-flat`]: !prev[`modal-${col.name}-flat`] }))}
                            style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                            title="Paste link manually"
                          >
                            <Link2 size={12} />
                          </button>
                        </div>
                      </div>

                      {showUrlInputs[`modal-${col.name}-flat`] && (
                        <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--hairline)' }}>
                          <input
                            type="text"
                            placeholder="Paste custom image URL..."
                            value={col.articleImage || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalColors((prev) =>
                                prev.map((c) => (c.name === col.name ? { ...c, articleImage: val } : c))
                              );
                            }}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--hairline)', fontSize: '11px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button3D variant="ghost" size="sm" onClick={() => setColorModalProduct(null)}>
                Cancel
              </Button3D>
              <Button3D
                variant="primary"
                size="sm"
                disabled={savingColors}
                onClick={async () => {
                  setSavingColors(true);
                  try {
                    await api.put(`/products/${colorModalProduct._id}`, {
                      colors: JSON.stringify(modalColors),
                    });
                    setColorModalProduct(null);
                    fetchProducts();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to update color visuals');
                  } finally {
                    setSavingColors(false);
                  }
                }}
              >
                {savingColors ? 'Saving...' : 'Save Color Visuals'}
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
