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
 * Maps editorial aspect ratio types to precise CSS aspect ratio classes.
 * Preserves organic staggered editorial column rhythm matching luxury campaign grids.
 */
const getAspectRatioClass = (aspect?: string) => {
  switch (aspect) {
    case 'tall':
      return 'aspect-[2/3]';
    case 'portrait':
      return 'aspect-[3/4]';
    case 'square':
      return 'aspect-square';
    case 'landscape':
      return 'aspect-[4/3]';
    default:
      return 'aspect-[3/4]';
  }
};

export const ProductsSection: React.FC<ProductsSectionProps> = ({ products, theme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

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
      className="relative w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-100/60 text-neutral-950 transition-colors duration-300 border-t border-neutral-200/80"
    >
      <div className="w-full max-w-[1880px] mx-auto">
        {/* Section Header */}
        <div className="flex items-baseline justify-between gap-4 pb-6 md:pb-8 border-b border-neutral-300 mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-baseline gap-2 sm:gap-4">
            <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
              Products
            </h2>
            <span className="text-[11px] font-mono tracking-widest text-neutral-400">
              Commercial Still Life & Objects
            </span>
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
          Editorial 4-Column Masonry Grid System:
          - Analyzed & styled after the reference luxury editorial layout
          - 4-column responsive layout (1 col mobile, 2 col sm, 3 col md, 4 col lg)
          - Exact 8px margins horizontally and vertically between all images (gap-[8px] + mb-[8px])
          - Natural varied aspect ratios (tall 2:3, portrait 3:4, square 1:1, landscape 4:3)
          - Frameless edge-to-edge presentation with no text labels under images
          - Grab/hand cursor with high-resolution lightbox expansion
        */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-[8px] select-none">
          {filteredProducts.map((product, idx) => (
            <div key={product.id} className="break-inside-avoid mb-[8px]">
              <article
                id={`product-shot-${product.id}`}
                onClick={() => setLightboxIndex(idx)}
                className="group relative overflow-hidden bg-neutral-200 cursor-hover-hand cursor-grab active:cursor-grabbing hover:cursor-grab w-full"
                title={`Click to view ${product.title} in lightbox`}
              >
                <div className={`w-full ${getAspectRatioClass(product.aspectRatio)} relative overflow-hidden bg-neutral-100`}>
                  <ResilientImage
                    src={product.url}
                    fallbackSrc={product.fallbackUrl}
                    alt={product.title}
                    lazy={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                  />
                </div>
              </article>
            </div>
          ))}
        </div>
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
