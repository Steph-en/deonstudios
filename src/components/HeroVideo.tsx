import React, { useRef, useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { useHeroSettings } from '../hooks/usePortfolioQueries';
import { DEFAULT_HERO_SETTINGS } from '../services/siteSettingsService';

interface HeroVideoProps {
  theme: ThemeMode;
  onExploreClick: () => void;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ onExploreClick }) => {
  const { data: settings } = useHeroSettings();
  const config = settings || DEFAULT_HERO_SETTINGS;

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
      const isPortrait =
        window.matchMedia('(orientation: portrait)').matches ||
        window.innerHeight > window.innerWidth;
      setIsMobileOrPortrait(isNarrow || isPortrait);
    };

    checkResponsiveMedia();

    window.addEventListener('resize', checkResponsiveMedia);
    window.addEventListener('orientationchange', checkResponsiveMedia);

    return () => {
      window.removeEventListener('resize', checkResponsiveMedia);
      window.removeEventListener('orientationchange', checkResponsiveMedia);
    };
  }, []);

  // Determine media URL based on viewport
  const activeMediaUrl =
    isMobileOrPortrait && config.mobileMediaUrl
      ? config.mobileMediaUrl
      : config.mediaUrl || '/videos/hero-desktop.mp4';

  const isVideoFormat =
    config.mediaType === 'video' ||
    activeMediaUrl.endsWith('.mp4') ||
    activeMediaUrl.endsWith('.webm') ||
    activeMediaUrl.includes('/videos/');

  const posterFallback =
    config.fallbackPosterUrl ||
    (config.mediaType === 'image' ? config.mediaUrl : '') ||
    '/assets/images/gideon_boadi_portrait.png';

  // Autoplay management for video
  useEffect(() => {
    if (!isVideoFormat) return;
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    setHasVideoError(false);

    const attemptPlay = () => {
      if (!video) return;
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoLoaded(true);
            setHasVideoError(false);
          })
          .catch(() => {
            // Browser autoplay restrictions - will play on first user interaction
          });
      }
    };

    if (video.readyState >= 2) {
      setVideoLoaded(true);
      attemptPlay();
    } else {
      video.load();
      attemptPlay();
    }

    const handleGesture = () => {
      if (video && video.paused) {
        attemptPlay();
      }
    };

    window.addEventListener('click', handleGesture, { once: true, passive: true });
    window.addEventListener('scroll', handleGesture, { once: true, passive: true });
    window.addEventListener('touchstart', handleGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('scroll', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [activeMediaUrl, isVideoFormat]);

  return (
    <section
      id="hero-section"
      className="relative w-full h-[100dvh] min-h-[100dvh] flex items-center justify-center overflow-hidden select-none bg-neutral-950"
    >
      {/* 
        RESPONSIVE VIEWPORT COVER HERO:
        - Image or Video fills full viewport on mobile & desktop
        - Uses object-cover + object-center to eliminate black letterbox bars
      */}
      <div className="absolute inset-0 w-full h-full min-h-[100dvh] overflow-hidden bg-neutral-950">
        {/* Fallback Poster (always present behind video or as primary image) */}
        {posterFallback && (
          <img
            src={posterFallback}
            alt="Deon Studios Cover"
            className={`absolute inset-0 w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 ${
              isVideoFormat && videoLoaded && !hasVideoError ? 'opacity-0' : 'opacity-100'
            }`}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Dynamic Video (rendered when mediaType === 'video' or mp4 source) */}
        {isVideoFormat ? (
          <video
            ref={videoRef}
            key={activeMediaUrl}
            src={activeMediaUrl}
            poster={posterFallback}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onPlay={() => setVideoLoaded(true)}
            onError={() => {
              console.warn('Hero video failed to load, falling back to image');
              setHasVideoError(true);
            }}
            className={`absolute inset-0 w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 ${
              videoLoaded && !hasVideoError ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          /* Pure Full-Bleed Image Mode */
          <img
            src={activeMediaUrl}
            alt="Deon Studios Editorial Cover"
            className="absolute inset-0 w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 opacity-100"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Ambient Darkened Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-500"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity ?? 0.2})`,
          }}
        />
      </div>

      {/* Centered Scroll Indicator at bottom edge */}
      <div
        role="button"
        tabIndex={0}
        onClick={onExploreClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExploreClick();
        }}
        className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center cursor-pointer group select-none pointer-events-auto transition-opacity duration-300 hover:opacity-100 opacity-90"
        title="Scroll down"
        aria-label="Scroll down to explore projects"
      >
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-medium text-white/80 group-hover:text-white transition-colors drop-shadow-sm font-sans-clean">
          {config.scrollText || 'SCROLL'}
        </span>
        <div className="w-[1.5px] h-8 sm:h-10 bg-white/30 relative overflow-hidden rounded-full mt-2">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-white to-transparent animate-scroll-indicator" />
        </div>
      </div>
    </section>
  );
};

export default HeroVideo;
