import sharp from 'sharp';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** preserve is safest: output bytes keep the source format. */
  format?: 'preserve' | 'jpeg' | 'webp' | 'png' | 'avif';
  minFileSizeToProcess?: number;
}

export interface VideoOptimizationOptions {
  maxHeight?: number;
  maxWidth?: number;
  crf?: number;
  audioBitrate?: string;
  preset?: string;
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

export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function isImage(filePathOrMime: string): boolean {
  const value = filePathOrMime.toLowerCase();
  return value.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|tiff|tif|gif|svg)$/i.test(value);
}

export function isVideo(filePathOrMime: string): boolean {
  const value = filePathOrMime.toLowerCase();
  return value.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(value);
}

export function getMimeType(filePathOrExt: string): string {
  const ext = path.extname(filePathOrExt).slice(1).toLowerCase() || filePathOrExt.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'avif': return 'image/avif';
    case 'tif':
    case 'tiff': return 'image/tiff';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    case 'mp4':
    case 'm4v': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'mkv': return 'video/x-matroska';
    case 'avi': return 'video/x-msvideo';
    default: return 'application/octet-stream';
  }
}

function unchanged(inputBuffer: Buffer, format: string, mimeType: string, width?: number, height?: number): OptimizationResult {
  return {
    optimizedBuffer: inputBuffer,
    originalSize: inputBuffer.length,
    optimizedSize: inputBuffer.length,
    savedBytes: 0,
    savedPercentage: 0,
    format,
    width,
    height,
    wasCompressed: false,
    mimeType,
  };
}

export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {},
  fallbackMime = 'application/octet-stream',
): Promise<OptimizationResult> {
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 82,
    format = 'preserve',
    minFileSizeToProcess = 300 * 1024,
  } = options;

  if (!inputBuffer.length || inputBuffer.length < minFileSizeToProcess) {
    return unchanged(inputBuffer, 'unchanged', fallbackMime, undefined, undefined);
  }
  if (!Number.isInteger(maxWidth) || maxWidth < 1 || !Number.isInteger(maxHeight) || maxHeight < 1) {
    throw new Error('maxWidth and maxHeight must be positive integers.');
  }
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    throw new Error('quality must be between 1 and 100.');
  }

  try {
    const metadata = await sharp(inputBuffer, { failOn: 'none', animated: false }).metadata();
    const originalFormat = metadata.format || 'unknown';
    const originalMime = fallbackMime || `image/${originalFormat}`;
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Preserve vector and multi-page/animated assets byte-for-byte.
    if (originalFormat === 'svg' || (metadata.pages ?? 1) > 1) {
      return unchanged(inputBuffer, originalFormat, originalMime, width, height);
    }

    // In preserve mode, only re-encode formats whose extension/MIME can remain unchanged.
    const targetFormat = format === 'preserve' ? originalFormat : format;
    if (!['jpeg', 'jpg', 'png', 'webp', 'avif'].includes(targetFormat)) {
      return unchanged(inputBuffer, originalFormat, originalMime, width, height);
    }

    const pipeline = sharp(inputBuffer, { failOn: 'none' }).rotate();
    if (width > maxWidth || height > maxHeight) {
      pipeline.resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true });
    }

    let mimeType: string;
    if (targetFormat === 'jpeg') {
      mimeType = 'image/jpeg';
      pipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' });
    } else if (targetFormat === 'png') {
      mimeType = 'image/png';
      pipeline.png({ compressionLevel: 9, palette: !metadata.hasAlpha, quality: Math.min(quality + 10, 100) });
    } else if (targetFormat === 'webp') {
      mimeType = 'image/webp';
      pipeline.webp({ quality, effort: 5 });
    } else {
      mimeType = 'image/avif';
      pipeline.avif({ quality: Math.max(quality - 10, 45), effort: 5 });
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();

    // Never replace an object unless the result is strictly smaller.
    if (optimizedBuffer.length >= inputBuffer.length) {
      return unchanged(inputBuffer, originalFormat, originalMime, width, height);
    }

    const savedBytes = inputBuffer.length - optimizedBuffer.length;
    return {
      optimizedBuffer,
      originalSize: inputBuffer.length,
      optimizedSize: optimizedBuffer.length,
      savedBytes,
      savedPercentage: Number(((savedBytes / inputBuffer.length) * 100).toFixed(2)),
      format: targetFormat,
      width: optimizedMetadata.width ?? width,
      height: optimizedMetadata.height ?? height,
      wasCompressed: true,
      mimeType,
    };
  } catch (error) {
    // Fail closed: optimization errors return the original bytes unchanged.
    console.warn('Image optimization failed; preserving original:', error instanceof Error ? error.message : error);
    return unchanged(inputBuffer, 'unknown', fallbackMime);
  }
}

export async function optimizeVideoFile(
  inputPath: string,
  outputPath: string,
  options: VideoOptimizationOptions = {},
): Promise<VideoOptimizationResult> {
  const {
    maxHeight = 1080,
    maxWidth = 1920,
    crf = 26,
    audioBitrate = '128k',
    preset = 'fast',
  } = options;
  const originalSize = fs.statSync(inputPath).size;
  const filter = `scale=w='min(${maxWidth},iw)':h='min(${maxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
  const args = [
    '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
    '-vf', filter, '-c:v', 'libx264', '-crf', String(crf), '-preset', preset,
    '-c:a', 'aac', '-b:a', audioBitrate, '-movflags', '+faststart', '-f', 'mp4', outputPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-4000); });
    proc.once('error', reject);
    proc.once('close', (code) => {
      if (code !== 0) reject(new Error(`FFmpeg failed (${code}): ${stderr.slice(-1000)}`));
      else resolve();
    });
  });

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new Error('FFmpeg did not produce a non-empty output file.');
  }
  const optimizedSize = fs.statSync(outputPath).size;
  if (optimizedSize >= originalSize) {
    fs.copyFileSync(inputPath, outputPath);
    return { outputPath, originalSize, optimizedSize: originalSize, savedBytes: 0, savedPercentage: 0, wasCompressed: false };
  }
  const savedBytes = originalSize - optimizedSize;
  return {
    outputPath,
    originalSize,
    optimizedSize,
    savedBytes,
    savedPercentage: Number(((savedBytes / originalSize) * 100).toFixed(2)),
    wasCompressed: true,
  };
}
