import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl, buildResponsiveSrcSet } from '../utils/imageOptimizer';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  lazy?: boolean;
  priority?: boolean;
  rootMargin?: string;
  optimizedWidth?: number;
  quality?: number;
  enableResponsiveSrcSet?: boolean;
  onDimensionsDetected?: (width: number, height: number) => void;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  lazy = true,
  priority = false,
  rootMargin = '400px 0px',
  optimizedWidth,
  quality = 82,
  enableResponsiveSrcSet = true,
  style,
  onLoad,
  onError,
  onDimensionsDetected,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props
}) => {
  const isEager = priority || !lazy;
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    const raw = src || fallbackSrc || '';
    if (!raw) return '';
    if (optimizedWidth) {
      return getOptimizedImageUrl(raw, { width: optimizedWidth, quality });
    }
    return raw;
  });
  const [isLoaded, setIsLoaded] = useState(isEager);
  const [loadFailed, setLoadFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Keep a stable ref to onDimensionsDetected to avoid re-triggering effects when parent passes new closures
  const onDimensionsDetectedRef = useRef(onDimensionsDetected);
  useEffect(() => {
    onDimensionsDetectedRef.current = onDimensionsDetected;
  });

  // Keep track of reported dimensions for current image to prevent duplicate calls
  const reportedDimensionsRef = useRef<string | null>(null);

  // Sync state when src changes
  useEffect(() => {
    const raw = src || fallbackSrc || '';
    if (!raw) {
      setCurrentSrc('');
      return;
    }
    const nextSrc = optimizedWidth
      ? getOptimizedImageUrl(raw, { width: optimizedWidth, quality })
      : raw;
    setCurrentSrc(nextSrc);
    setLoadFailed(false);
    reportedDimensionsRef.current = null;
  }, [src, fallbackSrc, optimizedWidth, quality]);

  const responsiveSrcSet = React.useMemo(() => {
    if (!enableResponsiveSrcSet || !src || loadFailed) return undefined;
    return buildResponsiveSrcSet(src);
  }, [src, enableResponsiveSrcSet, loadFailed]);

  // Check if image is already cached or complete on mount/source change (no unstable callback in deps)
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
      setIsLoaded(true);
      const key = `${el.naturalWidth}x${el.naturalHeight}`;
      if (reportedDimensionsRef.current !== key) {
        reportedDimensionsRef.current = key;
        onDimensionsDetectedRef.current?.(el.naturalWidth, el.naturalHeight);
      }
    }
  }, [currentSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setLoadFailed(false);
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const key = `${img.naturalWidth}x${img.naturalHeight}`;
      if (reportedDimensionsRef.current !== key) {
        reportedDimensionsRef.current = key;
        onDimensionsDetectedRef.current?.(img.naturalWidth, img.naturalHeight);
      }
    }
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If optimized URL failed, fallback to raw src first
    if (currentSrc !== src && src) {
      setCurrentSrc(src);
      return;
    }
    // If raw src failed, fallback to fallbackSrc if provided
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setLoadFailed(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  // If no source is available, do not render an <img> tag with an empty string
  if (!currentSrc) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      {...props}
      src={currentSrc}
      srcSet={responsiveSrcSet}
      sizes={responsiveSrcSet ? sizes : undefined}
      alt={alt}
      draggable={false}
      loading={isEager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={isEager ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-80'
      } ${className}`}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};

export default ResilientImage;
