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

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ shots, theme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(shots.map((s) => s.category).filter(Boolean)))];

  const filteredShots =
    activeCategory === 'All'
      ? shots
      : shots.filter((s) => s.category === activeCategory);

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
      className="relative w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      <div className="w-full max-w-[1880px] mx-auto">
        {/* Section Header */}
        <div className="flex items-baseline justify-between gap-4 pb-6 md:pb-8 border-b border-neutral-300 mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-baseline gap-2 sm:gap-4">
            <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
              Portfolio
            </h2>
            <span className="text-[11px] font-mono tracking-widest text-neutral-400">
              {filteredShots.length.toString().padStart(2, '0')} Plates
            </span>
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
          Editorial 4-Column Masonry Grid System:
          - Analyzed & styled after the reference luxury editorial layout
          - 4-column responsive layout (1 col mobile, 2 col sm, 3 col md, 4 col lg)
          - Exact 8px margins horizontally and vertically between all images (gap-[8px] + mb-[8px])
          - Natural varied aspect ratios (tall 2:3, portrait 3:4, square 1:1, landscape 4:3)
          - Frameless edge-to-edge presentation with no text labels under images
          - Grab/hand cursor with high-resolution lightbox expansion
        */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-[8px] select-none">
          {filteredShots.map((shot, idx) => (
            <div key={shot.id} className="break-inside-avoid mb-[8px]">
              <article
                id={`portfolio-shot-${shot.id}`}
                onClick={() => setLightboxIndex(idx)}
                className="group relative overflow-hidden bg-neutral-200 cursor-hover-hand cursor-grab active:cursor-grabbing hover:cursor-grab w-full"
                title={`Click to view ${shot.title} in lightbox`}
              >
                <div className={`w-full ${getAspectRatioClass(shot.aspectRatio)} relative overflow-hidden bg-neutral-100`}>
                  <ResilientImage
                    src={shot.url}
                    fallbackSrc={shot.fallbackUrl}
                    alt={shot.title}
                    lazy={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                  />
                </div>
              </article>
            </div>
          ))}
        </div>
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
