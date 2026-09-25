import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { STUDIO_INFO, SOCIAL_LINKS } from '../data/portfolioData';
import { SEOHead } from './SEOHead';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = STUDIO_INFO.email || 'contact@gideonboadi.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 500);
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', message: '' });
    setSubmitted(false);
  };

  return (
    <div
      id="contact-studio-page"
      className="min-h-[85vh] pt-24 sm:pt-28 md:pt-36 pb-20 px-4 sm:px-6 bg-white text-neutral-900 flex flex-col justify-between"
    >
      <SEOHead
        title="Contact & Booking Inquiries — Gideon Boadi | Deon Studios"
        description="Commission Gideon Boadi and Deon Studios for editorial fashion, advertising campaigns, lookbooks, or portraiture. Studio booking and correspondence in Accra and worldwide."
        canonicalUrl="/#contact"
        ogType="website"
        ogImage="/assets/gideon_boadi_portrait.png"
        imageAlt="Deon Studios - Contact & Inquiries"
        author="Gideon Boadi"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact & Booking — Deon Studios',
          description:
            'Commission Gideon Boadi and Deon Studios for editorial fashion, advertising campaigns, lookbooks, or portraiture.',
          mainEntity: {
            '@type': 'Organization',
            name: 'Deon Studios',
            email,
            url: typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.gideonboadi.com',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'editorial & commercial booking',
              email,
              availableLanguage: ['English'],
            },
          },
        }}
      />
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        {/* Header & Introductory Note */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <h1 className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] font-medium text-neutral-900">
            Contact
          </h1>

          <p className="text-neutral-700 font-light text-[13px] sm:text-[14px] leading-relaxed max-w-md mx-auto">
            Based in Accra and available for projects internationally.
          </p>

          <p className="text-neutral-500 font-light text-[12px] sm:text-[13px] leading-relaxed max-w-md mx-auto">
            For photoshoot enquiries please fill out the form below
            <span className="block mt-1">
              or email{' '}
              <a
                href={`mailto:${email}`}
                className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-black transition-colors font-normal"
              >
                {email}
              </a>
            </span>
          </p>
        </div>

        {/* Clean Editorial Enclosed Form (Reflects Classic Gallery Layout) */}
        <div className="w-full">
          {submitted ? (
            <div className="border border-neutral-300 p-8 sm:p-12 text-center space-y-3 bg-neutral-50/50">
              <CheckCircle2 className="w-5 h-5 text-neutral-900 mx-auto" />
              <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-neutral-950">
                Message Dispatched
              </h2>
              <p className="text-xs sm:text-[13px] text-neutral-600 font-light max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out. Your enquiry has been received and Gideon will be in touch shortly.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-5 py-2 border border-neutral-300 hover:border-neutral-900 text-[11px] uppercase tracking-[0.16em] text-neutral-800 hover:text-black transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-neutral-300 divide-y divide-neutral-300 bg-white focus-within:border-neutral-600 transition-colors">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light"
                  />
                </div>
                <div>
                  <textarea
                    rows={7}
                    required
                    placeholder="Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light resize-y min-h-[160px]"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-neutral-300 hover:border-neutral-900 text-neutral-900 hover:text-black text-[11px] sm:text-xs tracking-[0.06em] font-normal transition-colors cursor-pointer bg-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {STUDIO_INFO.booking && (
                  <a
                    href={STUDIO_INFO.booking}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-black transition-colors"
                  >
                    Bookings & General Inquiries ↗
                  </a>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Understated Social Archive Icons at Bottom Center */}
      <div className="pt-16 sm:pt-20 pb-4 text-center">
        <div className="inline-flex items-center justify-center gap-6 sm:gap-7 text-neutral-400">
          {/* Instagram */}
          <a
            href={STUDIO_INFO.instagram || 'https://www.instagram.com/deonstudios/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>

          {/* Pinterest */}
          <a
            href={STUDIO_INFO.pinterest || 'https://www.pinterest.com/deonboadi/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pinterest"
            className="hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href={STUDIO_INFO.youtube || 'https://www.youtube.com/@deonboadi'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href={STUDIO_INFO.whatsapp || 'https://api.whatsapp.com/send/?phone=%2B233208667252'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 0C5.405 0 .013 5.393.013 12.019c0 2.115.551 4.18 1.598 6.002L0 24l6.169-1.579a11.97 11.97 0 0 0 5.862 1.536h.005c6.626 0 12.018-5.393 12.018-12.019 0-3.21-1.25-6.227-3.52-8.498A11.946 11.946 0 0 0 12.031 0zm0 22.013h-.004a9.98 9.98 0 0 1-5.088-1.39l-.365-.216-3.778.968.995-3.684-.237-.377a9.99 9.99 0 0 1-1.537-5.295c0-5.521 4.492-10.013 10.013-10.013 2.674 0 5.187 1.042 7.078 2.933a9.94 9.94 0 0 1 2.934 7.08c0 5.521-4.492 10.013-10.014 10.013zm5.485-7.502c-.3-.15-1.776-.877-2.051-.977-.275-.1-.476-.15-.676.15-.2.3-.776.977-.951 1.177-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.488-.893-.797-1.496-1.782-1.671-2.082-.175-.3-.019-.462.131-.611.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.629-.926-2.23-.243-.586-.49-.506-.676-.516l-.576-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.502 0 1.476 1.075 2.902 1.225 3.102.15.2 2.116 3.23 5.127 4.53.716.31 1.275.495 1.71.634.72.229 1.375.197 1.892.12.578-.086 1.776-.726 2.026-1.427.25-.701.25-1.302.175-1.427-.075-.125-.275-.2-.575-.35z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactView;
