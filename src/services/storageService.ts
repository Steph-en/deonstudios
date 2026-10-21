
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ApiClient } from '../lib/api';

const BUCKET_NAME = 'portfolio-media';
const UPLOAD_ENDPOINT = '/upload';

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

interface ServerUploadResponse {
  success?: boolean;
  path?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  originalSize?: number;
  wasOptimized?: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  error?: string;
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

/**
 * Convert a browser File to a base64 data URL for the server upload endpoint.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the selected file.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read the selected file.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate that the server returned a real Supabase public Storage URL.
 *
 * This deliberately rejects relative URLs such as /uploads/image.jpg,
 * which could indicate that the server used a local filesystem fallback.
 */
function isSupabaseStorageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === 'https:' &&
      parsedUrl.pathname.includes(
        `/storage/v1/object/public/${BUCKET_NAME}/`
      )
    );
  } catch {
    return false;
  }
}

/**
 * Build a safe client-side fallback path for non-image uploads.
 */
function createStoragePath(
  fileName: string,
  destinationPath: string
): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';

  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload';

  const timestamp = Date.now();
  const generatedFileName = `${cleanBase}-${timestamp}.${extension}`;

  const normalizedDestination = destinationPath
    .replace(/^\/+|\/+$/g, '');

  return normalizedDestination
    ? `${normalizedDestination}/${generatedFileName}`
    : generatedFileName;
}

export class StorageService {
  /**
   * Get a public URL for a file in the portfolio-media bucket.
   */
  static getPublicUrl(storagePath: string): string {
    if (!storagePath) return '';

    if (
      storagePath.startsWith('http://') ||
      storagePath.startsWith('https://')
    ) {
      return storagePath;
    }

    if (!isSupabaseConfigured()) {
      return storagePath;
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Get a signed URL for private media.
   */
  static async getSignedUrl(
    storagePath: string,
    expiresIn = 3600
  ): Promise<string> {
    if (!isSupabaseConfigured()) {
      return storagePath;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      return this.getPublicUrl(storagePath);
    }

    return data.signedUrl;
  }

  /**
   * Upload media.
   *
   * Images:
   * - Must go through the server-side optimization endpoint.
   * - Must not fall back to a direct browser-to-Supabase upload.
   * - Are considered successful only when the server returns a valid
   *   Supabase Storage URL.
   *
   * Videos:
   * - Try the server endpoint first.
   * - May use the direct Supabase upload fallback if the server endpoint
   *   fails, provided Supabase is configured.
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
      throw new Error(
        `Unsupported media format (${file.type}). Supported: JPG, PNG, WebP, SVG, MP4 and WebM.`
      );
    }

    if (file.size === 0) {
      throw new Error('The selected file is empty.');
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image size exceeds the 20 MB limit.');
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      throw new Error('Video size exceeds the 150 MB limit.');
    }

    let width: number | undefined;
    let height: number | undefined;

    // Read image dimensions for metadata.
    if (isImage && file.type !== 'image/svg+xml' && typeof window !== 'undefined') {
      const objectUrl = URL.createObjectURL(file);

      try {
        const dimensions = await new Promise<{
          width: number;
          height: number;
        }>((resolve, reject) => {
          const img = new Image();

          img.onload = () => {
            resolve({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };

          img.onerror = () => {
            reject(new Error('Could not read image dimensions.'));
          };

          img.src = objectUrl;
        });

        width = dimensions.width;
        height = dimensions.height;
      } catch {
        // Image dimensions are optional; the server remains responsible
        // for processing and validating the uploaded image.
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    const fallbackPath = createStoragePath(file.name, destinationPath);

    let serverUploadError: unknown;

    // 1. Always attempt the server-side upload/optimization pipeline first.
    try {
      const base64 = await fileToBase64(file);

      const serverRes = (await ApiClient.post<ServerUploadResponse>(
        UPLOAD_ENDPOINT,
        {
          fileName: file.name,
          mimeType: file.type,
          base64,
          destinationPath,
        }
      )) as ServerUploadResponse;

      const responseUrl =
        typeof serverRes?.url === 'string' ? serverRes.url : '';

      const responsePath =
        typeof serverRes?.path === 'string' ? serverRes.path : '';

      if (
        serverRes?.success === true &&
        responsePath &&
        responseUrl &&
        isSupabaseStorageUrl(responseUrl)
      ) {
        return {
          path: responsePath,
          url: responseUrl,
          fileName:
            serverRes.fileName || file.name,
          fileSize:
            typeof serverRes.fileSize === 'number'
              ? serverRes.fileSize
              : file.size,
          mimeType:
            serverRes.mimeType || file.type,
          width:
            typeof serverRes.width === 'number'
              ? serverRes.width
              : width,
          height:
            typeof serverRes.height === 'number'
              ? serverRes.height
              : height,
        };
      }

      serverUploadError = new Error(
        serverRes?.error ||
          'The upload service did not confirm a valid Supabase Storage upload.'
      );
    } catch (error: unknown) {
      serverUploadError = error;
    }

    // 2. Never upload images directly from the browser if the server fails.
    if (isImage) {
      const details =
        serverUploadError instanceof Error
          ? ` Details: ${serverUploadError.message}`
          : '';

      console.error(
        'Image upload cancelled because the server optimization pipeline failed.',
        serverUploadError
      );

      throw new Error(
        'Image upload failed. The image was not uploaded through the direct-upload fallback. Please check the server optimization service and try again.' +
          details
      );
    }

    // 3. Videos may use direct Supabase upload if the server endpoint fails.
    if (!isSupabaseConfigured()) {
      const details =
        serverUploadError instanceof Error
          ? ` Details: ${serverUploadError.message}`
          : '';

      throw new Error(
        'Video upload failed because the server upload endpoint failed and Supabase is not configured.' +
          details
      );
    }

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fallbackPath, file, {
          cacheControl: '31536000',
          upsert,
          contentType: file.type,
        });

      if (error || !data?.path) {
        throw new Error(
          error?.message || 'Supabase did not return an uploaded file path.'
        );
      }

      return {
        path: data.path,
        url: this.getPublicUrl(data.path),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : String(error);

      throw new Error(`Video upload failed: ${details}`);
    }
  }

  /**
   * Upload an image to a project folder.
   */
  static async uploadImage(
    file: File,
    projectId = 'general',
    folder = 'gallery'
  ): Promise<UploadResult> {
    return this.uploadMedia({
      file,
      destinationPath: `projects/${projectId}/${folder}/`,
    });
  }

  /**
   * Upload a video to a project folder.
   */
  static async uploadVideo(
    file: File,
    projectId = 'general'
  ): Promise<UploadResult> {
    return this.uploadMedia({
      file,
      destinationPath: `projects/${projectId}/videos/`,
    });
  }

  /**
   * Delete media from Supabase Storage.
   */
  static async deleteMedia(storagePath: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !storagePath) {
      return true;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Failed to delete media from storage:', error);
      return false;
    }

    return true;
  }

  /**
   * Replace existing media with a new file.
   */
  static async replaceMedia(
    oldStoragePath: string | null | undefined,
    newFile: File,
    destinationPath: string
  ): Promise<UploadResult> {
    if (oldStoragePath) {
      const deleted = await this.deleteMedia(oldStoragePath);

      if (!deleted) {
        throw new Error(
          'The existing media could not be deleted. Replacement was cancelled.'
        );
      }
    }

    return this.uploadMedia({
      file: newFile,
      destinationPath,
      upsert: true,
    });
  }

  /**
   * List files in a bucket directory.
   */
  static async listFiles(
    folder = 'projects'
  ): Promise<
    Array<{
      name: string;
      path: string;
      url: string;
      size?: number;
      updated_at?: string | null;
    }>
  > {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: {
          column: 'created_at',
          order: 'desc',
        },
      });

    if (error || !data) {
      return [];
    }

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
