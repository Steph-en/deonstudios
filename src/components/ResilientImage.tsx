import React, { useState, useEffect, useRef } from 'react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  lazy?: boolean;
  priority?: boolean;
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
  priority = false,
  rootMargin = '800px 0px',
  style,
  onLoad,
  onError,
  ...props
}) => {
  const isEager = priority || !lazy;
  const [isInView, setIsInView] = useState(isEager);
  const [imgSrc, setImgSrc] = useState(isEager ? src : TRANSPARENT_PIXEL);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isEager) {
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
  }, [src, isEager, rootMargin, isInView]);

  useEffect(() => {
    if (isInView) {
      setImgSrc(src);
      setHasTriedFallback(false);
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
      draggable={false}
      loading={isEager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`transition-opacity duration-300 ${className}`}
      style={{
        ...style,
        opacity: isEager || isLoaded ? 1 : 0.4,
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default ResilientImage;
