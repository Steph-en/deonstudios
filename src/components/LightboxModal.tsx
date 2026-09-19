import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectImage, ThemeMode } from '../types';
import { ResilientImage } from './ResilientImage';
import { STUDIO_INFO } from '../data/portfolioData';

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

  return (
    <div
      id="portfolio-lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery preview"
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-white text-neutral-900 select-none animate-fade-in"
    >
      {/* 
        Top Bar:
        Left: Filled-in social media icon links (Instagram, Telegram, TikTok, WhatsApp, YouTube, Pinterest)
        Right: Ultra-thin delicate Close 'X' button
        Positioned tight to the top edge to maximize image breathing room
      */}
      <div className="w-full px-6 sm:px-10 md:px-12 pt-3 sm:pt-4 pb-1 flex items-center justify-between z-30">
        {/* Top Left Social Media Links in requested order: Instagram, Telegram, TikTok, WhatsApp, YouTube, Pinterest */}
        <div className="flex items-center gap-3 sm:gap-4 text-neutral-400">
          {/* 1. Instagram (Solid filled badge with cutout lens and flash dot) */}
          <a
            href={STUDIO_INFO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram profile"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 0C8.74 0 8.333.015 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c3.403 0 6.162 2.759 6.162 6.162s-2.759 6.163-6.162 6.163-6.162-2.759-6.162-6.163c0-3.403 2.759-6.162 6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
              />
            </svg>
          </a>

          {/* 2. Telegram (Solid filled circular badge with cutout paper airplane) */}
          <a
            href={STUDIO_INFO.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram channel"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>

          {/* 3. TikTok (Solid filled musical note silhouette) */}
          <a
            href={STUDIO_INFO.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok profile"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>

          {/* 4. WhatsApp (Solid filled speech bubble with phone handset cutout) */}
          <a
            href={STUDIO_INFO.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp chat"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>

          {/* 5. YouTube (Solid filled play button rectangle with cutout play triangle) */}
          <a
            href={STUDIO_INFO.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube channel"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* 6. Pinterest (Solid filled circular badge with 'P' cutout) */}
          <a
            href={STUDIO_INFO.pinterest}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pinterest portfolio"
            className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
            </svg>
          </a>
        </div>

        {/* Top Right: Ultra-thin delicate Close Button */}
        <button
          id="lightbox-close-button"
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-1 text-neutral-900 hover:opacity-50 transition-opacity cursor-pointer"
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={0.8} />
        </button>
      </div>

      {/* Main Image Stage & Ultra-Thin Navigation Buttons */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-12 md:px-16 min-h-0 overflow-hidden">
        {/* Previous Navigation Button (Ultra-thin chevron, no background) */}
        <button
          id="lightbox-prev-button"
          type="button"
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-2 sm:left-6 md:left-10 z-30 p-2 text-neutral-900 hover:opacity-50 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={0.65} />
        </button>

        {/* Active Image: Crisp, Squared-Out (rounded-none, shadow-none) */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <ResilientImage
            key={currentImage.id}
            src={currentImage.url}
            fallbackSrc={currentImage.fallbackUrl}
            alt={currentImage.caption || `${projectTitle} plate ${currentIndex + 1}`}
            className="max-h-[80vh] md:max-h-[85vh] max-w-[92vw] md:max-w-[78vw] object-contain rounded-none shadow-none"
          />
        </div>

        {/* Next Navigation Button (Ultra-thin chevron, no background) */}
        <button
          id="lightbox-next-button"
          type="button"
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-2 sm:right-6 md:right-10 z-30 p-2 text-neutral-900 hover:opacity-50 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={0.65} />
        </button>
      </div>

      {/* 
        Bottom Bar:
        Clean, frameless footer with caption/client on the left and subtle booking link on right
        Tucked close to the bottom edge matching the top bar's distance to the top
      */}
      <div className="w-full px-6 sm:px-10 md:px-12 pt-1 pb-3 sm:pb-4 flex items-center justify-between z-30">
        <div className="flex items-baseline gap-3">
          <span className="text-[9px] sm:text-[10px] font-sans text-neutral-400">
            {clientName || projectTitle}
          </span>
          {currentImage.caption && (
            <span className="text-[9px] sm:text-[10px] font-sans text-neutral-500 hidden sm:inline">
            - {currentImage.caption}
            </span>
          )}
        </div>

        {/* Bottom Right Subtle Attribution matching Format design */}
        <a
          href="https://deon-studios.easyweek.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] sm:text-[10px] font-sans text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Bookings & General Inquiries
        </a>
      </div>
    </div>
  );
};

export default LightboxModal;
