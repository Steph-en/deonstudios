/**
 * Image URL Optimization Utility
 * 
 * Automatically enhances image URLs from known CDNs (Supabase Storage, Cloudinary,
 * Unsplash, Imgix, etc.) with optimal dimensions, responsive sizes, WebP/AVIF formats,
 * and quality compression.
 * 
 * If the image is a standard URL or unknown CDN, it preserves the URL safely.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1 - 100, default 80
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Optimizes an image URL for the requested display width and quality.
 * Supports Supabase Image Transformation (render/image/v1), Unsplash, Cloudinary, etc.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';
  if (typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs, SVGs, or relative video/blob paths should not be transformed
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.endsWith('.svg') ||
    trimmed.endsWith('.mp4') ||
    trimmed.endsWith('.webm')
  ) {
    return trimmed;
  }

  const { width, height, quality = 82, format, resize = 'cover' } = options;

  try {
    // 1. Supabase Storage Image Transformation
    // Pattern: /storage/v1/object/public/<bucket>/<path>
    // Transformed: /storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...
    if (trimmed.includes('supabase.co/storage/v1/object/public/')) {
      const transformedBase = trimmed.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );

      const parsedUrl = new URL(transformedBase);
      if (width) parsedUrl.searchParams.set('width', Math.round(width).toString());
      if (height) parsedUrl.searchParams.set('height', Math.round(height).toString());
      if (quality) parsedUrl.searchParams.set('quality', Math.round(quality).toString());
      if (resize) parsedUrl.searchParams.set('resize', resize);
      if (format && format !== 'origin') parsedUrl.searchParams.set('format', format);

      return parsedUrl.toString();
    }

    // If already in /render/image/public format:
    if (trimmed.includes('supabase.co/storage/v1/render/image/public/')) {
      const parsedUrl = new URL(trimmed);
      if (width) parsedUrl.searchParams.set('width', Math.round(width).toString());
      if (height) parsedUrl.searchParams.set('height', Math.round(height).toString());
      if (quality) parsedUrl.searchParams.set('quality', Math.round(quality).toString());
      if (resize) parsedUrl.searchParams.set('resize', resize);
      if (format && format !== 'origin') parsedUrl.searchParams.set('format', format);
      return parsedUrl.toString();
    }

    // 2. Unsplash optimization
    if (trimmed.includes('images.unsplash.com')) {
      const parsedUrl = new URL(trimmed);
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      if (width) parsedUrl.searchParams.set('w', Math.round(width).toString());
      if (height) parsedUrl.searchParams.set('h', Math.round(height).toString());
      if (quality) parsedUrl.searchParams.set('q', Math.round(quality).toString());
      return parsedUrl.toString();
    }

    // 3. Cloudinary optimization
    if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
      const transforms: string[] = ['f_auto', 'q_auto'];
      if (width) transforms.push(`w_${Math.round(width)}`);
      if (height) transforms.push(`h_${Math.round(height)}`);
      if (resize) transforms.push(`c_${resize}`);
      const transformStr = transforms.join(',');
      return trimmed.replace('/image/upload/', `/image/upload/${transformStr}/`);
    }

    // Default: return raw URL if no CDN transformer applies
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Builds responsive `srcSet` for images supporting dynamic CDN transformation
 */
export function buildResponsiveSrcSet(
  url: string | undefined | null,
  widths: number[] = [480, 800, 1200, 1600, 2000]
): string | undefined {
  if (!url) return undefined;

  // Only generate srcSet if the URL is from a known transformable CDN
  const isTransformable =
    url.includes('supabase.co/storage/v1/') ||
    url.includes('images.unsplash.com') ||
    url.includes('res.cloudinary.com');

  if (!isTransformable) return undefined;

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, quality: 82 })} ${w}w`)
    .join(', ');
}
