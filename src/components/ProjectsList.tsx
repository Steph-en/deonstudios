import React, { useState } from 'react';
import { Project, ThemeMode } from '../types';

interface ProjectsListProps {
  projects: Project[];
  theme: ThemeMode;
  onSelectProject: (project: Project) => void;
}

const INITIAL_PROJECT_COUNT = 6;

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  theme,
  onSelectProject,
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayedProjects = showAll
    ? projects
    : projects.slice(0, INITIAL_PROJECT_COUNT);

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

  return (
    <section
      id="projects-archive-section"
      className="relative w-full py-12 md:py-20 px-4 sm:px-6 md:px-8 bg-neutral-50 text-neutral-950 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* 
          Section Header:
          - Left: Pure single text "PROJECTS"
          - Right: Underlined interactive toggle ("View All" / "Show Less")
        */}
        <div className="flex items-baseline justify-between pb-6 md:pb-8 border-b border-neutral-300 mb-6 md:mb-8">
          <h2 className="font-display text-[16px] sm:text-[20px] md:text-[26px] font-normal tracking-tight uppercase text-neutral-950">
            Projects
          </h2>

          <button
            type="button"
            onClick={handleToggleView}
            className="text-[10px] sm:text-[12px] uppercase tracking-[0.2em] font-medium underline underline-offset-6 text-neutral-800 hover:text-black transition-opacity duration-200 cursor-pointer"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        </div>

        {/* 
          Garrett Naccarato Inspired In-Line Layout:
          - 3 projects in line across the screen
          - Small, refined gaps between images
          - Multi-image projects grouped into a 3x3 mini-grid within the column slot
          - Clean, understated underlined project names beneath each item
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2.5 sm:gap-x-3.5 md:gap-x-4 gap-y-7 sm:gap-y-9 md:gap-y-11">
          {displayedProjects.map((project) => {
            const isGrid = project.layout === 'grid3x3' && project.gridImages && project.gridImages.length > 0;

            return (
              <article
                key={project.id}
                id={`project-card-${project.slug}`}
                onClick={() => onSelectProject(project)}
                className="group cursor-pointer flex flex-col select-none"
              >
                {/* Image Container with Consistent Aspect Ratio */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-900/10 dark:bg-neutral-900/40">
                  {isGrid ? (
                    /* 3x3 Grid of 9 tight photographs (like French Kiwis Eyewear) */
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[2px] sm:gap-[3px]">
                      {project.gridImages!.slice(0, 9).map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative w-full h-full overflow-hidden bg-neutral-900/20"
                        >
                          <img
                            src={imgUrl}
                            alt={`${project.title} frame ${imgIdx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Single Full-Height Editorial Photograph */
                    <img
                      src={project.previewImages[0]}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  )}
                </div>

                {/* Understated Underlined Project Name */}
                <div className="mt-2.5 sm:mt-3">
                  <span className="inline-block text-xs sm:text-sm font-normal tracking-wide underline underline-offset-4 decoration-1 text-neutral-900 group-hover:text-black decoration-neutral-400 group-hover:decoration-black transition-opacity duration-200">
                    {project.title}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Toggle Button if Expanded */}
        {showAll && (
          <div className="pt-12 md:pt-16 flex justify-center">
            <button
              type="button"
              onClick={handleToggleView}
              className="text-xs uppercase tracking-[0.2em] font-medium underline underline-offset-6 text-neutral-700 hover:text-black transition-opacity duration-200 cursor-pointer"
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
