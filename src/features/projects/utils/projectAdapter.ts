import { DbProject } from '../../../types/database';
import { Project, ProjectImage, Category } from '../../../types';
import { PROJECTS as STATIC_PROJECTS } from '../../../data/portfolioData';

/**
 * Maps a database project from Supabase into the public frontend Project interface
 */
export function dbProjectToPortfolioProject(db: DbProject): Project {
  // Find matching static project for fallback imagery if database has empty images
  const matchingStatic = STATIC_PROJECTS.find((p) => p.slug === db.slug);

  const heroImg = db.hero_image || db.preview_image || '/assets/gideon_boadi_portrait.png';
  const previewImg = db.preview_image || db.hero_image || '/assets/gideon_boadi_portrait.png';

  const categoryName = (db.category?.name || 'Editorial') as Category;

  // Build images array from project_media if available
  let images: ProjectImage[] = [];
  if (db.media && db.media.length > 0) {
    images = db.media.map((m, idx) => ({
      id: m.id,
      url: m.media_url,
      fallbackUrl: m.media_url,
      caption: m.alt_text || `${db.title} — Plate 0${idx + 1}`,
      aspectRatio: idx % 2 === 0 ? 'portrait' : 'tall',
      tag: idx === 0 ? 'Lead Plate' : 'Editorial Plate',
    }));
  } else if (matchingStatic && matchingStatic.images) {
    images = matchingStatic.images;
  } else {
    images = [
      {
        id: `${db.id}-hero`,
        url: heroImg,
        fallbackUrl: heroImg,
        caption: `${db.title} — Primary Campaign Frame`,
        aspectRatio: 'tall',
        tag: 'Hero Visual',
      },
    ];
  }

  const previewImages =
    db.media && db.media.length > 0
      ? db.media.slice(0, 3).map((m) => m.media_url)
      : matchingStatic?.previewImages || [previewImg, heroImg];

  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    client: db.client || 'Personal Project',
    category: categoryName,
    year: db.year || '2025',
    location: 'Accra • Global',
    description: db.description,
    artDirector: 'Gideon Boadi',
    previewImages,
    fallbackPreviewImages: matchingStatic?.fallbackPreviewImages,
    images,
  };
}
