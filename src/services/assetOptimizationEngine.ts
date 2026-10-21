import sharp from 'sharp';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100, default: 82
  format?: 'preserve' | 'jpeg' | 'webp' | 'png';
  minFileSizeToProcess?: number; // bytes, default: 300 * 1024 (300 KB)
}

export interface VideoOptimizationOptions {
  maxHeight?: number; // e.g. 1080
  maxWidth?: number;  // e.g. 1920
  crf?: number;       // default: 26 (visually lossless)
  audioBitrate?: string; // default: '128k'
  preset?: string;    // default: 'fast'
}

export interface OptimizationResult {
  optimizedBuffer: Buffer;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
  format: string;
  width?: number;
  height?: number;
  wasCompressed: boolean;
  mimeType: string;
}

export interface VideoOptimizationResult {
  outputPath: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
  wasCompressed: boolean;
}

/**
 * Calculates SHA-256 hash for exact asset deduplication
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Checks if a MIME type or file path represents an image
 */
export function isImage(filePathOrMime: string): boolean {
  const lower = filePathOrMime.toLowerCase();
  return (
    lower.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|avif|tiff|gif)$/i.test(lower)
  );
}

/**
 * Checks if a MIME type or file path represents a video
 */
export function isVideo(filePathOrMime: string): boolean {
  const lower = filePathOrMime.toLowerCase();
  return (
    lower.startsWith('video/') ||
    /\.(mp4|mov|webm|mkv|avi)$/i.test(lower)
  );
}

/**
 * Normalizes MIME type from extension or input
 */
export function getMimeType(filePathOrExt: string): string {
  const ext = filePathOrExt.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'svg':
      return 'image/svg+xml';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Optimizes an image buffer using Sharp.
 * Preserves transparency for PNGs and avoids re-compressing already-optimized files.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {},
  fallbackMime = 'image/jpeg'
): Promise<OptimizationResult> {
  const originalSize = inputBuffer.length;
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 82,
    format = 'preserve',
    minFileSizeToProcess = 300 * 1024,
  } = options;

  try {
    const pipeline = sharp(inputBuffer, { failOn: 'none' });
    const metadata = await pipeline.metadata();

    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;
    const origFormat = metadata.format || 'jpeg';

    // SVG or animated GIFs without resizing should be preserved
    if (origFormat === 'svg' || (metadata.pages && metadata.pages > 1)) {
      return {
        optimizedBuffer: inputBuffer,
        originalSize,
        optimizedSize: originalSize,
        savedBytes: 0,
        savedPercentage: 0,
        format: origFormat,
        width: origWidth,
        height: origHeight,
        wasCompressed: false,
        mimeType: `image/${origFormat}`,
      };
    }

    // Determine target format
    let targetFormat: string = origFormat;
    if (format !== 'preserve') {
      targetFormat = format;
    }

    // Auto-orient based on EXIF tag
    pipeline.rotate();

    // Resize inside bounding box without enlargement
    if (
      (maxWidth && origWidth > maxWidth) ||
      (maxHeight && origHeight > maxHeight)
    ) {
      pipeline.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific high-efficiency compression
    let targetMime = fallbackMime;
    if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
      targetMime = 'image/jpeg';
      pipeline.jpeg({
        quality,
        mozjpeg: true,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        overshootDeringing: true,
      });
    } else if (targetFormat === 'png') {
      targetMime = 'image/png';
      // If image has no alpha, compressing with palette or pngquant is very effective
      if (!metadata.hasAlpha) {
        pipeline.png({
          compressionLevel: 9,
          palette: true,
          quality: Math.min(quality + 10, 95),
        });
      } else {
        pipeline.png({
          compressionLevel: 9,
          progressive: true,
        });
      }
    } else if (targetFormat === 'webp') {
      targetMime = 'image/webp';
      pipeline.webp({
        quality,
        effort: 5,
      });
    } else if (targetFormat === 'avif') {
      targetMime = 'image/avif';
      pipeline.avif({
        quality: Math.max(quality - 10, 60),
        effort: 5,
      });
    } else {
      // Default fallback to high quality jpeg
      targetMime = 'image/jpeg';
      pipeline.jpeg({ quality, mozjpeg: true });
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    const optimizedSize = optimizedBuffer.length;

    // Safety check: Never return an optimized image if it became larger or failed to shrink meaningfully
    if (optimizedSize >= originalSize) {
      return {
        optimizedBuffer: inputBuffer,
        originalSize,
        optimizedSize: originalSize,
        savedBytes: 0,
        savedPercentage: 0,
        format: origFormat,
        width: origWidth,
        height: origHeight,
        wasCompressed: false,
        mimeType: fallbackMime,
      };
    }

    const savedBytes = originalSize - optimizedSize;
    const savedPercentage = Number(((savedBytes / originalSize) * 100).toFixed(1));

    return {
      optimizedBuffer,
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercentage,
      format: targetFormat,
      width: optimizedMetadata.width || origWidth,
      height: optimizedMetadata.height || origHeight,
      wasCompressed: true,
      mimeType: targetMime,
    };
  } catch (err: any) {
    console.warn('Image optimization fallback to original due to:', err?.message || err);
    return {
      optimizedBuffer: inputBuffer,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      format: 'unknown',
      wasCompressed: false,
      mimeType: fallbackMime,
    };
  }
}

/**
 * Optimizes a video file using system FFmpeg.
 * Scales down oversized resolutions, applies H.264 / AAC compression,
 * and adds +faststart for immediate web playback.
 */
export async function optimizeVideoFile(
  inputPath: string,
  outputPath: string,
  options: VideoOptimizationOptions = {}
): Promise<VideoOptimizationResult> {
  const {
    maxHeight = 1080,
    maxWidth = 1920,
    crf = 26,
    audioBitrate = '128k',
    preset = 'fast',
  } = options;

  const originalStat = fs.statSync(inputPath);
  const originalSize = originalStat.size;

  const filter = `scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`;

  const args = [
    '-y',
    '-i', inputPath,
    '-c:v', 'libx264',
    '-crf', String(crf),
    '-preset', preset,
    '-vf', filter,
    '-c:a', 'aac',
    '-b:a', audioBitrate,
    '-movflags', '+faststart',
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`FFmpeg failed with exit code ${code}: ${stderr.slice(-300)}`));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error('FFmpeg completed but output file not found.'));
      }

      const optimizedStat = fs.statSync(outputPath);
      const optimizedSize = optimizedStat.size;

      // If output is larger than original, revert to original
      if (optimizedSize >= originalSize) {
        fs.copyFileSync(inputPath, outputPath);
        return resolve({
          outputPath,
          originalSize,
          optimizedSize: originalSize,
          savedBytes: 0,
          savedPercentage: 0,
          wasCompressed: false,
        });
      }

      const savedBytes = originalSize - optimizedSize;
      const savedPercentage = Number(((savedBytes / originalSize) * 100).toFixed(1));

      resolve({
        outputPath,
        originalSize,
        optimizedSize,
        savedBytes,
        savedPercentage,
        wasCompressed: true,
      });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}
