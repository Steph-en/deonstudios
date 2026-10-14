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

  const [aspectClass, setAspectClass] = useState<string>(
    cachedClass || storedClass || 'aspect-[3/4]'
  );
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Proactively measure image natural dimensions on mount to ensure accurate format
  React.useEffect(() => {
    if (!shot.url) return;
    const cached = getCachedAspectRatioClass(shot.url);
    if (cached) {
      setAspectClass((prev) => (prev === cached ? prev : cached));
    }
    let isMounted = true;
    const img = new Image();
    img.onload = () => {
      if (!isMounted) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setDimensions((prev) => {
          if (prev && prev.width === img.naturalWidth && prev.height === img.naturalHeight) return prev;
          return { width: img.naturalWidth, height: img.naturalHeight };
        });
        const detected = detectAspectRatioClassFromDimensions(img.naturalWidth, img.naturalHeight);
        setCachedAspectRatioClass(shot.url, detected);
        setAspectClass((prev) => (prev === detected ? prev : detected));
      }
    };
    img.src = shot.url;
    return () => {
      isMounted = false;
    };
  }, [shot.url]);

  const handleDimensionsDetected = React.useCallback((w: number, h: number) => {
    if (!w || !h) return;
    setDimensions((prev) => {
      if (prev && prev.width === w && prev.height === h) return prev;
      return { width: w, height: h };
    });
    const detected = detectAspectRatioClassFromDimensions(w, h);
    if (shot.url) setCachedAspectRatioClass(shot.url, detected);
    setAspectClass((prev) => (prev === detected ? prev : detected));
  }, [shot.url]);

  const dynamicAspectRatio = dimensions?.width && dimensions?.height
    ? `${dimensions.width} / ${dimensions.height}`
    : undefined;

  return (
    <div className="break-inside-avoid inline-block w-full align-top mb-[8px] sm:mb-[10px] md:mb-[12px]">
      <article
        id={`portfolio-shot-${shot.id}`}
        onClick={onClick}
        className="group relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer w-full safari-clip-fix rounded-xs transition-opacity duration-200 hover:opacity-95"
        title={`Click to view ${shot.title} in lightbox`}
      >
        <div
          style={{ aspectRatio: dynamicAspectRatio }}
          className={`w-full ${!dynamicAspectRatio ? aspectClass : ''} relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 safari-clip-fix flex items-center justify-center`}
        >
          {shot.url ? (
            <ResilientImage
              src={shot.url}
              alt={shot.title}
              priority={idx < 4}
              lazy={idx >= 4}
              rootMargin="400px 0px"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onDimensionsDetected={handleDimensionsDetected}
              className="w-full h-full object-contain object-center transition-opacity duration-300 pointer-events-none safari-scale-smooth select-none"
            />
          ) : null}
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
