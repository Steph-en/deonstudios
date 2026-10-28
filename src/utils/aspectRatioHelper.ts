/**
 * Aspect Ratio Detection and Mapping Utilities
 * Dynamically detects natural image dimensions and maps to 16:9, 4:3, 21:9, 1:1, 3:4, 2:3, and 9:16 classes.
 * Enforces dynamic true-to-asset presentation:
 * - Landscape images (16:9, 4:3, 21:9) are displayed in landscape
 * - Portrait images (3:4, 2:3, 9:16) are displayed in portrait
 * - Square images (1:1) are displayed in square
 */

const LOCAL_STORAGE_CACHE_KEY = 'deon_aspect_ratios_v2';

// Global in-memory cache initialized from localStorage if available
const ratioCache = new Map<string, string>();

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof v === 'string') ratioCache.set(k, v);
      });
    }
  } catch {
    // Ignore storage errors
  }
}

function persistCache() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, string> = {};
    ratioCache.forEach((val, key) => {
      obj[key] = val;
    });
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Detects semantic aspect ratio class based on natural image width and height.
 */
export function detectAspectRatioClassFromDimensions(width: number, height: number): string {
  if (!width || !height) return 'aspect-[3/4]';
  const ratio = width / height;

  // Cinematic 21:9 (ratio ~2.333, >= 2.05)
  if (ratio >= 2.05) {
    return 'aspect-[21/9]';
  }
  // Widescreen 16:9 (ratio ~1.777, >= 1.55)
  if (ratio >= 1.55) {
    return 'aspect-[16/9]';
  }
  // Landscape 4:3 or 16:10 (ratio ~1.333, >= 1.18)
  if (ratio >= 1.18) {
    return 'aspect-[4/3]';
  }
  // Balanced Square 1:1 (0.92 <= ratio < 1.18)
  if (ratio >= 0.92 && ratio < 1.18) {
    return 'aspect-square';
  }
  // Portrait 3:4 or 4:5 (0.72 <= ratio < 0.92)
  if (ratio >= 0.72) {
    return 'aspect-[3/4]';
  }
  // Tall Editorial Portrait 2:3 (0.58 <= ratio < 0.72)
  if (ratio >= 0.58) {
    return 'aspect-[2/3]';
  }
  // Ultra-tall vertical 9:16 (ratio < 0.58)
  return 'aspect-[9/16]';
}

/**
 * Maps database/stored aspectRatio string to Tailwind aspect ratio class.
 */
export function mapStoredAspectRatioToClass(aspect?: string | null): string {
  if (!aspect) return '';
  switch (aspect.toLowerCase().trim()) {
    case '21:9':
    case '21/9':
    case 'cinema':
    case 'ultrawide':
      return 'aspect-[21/9]';
    case '16:9':
    case '16/9':
    case 'wide':
    case 'widescreen':
      return 'aspect-[16/9]';
    case '4:3':
    case '4/3':
    case 'landscape':
      return 'aspect-[4/3]';
    case '1:1':
    case 'square':
      return 'aspect-square';
    case '3:4':
    case '3/4':
    case 'portrait':
      return 'aspect-[3/4]';
    case '2:3':
    case '2/3':
    case 'tall':
      return 'aspect-[2/3]';
    case '9:16':
    case '9/16':
      return 'aspect-[9/16]';
    default:
      return '';
  }
}

export type OrientationType = 'landscape' | 'portrait' | 'square';

/**
 * Detects whether image dimensions correspond to landscape, portrait, or square orientation.
 */
export function detectOrientationFromDimensions(width: number, height: number): OrientationType {
  if (!width || !height) return 'portrait';
  const ratio = width / height;
  if (ratio >= 1.15) return 'landscape';
  if (ratio <= 0.88) return 'portrait';
  return 'square';
}

/**
 * Detects orientation from a stored aspect string (e.g. '16:9', 'landscape') or Tailwind class (e.g. 'aspect-[16/9]').
 */
export function detectOrientationFromClassOrString(str?: string | null): OrientationType {
  if (!str) return 'portrait';
  const s = str.toLowerCase().trim();
  if (
    s.includes('16/9') ||
    s.includes('16:9') ||
    s.includes('21/9') ||
    s.includes('21:9') ||
    s.includes('4/3') ||
    s.includes('4:3') ||
    s.includes('16/10') ||
    s.includes('landscape') ||
    s.includes('wide') ||
    s.includes('cinema') ||
    s.includes('ultrawide')
  ) {
    return 'landscape';
  }
  if (
    s.includes('3/4') ||
    s.includes('3:4') ||
    s.includes('2/3') ||
    s.includes('2:3') ||
    s.includes('9/16') ||
    s.includes('9:16') ||
    s.includes('4/5') ||
    s.includes('4:5') ||
    s.includes('portrait') ||
    s.includes('tall')
  ) {
    return 'portrait';
  }
  if (s.includes('square') || s.includes('1:1') || s.includes('1/1')) {
    return 'square';
  }
  return 'portrait';
}


/**
 * Gets cached aspect ratio for a URL or returns null if not measured yet
 */
export function getCachedAspectRatioClass(url: string): string | null {
  if (!url) return null;
  return ratioCache.get(url) || null;
}

/**
 * Stores a detected aspect ratio class for a URL and persists it
 */
export function setCachedAspectRatioClass(url: string, cls: string): void {
  if (url && cls) {
    ratioCache.set(url, cls);
    persistCache();
  }
}

/**
 * Pre-measures an image URL asynchronously and returns its detected aspect ratio class
 */
function measureImageAspectRatio(url: string): Promise<string> {
  if (!url) return Promise.resolve('aspect-[3/4]');
  if (ratioCache.has(url)) {
    return Promise.resolve(ratioCache.get(url)!);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('aspect-[3/4]');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const cls = detectAspectRatioClassFromDimensions(img.naturalWidth, img.naturalHeight);
      setCachedAspectRatioClass(url, cls);
      resolve(cls);
    };
    img.onerror = () => {
      resolve('aspect-[3/4]');
    };
    img.src = url;
  });
}

/**
 * Batch preloads multiple image URLs in parallel to detect aspect ratios early
 */
export function preloadImageRatios(urls: string[]): void {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (url && !ratioCache.has(url)) {
      measureImageAspectRatio(url).catch(() => {});
    }
  });
}
