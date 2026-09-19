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

  // Whenever the active video changes or mounts, ensure muted and start playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce muted property directly on DOM element for browser autoplay compliance
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
          .catch((err) => {
            console.warn('Hero video autoplay notice:', err);
            if (videoRef.current) {
              videoRef.current.defaultMuted = true;
              videoRef.current.muted = true;
              videoRef.current
                .play()
                .then(() => {
                  setVideoLoaded(true);
                  setHasVideoError(false);
                })
                .catch(() => {
                  // Browser policy may require first user interaction
                });
            }
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

    // Fallback: resume playback on first user gesture if browser blocked initial autoplay
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
  }, [activeVideoUrl]);

  return (
    <section
      id="hero-section"
      className="relative w-full h-[100vh] min-h-[600px] flex items-center justify-center overflow-hidden select-none bg-neutral-950"
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
          onPlay={() => setVideoLoaded(true)}
          onPlaying={() => setVideoLoaded(true)}
          onTimeUpdate={() => {
            if (videoRef.current && videoRef.current.currentTime > 0) {
              setVideoLoaded(true);
            }
          }}
          onError={() => {
            // Keep element mounted so user interactions or secondary sources can load
            console.warn('Hero video encountered error loading active source');
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
          {/* Desktop primary source from public /videos */}
          <source
            media="(min-width: 768px) and (orientation: landscape)"
            src="/videos/hero-desktop.mp4"
            type="video/mp4"
          />
          {/* Desktop source from src/assets */}
          <source
            media="(min-width: 768px) and (orientation: landscape)"
            src={HERO_VIDEO_DESKTOP}
            type="video/mp4"
          />
          {/* Fallback sources */}
          <source src={activeVideoUrl} type="video/mp4" />
          <source src="/videos/hero-desktop.mp4" type="video/mp4" />
          <source src="/src/assets/videos/hero-desktop.mp4" type="video/mp4" />
        </video>

        {/* Ambient Darkened Overlay for Text Legibility */}
        <div
          className="absolute inset-0 pointer-events-none bg-black/35 backdrop-brightness-[0.92] transition-colors duration-500"
        />
      </div>

      {/* Left-Aligned Editorial Studio Statement */}
      <div className="relative z-20 w-full px-6 sm:px-10 md:px-16 lg:px-24 max-w-[1880px] mx-auto flex flex-col items-start justify-center text-left pointer-events-none">
        <div className="flex flex-col items-start text-left pointer-events-auto max-w-4xl">
          {/* Photographer & Artist Name in Refined Editorial Font Size */}
          <h1
            className="font-editorial font-light text-white tracking-tight text-left drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
            style={{ fontSize: '48.12px', lineHeight: '48.12px' }}
          >
            Gideon Boadi
          </h1>

          {/* Role & Studio Discipline */}
          <p
            className="uppercase font-medium text-white/80 text-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            style={{
              fontSize: '10.54px',
              lineHeight: '16.81px',
              fontFamily: 'Times New Roman, serif',
              marginTop: '8px',
              letterSpacing: '0.32em',
            }}
          >
            Creative Director
          </p>
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
