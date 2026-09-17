export type Category = 'All' | 'Fashion' | 'Editorial' | 'Campaign' | 'Portraiture';

export interface ProjectImage {
  id: string;
  url: string;
  fallbackUrl?: string;
  caption: string;
  aspectRatio: 'portrait' | 'landscape' | 'tall' | 'square';
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
  previewImages: string[];
  fallbackPreviewImages?: string[];
  layout?: 'single' | 'grid3x3' | 'grid2x2';
  gridImages?: string[];
  fallbackGridImages?: string[];
  images: ProjectImage[];
}

export type ThemeMode = 'dark' | 'light';

export type PageView = 'home' | 'project' | 'about';
