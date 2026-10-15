import React, { useState } from 'react';
import { Project, ThemeMode } from '../types';
import { ResilientImage } from './ResilientImage';
import {
  detectAspectRatioClassFromDimensions,
  mapStoredAspectRatioToClass,
  getCachedAspectRatioClass,
  setCachedAspectRatioClass,
  detectOrientationFromDimensions,
  detectOrientationFromClassOrString,
  OrientationType,
} from '../utils/aspectRatioHelper';

interface ProjectsListProps {
  projects: Project[];
  theme: ThemeMode;
  onSelectProject: (project: Project) => void;
}

interface RowItemConfig {
  projectSlug: string;
  imageIndex?: number;
  customTitle?: string;
  forceGrid3x3?: boolean;
}

interface EditorialRowConfig {
  id: string;
  type:
    | 'two-col-equal'
    | 'two-col-1-to-2'
    | 'two-col-2-to-1'
    | 'full-width-landscape'
    | 'three-col'
    | 'four-col';
  items: RowItemConfig[];
}

/**
 * Curated editorial layout configuration inspired by Garrett Naccarato (garrettnaccarato.com):
 * Rhythmic, varied, grand picture-frame layout alternating dynamically between:
 * - 2-column balanced vertical plates (50% / 50%)
 * - 2-column asymmetric (1 is to 2, and 2 is to 1)
 * - Single massive full-width landscape canvases
 * - 3-column editorial grids & 3x3 matrix contact sheets
 * - 4-column portrait strips
 */
const EDITORIAL_ROWS: EditorialRowConfig[] = [
  // Row 1: Two grand vertical plates side by side (50% / 50%)
  {
    id: 'row-1',
    type: 'two-col-equal',
    items: [
      {
        projectSlug: 'helmet-of-heritage',
        imageIndex: 0,
        customTitle: 'Guzangs Magazine — Helmet of Heritage',
      },
      {
        projectSlug: 'vogue-crimson-and-silk',
        imageIndex: 1,
        customTitle: 'Vogue — Crimson & Silk',
      },
    ],
  },

  // Row 2: Two-column asymmetric (1 is to 2 aspect dynamic: narrow portrait left, broad landscape right)
  {
    id: 'row-2',
    type: 'two-col-1-to-2',
    items: [
      {
        projectSlug: 'deon-studios-red-502',
        imageIndex: 0,
        customTitle: 'Deon Studios — Red / 502',
      },
      {
        projectSlug: 'daniel-duveprime-beauty',
        imageIndex: 0,
        customTitle: 'Daniel Duveprime Beauty',
      },
    ],
  },

  // Row 3: Single massive full-width landscape canvas plate
  {
    id: 'row-3',
    type: 'full-width-landscape',
    items: [
      {
        projectSlug: 'the-wooden-monolith',
        imageIndex: 0,
        customTitle: 'The Wooden Monolith — Chapel Study',
      },
    ],
  },

  // Row 4: Three-column grand editorial portraits (33.3% / 33.3% / 33.3%)
  {
    id: 'row-4',
    type: 'three-col',
    items: [
      {
        projectSlug: 'culinary-haute-couture',
        imageIndex: 0,
        customTitle: 'Culinary Couture',
      },
      {
        projectSlug: 'vlisco-modern-tapestry',
        imageIndex: 0,
        customTitle: 'Vlisco — Modern Tapestry',
      },
      {
        projectSlug: 'solitude-and-the-tide',
        imageIndex: 0,
        customTitle: 'Solitude & The Tide',
      },
    ],
  },

  // Row 5: Three-column with 3x3 matrix contact sheet in the middle (like French Kiwis Eyewear in Naccarato's portfolio)
  {
    id: 'row-5',
    type: 'three-col',
    items: [
      {
        projectSlug: 'bottega-form-and-leather',
        imageIndex: 0,
        customTitle: 'Bottega Veneta — Form & Leather',
      },
      {
        projectSlug: 'prada-and-form',
        imageIndex: 0,
        customTitle: 'Prada & Contemporary Forms',
        forceGrid3x3: true,
      },
      {
        projectSlug: 'gq-the-tailored-silhouette',
        imageIndex: 0,
        customTitle: 'GQ Style — The Tailored Silhouette',
      },
    ],
  },

  // Row 6: Two-column asymmetric (2 is to 1 aspect dynamic: broad spread left, tall portrait right)
  {
    id: 'row-6',
    type: 'two-col-2-to-1',
    items: [
      {
        projectSlug: 'dazed-generation-pulse',
        imageIndex: 0,
        customTitle: 'Dazed — Generation Pulse',
      },
      {
        projectSlug: 'vogue-crimson-and-silk',
        imageIndex: 2,
        customTitle: 'Vogue — Ocean Outtake',
      },
    ],
  },

  // Row 7: Single massive full-width landscape canvas (Night ocean highway streaks)
  {
    id: 'row-7',
    type: 'full-width-landscape',
    items: [
      {
        projectSlug: 'solitude-and-the-tide',
        imageIndex: 1,
        customTitle: 'Solitude & The Tide — Nocturne Horizon',
      },
    ],
  },

  // Row 8: Four-column editorial strip (25% each, like Lululemon/Tommy Hilfiger/Monos/Kanuk)
  {
    id: 'row-8',
    type: 'four-col',
    items: [
      {
        projectSlug: 'helmet-of-heritage',
        imageIndex: 1,
        customTitle: 'Guzangs — Warehouse Study',
      },
      {
        projectSlug: 'daniel-duveprime-beauty',
        imageIndex: 1,
        customTitle: 'Daniel Duveprime — Dewy Macro',
      },
      {
        projectSlug: 'deon-studios-red-502',
        imageIndex: 1,
        customTitle: 'Deon Studios — Neon Spectrum',
      },
      {
        projectSlug: 'culinary-haute-couture',
        imageIndex: 1,
        customTitle: 'Culinary Couture — Texture',
      },
    ],
  },

  // Row 9: Two grand vertical plates side by side (50% / 50%)
  {
    id: 'row-9',
    type: 'two-col-equal',
    items: [
      {
        projectSlug: 'daniel-duveprime-beauty',
        imageIndex: 3,
        customTitle: 'Daniel Duveprime — Duo Radiance',
      },
      {
        projectSlug: 'the-wooden-monolith',
        imageIndex: 1,
        customTitle: 'The Wooden Monolith — Skyward',
      },
    ],
  },

  // Row 10: Single massive full-width landscape canvas (Mercedes coupe wide shot)
  {
    id: 'row-10',
    type: 'full-width-landscape',
    items: [
      {
        projectSlug: 'vogue-crimson-and-silk',
        imageIndex: 0,
        customTitle: 'Vogue — Crimson Mercedes Coupe',
      },
    ],
  },

  // Row 11: Three-column grand editorial portraits
  {
    id: 'row-11',
    type: 'three-col',
    items: [
      {
        projectSlug: 'vlisco-modern-tapestry',
        imageIndex: 1,
        customTitle: 'Vlisco — Movement Plate',
      },
      {
        projectSlug: 'bottega-form-and-leather',
        imageIndex: 1,
        customTitle: 'Bottega Veneta — Tactility',
      },
      {
        projectSlug: 'gq-the-tailored-silhouette',
        imageIndex: 1,
        customTitle: 'GQ Style — Lapel Detail',
      },
    ],
  },

  // Row 12: Two-column asymmetric (1 is to 2 aspect ratio)
  {
    id: 'row-12',
    type: 'two-col-1-to-2',
    items: [
      {
        projectSlug: 'helmet-of-heritage',
        imageIndex: 2,
        customTitle: 'Guzangs — Ancestral Adornment',
      },
      {
        projectSlug: 'dazed-generation-pulse',
        imageIndex: 1,
        customTitle: 'Dazed — Electric Motion Trace',
      },
    ],
  },
];

const INITIAL_ROWS_COUNT = 6;

interface EditorialProjectCardProps {
  project: Project;
  src: string;
  title: string;
  is3x3Grid: boolean;
  cardId: string;
  defaultAspectClasses?: string;
  extraContainerClasses?: string;
  isPriority?: boolean;
  onSelectProject: (project: Project) => void;
}

const EditorialProjectCard: React.FC<EditorialProjectCardProps> = ({
  project,
  src,
  title,
  is3x3Grid,
  cardId,
  defaultAspectClasses = 'aspect-[4/3]',
  extraContainerClasses = '',
  isPriority = false,
  onSelectProject,
}) => {
  const cachedClass = src ? getCachedAspectRatioClass(src) : '';
  const storedClass = mapStoredAspectRatioToClass(project.aspect_ratio || (project as any).aspectRatio);

  const [aspectClass, setAspectClass] = useState<string>(
    cachedClass || storedClass || defaultAspectClasses
  );
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!src || is3x3Grid) return;
    const cached = getCachedAspectRatioClass(src);
    if (cached) {
      setAspectClass((prev) => (prev === cached ? prev : cached));
    }
    let isMounted = true;
    const img = new Image();
    img.onload = () => {
      if (!isMounted) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setDimensions((prev) => {
          if (prev && prev.width === img.naturalWidth && prev.height === img.naturalHeight) return prev;
          return { width: img.naturalWidth, height: img.naturalHeight };
        });
        const detected = detectAspectRatioClassFromDimensions(img.naturalWidth, img.naturalHeight);
        setCachedAspectRatioClass(src, detected);
        setAspectClass((prev) => (prev === detected ? prev : detected));
      }
    };
    img.src = src;
    return () => {
      isMounted = false;
    };
  }, [src, is3x3Grid]);

  const handleDimensionsDetected = React.useCallback((w: number, h: number) => {
    if (!w || !h) return;
    setDimensions((prev) => {
      if (prev && prev.width === w && prev.height === h) return prev;
      return { width: w, height: h };
    });
    const detected = detectAspectRatioClassFromDimensions(w, h);
    if (src) setCachedAspectRatioClass(src, detected);
    setAspectClass((prev) => (prev === detected ? prev : detected));
  }, [src]);

  const dynamicAspectRatio = !is3x3Grid && dimensions?.width && dimensions?.height
    ? `${dimensions.width} / ${dimensions.height}`
    : undefined;

  return (
    <article
      id={cardId}
      onClick={() => onSelectProject(project)}
      className={`group cursor-pointer flex flex-col select-none w-full ${extraContainerClasses}`}
    >
      {/* Dynamic Canvas Container: takes the exact shape / aspect ratio of the image */}
      <div
        style={{ aspectRatio: dynamicAspectRatio }}
        className={`relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 safari-clip-fix flex items-center justify-center ${
          !dynamicAspectRatio ? aspectClass : ''
        }`}
      >
        {is3x3Grid && project.gridImages && project.gridImages.length > 0 ? (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[2px] sm:gap-[3px]">
            {project.gridImages.filter(Boolean).slice(0, 9).map((imgUrl: string, idx: number) => (
              <div
                key={idx}
                className="relative w-full h-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 safari-clip-fix flex items-center justify-center"
              >
                {imgUrl ? (
                  <ResilientImage
                    src={imgUrl}
                    alt={`${title} tile ${idx + 1}`}
                    priority={isPriority && idx < 3}
                    lazy={!(isPriority && idx < 3)}
                    rootMargin="400px 0px"
                    sizes="(max-width: 640px) 33vw, 15vw"
                    className="w-full h-full object-contain object-center transition-opacity duration-300 pointer-events-none safari-scale-smooth"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : src ? (
          <ResilientImage
            src={src}
            alt={title}
            priority={isPriority}
            lazy={!isPriority}
            rootMargin="400px 0px"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 100vw"
            onDimensionsDetected={handleDimensionsDetected}
            className="w-full h-full object-contain object-center transition-opacity duration-300 pointer-events-none safari-scale-smooth select-none"
          />
        ) : null}
      </div>

      {/* Understated Underlined Project Title Directly Underneath */}
      <div className="mt-2 sm:mt-2.5 mb-[6px]">
        <span className="inline-block text-xs sm:text-[13px] md:text-[14px] lg:text-[15px] font-normal tracking-wide text-neutral-900 underline underline-offset-4 decoration-1 decoration-neutral-400 group-hover:decoration-neutral-950 group-hover:text-black transition-colors duration-200">
          {title}
        </span>
      </div>
    </article>
  );
};

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  theme,
  onSelectProject,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Map of project slug to Project
  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.slug, p));
    return map;
  }, [projects]);

  // Helper to extract the primary thumbnail URL for a project
  const getThumbnailForProject = React.useCallback((project: Project): string => {
    const isInvalidPlaceholder = (url?: string | null) =>
      !url ||
      url === '/assets/gideon_boadi_portrait.png' ||
      url.includes('placeholder');

    const previewThumb =
      (!isInvalidPlaceholder(project.preview_image) ? project.preview_image : null) ||
      (!isInvalidPlaceholder(project.previewImages?.[0]) ? project.previewImages?.[0] : null) ||
      '';

    const projectImage = project.images?.[0];
    return previewThumb || projectImage?.url || project.hero_image || '';
  }, []);

  // Track dynamically detected aspect ratio / orientation for each project's thumbnail
  const [aspectData, setAspectData] = useState<
    Record<
      string,
      {
        orientation: OrientationType;
        ratio: number;
        width: number;
        height: number;
      }
    >
  >(() => {
    const initial: Record<
      string,
      {
        orientation: OrientationType;
        ratio: number;
        width: number;
        height: number;
      }
    > = {};

    projects.forEach((p) => {
      const src = getThumbnailForProject(p);
      if (!src) return;
      const cached = getCachedAspectRatioClass(src);
      const stored = p.aspect_ratio || (p as any).aspectRatio || p.images?.[0]?.aspectRatio;
      const orientation =
        (cached && detectOrientationFromClassOrString(cached)) ||
        (stored && detectOrientationFromClassOrString(stored)) ||
        'portrait';

      initial[p.slug] = {
        orientation,
        ratio: orientation === 'landscape' ? 1.77 : orientation === 'square' ? 1 : 0.75,
        width: orientation === 'landscape' ? 1920 : orientation === 'square' ? 1200 : 1200,
        height: orientation === 'landscape' ? 1080 : orientation === 'square' ? 1200 : 1600,
      };
    });

    return initial;
  });

  // Dynamically pre-measure all project thumbnail images to get exact orientation & natural dimensions
  React.useEffect(() => {
    let isMounted = true;

    projects.forEach((p) => {
      const src = getThumbnailForProject(p);
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        if (!isMounted || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / h;
        const orientation = detectOrientationFromDimensions(w, h);
        const cls = detectAspectRatioClassFromDimensions(w, h);
        setCachedAspectRatioClass(src, cls);

        setAspectData((prev) => {
          const current = prev[p.slug];
          if (
            current &&
            current.width === w &&
            current.height === h &&
            current.orientation === orientation
          ) {
            return prev;
          }
          return {
            ...prev,
            [p.slug]: {
              orientation,
              ratio,
              width: w,
              height: h,
            },
          };
        });
      };
      img.src = src;
    });

    return () => {
      isMounted = false;
    };
  }, [projects, getThumbnailForProject]);

  /**
   * Balanced Editorial Grid Rearrangement:
   * 1. The first image in the grid is guaranteed to be a landscape taking the entire width (full-width landscape plate).
   * 2. The remaining projects are rearranged based on aspect ratio:
   *    - Portraits are grouped with portraits (in balanced 2-column or 3-column rows) so heights match and there is NO empty void.
   *    - Landscapes are grouped with other landscapes (balanced 2-column landscape row) or full-width landscape plates.
   *    - Squares are paired with squares or close-matching portrait formats.
   * 3. Completely prevents mismatched pairings (e.g. landscape next to tall portrait) that caused empty dead space.
   */
  const activeRows = React.useMemo<EditorialRowConfig[]>(() => {
    if (!projects || projects.length === 0) return [];

    // Helper to get orientation for any project
    const getOrientation = (p: Project): OrientationType => {
      if (aspectData[p.slug]?.orientation) {
        return aspectData[p.slug].orientation;
      }
      const src = getThumbnailForProject(p);
      const cached = src ? getCachedAspectRatioClass(src) : null;
      if (cached) return detectOrientationFromClassOrString(cached);

      const stored = p.aspect_ratio || (p as any).aspectRatio || p.images?.[0]?.aspectRatio;
      if (stored) return detectOrientationFromClassOrString(stored);

      return 'portrait';
    };

    // Build project metadata list
    const pool = projects.map((p) => ({
      project: p,
      orientation: getOrientation(p),
    }));

    // Determine the full-width landscape hero for Row 0
    let heroProject: Project;
    let heroImageIndex = 0;

    // First check if the user's #1 ordered project is already landscape or contains a landscape image
    const firstProject = pool[0]?.project;
    const firstProjHasLandscapeImg = firstProject?.images?.findIndex((img) => {
      const asp = img.aspectRatio ? String(img.aspectRatio).toLowerCase() : '';
      return (
        asp.includes('landscape') ||
        asp.includes('wide') ||
        asp.includes('16:9') ||
        asp.includes('4:3') ||
        asp.includes('21:9')
      );
    });

    if (pool[0]?.orientation === 'landscape') {
      heroProject = pool[0].project;
      heroImageIndex = 0;
      pool.splice(0, 1);
    } else if (firstProjHasLandscapeImg !== undefined && firstProjHasLandscapeImg !== -1) {
      heroProject = pool[0].project;
      heroImageIndex = firstProjHasLandscapeImg;
      pool.splice(0, 1);
    } else {
      // Find the first landscape project in the user's ordered list
      let heroLandscapeIndex = pool.findIndex((item) => item.orientation === 'landscape');
      if (heroLandscapeIndex !== -1) {
        heroProject = pool[heroLandscapeIndex].project;
        pool.splice(heroLandscapeIndex, 1);
      } else {
        // Check if any project has an image with landscape aspect ratio in its gallery
        let foundInGallery = false;
        for (let i = 0; i < pool.length; i++) {
          const p = pool[i].project;
          if (p.images && p.images.length > 0) {
            const imgIdx = p.images.findIndex((img) => {
              const asp = img.aspectRatio ? String(img.aspectRatio).toLowerCase() : '';
              return (
                asp.includes('landscape') ||
                asp.includes('wide') ||
                asp.includes('16:9') ||
                asp.includes('4:3') ||
                asp.includes('21:9')
              );
            });
            if (imgIdx !== -1) {
              heroProject = p;
              heroImageIndex = imgIdx;
              pool.splice(i, 1);
              foundInGallery = true;
              break;
            }
          }
        }

        if (!foundInGallery) {
          // Fallback: take the first project and format as the prominent full-width showcase
          heroProject = pool[0].project;
          pool.splice(0, 1);
        }
      }
    }

    const resultRows: EditorialRowConfig[] = [];

    // ROW 0: Always a grand full-width landscape taking the entire grid width
    resultRows.push({
      id: `hero-landscape-${heroProject.slug}`,
      type: 'full-width-landscape',
      items: [
        {
          projectSlug: heroProject.slug,
          imageIndex: heroImageIndex,
          customTitle: heroProject.title,
        },
      ],
    });

    // Separate remaining projects into orientation categories
    const remainingPortraits: Project[] = [];
    const remainingLandscapes: Project[] = [];
    const remainingSquares: Project[] = [];

    pool.forEach((item) => {
      if (item.orientation === 'landscape') {
        remainingLandscapes.push(item.project);
      } else if (item.orientation === 'square') {
        remainingSquares.push(item.project);
      } else {
        remainingPortraits.push(item.project);
      }
    });

    let rowIndex = 1;

    // Process remaining projects into balanced, flush rows
    while (
      remainingPortraits.length > 0 ||
      remainingLandscapes.length > 0 ||
      remainingSquares.length > 0
    ) {
      // If we have landscapes left to weave in:
      if (
        remainingLandscapes.length > 0 &&
        (rowIndex % 3 === 0 || remainingPortraits.length === 0)
      ) {
        if (remainingLandscapes.length >= 2 && rowIndex % 2 === 0) {
          // Pair 2 landscapes in a balanced 2-column landscape row (both have matching landscape heights!)
          const l1 = remainingLandscapes.shift()!;
          const l2 = remainingLandscapes.shift()!;
          resultRows.push({
            id: `row-landscapes-pair-${rowIndex++}`,
            type: 'two-col-equal',
            items: [
              { projectSlug: l1.slug, imageIndex: 0, customTitle: l1.title },
              { projectSlug: l2.slug, imageIndex: 0, customTitle: l2.title },
            ],
          });
        } else {
          // Single landscape becomes an impressive full-width canvas
          const l = remainingLandscapes.shift()!;
          resultRows.push({
            id: `row-landscape-full-${rowIndex++}`,
            type: 'full-width-landscape',
            items: [{ projectSlug: l.slug, imageIndex: 0, customTitle: l.title }],
          });
        }
        continue;
      }

      // Group portraits with portraits so lengths are equal and there is no empty space
      if (remainingPortraits.length >= 3 && rowIndex % 3 === 2) {
        // Trio of portraits in a 3-column row
        const p1 = remainingPortraits.shift()!;
        const p2 = remainingPortraits.shift()!;
        const p3 = remainingPortraits.shift()!;
        resultRows.push({
          id: `row-portraits-trio-${rowIndex++}`,
          type: 'three-col',
          items: [
            { projectSlug: p1.slug, imageIndex: 0, customTitle: p1.title },
            { projectSlug: p2.slug, imageIndex: 0, customTitle: p2.title },
            { projectSlug: p3.slug, imageIndex: 0, customTitle: p3.title },
          ],
        });
      } else if (remainingPortraits.length >= 2) {
        // Pair of portraits in a 2-column row (50% / 50% equal height!)
        const p1 = remainingPortraits.shift()!;
        const p2 = remainingPortraits.shift()!;
        resultRows.push({
          id: `row-portraits-pair-${rowIndex++}`,
          type: 'two-col-equal',
          items: [
            { projectSlug: p1.slug, imageIndex: 0, customTitle: p1.title },
            { projectSlug: p2.slug, imageIndex: 0, customTitle: p2.title },
          ],
        });
      } else if (remainingPortraits.length === 1) {
        const p = remainingPortraits.shift()!;
        if (remainingSquares.length > 0) {
          // Pair with a square (square is close in aspect to portrait, avoiding giant height discrepancies)
          const sq = remainingSquares.shift()!;
          resultRows.push({
            id: `row-portrait-sq-${rowIndex++}`,
            type: 'two-col-equal',
            items: [
              { projectSlug: p.slug, imageIndex: 0, customTitle: p.title },
              { projectSlug: sq.slug, imageIndex: 0, customTitle: sq.title },
            ],
          });
        } else if (remainingLandscapes.length > 0) {
          // Never place a landscape next to a portrait in the same row!
          // Give the portrait its own clean column, and the landscape a full-width plate
          resultRows.push({
            id: `row-portrait-solo-${rowIndex++}`,
            type: 'two-col-equal',
            items: [{ projectSlug: p.slug, imageIndex: 0, customTitle: p.title }],
          });
        } else {
          resultRows.push({
            id: `row-portrait-solo-${rowIndex++}`,
            type: 'two-col-equal',
            items: [{ projectSlug: p.slug, imageIndex: 0, customTitle: p.title }],
          });
        }
      } else if (remainingSquares.length > 0) {
        if (remainingSquares.length >= 2) {
          const sq1 = remainingSquares.shift()!;
          const sq2 = remainingSquares.shift()!;
          resultRows.push({
            id: `row-squares-pair-${rowIndex++}`,
            type: 'two-col-equal',
            items: [
              { projectSlug: sq1.slug, imageIndex: 0, customTitle: sq1.title },
              { projectSlug: sq2.slug, imageIndex: 0, customTitle: sq2.title },
            ],
          });
        } else {
          const sq = remainingSquares.shift()!;
          resultRows.push({
            id: `row-square-solo-${rowIndex++}`,
            type: 'two-col-equal',
            items: [{ projectSlug: sq.slug, imageIndex: 0, customTitle: sq.title }],
          });
        }
      } else if (remainingLandscapes.length > 0) {
        const l = remainingLandscapes.shift()!;
        resultRows.push({
          id: `row-landscape-full-${rowIndex++}`,
          type: 'full-width-landscape',
          items: [{ projectSlug: l.slug, imageIndex: 0, customTitle: l.title }],
        });
      }
    }

    return resultRows;
  }, [projects, aspectData, getThumbnailForProject]);

  const displayedRows = showAll || activeRows.length <= 8
    ? activeRows
    : activeRows.slice(0, 8);

  const handleToggleView = () => {
    if (showAll) {
      setShowAll(false);
      const el = document.getElementById('projects-archive-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setShowAll(true);
    }
  };

  /**
   * Helper to resolve project, image source, and fallback for an item
   */
  const resolveItemData = (itemConfig: RowItemConfig) => {
    const project =
      projectMap.get(itemConfig.projectSlug) ||
      projects.find((p) => p.slug === itemConfig.projectSlug);

    if (!project) return null;

    const imgIndex = itemConfig.imageIndex ?? 0;

    // Helper to filter out stale/deleted placeholder paths
    const isInvalidPlaceholder = (url?: string | null) =>
      !url ||
      url === '/assets/gideon_boadi_portrait.png' ||
      url.includes('placeholder');

    // The Preview Thumbnail Image defined in CMS Hero & Preview Media
    const previewThumb =
      (!isInvalidPlaceholder(project.preview_image) ? project.preview_image : null) ||
      (!isInvalidPlaceholder(project.previewImages?.[0]) ? project.previewImages?.[0] : null) ||
      '';

    const projectImage = project.images?.[imgIndex] || project.images?.[0];
    const previewImage = project.previewImages?.[imgIndex] || previewThumb;

    // For the primary project card thumbnail on the landing page (imgIndex 0),
    // the Preview Thumbnail Image from CMS Hero & Preview Media strictly takes highest precedence:
    const src =
      imgIndex === 0
        ? (previewThumb || projectImage?.url || previewImage || '')
        : (project.previewImages?.[imgIndex] || projectImage?.url || previewThumb || '');

    const title = itemConfig.customTitle || project.title;
    const is3x3Grid =
      itemConfig.forceGrid3x3 ||
      (project.layout === 'grid3x3' && project.gridImages && project.gridImages.length > 0);

    return {
      project,
      src,
      title,
      is3x3Grid,
    };
  };

  /**
   * Editorial Project Card with dynamic container aspect ratio
   * Automatically shapes itself to the aspect ratio of the client's uploaded thumbnail.
   * Images use object-contain so details are 100% visible before clicking into lightbox.
   */
  const renderCard = (
    itemConfig: RowItemConfig,
    defaultAspect = 'aspect-[4/3]',
    extraContainerClasses = '',
    isPriority = false
  ) => {
    const data = resolveItemData(itemConfig);
    if (!data) return null;
    const { project, src, title, is3x3Grid } = data;

    return (
      <EditorialProjectCard
        key={`${itemConfig.projectSlug}-${itemConfig.imageIndex ?? 0}-${itemConfig.customTitle ?? ''}`}
        project={project}
        src={src}
        title={title}
        is3x3Grid={is3x3Grid}
        cardId={`card-${project.slug}-${itemConfig.imageIndex ?? 0}`}
        defaultAspectClasses={defaultAspect}
        extraContainerClasses={extraContainerClasses}
        isPriority={isPriority}
        onSelectProject={onSelectProject}
      />
    );
  };

  /**
   * Renders an editorial row with responsive rhythm and dynamic image containers
   */
  const renderRow = (row: EditorialRowConfig, rowIndex: number) => {
    const isPriorityRow = rowIndex === 0;

    switch (row.type) {
      // 1. Two-Column Equal: 50% / 50% dynamic plates side by side - 10px gap
      case 'two-col-equal':
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-[10px] items-stretch"
          >
            {row.items.map((item) => (
              <div key={`${item.projectSlug}-${item.imageIndex ?? 0}`} className="w-full flex">
                {renderCard(item, 'aspect-[4/5]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            ))}
          </div>
        );

      // 2. Two-Column Asymmetric 1 is to 2: Narrow column left, broad column right - 10px gap
      case 'two-col-1-to-2': {
        const leftItem = row.items[0];
        const rightItem = row.items[1];
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-stretch"
          >
            {leftItem && (
              <div className="w-full md:col-span-1 flex">
                {renderCard(leftItem, 'aspect-[3/4]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            )}
            {rightItem && (
              <div className="w-full md:col-span-2 flex">
                {renderCard(rightItem, 'aspect-[16/9]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            )}
          </div>
        );
      }

      // 3. Two-Column Asymmetric 2 is to 1: Broad column left, narrow column right - 10px gap
      case 'two-col-2-to-1': {
        const leftItem = row.items[0];
        const rightItem = row.items[1];
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-stretch"
          >
            {leftItem && (
              <div className="w-full md:col-span-2 flex">
                {renderCard(leftItem, 'aspect-[16/9]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            )}
            {rightItem && (
              <div className="w-full md:col-span-1 flex">
                {renderCard(rightItem, 'aspect-[3/4]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            )}
          </div>
        );
      }

      // 4. Single Full-Width Landscape Canvas Plate (100% width)
      case 'full-width-landscape': {
        const item = row.items[0];
        if (!item) return null;
        return (
          <div key={row.id} className="w-full">
            {renderCard(item, 'aspect-[16/9]', 'w-full', isPriorityRow)}
          </div>
        );
      }

      // 5. Three-Column Editorial Grid (33.3% each) - 10px gap
      case 'three-col':
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-stretch"
          >
            {row.items.map((item) => (
              <div key={`${item.projectSlug}-${item.imageIndex ?? 0}`} className="w-full flex">
                {renderCard(item, 'aspect-[4/5]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            ))}
          </div>
        );

      // 6. Four-Column Editorial Strip (25% each) - 10px gap
      case 'four-col':
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px] items-stretch"
          >
            {row.items.map((item) => (
              <div key={`${item.projectSlug}-${item.imageIndex ?? 0}`} className="w-full flex">
                {renderCard(item, 'aspect-[3/4]', 'w-full h-full flex flex-col justify-between', isPriorityRow)}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section
      id="projects-archive-section"
      className="relative w-full py-10 sm:py-10 md:py-8 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      {/* Generous Gallery-Width Container (max-w-[1880px]) so images display huge, broad, and grand */}
      <div className="w-full max-w-[1880px] mx-auto">
        {/* 
          Section Header:
          - Left: Pure single text "PROJECTS"
          - Right: Underlined interactive toggle ("View All" / "Show Less")
        */}
        <div className="flex items-baseline justify-between pb-6 md:pb-6 border-b border-neutral-300 mb-8 sm:mb-12 md:mb-16">
          <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
            Projects
          </h2>

          {projects.length > INITIAL_ROWS_COUNT && (
            <button
              type="button"
              onClick={handleToggleView}
              className="text-[11px] sm:text-[13px] uppercase tracking-[0.2em] font-medium underline underline-offset-6 text-neutral-800 hover:text-black transition-opacity duration-200 cursor-pointer"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>

        {/* Dynamic Project Display or Clean Empty State */}
        {projects.length === 0 ? (
          <div className="py-24 sm:py-32 text-center border border-dashed border-neutral-300/80 rounded-lg my-4">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-neutral-400 font-mono">
              No published projects in gallery
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-y-[10px]">
            {displayedRows.map((row, idx) => renderRow(row, idx))}
          </div>
        )}

        {/* Bottom Toggle Button if Expanded */}
        {showAll && (
          <div className="pt-16 sm:pt-20 md:pt-24 flex justify-center">
            <button
              type="button"
              onClick={handleToggleView}
              className="text-xs sm:text-[13px] uppercase tracking-[0.22em] font-medium underline underline-offset-6 text-neutral-700 hover:text-black transition-opacity duration-200 cursor-pointer"
            >
              Show Less ↑
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsList;
