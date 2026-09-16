import React from 'react';
import { STUDIO_INFO, CLIENT_LIST, SOCIAL_LINKS } from '../data/portfolioData';

interface AboutViewProps {
  onOpenContact: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onOpenContact }) => {
  return (
    <div
      id="about-studio-page"
      className="min-h-screen pt-24 sm:pt-28 md:pt-36 pb-20 md:pb-28 px-4 sm:px-6 md:px-8 bg-neutral-50 text-neutral-900 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* 
          Two-column editorial layout matching garrettnaccarato.com/info:
          - Left: High-contrast photographic portrait of photographer in film frame with photo credit
          - Right: Clean editorial narrative, social links, inquiries, awards, and clients
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* Left Column: Portrait */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="relative overflow-hidden border border-neutral-900/80 bg-neutral-100 shadow-sm">
              <img
                src="/src/assets/images/gideon_boadi_portrait.png"
                alt="Gideon Boadi — Photographer & Creative Director"
                className="w-full h-auto aspect-3/4 object-cover grayscale contrast-105 block"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-2 text-[9px] text-neutral-500 font-sans-clean tracking-wider">
              Photo by <span className="underline underline-offset-2 decoration-neutral-400">Nana K. Boakye</span>
            </p>
          </div>

          {/* Right Column: Editorial Text */}
          <div className="lg:col-span-7 xl:col-span-7 text-neutral-800 space-y-6 sm:space-y-7 leading-relaxed font-sans-clean text-[12px] sm:text-[14px]">
            {/* Header & Disciplines Tagline */}
            <div className="border-b border-neutral-200 pb-5 mb-2">
              <h1 className="font-display text-[22px] sm:text-[28px] uppercase tracking-tight text-neutral-950 font-normal">
                Deon Studios
              </h1>
              <p className="mt-1 text-[10px] sm:text-[12px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                Creative Direction · Visual Storytelling · Image Making
              </p>
            </div>

            {/* Opening Studio Statement */}
            <p className="text-neutral-900 text-[14px] sm:text-[16px] font-light leading-relaxed">
              Deon Studios is a creative image studio focused on transforming ideas, identities, and emotions into distinctive visual stories.
            </p>

            {/* Studio Philosophy & Approach */}
            <p className="text-neutral-700 font-light leading-relaxed">
              We work with brands across fashion, beauty, lifestyle, and culture to develop visual concepts, direct imagery, and create compelling content that goes beyond aesthetics. Every project is approached with intention — from the initial idea and visual language to the mood, composition, and final image. Our work sits at the intersection of fashion, culture, creativity, and visual communication, creating imagery that feels considered, authentic, and memorable.
            </p>

            {/* Leadership & Creative Direction */}
            <p className="text-neutral-700 font-light leading-relaxed">
              Led by Gideon Boadi, an Image Creative and Visual Storyteller based in Accra, the studio brings a disciplined and holistic visual approach to every commission. Gideon plays an active role throughout the entire creative process — from conceptualization, pre-production, and cinematographic lighting to post-production, art direction, and print design. Chasing resonance, he draws upon architectural form to bring timeless stillness to dynamic contemporary environments.
            </p>

            {/* Collaborations & Core Belief */}
            <p className="text-neutral-700 font-light leading-relaxed">
              The studio has collaborated with notable names including Vogue, Vlisco, Dazed, and Guzangs Magazine, among others. Whether developing an expansive campaign concept, shaping a brand’s visual identity, directing a fashion story, or producing editorial imagery, Deon Studios is driven by a singular belief: to cultivate deep emotional connections through unique and relevant visual storytelling.
            </p>

            {/* Global Availability */}
            <p className="text-neutral-700 font-light leading-relaxed">
              Available worldwide for editorial commissions, runway documentation, commercial campaigns, and creative consultation.
            </p>

            {/* Social Links */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[10px] sm:text-[12px] uppercase tracking-[0.16em] font-medium text-neutral-900">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-neutral-400 hover:decoration-black hover:text-black transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Bookings & General Inquiries */}
            <div className="pt-4 sm:pt-6 border-t border-neutral-200">
              <h3 className="font-sans-clean text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.16em] text-neutral-950 mb-2">
                Bookings &amp; General Inquiries
              </h3>
              <a
                href="https://deon-studios.easyweek.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] sm:text-[12px] text-neutral-700 underline underline-offset-4 decoration-neutral-400 hover:text-black hover:decoration-black transition-colors break-all"
              >
                https://deon-studios.easyweek.de/
              </a>
            </div>

            {/* Features & Recognition */}
            <div className="pt-4 sm:pt-6 border-t border-neutral-200 space-y-3">
              <h3 className="font-sans-clean text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.16em] text-neutral-950 mb-2">
                Features &amp; Recognition
              </h3>
              <div className="space-y-1.5 text-[10px] sm:text-[12px] text-neutral-700 leading-normal">
                {STUDIO_INFO.awards.map((award, idx) => (
                  <p key={idx} className="underline underline-offset-2 decoration-neutral-300">
                    {award.year} {award.title}
                  </p>
                ))}
              </div>

              {/* Selected Clients inline list */}
              <div className="pt-2 text-[10px] sm:text-[12px] text-neutral-600 leading-relaxed">
                <span className="font-medium text-neutral-900">Select Clients: </span>
                {CLIENT_LIST.slice(0, 10).map((client, idx, arr) => (
                  <span key={idx}>
                    <span className="underline underline-offset-2 decoration-neutral-300 hover:text-neutral-900 transition-colors">
                      {client}
                    </span>
                    {idx < arr.length - 1 ? ' | ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
