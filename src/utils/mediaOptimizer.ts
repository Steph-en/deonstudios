/**
 * Browser-side image optimizer.
 *
 * Runs before every upload so only a compressed copy ever reaches Supabase
 * Storage (and therefore counts against storage and egress quotas).
 *
 *  - Downscales to MAX_EDGE on the longest side (never enlarges).
 *  - Re-encodes as WebP (keeps transparency, ~25-35% smaller than JPEG at the
 *    same visual quality). Falls back to JPEG, then to the original file.
 *  - Bakes in EXIF orientation, then drops all metadata (GPS, camera serials).
 *  - Never returns a file larger than the one it was given.
 *  - SVG / GIF are passed through untouched.
 */

const MAX_EDGE = 2560;
const WEBP_QUALITY = 0.85;
const JPEG_QUALITY = 0.86;

export interface OptimizedImage {
  file: File;
  width?: number;
  height?: number;
  originalSize: number;
  wasOptimized: boolean;
}

const PASSTHROUGH_TYPES = new Set(['image/svg+xml', 'image/gif']);

async function encode(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob | null> {
  const blob =
    'convertToBlob' in canvas
      ? await canvas.convertToBlob({ type, quality })
      : await new Promise<Blob | null>((resolve) =>
          (canvas as HTMLCanvasElement).toBlob(resolve, type, quality)
        );
  // Browsers silently fall back to PNG when they can't encode `type`.
  return blob && blob.type === type ? blob : null;
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  const untouched: OptimizedImage = {
    file,
    originalSize: file.size,
    wasOptimized: false,
  };

  if (PASSTHROUGH_TYPES.has(file.type) || typeof createImageBitmap !== 'function') {
    return untouched;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return untouched; // undecodable here; let Storage validate it
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const dims = { width, height };

    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), dims);
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return { ...untouched, ...dims };

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    let blob = await encode(canvas, 'image/webp', WEBP_QUALITY);
    let ext = 'webp';
    if (!blob) {
      // Browser can't encode WebP; JPEG is fine for photos but has no alpha,
      // so only use it when the source has none (PNG may carry transparency).
      blob = file.type === 'image/png' ? null : await encode(canvas, 'image/jpeg', JPEG_QUALITY);
      ext = 'jpg';
    }

    // Keep the original if re-encoding didn't help and we didn't have to resize.
    if (!blob || (blob.size >= file.size && scale === 1)) {
      return { ...untouched, ...dims };
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    return {
      file: new File([blob], `${baseName}.${ext}`, { type: blob.type }),
      ...dims,
      originalSize: file.size,
      wasOptimized: true,
    };
  } finally {
    bitmap.close();
  }
}
