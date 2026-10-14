export type Category = 'All' | 'Fashion' | 'Editorial' | 'Campaign' | 'Portraiture';

export interface ProjectImage {
  id: string;
  url: string;
  fallbackUrl?: string;
  caption: string;
  aspectRatio: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide' | '16:9' | '4:3' | '21:9' | string;
  tag?: string;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    shutter?: string;
  };
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  client: string;
  category: Category;
  year: string;
  location: string;
  description: string;
  artDirector?: string;
  stylist?: string;
  model?: string;
  preview_image?: string | null;
  hero_image?: string | null;
  aspect_ratio?: string | null;
  aspectRatio?: string | null;
  previewImages: string[];
  fallbackPreviewImages?: string[];
  layout?: 'single' | 'grid3x3' | 'grid2x2';
  gridImages?: string[];
  fallbackGridImages?: string[];
  images: ProjectImage[];
  display_order?: number;
}

export type ThemeMode = 'dark' | 'light';

export type PageView = 'home' | 'project' | 'about' | 'contact' | 'admin';

export interface SingleShot {
  id: string;
  title: string;
  category?: string;
  url: string;
  fallbackUrl?: string;
  aspectRatio: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide' | '16:9' | '4:3' | '21:9' | string;
  caption: string;
  clientOrBrand?: string;
  tag?: string;
  camera?: string;
  lens?: string;
  iso?: string;
  shutter?: string;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    shutter?: string;
  };
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
