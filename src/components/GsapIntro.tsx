import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DeonLogo } from './DeonLogo';

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

      // 1. Initial State: Centered, small, zero opacity
      gsap.set(logoWrapperRef.current, {
        scale: 0.5,
        opacity: 0,
        x: 0,
        y: 0,
      });

      // 2. Animate logo into the center of the screen
      tl.to(logoWrapperRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'power3.out',
      })
      // 3. Poise in the center
      .to({}, { duration: 0.5 });

      // 4. Calculate target position of the centered navbar logo
      let targetX = 0;
      let targetY = -window.innerHeight / 2 + 50;
      let targetScale = 0.38;

      if (targetLogoRef.current && logoWrapperRef.current) {
        const logoRect = logoWrapperRef.current.getBoundingClientRect();
        const targetRect = targetLogoRef.current.getBoundingClientRect();

        targetX = targetRect.left + targetRect.width / 2 - (logoRect.left + logoRect.width / 2);
        targetY = targetRect.top + targetRect.height / 2 - (logoRect.top + logoRect.height / 2);
        targetScale = (targetRect.height || 32) / (logoRect.height || 84);
      }

      // 5. Glide straight into the centered navigation bar logo
      tl.to(
        logoWrapperRef.current,
        {
          x: targetX,
          y: targetY,
          scale: targetScale,
          duration: 0.9,
          ease: 'power3.inOut',
        }
      )
      // 6. Fade out overlay
      .to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        '-=0.3'
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
        Centered Logo ONLY — no writing, no text, no lines, pure geometric mark 
      */}
      <div
        ref={logoWrapperRef}
        id="intro-logo-element"
        className="origin-center pointer-events-none"
      >
        <DeonLogo
          size={84}
          fillColor="#FFFFFF"
        />
      </div>
    </div>
  );
};

export default GsapIntro;
