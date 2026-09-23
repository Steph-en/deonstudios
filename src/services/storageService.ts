import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fileToPersistentDataUrl } from './indexedDbStorage';

const BUCKET_NAME = 'portfolio-media';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  path: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
];

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB

export class StorageService {
  /**
   * Helper to get public URL for a file in portfolio-media bucket
   */
  static getPublicUrl(storagePath: string): string {
    if (!storagePath) return '';
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }
    if (!isSupabaseConfigured()) {
      return storagePath;
    }
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Helper to get signed URL for private media
   */
  static async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    if (!isSupabaseConfigured()) return storagePath;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);
    if (error || !data?.signedUrl) {
      return this.getPublicUrl(storagePath);
    }
    return data.signedUrl;
  }

  /**
   * Universal upload method for Supabase Storage
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
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      throw new Error(`Unsupported media format (${file.type}). Supported: JPG, PNG, WebP, SVG, MP4, WebM.`);
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image size exceeds 20MB limit.');
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      throw new Error('Video size exceeds 150MB limit.');
    }

    // Measure image dimensions if applicable
    let width: number | undefined;
    let height: number | undefined;

    if (isImage && typeof window !== 'undefined') {
      try {
        const dimensions = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = URL.createObjectURL(file);
        });
        width = dimensions.w;
        height = dimensions.h;
      } catch {
        // dimensions optional
      }
    }

    // Clean up filename and build unique storage path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const finalPath = destinationPath.endsWith('/')
      ? `${destinationPath}${cleanBase}-${timestamp}.${fileExt}`
      : destinationPath;

    if (!isSupabaseConfigured()) {
      // In local preview/dev without Supabase keys, create a persistent Data URL
      const persistentUrl = await fileToPersistentDataUrl(file);
      return {
        path: finalPath,
        url: persistentUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
      };
    }

    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(finalPath, file, {
      cacheControl: '3600',
      upsert,
      contentType: file.type,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      width,
      height,
    };
  }

  /**
   * Upload image to project path
   */
  static async uploadImage(file: File, projectId = 'general', folder = 'gallery'): Promise<UploadResult> {
    return this.uploadMedia({
      file,
      destinationPath: `projects/${projectId}/${folder}/`,
    });
  }

  /**
   * Upload video to project path
   */
  static async uploadVideo(file: File, projectId = 'general'): Promise<UploadResult> {
    return this.uploadMedia({
      file,
      destinationPath: `projects/${projectId}/videos/`,
    });
  }

  /**
   * Delete media file from Supabase Storage
   */
  static async deleteMedia(storagePath: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !storagePath) return true;
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (error) {
      console.error('Failed to delete media from storage:', error);
      return false;
    }
    return true;
  }

  /**
   * Replace existing media with a new file at same or new path
   */
  static async replaceMedia(
    oldStoragePath: string | null | undefined,
    newFile: File,
    destinationPath: string
  ): Promise<UploadResult> {
    if (oldStoragePath) {
      await this.deleteMedia(oldStoragePath);
    }
    return this.uploadMedia({
      file: newFile,
      destinationPath,
      upsert: true,
    });
  }

  /**
   * List files in a bucket directory
   */
  static async listFiles(folder = 'projects'): Promise<Array<{ name: string; path: string; url: string; size?: number; updated_at?: string }>> {
    if (!isSupabaseConfigured()) {
      return [];
    }
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error || !data) return [];

    return data.map((item) => {
      const fullPath = `${folder}/${item.name}`;
      return {
        name: item.name,
        path: fullPath,
        url: this.getPublicUrl(fullPath),
        size: item.metadata?.size,
        updated_at: item.updated_at,
      };
    });
  }
}
