import React, { useState } from 'react';
import { Project, ThemeMode } from '../types';
import { ResilientImage } from './ResilientImage';

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

  const displayedRows = showAll
    ? EDITORIAL_ROWS
    : EDITORIAL_ROWS.slice(0, INITIAL_ROWS_COUNT);

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
      projects.find((p) => p.slug === itemConfig.projectSlug) ||
      projects[0];

    if (!project) return null;

    const imgIndex = itemConfig.imageIndex ?? 0;
    const projectImage = project.images?.[imgIndex];
    const previewImage = project.previewImages?.[imgIndex] || project.previewImages?.[0];
    const fallbackImage =
      projectImage?.fallbackUrl ||
      project.fallbackPreviewImages?.[imgIndex] ||
      project.fallbackPreviewImages?.[0] ||
      '';

    const src = projectImage?.url || previewImage || '';
    const title = itemConfig.customTitle || project.title;
    const is3x3Grid =
      itemConfig.forceGrid3x3 ||
      (project.layout === 'grid3x3' && project.gridImages && project.gridImages.length > 0);

    return {
      project,
      src,
      fallbackSrc: fallbackImage,
      title,
      is3x3Grid,
    };
  };

  /**
   * Renders a single picture frame card with underlined title underneath
   */
  const renderCard = (
    itemConfig: RowItemConfig,
    aspectRatioClasses: string,
    extraContainerClasses = ''
  ) => {
    const data = resolveItemData(itemConfig);
    if (!data) return null;

    const { project, src, fallbackSrc, title, is3x3Grid } = data;

    return (
      <article
        key={`${project.slug}-${itemConfig.imageIndex ?? 0}-${itemConfig.customTitle ?? ''}`}
        id={`card-${project.slug}-${itemConfig.imageIndex ?? 0}`}
        onClick={() => onSelectProject(project)}
        className={`group cursor-pointer flex flex-col select-none ${extraContainerClasses}`}
      >
        {/* Massive Picture Frame / Canvas Container */}
        <div
          className={`relative w-full overflow-hidden bg-neutral-100 ${aspectRatioClasses}`}
        >
          {is3x3Grid && project.gridImages && project.gridImages.length > 0 ? (
            /* 3x3 Photo Matrix Contact Sheet (French Kiwis Eyewear reference) */
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[2px] sm:gap-[3px]">
              {project.gridImages.slice(0, 9).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative w-full h-full overflow-hidden bg-neutral-200"
                >
                  <ResilientImage
                    src={imgUrl}
                    fallbackSrc={
                      project.fallbackGridImages?.[idx] ||
                      project.images[idx % project.images.length]?.url
                    }
                    alt={`${title} tile ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Single Grand Full-Frame Photograph */
            <ResilientImage
              src={src}
              fallbackSrc={fallbackSrc}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            />
          )}
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

  /**
   * Renders an editorial row based on its layout archetype with exact 10px gap
   */
  const renderRow = (row: EditorialRowConfig) => {
    switch (row.type) {
      // 1. Two-Column Equal: 50% / 50% grand vertical plates side by side - 10px gap
      case 'two-col-equal':
        return (
          <div
            key={row.id}
            className="flex flex-col md:flex-row gap-[10px] items-start"
          >
            {row.items.map((item) => (
              <div
                key={`${item.projectSlug}-${item.imageIndex ?? 0}`}
                className="w-full md:w-[calc(50%-5px)]"
              >
                {renderCard(
                  item,
                  'aspect-[3/4] sm:aspect-[4/5] min-h-[460px] sm:min-h-[580px] md:min-h-[660px] lg:min-h-[780px]'
                )}
              </div>
            ))}
          </div>
        );

      // 2. Two-Column Asymmetric 1 is to 2: Narrow portrait left (1 part), broad landscape right (2 parts) - Exact Equal Height, 10px gap
      case 'two-col-1-to-2': {
        const leftItem = row.items[0];
        const rightItem = row.items[1];
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-stretch"
          >
            {leftItem && (
              <div className="w-full md:col-span-1">
                {renderCard(
                  leftItem,
                  'w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[620px]'
                )}
              </div>
            )}
            {rightItem && (
              <div className="w-full md:col-span-2">
                {renderCard(
                  rightItem,
                  'w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[620px]'
                )}
              </div>
            )}
          </div>
        );
      }

      // 3. Two-Column Asymmetric 2 is to 1: Broad landscape left (2 parts), narrow portrait right (1 part) - Exact Equal Height, 10px gap
      case 'two-col-2-to-1': {
        const leftItem = row.items[0];
        const rightItem = row.items[1];
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-stretch"
          >
            {leftItem && (
              <div className="w-full md:col-span-2">
                {renderCard(
                  leftItem,
                  'w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[620px]'
                )}
              </div>
            )}
            {rightItem && (
              <div className="w-full md:col-span-1">
                {renderCard(
                  rightItem,
                  'w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[620px]'
                )}
              </div>
            )}
          </div>
        );
      }

      // 4. Single Full-Width Grand Landscape Canvas Plate (100% width)
      case 'full-width-landscape': {
        const item = row.items[0];
        if (!item) return null;
        return (
          <div key={row.id} className="w-full">
            {renderCard(
              item,
              'w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/10] min-h-[380px] sm:min-h-[500px] md:min-h-[620px] lg:min-h-[720px] max-h-[820px]'
            )}
          </div>
        );
      }

      // 5. Three-Column Editorial Grid (33.3% / 33.3% / 33.3%) - Exact Uniform Height, 10px gap
      case 'three-col':
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px] items-start"
          >
            {row.items.map((item) => (
              <div
                key={`${item.projectSlug}-${item.imageIndex ?? 0}`}
                className="w-full"
              >
                {renderCard(
                  item,
                  'w-full h-[360px] sm:h-[440px] md:h-[500px] lg:h-[580px]'
                )}
              </div>
            ))}
          </div>
        );

      // 6. Four-Column Editorial Strip (25% each) - 10px gap
      case 'four-col':
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px] items-start"
          >
            {row.items.map((item) => (
              <div
                key={`${item.projectSlug}-${item.imageIndex ?? 0}`}
                className="w-full"
              >
                {renderCard(
                  item,
                  'aspect-[3/4] min-h-[360px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[560px]'
                )}
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
      className="relative w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-10 lg:px-14 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      {/* Generous Gallery-Width Container (max-w-[1880px]) so images display huge, broad, and grand */}
      <div className="w-full max-w-[1880px] mx-auto">
        {/* 
          Section Header:
          - Left: Pure single text "PROJECTS"
          - Right: Underlined interactive toggle ("View All" / "Show Less")
        */}
        <div className="flex items-baseline justify-between pb-6 md:pb-8 border-b border-neutral-300 mb-8 sm:mb-12 md:mb-16">
          <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
            Projects
          </h2>

          <button
            type="button"
            onClick={handleToggleView}
            className="text-[11px] sm:text-[13px] uppercase tracking-[0.2em] font-medium underline underline-offset-6 text-neutral-800 hover:text-black transition-opacity duration-200 cursor-pointer"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        </div>

        {/* 
          Garrett Naccarato Inspired Dynamic Layout:
          Alternating between full-width single landscape canvases, 2-column balanced,
          asymmetric (1:2 and 2:1) layouts, 3-column matrices, and 4-column strips with 10px margin.
        */}
        <div className="flex flex-col gap-y-[10px]">
          {displayedRows.map((row) => renderRow(row))}
        </div>

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
