import React from 'react';
import { useAboutSettings } from '../hooks/usePortfolioQueries';
import { DEFAULT_ABOUT_SETTINGS } from '../services/siteSettingsService';
import { SEOHead } from './SEOHead';

interface AboutViewProps {
  onOpenContact: () => void;
}

export const AboutView: React.FC<AboutViewProps> = () => {
  const { data: settings } = useAboutSettings();
  const config = settings || DEFAULT_ABOUT_SETTINGS;

  const isVideo =
    config.mediaType === 'video' ||
    (config.mediaUrl &&
      (config.mediaUrl.endsWith('.mp4') || config.mediaUrl.endsWith('.webm')));

  return (
    <div
      id="about-studio-page"
      className="min-h-screen pt-24 sm:pt-28 md:pt-36 pb-20 md:pb-28 px-4 sm:px-6 md:px-8 bg-neutral-50 text-neutral-900 transition-colors duration-300"
    >
      <SEOHead
        title={`About ${config.artistName} — Founder & Creative Director | Deon Studios`}
        description={`Learn about ${config.artistName}, Ghanaian fashion photographer, visual storyteller, and founder of Deon Studios. Studio philosophy, client roster, awards, and representation.`}
        canonicalUrl="/#about"
        ogType="profile"
        ogImage={config.mediaUrl || '/assets/images/gideon_boadi_portrait.png'}
        imageAlt={`${config.artistName} - ${config.roleTagline || 'Photographer'}`}
        author={config.artistName}
      />

      <div className="max-w-7xl mx-auto">
        {/* 
          Two-column editorial layout:
          - Left: High-contrast photographic portrait / looping video of photographer in film frame with credit
          - Right: Dynamic editorial narrative, social links, bookings, and select clients list
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* Left Column: Portrait / Media */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="relative overflow-hidden border border-neutral-900/80 bg-neutral-100 shadow-sm">
              {isVideo ? (
                <video
                  src={config.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto aspect-3/4 object-cover grayscale contrast-105 block"
                />
              ) : (
                <img
                  src={config.mediaUrl || '/assets/images/gideon_boadi_portrait.png'}
                  alt={`${config.artistName} — ${config.artistTitle}`}
                  className="w-full h-auto aspect-3/4 object-cover grayscale contrast-105 block"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.tried) {
                      target.dataset.tried = '1';
                      target.src = '/assets/images/gideon_boadi_portrait.png';
                    }
                  }}
                />
              )}
            </div>
            {config.mediaCredit && (
              <p className="mt-2 text-[9px] text-neutral-500 font-sans-clean tracking-wider">
                Photo by{' '}
                <span className="underline underline-offset-2 decoration-neutral-400">
                  {config.mediaCredit}
                </span>
              </p>
            )}
          </div>

          {/* Right Column: Editorial Text */}
          <div className="lg:col-span-7 xl:col-span-7 text-neutral-800 space-y-6 sm:space-y-7 leading-relaxed font-sans-clean text-[12px] sm:text-[14px]">
            {/* Header & Disciplines Tagline */}
            <div className="border-b border-neutral-200 pb-5 mb-2">
              <h1 className="font-display text-[22px] sm:text-[28px] uppercase tracking-tight text-neutral-950 font-normal">
                {config.artistName}
              </h1>
              <p className="mt-1 text-[10px] sm:text-[12px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                {config.artistTitle}
              </p>
            </div>

            {/* Dynamic Bio Paragraphs */}
            {config.bioParagraphs && config.bioParagraphs.length > 0 ? (
              config.bioParagraphs.map((paragraph, idx) => (
                <p
                  key={idx}
                  className={`leading-relaxed ${
                    idx === 0
                      ? 'text-neutral-900 text-[14px] sm:text-[16px] font-light'
                      : 'text-neutral-700 font-light'
                  }`}
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-neutral-700 font-light leading-relaxed">
                Visual storyteller and photographer based in Accra, Ghana.
              </p>
            )}

            {/* Social Links */}
            {config.socialLinks && config.socialLinks.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[10px] sm:text-[12px] uppercase tracking-[0.16em] font-medium text-neutral-900">
                {config.socialLinks.map((link, idx) => (
                  <a
                    key={`${link.name}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-neutral-400 hover:decoration-black hover:text-black transition-all"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            )}

            {/* Bookings & General Inquiries */}
            {config.bookingUrl && (
              <div className="pt-4 sm:pt-6 border-t border-neutral-200">
                <h3 className="font-sans-clean text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.16em] text-neutral-950 mb-2">
                  {config.bookingLabel || 'Bookings & General Inquiries'}
                </h3>
                <a
                  href={config.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] sm:text-[12px] text-neutral-700 underline underline-offset-4 decoration-neutral-400 hover:text-black hover:decoration-black transition-colors break-all"
                >
                  {config.bookingUrl}
                </a>
              </div>
            )}

            {/* Selected Clients inline list */}
            {config.clients && config.clients.length > 0 && (
              <div className="pt-4 sm:pt-6 border-t border-neutral-200">
                <div className="text-[10px] sm:text-[12px] text-neutral-600 leading-relaxed">
                  <span className="font-medium text-neutral-900">Select Clients: </span>
                  {config.clients.map((client, idx, arr) => (
                    <span key={idx}>
                      <span className="underline underline-offset-2 decoration-neutral-300 hover:text-neutral-900 transition-colors">
                        {client}
                      </span>
                      {idx < arr.length - 1 ? ' | ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
