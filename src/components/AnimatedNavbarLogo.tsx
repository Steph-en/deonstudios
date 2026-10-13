import React from 'react';

interface AnimatedNavbarLogoProps {
  size?: number;
  className?: string;
  isLightHeader?: boolean;
}

export const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = ({
  size = 36,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none bg-transparent ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Deon Studios"
    >
      {/* 
        Ghostly Black & White Transparent Inversion Lens:
        Clips a monochrome backdrop filter strictly to the geometric shape of the Deon Studios logo mark.
        1. Desaturates whatever is beneath the logo to pure grayscale (100%), completely removing any sepia, orange, or chromatic cast on photographs.
        2. Inverts luminance (100%): on dark/black backgrounds it produces luminous white; on light/white backgrounds it produces crisp black.
        3. Preserves full transparency and photo texture beneath the mark for that signature ethereal 'ghostly' lens effect.
      */}
      <div
        className="w-full h-full pointer-events-none transition-all duration-300 navbar-logo-ghostly"
        style={{
          width: size,
          height: size,
          WebkitMaskImage: 'url(/assets/logo.png)',
          maskImage: 'url(/assets/logo.png)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          backdropFilter: 'grayscale(100%) invert(100%) contrast(1.25) brightness(1.05)',
          WebkitBackdropFilter: 'grayscale(100%) invert(100%) contrast(1.25) brightness(1.05)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      />
    </div>
  );
};

export default AnimatedNavbarLogo;
