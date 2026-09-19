import React, { useState, useEffect, useRef } from 'react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  lazy?: boolean;
  rootMargin?: string;
}

const TRANSPARENT_PIXEL =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  lazy = true,
  rootMargin = '250px 0px',
  style,
  onLoad,
  onError,
  ...props
}) => {
  const [isInView, setIsInView] = useState(!lazy);
  const [imgSrc, setImgSrc] = useState(lazy ? TRANSPARENT_PIXEL : src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!lazy) {
      setIsInView(true);
      setImgSrc(src);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      setImgSrc(src);
      return;
    }

    const node = imgRef.current;
    if (!node) return;

    if (isInView) {
      setImgSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImgSrc(src);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [src, lazy, rootMargin, isInView]);

  useEffect(() => {
    if (isInView) {
      setImgSrc(src);
      setHasTriedFallback(false);
      setIsLoaded(false);
    }
  }, [src, isInView]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== TRANSPARENT_PIXEL) {
      setIsLoaded(true);
    }
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && imgSrc !== fallbackSrc && !hasTriedFallback) {
      setHasTriedFallback(true);
      setImgSrc(fallbackSrc);
    }
    if (onError) onError(e);
  };

  return (
    <img
      ref={imgRef}
      {...props}
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      style={{
        ...style,
        opacity: !lazy || isLoaded ? 1 : 0,
        transition: 'opacity 0.45s ease-out',
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default ResilientImage;
