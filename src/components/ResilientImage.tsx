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
  const [isInView, setIsInView] = useState(isEager);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // IntersectionObserver for genuine, reliable lazy-loading that defers DOM image attachment
  // until the viewport is within rootMargin
  useEffect(() => {
    if (isEager) {
      setIsInView(true);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isEager, rootMargin]);

  // Derive optimized src and responsive srcset
  const optimizedSrc = React.useMemo(() => {
    if (!src) return '';
    if (optimizedWidth) {
      return getOptimizedImageUrl(src, { width: optimizedWidth, quality });
    }
    return src;
  }, [src, optimizedWidth, quality]);

  const responsiveSrcSet = React.useMemo(() => {
    if (!enableResponsiveSrcSet || !src) return undefined;
    return buildResponsiveSrcSet(src);
  }, [src, enableResponsiveSrcSet]);

  // Check if image is already cached/complete on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      if (onDimensionsDetected && imgRef.current.naturalHeight > 0) {
        onDimensionsDetected(imgRef.current.naturalWidth, imgRef.current.naturalHeight);
      }
    }
  }, [optimizedSrc, onDimensionsDetected]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    const img = e.currentTarget;
    if (onDimensionsDetected && img.naturalWidth > 0 && img.naturalHeight > 0) {
      onDimensionsDetected(img.naturalWidth, img.naturalHeight);
    }
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (onError) onError(e);
  };

  return (
    <div
      ref={containerRef}
      className="contents"
    >
      {isInView ? (
        <img
          ref={imgRef}
          {...props}
          src={optimizedSrc}
          srcSet={responsiveSrcSet}
          sizes={responsiveSrcSet ? sizes : undefined}
          alt={alt}
          draggable={false}
          loading={isEager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={isEager ? 'high' : 'low'}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-500 ${
            isLoaded || isEager ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={style}
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Empty DOM placeholder while far off-screen to keep DOM light and save memory */
        <div
          aria-hidden="true"
          className="w-full h-full pointer-events-none"
        />
      )}
    </div>
  );
};

export default ResilientImage;
