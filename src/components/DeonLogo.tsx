import React from 'react';

interface DeonLogoProps {
  className?: string;
  size?: number | string;
  fillColor?: string;
  showText?: boolean;
  textColor?: string;
  id?: string;
}

export const DeonLogo: React.FC<DeonLogoProps> = ({
  className = '',
  size = 36,
  fillColor = 'currentColor',
  showText = false,
  textColor = 'currentColor',
  id,
}) => {
  const isWhite =
    typeof fillColor === 'string' &&
    (fillColor.toLowerCase() === '#ffffff' ||
      fillColor.toLowerCase() === '#fff' ||
      fillColor.toLowerCase() === 'white');

  const logoSrc = isWhite ? '/assets/logo-white.png' : '/assets/logo-dark.png';
  const numSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div id={id} className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Deon Studios"
        className="shrink-0 object-contain transition-transform duration-300 select-none pointer-events-none"
        style={{ width: numSize, height: numSize }}
        draggable={false}
      />
      {showText && (
        <span
          className="font-display font-bold tracking-[0.25em] text-xs uppercase leading-none"
          style={{ color: textColor }}
        >
          DEON STUDIOS
        </span>
      )}
    </div>
  );
};

export default DeonLogo;
