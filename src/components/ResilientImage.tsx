import React, { useState, useEffect } from 'react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasTriedFallback(false);
  }, [src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackSrc && imgSrc !== fallbackSrc && !hasTriedFallback) {
          setHasTriedFallback(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
};

export default ResilientImage;
