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

  // Keep references to callback and target ref to avoid re-triggering effect on parent re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const targetLogoRefInternal = useRef(targetLogoRef);
  targetLogoRefInternal.current = targetLogoRef;

  useEffect(() => {
    if (!containerRef.current || !logoWrapperRef.current) return;

    // Preload image in memory to prevent any decode delay or paint flicker
    const imgPreload = new Image();
    imgPreload.src = '/assets/logo.png';

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          onCompleteRef.current();
        },
      });

      // 1. Set initial state seamlessly (matches initial inline CSS to eliminate FOUC)
      gsap.set(logoWrapperRef.current, {
        scale: 0.65,
        opacity: 0,
        x: 0,
        y: 0,
        force3D: true,
      });

      // 2. Animate logo into the center of the screen
      tl.to(logoWrapperRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.0,
        ease: 'power2.out',
      })
      // 3. Poise/Wait for 2 full seconds in the center with complete stability
      .to({}, { duration: 2.0 })
      // 4. Glide smoothly into the centered navigation bar logo
      .to(logoWrapperRef.current, {
        x: () => {
          const targetEl = targetLogoRefInternal.current.current;
          if (targetEl && logoWrapperRef.current) {
            const targetRect = targetEl.getBoundingClientRect();
            const logoRect = logoWrapperRef.current.getBoundingClientRect();
            const currentX = (gsap.getProperty(logoWrapperRef.current, 'x') as number) || 0;
            return currentX + (targetRect.left + targetRect.width / 2 - (logoRect.left + logoRect.width / 2));
          }
          return 0;
        },
        y: () => {
          const targetEl = targetLogoRefInternal.current.current;
          if (targetEl && logoWrapperRef.current) {
            const targetRect = targetEl.getBoundingClientRect();
            const logoRect = logoWrapperRef.current.getBoundingClientRect();
            const currentY = (gsap.getProperty(logoWrapperRef.current, 'y') as number) || 0;
            return currentY + (targetRect.top + targetRect.height / 2 - (logoRect.top + logoRect.height / 2));
          }
          return -window.innerHeight / 2 + 50;
        },
        scale: () => {
          const targetEl = targetLogoRefInternal.current.current;
          if (targetEl) {
            const targetRect = targetEl.getBoundingClientRect();
            return (targetRect.height || 44) / 100;
          }
          return 0.44;
        },
        duration: 1.3,
        ease: 'power3.inOut',
      })
      // 5. Fade out overlay synchronously with landing
      .to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        '-=0.4'
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []); // Run ONCE on mount so parent re-renders never interrupt or flicker the animation

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      id="gsap-intro-overlay"
      onClick={() => {
        setIsDone(true);
        onCompleteRef.current();
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center select-none cursor-pointer transition-colors duration-300 will-change-opacity ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-950 text-white'
      }`}
      aria-label="Deon Studios intro animation"
    >
      {/* 
        Client's original logo image — exact dimensions, pure geometry mark.
        Initial CSS opacity: 0 and scale(0.65) prevents any initial paint flash or FOUC.
      */}
      <div
        ref={logoWrapperRef}
        id="intro-logo-element"
        style={{ opacity: 0, transform: 'scale(0.65)' }}
        className="origin-center pointer-events-none flex items-center justify-center will-change-transform"
      >
        <img
          src="/assets/logo.png"
          alt="Deon Studios"
          width={100}
          height={100}
          className="w-[100px] h-[100px] max-w-[100px] max-h-[100px] object-contain drop-shadow-2xl select-none pointer-events-none"
          draggable={false}
          loading="eager"
        />
      </div>
    </div>
  );
};

export default GsapIntro;
