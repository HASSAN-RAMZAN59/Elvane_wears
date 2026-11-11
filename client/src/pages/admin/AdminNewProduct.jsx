import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Upload, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import Button3D from '../../components/Button3D';

const MASTER_COLORS = [
  { name: 'Forest Deep Teal', hex: '#374F4F', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333563/elvena_wear/products/1-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333562/elvena_wear/products/1-flat.jpg' },
  { name: 'Obsidian & Cream', hex: '#181818', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333568/elvena_wear/products/2-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333567/elvena_wear/products/2-flat.jpg' },
  { name: 'Terracotta Rust', hex: '#85462C', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333575/elvena_wear/products/3.1-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333574/elvena_wear/products/3.1-flat.jpg' },
  { name: 'Midnight Pitch Black', hex: '#1E1E1E', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333585/elvena_wear/products/5-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333584/elvena_wear/products/5-flat.jpg' },
  { name: 'Warm Taupe Sand', hex: '#7A7167', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333593/elvena_wear/products/7-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333592/elvena_wear/products/7-flat.jpg' },
  { name: 'Platinum Pearl White', hex: '#D3CAC1', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333594/elvena_wear/products/7.1-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333594/elvena_wear/products/7.1-flat.jpg' },
  { name: 'Champagne Almond', hex: '#C5AF98', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333601/elvena_wear/products/8.1-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333600/elvena_wear/products/8.1-flat.jpg' },
  { name: 'Washed Olive Sage', hex: '#827F5E', defaultModel: 'https://res.cloudinary.com/up56alno/image/upload/v1793333566/elvena_wear/products/1.1-model.jpg', defaultArticle: 'https://res.cloudinary.com/up56alno/image/upload/v1793333564/elvena_wear/products/1.1-flat.jpg' },
];

const MASTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminNewProduct() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('Sportswear');
  const [description, setDescription] = useState('');
  const [fabric, setFabric] = useState('');
  const [care, setCare] = useState('');
  const [inventoryCount, setInventoryCount] = useState(25);

  // SEO & Google Ranking state
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [additionalKeywords, setAdditionalKeywords] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Active Color Swatches toggled by Admin (with image associations)
  const [activeColors, setActiveColors] = useState([
    {
      name: 'Forest Deep Teal',
      hex: '#374F4F',
      active: true,
      modelImage: 'https://res.cloudinary.com/up56alno/image/upload/v1793333563/elvena_wear/products/1-model.jpg',
      articleImage: 'https://res.cloudinary.com/up56alno/image/upload/v1793333562/elvena_wear/products/1-flat.jpg',
      imageUrl: 'https://res.cloudinary.com/up56alno/image/upload/v1793333563/elvena_wear/products/1-model.jpg',
    },
    {
      name: 'Obsidian & Cream',
      hex: '#181818',
      active: true,
      modelImage: 'https://res.cloudinary.com/up56alno/image/upload/v1793333568/elvena_wear/products/2-model.jpg',
      articleImage: 'https://res.cloudinary.com/up56alno/image/upload/v1793333567/elvena_wear/products/2-flat.jpg',
      imageUrl: 'https://res.cloudinary.com/up56alno/image/upload/v1793333568/elvena_wear/products/2-model.jpg',
    },
  ]);

  // Custom Color Builder state
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#4A6B82');
  const [customColorNotice, setCustomColorNotice] = useState(null);
  const [uploadingKey, setUploadingKey] = useState('');

  // Active Sizes toggled by Admin
  const [activeSizes, setActiveSizes] = useState([
    { name: 'S', active: true },
    { name: 'M', active: true },
    { name: 'L', active: true },
  ]);

  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const genSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(genSlug);
    if (!seoTitle) {
      setSeoTitle(val ? `${val} — Luxury Tracksuit Pakistan | Elvane Wear` : '');
    }
    if (!imageAlt) {
      setImageAlt(val ? `${val} - Luxury Tracksuit Set Pakistan` : '');
    }
  };

  const toggleColor = (col) => {
    const exists = activeColors.find((c) => c.name === col.name);
    if (exists) {
      setActiveColors(activeColors.filter((c) => c.name !== col.name));
    } else {
      setActiveColors([
        ...activeColors,
        {
          name: col.name,
          hex: col.hex,
          active: true,
          modelImage: col.defaultModel || '',
          articleImage: col.defaultArticle || '',
          imageUrl: col.defaultModel || '',
        },
      ]);
    }
  };

  const handleAddCustomColor = (e) => {
    if (e) e.preventDefault();
    setCustomColorNotice(null);

    const trimmedName = customColorName.trim();
    const colorName = trimmedName || `Custom ${customColorHex.toUpperCase()}`;

    const exists = activeColors.find(
      (c) =>
        c.name.toLowerCase() === colorName.toLowerCase() ||
        (!trimmedName && c.hex?.toLowerCase() === customColorHex.toLowerCase())
    );
    if (exists) {
      setCustomColorNotice({
        type: 'error',
        text: `Color "${exists.name}" is already added.`,
      });
      return;
    }

    setActiveColors((prev) => [
      ...prev,
      {
        name: colorName,
        hex: customColorHex,
        active: true,
        modelImage: '',
        articleImage: '',
        imageUrl: '',
      },
    ]);
    setCustomColorName('');
    setCustomColorNotice({
      type: 'success',
      text: `Added "${colorName}" (${customColorHex}). You can upload its photos below.`,
    });
  };

  const updateColorImage = (colorName, field, value) => {
    setActiveColors((prev) =>
      prev.map((c) => {
        if (c.name === colorName) {
          const updated = { ...c, [field]: value };
          if (field === 'modelImage' && !c.imageUrl) updated.imageUrl = value;
          return updated;
        }
        return c;
      })
    );
  };

  const handleFileUpload = async (colorName, field, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingKey(`${colorName}-${field}`);
    try {
      const { data } = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateColorImage(colorName, field, data.url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingKey('');
    }
  };

  const toggleSize = (sz) => {
    const exists = activeSizes.find((s) => s.name === sz);
    if (exists) {
      setActiveSizes(activeSizes.filter((s) => s.name !== sz));
    } else {
      setActiveSizes([...activeSizes, { name: sz, active: true }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeColors.length === 0) {
      setErrorMsg('Please activate at least 1 color for this tracksuit set');
      return;
    }
    if (activeSizes.length === 0) {
      setErrorMsg('Please activate at least 1 size for this tracksuit set');
      return;
    }

    setSubmitting(true);
    try {
      // Gather primary product gallery images from active colors
      const galleryImages = [];
      activeColors.forEach((c) => {
        if (c.modelImage && !galleryImages.includes(c.modelImage)) galleryImages.push(c.modelImage);
        if (c.articleImage && !galleryImages.includes(c.articleImage)) galleryImages.push(c.articleImage);
      });

      const payload = {
        title,
        slug,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        category,
        description,
        fabric,
        care,
        inventoryCount: Number(inventoryCount),
        images: galleryImages,
        colors: JSON.stringify(activeColors),
        sizes: JSON.stringify(activeSizes),
        isFeatured,
        isNewArrival,
        isBestseller,
        seoTitle,
        metaDescription,
        focusKeyword,
        additionalKeywords,
        imageAlt,
        canonicalUrl,
      };

      await api.post('/products', payload);
      navigate('/admin/products');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create tracksuit set');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/products')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--ash)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={14} />
        <span>Back to Products</span>
      </button>

      <div style={{ marginBottom: '32px' }}>
        <span className="eyebrow" style={{ color: 'var(--champagne)' }}>
          Product Management
        </span>
        <h1 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '28px', fontWeight: 600, color: 'var(--graphite)', marginTop: '4px' }}>
          Add New Tracksuit Set
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--ash)', marginTop: '4px' }}>
          Remember: tracksuits are sold exclusively as complete 1-piece sets (Top + Trouser).
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(163, 64, 64, 0.1)',
            border: '1px solid rgba(163, 64, 64, 0.25)',
            color: 'var(--danger)',
            fontSize: '13px',
            marginBottom: '24px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Core Attributes */}
        <div style={{ background: 'var(--snow)', borderRadius: '20px', border: '1px solid var(--hairline)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '18px', fontWeight: 600 }}>General Information</h3>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Set Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Luxury Cashmere-Blend Tracksuit"
              value={title}
              onChange={handleTitleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Slug (URL identifier)</label>
              <input
                type="text"
                required
                placeholder="luxury-cashmere-tracksuit"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Category Series *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ height: '46px' }}
              >
                <option value="Sportswear">Sportswear</option>
                <option value="Limited Sets">Limited Sets</option>
                <option value="Newest Release">Newest Release</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Selling Price in PKR (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 4000 (Customer pays this)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Original / Cut Price in PKR (Optional)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 8000 (Crossed out ~~8000~~)"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Backend Stock Quantity * (Hidden)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 50"
                value={inventoryCount}
                onChange={(e) => setInventoryCount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Description *</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the silhouette, hand feel, and design accents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Fabric Composition</label>
              <input
                type="text"
                placeholder="e.g. 70% Pima Cotton, 30% Cashmere | 380 GSM"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Care Instructions</label>
              <input
                type="text"
                placeholder="e.g. Dry clean or cold wool cycle. Lay flat."
                value={care}
                onChange={(e) => setCare(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Interactive Color & Size Activator */}
        <div style={{ background: 'var(--snow)', borderRadius: '20px', border: '1px solid var(--hairline)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '18px', fontWeight: 600 }}>Active Variants Configurator</h3>
          <p style={{ fontSize: '13px', color: 'var(--ash)', marginTop: '-12px' }}>
            Toggle ON the exact colors and sizes that customers can see and order on the storefront.
          </p>

          {/* Color Activator */}
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '10px' }}>
              Master Color Palette (Selected: {activeColors.length})
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {MASTER_COLORS.map((col) => {
                const isActive = activeColors.some((c) => c.name === col.name);
                return (
                  <button
                    type="button"
                    key={col.name}
                    onClick={() => toggleColor(col)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      background: isActive ? 'var(--snow)' : 'var(--cloud)',
                      border: isActive ? '1.5px solid var(--graphite)' : '1px dashed var(--hairline)',
                      cursor: 'pointer',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: col.hex, border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400 }}>{col.name}</span>
                    {isActive && <Check size={12} color="var(--graphite)" />}
                  </button>
                );
              })}

              {/* Custom colors added by admin */}
              {activeColors
                .filter((col) => !MASTER_COLORS.some((m) => m.name === col.name))
                .map((col) => (
                  <button
                    type="button"
                    key={col.name}
                    onClick={() => toggleColor(col)}
                    title="Click to remove custom color"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      background: 'var(--snow)',
                      border: '1.5px solid var(--champagne)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: col.hex, border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{col.name}</span>
                    <Check size={12} color="var(--champagne)" />
                  </button>
                ))}
            </div>

            {/* Custom Color Creator */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--hairline)' }}>
              <span className="eyebrow" style={{ fontSize: '10px', color: 'var(--ash)', display: 'block', marginBottom: '8px' }}>
                Or Add Custom Color Variant
              </span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Custom Color (e.g. Sage Green)"
                  value={customColorName}
                  onChange={(e) => {
                    setCustomColorName(e.target.value);
                    if (customColorNotice) setCustomColorNotice(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomColor(e);
                    }
                  }}
                  style={{ width: '220px', height: '40px', fontSize: '12.5px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => {
                      setCustomColorHex(e.target.value);
                      if (customColorNotice) setCustomColorNotice(null);
                    }}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    title="Choose Color Hex"
                  />
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--graphite)' }}>{customColorHex}</span>
                </div>
                <Button3D
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomColor}
                  icon={Plus}
                >
                  Add Custom Color
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

            {/* Color Variant Visuals & Images Section (Requested by User) */}
            {activeColors.length > 0 && (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '17px', fontWeight: 600, color: 'var(--graphite)' }}>
                      Color Variant Images & Visual Assets
                    </h4>
                    <span className="eyebrow" style={{ color: 'var(--champagne)' }}>
                      Customer Hover Display
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--ash)' }}>
                    When customers hover over a color swatch dot on the storefront, the tracksuit card updates to that color's image below.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeColors.map((col) => {
                    const isUploadingModel = uploadingKey === `${col.name}-modelImage`;
                    const isUploadingArticle = uploadingKey === `${col.name}-articleImage`;

                    return (
                      <div
                        key={col.name}
                        style={{
                          background: 'var(--cloud)',
                          border: '1px solid var(--hairline)',
                          borderRadius: '16px',
                          padding: '18px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        {/* Color Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: col.hex,
                                border: '1.5px solid rgba(0,0,0,0.2)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                              }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--graphite)' }}>
                              {col.name}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--ash)', fontFamily: 'monospace' }}>
                              ({col.hex})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleColor(col)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--mist)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Remove color variant"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Image Input 1: Primary / Model Image */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--graphite)', display: 'block', marginBottom: '4px' }}>
                              Primary / Model Photo (Front Display & Color Hover)
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="/images/products/p1-cream-model.jpg or https://..."
                                value={col.modelImage || ''}
                                onChange={(e) => updateColorImage(col.name, 'modelImage', e.target.value)}
                                style={{ flex: 1, height: '42px', fontSize: '12px' }}
                              />
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '0 14px',
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: isUploadingModel ? 'var(--ash)' : 'var(--snow)',
                                  border: '1px solid var(--hairline)',
                                  color: 'var(--graphite)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isUploadingModel ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Upload size={13} />
                                <span>{isUploadingModel ? 'Uploading...' : 'Upload File'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={isUploadingModel}
                                  onChange={(e) => handleFileUpload(col.name, 'modelImage', e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Thumbnail Preview */}
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: '10px',
                              background: '#F0ECE4',
                              border: '1px solid var(--hairline)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {col.modelImage ? (
                              <img
                                src={col.modelImage}
                                alt="Model preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <ImageIcon size={18} color="var(--mist)" />
                            )}
                          </div>
                        </div>

                        {/* Image Input 2: Flat-lay / Article Image */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ash)', display: 'block', marginBottom: '4px' }}>
                              Article / Garment Flat-Lay Photo (Card Hover View)
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="/images/products/p1-cream-flat.jpg or https://..."
                                value={col.articleImage || ''}
                                onChange={(e) => updateColorImage(col.name, 'articleImage', e.target.value)}
                                style={{ flex: 1, height: '42px', fontSize: '12px' }}
                              />
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '0 14px',
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: isUploadingArticle ? 'var(--ash)' : 'var(--snow)',
                                  border: '1px solid var(--hairline)',
                                  color: 'var(--graphite)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: isUploadingArticle ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Upload size={13} />
                                <span>{isUploadingArticle ? 'Uploading...' : 'Upload File'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={isUploadingArticle}
                                  onChange={(e) => handleFileUpload(col.name, 'articleImage', e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Thumbnail Preview */}
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: '10px',
                              background: '#F0ECE4',
                              border: '1px solid var(--hairline)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {col.articleImage ? (
                              <img
                                src={col.articleImage}
                                alt="Article preview"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <ImageIcon size={18} color="var(--mist)" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Size Activator */}
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '10px' }}>
              Master Sizes (Selected: {activeSizes.length})
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {MASTER_SIZES.map((sz) => {
                const isActive = activeSizes.some((s) => s.name === sz);
                return (
                  <button
                    type="button"
                    key={sz}
                    onClick={() => toggleSize(sz)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isActive ? 'var(--graphite)' : 'var(--cloud)',
                      color: isActive ? 'var(--snow)' : 'var(--ash)',
                      border: isActive ? '1px solid var(--graphite)' : '1px dashed var(--hairline)',
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editorial Badges */}
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '10px' }}>Editorial Flags</label>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Mark as "New Release"</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Mark as "Bestseller"</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Feature on Homepage 3D Carousel</span>
              </label>
            </div>
          </div>
        </div>

        {/* Search Engine Optimization (SEO) & Google Ranking Card */}
        <div style={{ background: 'var(--snow)', borderRadius: '20px', border: '1px solid var(--hairline-accent)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--champagne)" />
              <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '18px', fontWeight: 600, color: 'var(--graphite)' }}>
                Google SEO & Search Rankings
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ash)' }}>
              Configure how this tracksuit set ranks and appears on Google Search and social media in Pakistan.
            </p>
          </div>

          {/* Google Search Live SERP Preview */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--hairline)', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ash)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Google Search Result Preview
            </span>
            <div style={{ fontSize: '13px', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--champagne)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#FFF', fontWeight: 700 }}>E</span>
              <span style={{ color: '#202124', fontSize: '12px' }}>elvanewears.com</span>
              <span style={{ color: '#5f6368', fontSize: '12px' }}>› product › {slug || 'tracksuit-slug'}</span>
            </div>
            <h4 style={{ fontSize: '18px', color: '#1a0dab', fontWeight: 500, fontFamily: 'Arial, sans-serif', lineHeight: 1.3, marginBottom: '4px' }}>
              {seoTitle || (title ? `${title} — Luxury Tracksuit Pakistan | Elvane Wear` : 'Tracksuit Set Title — Elvane Wear')}
            </h4>
            <p style={{ fontSize: '13px', color: '#4d5156', fontFamily: 'Arial, sans-serif', lineHeight: 1.4, margin: 0 }}>
              {metaDescription || (description ? description.slice(0, 155) + '...' : 'Shop luxury minimalist tracksuit sets crafted from French terry, merino wool, and organic cotton in Pakistan with Cash on Delivery.')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="eyebrow" style={{ margin: 0 }}>SEO Title (Target: 50–60 Chars)</label>
                <span style={{ fontSize: '11px', color: seoTitle.length > 60 ? 'var(--danger)' : 'var(--ash)' }}>
                  {seoTitle.length} / 60
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. French Terry Heavyweight Set — Luxury Tracksuits Pakistan"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="eyebrow" style={{ margin: 0 }}>Meta Description (Target: 130–160 Chars)</label>
                <span style={{ fontSize: '11px', color: metaDescription.length > 160 ? 'var(--danger)' : 'var(--ash)' }}>
                  {metaDescription.length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Brief search summary enticing buyers in Pakistan to click..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--hairline)', background: 'var(--snow)', fontSize: '13px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Focus Keyword</label>
              <input
                type="text"
                placeholder="e.g. French Terry Tracksuit Pakistan"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Additional Keywords (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. heavyweight tracksuit, men winter set, luxury hoodie"
                value={additionalKeywords}
                onChange={(e) => setAdditionalKeywords(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Image ALT Text (For Google Image Search)</label>
              <input
                type="text"
                placeholder="e.g. Midnight Black French Terry Tracksuit Set Model View"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Canonical URL (Optional override)</label>
              <input
                type="url"
                placeholder={`https://elvanewears.com/product/${slug || 'product-slug'}`}
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <Button3D
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? 'Publishing Tracksuit Set...' : 'Publish Tracksuit to Store'}
          </Button3D>
        </div>
      </form>
    </div>
  );
}
