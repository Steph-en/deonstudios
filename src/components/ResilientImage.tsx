import React, { useState, useEffect, useRef } from 'react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  lazy?: boolean;
  priority?: boolean;
  rootMargin?: string;
  onDimensionsDetected?: (width: number, height: number) => void;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  lazy = true,
  priority = false,
  rootMargin,
  style,
  onLoad,
  onError,
  onDimensionsDetected,
  ...props
}) => {
  const isEager = priority || !lazy;
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Synchronize src if prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasTriedFallback(false);
  }, [src]);

  // Check if image is already cached/complete on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      if (onDimensionsDetected && imgRef.current.naturalHeight > 0) {
        onDimensionsDetected(imgRef.current.naturalWidth, imgRef.current.naturalHeight);
      }
    }
  }, [currentSrc, onDimensionsDetected]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    const img = e.currentTarget;
    if (onDimensionsDetected && img.naturalWidth > 0 && img.naturalHeight > 0) {
      onDimensionsDetected(img.naturalWidth, img.naturalHeight);
    }
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc && !hasTriedFallback) {
      setHasTriedFallback(true);
      setCurrentSrc(fallbackSrc);
    }
    if (onError) onError(e);
  };

  return (
    <img
      ref={imgRef}
      {...props}
      src={currentSrc}
      alt={alt}
      draggable={false}
      loading={isEager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`transition-opacity duration-300 ${className}`}
      style={{
        ...style,
        opacity: isLoaded || isEager ? 1 : 0.85,
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default ResilientImage;
