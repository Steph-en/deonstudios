import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { optimizeImage } from '../utils/mediaOptimizer';

const BUCKET = 'portfolio-media';

// Images are compressed in the browser before upload, so the limit applies to the
// original file the user picks. Videos are uploaded as-is and must fit the bucket
// limit (50 MB, see supabase/migrations/015).
const MAX_IMAGE_SIZE = 40 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export interface UploadResult {
  path: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  /** Size of the file the user picked, before optimization. */
  originalSize: number;
  wasOptimized: boolean;
}

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

function buildStoragePath(destination: string, fileName: string): string {
  const folder = destination.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!folder || !folder.split('/').every((s) => /^[a-zA-Z0-9_-]+$/.test(s))) {
    throw new Error('Invalid upload destination.');
  }
  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const base =
    fileName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'upload';
  return `${folder}/${base}-${Date.now()}.${ext}`;
}

function describeUploadError(error: { message?: string; statusCode?: string | number }): string {
  const msg = error.message || 'Unknown storage error.';
  if (/row-level security|unauthorized|not authorized|403/i.test(`${msg} ${error.statusCode}`)) {
    return 'Storage rejected the upload because you are not signed in to Supabase. Sign out, sign back in, and try again.';
  }
  if (/exceeded the maximum|too large|413/i.test(`${msg} ${error.statusCode}`)) {
    return 'The file is larger than the storage limit. Compress it or raise the limit in Supabase → Storage → Settings.';
  }
  return msg;
}

export class StorageService {
  /**
   * Optimize (images only) and upload a file straight to Supabase Storage.
   * Nothing is proxied through our own server, so it works identically in
   * local dev and on Vercel, and original full-size images are never stored.
   */
  static async uploadMedia({
    file,
    destinationPath,
    upsert = true,
  }: {
    file: File;
    destinationPath: string;
    upsert?: boolean;
  }): Promise<UploadResult> {
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      throw new Error(
        `Unsupported media format (${file.type || 'unknown'}). Supported: JPG, PNG, WebP, SVG, MP4 and WebM.`
      );
    }
    if (file.size === 0) throw new Error('The selected file is empty.');
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image is larger than ${mb(MAX_IMAGE_SIZE)}.`);
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      throw new Error(
        `Video is larger than ${mb(MAX_VIDEO_SIZE)}. Compress it first (e.g. HandBrake, H.264 at 1080p) and try again.`
      );
    }
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured, so media cannot be uploaded.');
    }

    const optimized = isImage
      ? await optimizeImage(file)
      : { file, originalSize: file.size, wasOptimized: false, width: undefined, height: undefined };
    const upload = optimized.file;
    const path = buildStoragePath(destinationPath, upload.name);

    const { data, error } = await supabase.storage.from(BUCKET).upload(path, upload, {
      cacheControl: '31536000',
      upsert,
      contentType: upload.type,
    });
    if (error || !data?.path) {
      throw new Error(describeUploadError(error ?? {}));
    }

    return {
      path: data.path,
      url: supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl,
      fileName: upload.name,
      fileSize: upload.size,
      mimeType: upload.type,
      width: optimized.width,
      height: optimized.height,
      originalSize: optimized.originalSize,
      wasOptimized: optimized.wasOptimized,
    };
  }

  /** Delete a file from Supabase Storage. Returns false on failure. */
  static async deleteMedia(storagePath: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !storagePath) return true;

    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) {
      console.error('Failed to delete media from storage:', error);
      return false;
    }
    return true;
  }
}
