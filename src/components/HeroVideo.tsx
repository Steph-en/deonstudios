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

  // Multi-asset rotation calculation based on clock time
  const [currentSlotIndex, setCurrentSlotIndex] = useState(() => {
    if (!config.assets || config.assets.length === 0 || config.mode !== 'rotation') return 0;
    const intervalValue = config.rotationIntervalHours || 1;
    const isMinutes = config.rotationIntervalUnit === 'minutes';
    const intervalMs = (isMinutes ? intervalValue * 60 : intervalValue * 3600) * 1000;
    return Math.floor(Date.now() / intervalMs) % config.assets.length;
  });

  useEffect(() => {
    if (!config.assets || config.assets.length <= 1 || config.mode !== 'rotation') return;
    const intervalValue = config.rotationIntervalHours || 1;
    const isMinutes = config.rotationIntervalUnit === 'minutes';
    const intervalMs = (isMinutes ? intervalValue * 60 : intervalValue * 3600) * 1000;

    const checkInterval = () => {
      const newSlot = Math.floor(Date.now() / intervalMs) % config.assets.length;
      setCurrentSlotIndex((prev) => (prev !== newSlot ? newSlot : prev));
    };

    checkInterval();
    const timer = setInterval(checkInterval, 5000);
    return () => clearInterval(timer);
  }, [config.assets, config.mode, config.rotationIntervalHours, config.rotationIntervalUnit]);

  // Active asset resolution (single vs rotation playlist)
  const activeAsset = React.useMemo(() => {
    if (config.mode === 'rotation' && config.assets && config.assets.length > 0) {
      return config.assets[currentSlotIndex] || config.assets[0];
    }
    if (config.assets && config.assets.length > 0) {
      if (config.activeAssetId) {
        const found = config.assets.find((a) => a.id === config.activeAssetId);
        if (found) return found;
      }
      return config.assets[0];
    }
    return {
      id: 'default',
      url: config.mediaUrl || 'https://oorbvpnuivsyfxftlqwr.supabase.co/storage/v1/object/public/portfolio-media/hero/l1060844-2-1790909528392.jpg',
      mediaType: config.mediaType || 'image',
      mobileUrl: config.mobileMediaUrl,
    };
  }, [config, currentSlotIndex]);

  // Framing values for centering the subject and scaling on mobile
  const mobileScale = config.mobileScale ?? 1;
  const mobileFocalX = config.mobileFocalX ?? 54;
  const mobileFocalY = config.mobileFocalY ?? 50;

  // Determine media URL based on viewport
  const activeMediaUrl =
    isMobileOrPortrait && activeAsset.mobileUrl
      ? activeAsset.mobileUrl
      : activeAsset.url || config.mediaUrl || '';

  const isVideoFormat =
    activeAsset.mediaType === 'video' ||
    activeMediaUrl.endsWith('.mp4') ||
    activeMediaUrl.endsWith('.webm') ||
    activeMediaUrl.includes('/videos/');

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
        RESPONSIVE HERO:
        Pure image or video centered with CMS focal point and scale controls.
        Zero ambient backdrop gradient or bleed distortion layers.
      */}
      <div className="absolute inset-0 w-full h-full min-h-[100dvh] overflow-hidden bg-neutral-950">
        {/* Dynamic Video (rendered when mediaType === 'video' or mp4 source) */}
        {isVideoFormat ? (
          <video
            ref={videoRef}
            key={activeMediaUrl}
            src={activeMediaUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onPlay={() => setVideoLoaded(true)}
            onError={() => {
              setHasVideoError(true);
            }}
            style={{
              objectPosition: isMobileOrPortrait
                ? `${mobileFocalX}% ${mobileFocalY}%`
                : 'center center',
              transform: isMobileOrPortrait ? `scale(${mobileScale})` : 'scale(1)',
              transformOrigin: `${mobileFocalX}% ${mobileFocalY}%`,
            }}
            className={`absolute inset-0 w-full h-full min-h-[100dvh] object-cover transition-opacity duration-500 ${
              videoLoaded && !hasVideoError ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          /* Pure Image Mode — clean, centered, no gradient bleed */
          <img
            src={activeMediaUrl}
            alt="Deon Studios Editorial Cover"
            className="absolute inset-0 w-full h-full min-h-[100dvh] object-cover transition-opacity duration-500 opacity-100"
            style={{
              objectPosition: isMobileOrPortrait
                ? `${mobileFocalX}% ${mobileFocalY}%`
                : 'center center',
              transform: isMobileOrPortrait ? `scale(${mobileScale})` : 'scale(1)',
              transformOrigin: `${mobileFocalX}% ${mobileFocalY}%`,
            }}
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

      {/* Centered Scroll Indicator */}
      <div
        role="button"
        tabIndex={0}
        onClick={onExploreClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExploreClick();
        }}
        style={{
          WebkitTransform: 'translate3d(-50%, 0, 0)',
          transform: 'translate3d(-50%, 0, 0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
        className="absolute bottom-5 sm:bottom-6 left-1/2 z-30 flex flex-col items-center cursor-pointer group select-none pointer-events-auto transition-opacity duration-300 hover:opacity-100 opacity-90"
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
