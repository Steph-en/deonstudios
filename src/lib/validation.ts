import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const projectSchema = z.object({
  title: z.string().min(2, 'Title is required (min 2 characters)'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  category_id: z.string().nullable().optional(),
  client: z.string(),
  year: z.string(),
  role: z.string(),
  description: z.string().min(10, 'Short description is required (min 10 characters)'),
  long_description: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean(),
  preview_image: z.string().nullable().optional(),
  preview_video: z.string().nullable().optional(),
  hero_image: z.string().nullable().optional(),
  hero_video: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  seo_title: z.string(),
  seo_description: z.string(),
  seo_keywords: z.string(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional().default(''),
  color: z.string().optional().default('#d4d4d4'),
  icon: z.string().optional().default('folder'),
  display_order: z.number().int().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const sectionSchema = z.object({
  section_type: z.enum([
    'overview',
    'challenge',
    'research',
    'strategy',
    'wireframes',
    'design_system',
    'process',
    'solution',
    'results',
    'gallery',
    'video',
  ]),
  title: z.string().optional().default(''),
  content: z.string().optional().default(''),
  media_url: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
});

export type SectionFormData = z.infer<typeof sectionSchema>;
