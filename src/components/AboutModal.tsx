import React from 'react';
import { X, Instagram, Award, Sparkles, ArrowUpRight, Mail } from 'lucide-react';
import { STUDIO_INFO, CLIENT_LIST } from '../data/portfolioData';
import { ThemeMode } from '../types';
import { DeonLogo } from './DeonLogo';

interface AboutModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onOpenContact: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  theme,
  onClose,
  onOpenContact,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="about-studio-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 border border-neutral-800 bg-[#0a0a0a] text-white shadow-2xl transition-all duration-300"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close about modal"
          className="absolute top-6 right-6 p-2.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <DeonLogo size={42} fillColor="#FFFFFF" />
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.2em]">
              {STUDIO_INFO.name}
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] opacity-60">
              {STUDIO_INFO.location}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-[0.25em] font-sans-clean font-semibold opacity-50 mb-3">
            Studio Philosophy
          </h3>
          <p className="font-editorial text-lg md:text-xl italic leading-relaxed font-light opacity-95">
            "{STUDIO_INFO.bio}"
          </p>
        </div>

        {/* Services & Capabilities */}
        <div className="mb-8 pt-6 border-t border-neutral-800/30">
          <h3 className="text-xs uppercase tracking-[0.25em] font-sans-clean font-semibold opacity-50 mb-3">
            Creative Services
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs uppercase tracking-wider opacity-85">
            {STUDIO_INFO.services.map((service, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Select Client Roster */}
        <div className="mb-8 pt-6 border-t border-neutral-800/30">
          <h3 className="text-xs uppercase tracking-[0.25em] font-sans-clean font-semibold opacity-50 mb-3">
            Selected Editorial & Commercial Clients
          </h3>
          <div className="flex flex-wrap gap-2">
            {CLIENT_LIST.map((client, idx) => (
              <span
                key={idx}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  theme === 'dark'
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-700'
                }`}
              >
                {client}
              </span>
            ))}
          </div>
        </div>

        {/* Honors & Accolades */}
        <div className="mb-8 pt-6 border-t border-neutral-800/30">
          <h3 className="text-xs uppercase tracking-[0.25em] font-sans-clean font-semibold opacity-50 mb-3">
            Recognition & Honors
          </h3>
          <div className="space-y-2">
            {STUDIO_INFO.awards.map((award, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-mono opacity-50">{award.year}</span>
                <span className="opacity-90">{award.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions & Instagram */}
        <div className="pt-6 border-t border-neutral-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href={STUDIO_INFO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span>Follow {STUDIO_INFO.handle}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenContact();
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
              theme === 'dark'
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            Commission Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
