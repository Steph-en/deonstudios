import { DbProject } from '../../../types/database';
import { Project, ProjectImage, Category } from '../../../types';
import { PROJECTS as STATIC_PROJECTS } from '../../../data/portfolioData';

/**
 * Maps a database project from Supabase into the public frontend Project interface
 */
export function dbProjectToPortfolioProject(db: DbProject): Project {
  // Find matching static project for fallback imagery if database has empty images
  const matchingStatic = STATIC_PROJECTS.find((p) => p.slug === db.slug);

  // Helper to filter out stale/deleted placeholder paths
  const isInvalidPlaceholder = (url?: string | null) =>
    !url ||
    url === '/assets/gideon_boadi_portrait.png' ||
    url.includes('placeholder');

  const firstMediaUrl = db.media?.[0]?.media_url;
  const staticFirstUrl = matchingStatic?.images?.[0]?.url;

  const previewImg =
    (!isInvalidPlaceholder(db.preview_image) ? db.preview_image : null) ||
    (!isInvalidPlaceholder(db.hero_image) ? db.hero_image : null) ||
    firstMediaUrl ||
    staticFirstUrl ||
    '';

  const heroImg =
    (!isInvalidPlaceholder(db.hero_image) ? db.hero_image : null) ||
    (!isInvalidPlaceholder(db.preview_image) ? db.preview_image : null) ||
    firstMediaUrl ||
    staticFirstUrl ||
    '';

  const categoryName = (db.category?.name || 'Editorial') as Category;

  // Build images array from project_media if available
  let images: ProjectImage[] = [];
  if (db.media && db.media.length > 0) {
    images = db.media.map((m, idx) => ({
      id: m.id,
      url: m.media_url,
      fallbackUrl: m.media_url,
      caption: m.alt_text || `${db.title} — 0${idx + 1}`,
      aspectRatio: idx % 2 === 0 ? 'portrait' : 'tall',
      tag: idx === 0 ? 'Lead' : 'Editorial',
    }));
  } else if (matchingStatic && matchingStatic.images) {
    images = matchingStatic.images;
  } else {
    images = [
      {
        id: `${db.id}-hero`,
        url: heroImg || previewImg,
        fallbackUrl: heroImg || previewImg,
        caption: `${db.title} — Primary Campaign Frame`,
        aspectRatio: 'tall',
        tag: 'Hero Visual',
      },
    ];
  }

  // Preview images array for card teasers and hover previews:
  // MUST prioritize the CMS preview thumbnail image as the very first item!
  const previewImages: string[] = [];
  if (previewImg) {
    previewImages.push(previewImg);
  }
  if (db.media && db.media.length > 0) {
    db.media.forEach((m) => {
      if (m.media_url && !previewImages.includes(m.media_url)) {
        previewImages.push(m.media_url);
      }
    });
  }
  if (matchingStatic?.previewImages) {
    matchingStatic.previewImages.forEach((url) => {
      if (url && !previewImages.includes(url)) {
        previewImages.push(url);
      }
    });
  }

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
    preview_image: previewImg || null,
    hero_image: heroImg || null,
    previewImages,
    fallbackPreviewImages: matchingStatic?.fallbackPreviewImages,
    images,
  };
}
