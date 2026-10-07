import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface GsapIntroProps {
  onComplete: () => void;
  targetLogoRef: React.RefObject<HTMLDivElement | null>;
  theme: 'dark' | 'light';
}

export const GsapIntro: React.FC<GsapIntroProps> = ({ onComplete, targetLogoRef, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !logoWrapperRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          onComplete();
        },
      });

      // 1. Initial State: Centered, scaled down, zero opacity
      gsap.set(logoWrapperRef.current, {
        scale: 0.65,
        opacity: 0,
        x: 0,
        y: 0,
      });

      // 2. Animate logo into the center of the screen
      tl.to(logoWrapperRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'power2.out',
      })
      // 3. Poise/Wait for 3 full seconds in the center as requested
      .to({}, { duration: 3.0 })
      // 4. Glide smoothly into the centered navigation bar logo
      .to(logoWrapperRef.current, {
        x: () => {
          if (targetLogoRef.current && logoWrapperRef.current) {
            const targetRect = targetLogoRef.current.getBoundingClientRect();
            const logoRect = logoWrapperRef.current.getBoundingClientRect();
            const currentX = (gsap.getProperty(logoWrapperRef.current, 'x') as number) || 0;
            return currentX + (targetRect.left + targetRect.width / 2 - (logoRect.left + logoRect.width / 2));
          }
          return 0;
        },
        y: () => {
          if (targetLogoRef.current && logoWrapperRef.current) {
            const targetRect = targetLogoRef.current.getBoundingClientRect();
            const logoRect = logoWrapperRef.current.getBoundingClientRect();
            const currentY = (gsap.getProperty(logoWrapperRef.current, 'y') as number) || 0;
            return currentY + (targetRect.top + targetRect.height / 2 - (logoRect.top + logoRect.height / 2));
          }
          return -window.innerHeight / 2 + 50;
        },
        scale: () => {
          if (targetLogoRef.current && logoWrapperRef.current) {
            const targetRect = targetLogoRef.current.getBoundingClientRect();
            return (targetRect.height || 38) / 100;
          }
          return 0.38;
        },
        duration: 1.35,
        ease: 'power3.inOut',
      })
      // 5. Fade out overlay
      .to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        '-=0.35'
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete, targetLogoRef]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      id="gsap-intro-overlay"
      onClick={() => {
        setIsDone(true);
        onComplete();
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center select-none cursor-pointer transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-950 text-white'
      }`}
      aria-label="Deon Studios intro animation"
    >
      {/* 
        Client's original logo image — exact dimensions, pure geometry mark 
      */}
      <div
        ref={logoWrapperRef}
        id="intro-logo-element"
        className="origin-center pointer-events-none flex items-center justify-center"
      >
        <img
          src="/assets/logo.png"
          alt="Deon Studios"
          className="w-[100px] h-[100px] max-w-[100px] max-h-[100px] object-contain drop-shadow-2xl select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default GsapIntro;
