import React from 'react';

interface AnimatedNavbarLogoProps {
  size?: number;
  className?: string;
  isLightHeader?: boolean;
}

export const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = ({
  size = 42,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Deon Studios"
    >
      {/* 
        Transparent Dynamic See-Through Original Client Logo:
        - Pure white (#ffffff) on transparent alpha
        - Blended via parent container with mix-blend-mode: difference
        - Inverts to black on white sections, inverts to white on black sections
        - Splices seamlessly across text and media boundaries during scroll
      */}
      <img
        src="/assets/logo-white.png"
        alt="Deon Studios"
        className="w-full h-full object-contain block select-none pointer-events-none"
        style={{ width: size, height: size }}
        draggable={false}
      />
    </div>
  );
};

export default AnimatedNavbarLogo;
