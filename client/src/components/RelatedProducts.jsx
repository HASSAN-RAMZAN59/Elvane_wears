import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowUpRight } from 'lucide-react';
import api, { formatPKR } from '../utils/api';
import { optimizeImageUrl, getResponsiveSrcSet } from '../utils/imageOptimizer';

export default function RelatedProducts({ currentSlug, currentCategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!currentSlug) return;

    let isMounted = true;
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/slug/${currentSlug}/related`);
        if (isMounted) {
          setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
        }
      } catch (err) {
        // Fallback: fetch general products list and filter
        try {
          const { data } = await api.get('/products');
          if (isMounted) {
            const all = Array.isArray(data) ? data : data.products || [];
            const filtered = all
              .filter((p) => p.slug !== currentSlug)
              .slice(0, 4);
            setProducts(filtered);
          }
        } catch {
          if (isMounted) setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [currentSlug, currentCategory]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Related Products"
      style={{
        marginTop: '80px',
        borderTop: '1px solid var(--hairline)',
        paddingTop: '64px',
        position: 'relative',
      }}
    >
      {/* Editorial Header with Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '36px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span className="eyebrow" style={{ color: 'var(--champagne)' }}>
            Curated Complements
          </span>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              color: 'var(--graphite)',
              marginTop: '8px',
              lineHeight: 1.15,
            }}
          >
            You May Also <em style={{ fontStyle: 'italic' }}>Like</em>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ash)', marginTop: '6px' }}>
            Complete 2-piece luxury tracksuit sets coordinated for architectural style.
          </p>
        </div>

        {/* Carousel Control Arrows */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Previous related products"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--hairline)',
              background: '#FFFFFF',
              color: 'var(--graphite)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--graphite)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--hairline)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Next related products"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--hairline)',
              background: '#FFFFFF',
              color: 'var(--graphite)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--graphite)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--hairline)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Swipeable Track / Grid */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '16px',
        }}
      >
        {loading ? (
          // Skeleton placeholders
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                flex: '0 0 clamp(240px, 70vw, 290px)',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--hairline)',
                padding: '12px',
                height: '420px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))
        ) : (
          products.map((item) => {
            const primaryColor = item.colors?.[0] || {};
            const photo =
              primaryColor.modelImage ||
              primaryColor.imageUrl ||
              item.images?.[0] ||
              '';

            const hasDiscount =
              item.originalPrice && Number(item.originalPrice) > Number(item.price);
            const discountPercent = hasDiscount
              ? Math.round(
                  ((Number(item.originalPrice) - Number(item.price)) /
                    Number(item.originalPrice)) *
                    100
                )
              : 0;

            return (
              <div
                key={item._id || item.slug}
                style={{
                  flex: '0 0 clamp(250px, 72vw, 290px)',
                  scrollSnapAlign: 'start',
                }}
              >
                {/* Real crawlable HTML anchor tag for Google indexing */}
                <Link
                  to={`/product/${item.slug}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#FFFFFF',
                    border: '1px solid var(--hairline)',
                    borderRadius: '16px',
                    padding: '12px',
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--champagne)';
                    e.currentTarget.style.boxShadow =
                      '0 12px 32px -4px rgba(26, 26, 26, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hairline)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 16px rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Photo Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '125%', // 4:5 aspect ratio
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#F6F5F2',
                      marginBottom: '14px',
                    }}
                  >
                    {photo ? (
                      <img
                        src={optimizeImageUrl(photo, { width: 500 })}
                        srcSet={getResponsiveSrcSet(photo, [300, 500])}
                        sizes="(max-width: 640px) 70vw, 290px"
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        width={300}
                        height={375}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center 15%',
                          transition:
                            'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--ash)',
                          fontSize: '12px',
                        }}
                      >
                        Elvane Atelier
                      </div>
                    )}

                    {/* Discount or New Badge */}
                    {hasDiscount ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: '#85462C',
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          boxShadow: '0 2px 8px rgba(133, 70, 44, 0.25)',
                        }}
                      >
                        {discountPercent}% Off
                      </span>
                    ) : item.isNewArrival ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: '#FFFFFF',
                          color: 'var(--graphite)',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: '1px solid var(--hairline)',
                        }}
                      >
                        New
                      </span>
                    ) : null}

                    {/* View Product Indicator Tag */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--graphite)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <ArrowUpRight size={14} />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span
                      style={{
                        fontSize: '10px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--champagne)',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {item.category || 'Atelier Set'}
                    </span>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '18px',
                        fontWeight: 500,
                        color: 'var(--graphite)',
                        lineHeight: 1.25,
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Pricing */}
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--graphite)',
                        }}
                      >
                        {formatPKR(item.price)}
                      </span>
                      {hasDiscount && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--ash)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatPKR(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
