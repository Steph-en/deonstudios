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
        Transparent Dynamic See-Through Vector Logo:
        - Fill is pure white (#ffffff)
        - Blended via parent container with mix-blend-mode: difference
        - Inverts to black on white sections, inverts to white on black sections
        - Splices seamlessly across text and media boundaries during scroll
      */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <path
          d="M 36 16 L 105 16 A 84 84 0 0 1 189 100 A 84 84 0 0 1 105 184 L 36 184 L 36 106 L 55 106 A 45 45 0 1 0 55 94 L 36 94 L 36 16 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
};

export default AnimatedNavbarLogo;
