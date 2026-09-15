import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { STUDIO_INFO } from '../data/portfolioData';
import { ThemeMode } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Handle smooth bi-directional slide animation
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setIsRendered(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Lock body scroll while contact panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      id="contact-slideover-panel"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* 
        Blurred Backdrop:
        Takes over the left/remaining side of the screen.
        Clicking anywhere in this blurred region animates the drawer back off to the right.
      */}
      <div
        onClick={onClose}
        aria-label="Dismiss contact panel"
        className={`fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-500 ease-in-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 
        Slide-Over Drawer (Takes ~1/3 to 1/2 of the screen):
        Animates in smoothly from the right edge with high-end editorial styling.
      */}
      <div
        className={`fixed top-0 right-0 bottom-0 h-full w-full sm:w-[500px] md:w-[560px] lg:w-[46%] xl:w-[40%] max-w-2xl bg-[#0a0a0a] text-white border-l border-neutral-900 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto transition-transform duration-500 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header: CONTACT Label with extending line + square X button */}
        <div className="flex items-center justify-between gap-4 pt-8 sm:pt-10 px-6 sm:px-12">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-medium whitespace-nowrap">
              Contact
            </span>
            <div className="h-[1px] bg-neutral-800 flex-1 max-w-md" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact drawer"
            className="p-2 sm:p-2.5 rounded-lg border border-neutral-800/90 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Title & Direct Email */}
          <div className="pt-8 sm:pt-10 pb-6 sm:pb-8 px-6 sm:px-12">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium uppercase tracking-tight text-white leading-[1.15]">
              Let's make{' '}
              <span className="font-editorial italic font-normal tracking-wide text-neutral-300">
                something
              </span>{' '}
              great.
            </h2>

            <div className="mt-6 sm:mt-8">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mb-1.5">
                Email
              </span>
              <a
                href={`mailto:${STUDIO_INFO.booking}`}
                className="text-lg sm:text-xl md:text-2xl text-white hover:text-neutral-300 transition-colors font-sans-clean font-light tracking-wide break-all"
              >
                {STUDIO_INFO.booking}
              </a>
            </div>
          </div>

          {/* Form / Submission State */}
          {submitted ? (
            <div className="px-6 sm:px-12 py-12 flex flex-col items-start gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <h3 className="font-display text-2xl uppercase tracking-tight text-white">
                Message Dispatched
              </h3>
              <p className="text-sm font-light text-neutral-400 max-w-md">
                Thank you for getting in touch. Your project details have been received and our studio will review and reply within 24–48 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 rounded-lg border border-neutral-700 hover:border-white text-xs uppercase tracking-[0.2em] text-white transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 sm:px-12 pb-10 flex flex-col gap-7 sm:gap-9 flex-1">
              {/* Full Name & Email Address Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm sm:text-base text-white outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder=""
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm sm:text-base text-white outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Type of Project */}
              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-[0.25em] text-amber-500/90 font-medium mb-1">
                  Type of Project
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm sm:text-base text-white outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Tell Me About Your Project */}
              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mb-1">
                  Tell Me About Your Project
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder=""
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm sm:text-base text-white outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Bottom Row: Response Time Notice + Send Message Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
                  I usually respond within 24–48 hours.
                </span>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-neutral-700 hover:border-white text-xs uppercase tracking-[0.22em] font-medium text-white hover:bg-white hover:text-black transition-all duration-200 cursor-pointer"
                >
                  <span>Send Message</span>
                  <span className="tracking-tighter">──</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
