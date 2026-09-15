import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Maximize2 } from 'lucide-react';
import { ProjectImage, ThemeMode } from '../types';

interface LightboxModalProps {
  images: ProjectImage[];
  currentIndex: number;
  isOpen: boolean;
  projectTitle: string;
  clientName: string;
  theme: ThemeMode;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  currentIndex,
  isOpen,
  projectTitle,
  clientName,
  theme,
  onClose,
  onNavigate,
}) => {
  const currentImage = images[currentIndex];

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentImage) return null;

  const currentNumberFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalCountFormatted = String(images.length).padStart(2, '0');

  return (
    <div
      id="portfolio-lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery preview"
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-black/95 text-white select-none backdrop-blur-xl animate-fade-in"
    >
      {/* 
        Top Bar:
        Project/Client info, Image Number indicator (e.g. 03 / 06), and Close Button
      */}
      <div className="w-full px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/10 z-20">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-sans-clean font-medium">
            {clientName}
          </span>
          <span className="font-display text-sm md:text-base font-semibold uppercase tracking-wider text-white">
            {projectTitle}
          </span>
        </div>

        {/* Center: Image counter indicating how many images there are and the current number */}
        <div
          id="lightbox-counter-indicator"
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono tracking-widest"
        >
          <span className="text-white font-bold">{currentNumberFormatted}</span>
          <span className="opacity-40">/</span>
          <span className="opacity-70">{totalCountFormatted}</span>
        </div>

        {/* Right: Close Button */}
        <button
          id="lightbox-close-button"
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage & Navigation Buttons */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 min-h-0 overflow-hidden">
        {/* Previous Navigation Button */}
        <button
          id="lightbox-prev-button"
          type="button"
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-4 md:left-8 z-30 p-3 md:p-4 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Active Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            key={currentImage.id}
            src={currentImage.url}
            alt={currentImage.caption || `${projectTitle} plate ${currentIndex + 1}`}
            className="max-h-[75vh] md:max-h-[80vh] max-w-[90vw] md:max-w-[78vw] object-contain rounded-lg shadow-2xl transition-all duration-300"
          />
        </div>

        {/* Next Navigation Button */}
        <button
          id="lightbox-next-button"
          type="button"
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-4 md:right-8 z-30 p-3 md:p-4 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 
        Bottom Bar:
        Image Caption & EXIF Camera Details
      */}
      <div className="w-full px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-black/40 z-20">
        <div className="flex items-center gap-3">
          {currentImage.tag && (
            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-white/15 text-neutral-200">
              {currentImage.tag}
            </span>
          )}
          <p className="text-xs md:text-sm font-editorial italic text-neutral-300">
            {currentImage.caption}
          </p>
        </div>

        {currentImage.exif && (
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono tracking-wider">
            <Camera className="w-3.5 h-3.5 text-neutral-400" />
            <span>{currentImage.exif.camera}</span>
            {currentImage.exif.lens && <span>• {currentImage.exif.lens}</span>}
            {currentImage.exif.shutter && <span>• {currentImage.exif.shutter}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LightboxModal;
