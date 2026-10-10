import React, { useState } from 'react';
import { SingleShot, ThemeMode, ProjectImage } from '../types';
import { ResilientImage } from './ResilientImage';
import { LightboxModal } from './LightboxModal';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';

interface PortfolioSectionProps {
  shots: SingleShot[];
  theme: ThemeMode;
}

/**
 * Maps editorial aspect ratio types to precise CSS aspect ratio classes.
 * Mixes portrait, landscape, and square shapes with varied heights (some smaller, some larger)
 * to create a true organic luxury editorial masonry waterfall grid with a 3-column maximum.
 */
const PORTFOLIO_MASONRY_RHYTHMS = [
  'aspect-[3/4]',    // 0: Classic portrait rectangle (prominent)
  'aspect-[4/3]',    // 1: Editorial landscape rectangle (smaller, compact height)
  'aspect-square',   // 2: Clean balanced square
  'aspect-[2/3]',    // 3: Tall editorial portrait (large & prominent)
  'aspect-[16/10]',  // 4: Wide cinematic landscape (compact / smaller)
  'aspect-square',   // 5: Modern square
  'aspect-[4/5]',    // 6: Medium portrait rectangle
  'aspect-[4/3]',    // 7: Smaller landscape rectangle
  'aspect-[2/3]',    // 8: Tall editorial portrait
  'aspect-square',   // 9: Square
  'aspect-[3/4]',    // 10: Portrait rectangle
  'aspect-[16/9]',   // 11: Cinematic wide rectangle (smaller)
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

  return PORTFOLIO_MASONRY_RHYTHMS[seed % PORTFOLIO_MASONRY_RHYTHMS.length];
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ shots, theme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(shots.map((s) => s.category).filter(Boolean)))];

  const filteredShots =
    !activeCategory || activeCategory === 'All'
      ? shots
      : shots.filter((s) => (s.category || '').toLowerCase() === activeCategory.toLowerCase());

  // Convert SingleShot[] to ProjectImage[] for LightboxModal compatibility
  const lightboxImages: ProjectImage[] = filteredShots.map((s) => ({
    id: s.id,
    url: s.url,
    fallbackUrl: s.fallbackUrl,
    caption: s.caption || s.title,
    aspectRatio: s.aspectRatio,
    tag: s.tag || s.category,
    exif: s.exif,
  }));

  const activeShot = lightboxIndex !== null ? filteredShots[lightboxIndex] : null;

  return (
    <section
      id="portfolio-section"
      className="relative w-full py-10 sm:py-10 md:py-10 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      <div className="w-full max-w-[1880px] mx-auto">
        {/* Section Header */}
        <div className="flex items-baseline justify-between gap-4 pb-6 md:pb-8 border-b border-neutral-300 mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-baseline gap-2 sm:gap-4">
            <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
              Portfolio
            </h2>
          </div>

          {/* Breadcrumb-Style Category Filter Dropdown with Rotating Active Option */}
          <CategoryFilterDropdown
            activeCategory={activeCategory}
            categories={categories as string[]}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            idPrefix="portfolio"
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
        {filteredShots.length === 0 ? (
          <div className="py-24 sm:py-32 text-center border border-dashed border-neutral-300/80 rounded-lg my-4">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-neutral-400 font-mono">
              No published portraits in portfolio
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-[8px] sm:gap-[10px] md:gap-[12px] select-none">
            {filteredShots.map((shot, idx) => (
              <div key={shot.id} className="break-inside-avoid inline-block w-full align-top mb-[8px] sm:mb-[10px] md:mb-[12px]">
                <article
                  id={`portfolio-shot-${shot.id}`}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative overflow-hidden bg-neutral-200 cursor-pointer w-full safari-clip-fix"
                  title={`Click to view ${shot.title} in lightbox`}
                >
                  <div className={`w-full ${getAspectRatioClass(shot.aspectRatio, idx, shot.id)} relative overflow-hidden bg-neutral-100 safari-clip-fix`}>
                    <ResilientImage
                      src={shot.url}
                      fallbackSrc={shot.fallbackUrl}
                      alt={shot.title}
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

      {/* Lightbox Modal for Portfolio */}
      {lightboxIndex !== null && activeShot && (
        <LightboxModal
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={true}
          projectTitle={activeShot.title}
          clientName={activeShot.clientOrBrand || 'Portfolio'}
          theme={theme}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </section>
  );
};

export default PortfolioSection;
