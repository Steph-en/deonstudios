import React from 'react';
import { DeonLogo } from './DeonLogo';

interface FooterProps {
  onScrollToTop?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  const handleLogoClick = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="studio-footer"
      className="relative w-full border-t border-neutral-200 bg-neutral-50 text-neutral-500 py-8 sm:py-10 px-4 sm:px-6 md:px-10 lg:px-14 select-none"
    >
      <div className="w-full max-w-[1880px] mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Subtle, classic copyright fine print */}
        <p className="text-[8px] uppercase tracking-[0.16em] font-normal text-neutral-400 hover:text-neutral-500 transition-colors leading-none">
          © 2026 Deon Studios. All Rights Reserved.
        </p>

        {/* Right Side: Logo ALONE */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleLogoClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleLogoClick();
          }}
          className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity p-1 focus:outline-hidden"
          title="Deon Studios — Back to Top"
          aria-label="Deon Studios — Back to Top"
        >
          <DeonLogo size={20} fillColor="#171717" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
