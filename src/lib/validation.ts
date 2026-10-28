import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(1, 'Password is required'),
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
