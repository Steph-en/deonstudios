import React from 'react';

interface AnimatedNavbarLogoProps {
  size?: number;
  className?: string;
  isLightHeader?: boolean;
}

export const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = ({
  size = 42,
  className = '',
  isLightHeader = false,
}) => {
  const logoSrc = isLightHeader ? '/assets/logo-dark.png' : '/assets/logo-white.png';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none bg-transparent ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Deon Studios"
    >
      <img
        src={logoSrc}
        alt="Deon Studios"
        className="w-full h-full object-contain block select-none pointer-events-none transition-opacity duration-200"
        style={{ width: size, height: size }}
        draggable={false}
      />
    </div>
  );
};

export default AnimatedNavbarLogo;
