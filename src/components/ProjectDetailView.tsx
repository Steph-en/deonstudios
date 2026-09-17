import React, { useState } from 'react';
import { ArrowLeft, Maximize2, Camera, Calendar, MapPin, User, ArrowRight } from 'lucide-react';
import { Project, ThemeMode } from '../types';
import { LightboxModal } from './LightboxModal';
import { ResilientImage } from './ResilientImage';

interface ProjectDetailViewProps {
  project: Project;
  allProjects: Project[];
  theme: ThemeMode;
  onBack: () => void;
  onSelectProject: (project: Project) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  allProjects,
  theme,
  onBack,
  onSelectProject,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  // Find next project in the collection
  const currentProjectIndex = allProjects.findIndex((p) => p.id === project.id);
  const nextProject = allProjects[(currentProjectIndex + 1) % allProjects.length];

  return (
    <div
      id={`project-detail-${project.slug}`}
      className={`min-h-screen pt-28 md:pt-36 pb-24 px-6 md:px-12 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-950'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-10">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium py-2 px-4 rounded-full border transition-all duration-200 ${
              theme === 'dark'
                ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'border-neutral-300 bg-white text-neutral-700 hover:text-black hover:bg-neutral-100 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Projects</span>
          </button>
        </div>

        {/* Project Header and Credits */}
        <header className="pb-12 md:pb-16 border-b border-neutral-300">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-amber-600 mb-2">
                <span>{project.client}</span>
                <span className="opacity-40">•</span>
                <span>{project.category}</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight text-neutral-950">
                {project.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.18em] opacity-75 text-neutral-700">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {project.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {project.year}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                {project.images.length} Plates
              </span>
            </div>
          </div>

          {/* Description & Full Credits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10 pt-8 border-t border-neutral-200">
            <div className="md:col-span-7">
              <h3 className="text-xs uppercase tracking-[0.2em] font-mono opacity-50 mb-2">
                Creative Concept
              </h3>
              <p className="font-editorial italic text-lg sm:text-xl md:text-2xl leading-relaxed opacity-90 font-light">
                "{project.description}"
              </p>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-4 text-xs">
              {project.artDirector && (
                <div>
                  <span className="uppercase tracking-[0.18em] opacity-50 block mb-1">
                    Art Direction
                  </span>
                  <span className="font-medium tracking-wider">{project.artDirector}</span>
                </div>
              )}
              {project.stylist && (
                <div>
                  <span className="uppercase tracking-[0.18em] opacity-50 block mb-1">
                    Styling
                  </span>
                  <span className="font-medium tracking-wider">{project.stylist}</span>
                </div>
              )}
              {project.model && (
                <div>
                  <span className="uppercase tracking-[0.18em] opacity-50 block mb-1">
                    Talent / Cast
                  </span>
                  <span className="font-medium tracking-wider">{project.model}</span>
                </div>
              )}
              <div>
                <span className="uppercase tracking-[0.18em] opacity-50 block mb-1">
                  Photographer
                </span>
                <span className="font-medium tracking-wider">Deon Studios</span>
              </div>
            </div>
          </div>
        </header>

        {/* 
          FEATURE 3 (chantellekemkemian.com/quick-portfolio inspired):
          Masonry grid layout displaying related project works and assets.
          Clicking any image pops up the Lightbox Modal with navigation and counter.
        */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs uppercase tracking-[0.25em] font-sans-clean font-semibold opacity-70">
              Project Archive Plates ({project.images.length})
            </h2>
            <span className="text-[11px] uppercase tracking-[0.2em] opacity-50">
              Click plate to expand
            </span>
          </div>

          {/* Masonry Columns */}
          <div className="masonry-columns-3">
            {project.images.map((image, index) => {
              return (
                <div
                  key={image.id}
                  onClick={() => openLightbox(index)}
                  className="masonry-break group relative overflow-hidden rounded-xl cursor-pointer bg-neutral-900/10 shadow-sm transition-all duration-300 hover:shadow-2xl"
                >
                  <ResilientImage
                    src={image.url}
                    fallbackSrc={image.fallbackUrl}
                    alt={image.caption || `${project.title} image ${index + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Dark subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5" />

                  {/* Top-right zoom action icon on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <span className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 inline-flex items-center justify-center">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Bottom Caption & Number Plate on hover */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-white">
                    <div className="flex items-center justify-between text-[11px] font-mono tracking-wider mb-1 text-amber-400">
                      <span>PLATE 0{index + 1}</span>
                      {image.tag && <span className="uppercase">{image.tag}</span>}
                    </div>
                    <p className="font-editorial text-sm italic line-clamp-2 text-neutral-200">
                      {image.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Next Project Teaser Footer */}
        <div className="mt-24 pt-16 border-t border-neutral-800/40">
          <div
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onSelectProject(nextProject);
            }}
            className={`cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 rounded-2xl border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-neutral-900/40 hover:bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300 shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-amber-500 block mb-1">
                Next Project
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                {nextProject.title} — {nextProject.client}
              </h3>
              <p className="text-xs uppercase tracking-wider opacity-60 mt-1">
                {nextProject.category} • {nextProject.images.length} Assets
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] font-medium hidden sm:inline">
                View Project
              </span>
              <span className={`p-3 rounded-full border transition-all duration-300 group-hover:scale-110 ${
                theme === 'dark' ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
              }`}>
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        images={project.images}
        currentIndex={activeImageIndex}
        isOpen={lightboxOpen}
        projectTitle={project.title}
        clientName={project.client}
        theme={theme}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setActiveImageIndex(newIdx)}
      />
    </div>
  );
};

export default ProjectDetailView;
