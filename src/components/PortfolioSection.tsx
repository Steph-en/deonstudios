import React, { useState } from 'react';
import { SingleShot, ThemeMode, ProjectImage } from '../types';
import { ResilientImage } from './ResilientImage';
import { LightboxModal } from './LightboxModal';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';

interface PortfolioSectionProps {
  shots: SingleShot[];
  theme: ThemeMode;
}

import {
  detectAspectRatioClassFromDimensions,
  mapStoredAspectRatioToClass,
  getCachedAspectRatioClass,
  setCachedAspectRatioClass,
  preloadImageRatios,
} from '../utils/aspectRatioHelper';

interface PortfolioItemCardProps {
  shot: SingleShot;
  idx: number;
  onClick: () => void;
}

const PortfolioItemCard: React.FC<PortfolioItemCardProps> = ({ shot, idx, onClick }) => {
  const cachedClass = getCachedAspectRatioClass(shot.url);
  const storedClass = mapStoredAspectRatioToClass(shot.aspectRatio);

  // Dynamic state: uses cached measured ratio, stored ratio, or neutral default
  const [aspectClass, setAspectClass] = useState<string>(
    cachedClass || storedClass || 'aspect-[3/4]'
  );

  // Proactively measure image natural dimensions on mount to ensure 100% accurate format
  React.useEffect(() => {
    if (!shot.url) return;
    const cached = getCachedAspectRatioClass(shot.url);
    if (cached) {
      setAspectClass(cached);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const detected = detectAspectRatioClassFromDimensions(img.naturalWidth, img.naturalHeight);
        setCachedAspectRatioClass(shot.url, detected);
        setAspectClass(detected);
      }
    };
    img.src = shot.url;
  }, [shot.url]);

  const handleDimensionsDetected = (w: number, h: number) => {
    const detected = detectAspectRatioClassFromDimensions(w, h);
    setCachedAspectRatioClass(shot.url, detected);
    setAspectClass(detected);
  };

  return (
    <div className="break-inside-avoid inline-block w-full align-top mb-[8px] sm:mb-[10px] md:mb-[12px]">
      <article
        id={`portfolio-shot-${shot.id}`}
        onClick={onClick}
        className="group relative overflow-hidden bg-neutral-200 cursor-pointer w-full safari-clip-fix"
        title={`Click to view ${shot.title} in lightbox`}
      >
        <div className={`w-full ${aspectClass} relative overflow-hidden bg-neutral-100 safari-clip-fix transition-[aspect-ratio] duration-300`}>
          <ResilientImage
            src={shot.url}
            fallbackSrc={shot.fallbackUrl}
            alt={shot.title}
            priority={idx < 4}
            lazy={idx >= 4}
            rootMargin="1000px 0px"
            onDimensionsDetected={handleDimensionsDetected}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025] pointer-events-none safari-scale-smooth"
          />
        </div>
      </article>
    </div>
  );
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ shots, theme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Preload natural aspect ratios for all shots in background
  React.useEffect(() => {
    const urls = shots.map((s) => s.url).filter(Boolean);
    preloadImageRatios(urls);
  }, [shots]);

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
              <PortfolioItemCard
                key={shot.id}
                shot={shot}
                idx={idx}
                onClick={() => setLightboxIndex(idx)}
              />
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
