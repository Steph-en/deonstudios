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
  return (
    <div id={id} className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300"
      >
        <path
          d="M 36 16 L 105 16 A 84 84 0 0 1 189 100 A 84 84 0 0 1 105 184 L 36 184 L 36 106 L 55 106 A 45 45 0 1 0 55 94 L 36 94 L 36 16 Z"
          fill={fillColor}
        />
      </svg>
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
