import React, { useState } from 'react';
import { SingleShot, ThemeMode, ProjectImage } from '../types';
import { ResilientImage } from './ResilientImage';
import { LightboxModal } from './LightboxModal';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';

interface ProductsSectionProps {
  products: SingleShot[];
  theme: ThemeMode;
}

/**
 * Maps product aspect ratio types to precise CSS aspect ratio classes.
 * Mixes square, portrait, and landscape shapes with varied heights (some smaller, some larger)
 * to create a true organic luxury editorial masonry waterfall grid with a 3-column maximum.
 */
const PRODUCT_MASONRY_RHYTHMS = [
  'aspect-square',   // 0: Clean luxury still-life square
  'aspect-[3/4]',    // 1: Portrait rectangle (prominent)
  'aspect-[4/3]',    // 2: Editorial landscape rectangle (smaller)
  'aspect-[2/3]',    // 3: Tall editorial still-life (prominent)
  'aspect-square',   // 4: Clean square
  'aspect-[16/10]',  // 5: Wide product flatlay (compact / smaller)
  'aspect-[3/4]',    // 6: Portrait rectangle
  'aspect-square',   // 7: Square
  'aspect-[4/3]',    // 8: Landscape rectangle (smaller)
  'aspect-[2/3]',    // 9: Tall product portrait
  'aspect-[4/5]',    // 10: Soft portrait rectangle
  'aspect-square',   // 11: Square
];

const getAspectRatioClass = (aspect?: string, index: number = 0, id?: string) => {
  if (aspect && aspect !== 'portrait') {
    switch (aspect) {
      case 'tall':
        return 'aspect-[2/3]';
      case 'square':
        return 'aspect-square';
      case 'landscape':
        return 'aspect-[4/3]';
      case 'wide':
        return 'aspect-[16/10]';
      default:
        break;
    }
  }

  // Stable pseudo-random seed based on id or index to create intentional visual variety
  let seed = index;
  if (id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
    }
    seed = Math.abs(hash) + index;
  }

  return PRODUCT_MASONRY_RHYTHMS[seed % PRODUCT_MASONRY_RHYTHMS.length];
};

export const ProductsSection: React.FC<ProductsSectionProps> = ({ products, theme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts =
    !activeCategory || activeCategory === 'All'
      ? products
      : products.filter((p) => (p.category || '').toLowerCase() === activeCategory.toLowerCase());

  // Convert SingleShot[] to ProjectImage[] for LightboxModal compatibility
  const lightboxImages: ProjectImage[] = filteredProducts.map((p) => ({
    id: p.id,
    url: p.url,
    fallbackUrl: p.fallbackUrl,
    caption: p.caption || p.title,
    aspectRatio: p.aspectRatio,
    tag: p.tag || p.category,
    exif: p.exif,
  }));

  const activeProduct = lightboxIndex !== null ? filteredProducts[lightboxIndex] : null;

  return (
    <section
      id="products-section"
      className="relative w-full py-10 sm:py-10 md:py-10 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      <div className="w-full max-w-[1880px] mx-auto">
        {/* Section Header */}
        <div className="flex items-baseline justify-between gap-4 pb-6 md:pb-8 border-b border-neutral-300 mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-baseline gap-2 sm:gap-4">
            <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
              Products
            </h2>
          </div>

          {/* Breadcrumb-Style Category Filter Dropdown with Rotating Active Option */}
          <CategoryFilterDropdown
            activeCategory={activeCategory}
            categories={categories as string[]}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            idPrefix="products"
          />
        </div>

        {/* 
          Editorial 3-Column Maximum Masonry Grid System:
          - Maximum 3-column responsive layout (1 col mobile, 2 col sm, 3 col md/lg)
          - Images are significantly larger, bolder, and more prominent
          - True masonry waterfall with mixed rectangle and square shapes, portrait and landscape
          - Exact gap margins (gap-[8px] sm:gap-[10px] md:gap-[12px]) between all images
          - Frameless edge-to-edge presentation with pointer cursor and lightbox expansion
        */}
        {filteredProducts.length === 0 ? (
          <div className="py-24 sm:py-32 text-center border border-dashed border-neutral-300/80 rounded-lg my-4">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-neutral-400 font-mono">
              No published commercial products in gallery
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-[8px] sm:gap-[10px] md:gap-[12px] select-none">
            {filteredProducts.map((product, idx) => (
              <div key={product.id} className="break-inside-avoid inline-block w-full align-top mb-[8px] sm:mb-[10px] md:mb-[12px]">
                <article
                  id={`product-shot-${product.id}`}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative overflow-hidden bg-neutral-200 cursor-pointer w-full safari-clip-fix"
                  title={`Click to view ${product.title} in lightbox`}
                >
                  <div className={`w-full ${getAspectRatioClass(product.aspectRatio, idx, product.id)} relative overflow-hidden bg-neutral-100 safari-clip-fix`}>
                    <ResilientImage
                      src={product.url}
                      fallbackSrc={product.fallbackUrl}
                      alt={product.title}
                      priority={idx < 4}
                      lazy={idx >= 4}
                      rootMargin="1000px 0px"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025] pointer-events-none safari-scale-smooth"
                    />
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Products */}
      {lightboxIndex !== null && activeProduct && (
        <LightboxModal
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={true}
          projectTitle={activeProduct.title}
          clientName={activeProduct.clientOrBrand || 'Commercial Product'}
          theme={theme}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </section>
  );
};

export default ProductsSection;
