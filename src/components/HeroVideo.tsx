import React, { useRef, useState, useEffect } from 'react';
import { HERO_VIDEO_DESKTOP, HERO_VIDEO_MOBILE, FALLBACK_HERO_POSTER } from '../data/portfolioData';
import { ThemeMode } from '../types';

interface HeroVideoProps {
  theme: ThemeMode;
  onExploreClick: () => void;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ theme, onExploreClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Responsive display detection (portrait / mobile vs landscape / desktop)
  const [isMobileOrPortrait, setIsMobileOrPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkResponsiveMedia = () => {
      const isNarrow = window.innerWidth < 768;
      const isPortrait = window.matchMedia('(orientation: portrait)').matches || (window.innerHeight > window.innerWidth);
      setIsMobileOrPortrait(isNarrow || isPortrait);
    };

    checkResponsiveMedia();

    window.addEventListener('resize', checkResponsiveMedia);
    window.addEventListener('orientationchange', checkResponsiveMedia);

    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const narrowQuery = window.matchMedia('(max-width: 767px)');

    const mediaListener = () => checkResponsiveMedia();
    portraitQuery.addEventListener('change', mediaListener);
    narrowQuery.addEventListener('change', mediaListener);

    return () => {
      window.removeEventListener('resize', checkResponsiveMedia);
      window.removeEventListener('orientationchange', checkResponsiveMedia);
      portraitQuery.removeEventListener('change', mediaListener);
      narrowQuery.removeEventListener('change', mediaListener);
    };
  }, []);

  const activeVideoUrl = isMobileOrPortrait ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP;

  // Whenever the active video changes (e.g. resizing between mobile & desktop), load and play
  useEffect(() => {
    setHasVideoError(false);
    setVideoLoaded(false);

    if (videoRef.current) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setVideoLoaded(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {
                // Ignore background policy issues
              });
            }
          });
      }
    }
  }, [activeVideoUrl]);

  return (
    <section
      id="hero-section"
      className="relative w-full h-[100vh] min-h-[600px] flex items-end justify-between overflow-hidden select-none bg-neutral-950"
    >
      {/* 
        RESPONSIVE HERO VIDEO (foliobyjake.com inspired):
        - Desktop / Tablet / Monitor (landscape 16:9): uses HERO_VIDEO_DESKTOP
        - Mobile / Phone (portrait 9:16 Instagram aspect ratio): uses HERO_VIDEO_MOBILE
      */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950">
        {/* High-res poster fallback */}
        <img
          src={FALLBACK_HERO_POSTER}
          alt="Deon Studios Editorial"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoLoaded && !hasVideoError ? 'opacity-0' : 'opacity-100'
          }`}
          referrerPolicy="no-referrer"
        />

        {!hasVideoError && (
          <video
            ref={videoRef}
            key={activeVideoUrl}
            poster={FALLBACK_HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => {
              // Try fallback or poster if active video fails
              setHasVideoError(true);
              setVideoLoaded(false);
            }}
            className={`w-full h-full object-cover object-center transition-all duration-1000 ease-out ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Conditional sources matching viewport */}
            <source
              media="(max-width: 767px), (orientation: portrait)"
              src={HERO_VIDEO_MOBILE}
              type="video/mp4"
            />
            <source
              media="(min-width: 768px) and (orientation: landscape)"
              src={HERO_VIDEO_DESKTOP}
              type="video/mp4"
            />
            {/* Fallback source */}
            <source src={activeVideoUrl} type="video/mp4" />
          </video>
        )}

        {/* Subtle Ambient Darkened Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950/80 via-black/30 to-black/20 transition-colors duration-500"
        />
      </div>

      {/* Editorial Studio Statement at Bottom-Left (Mathematically aligned with Projects Grid & Footer) */}
      <div className="relative z-20 w-full px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 md:pb-20 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl text-left pointer-events-auto">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-medium text-white/70 mb-2 sm:mb-2.5">
              Deon Studios
            </p>
            <h1 className="font-editorial text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-white tracking-normal leading-snug sm:leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              Creating stories through stunning visuals<br className="hidden sm:inline" />{' '}
              and immersive experiences.
            </h1>
          </div>
        </div>
      </div>

      {/* Centered Scroll Indicator at the bottom edge */}
      <div
        role="button"
        tabIndex={0}
        onClick={onExploreClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExploreClick();
        }}
        className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center cursor-pointer group select-none pointer-events-auto transition-opacity duration-300 hover:opacity-100 opacity-90"
        title="Scroll down"
        aria-label="Scroll down to explore projects"
      >
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-medium text-white/80 group-hover:text-white transition-colors drop-shadow-sm">
          SCROLL
        </span>
        {/* Vertical line with downward repeating pulse/beam */}
        <div className="w-[1.5px] h-8 sm:h-10 bg-white/25 relative overflow-hidden rounded-full mt-2">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-white to-transparent animate-scroll-indicator" />
        </div>
      </div>
    </section>
  );
};

export default HeroVideo;
