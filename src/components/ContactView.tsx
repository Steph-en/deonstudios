import React, { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Send, ArrowRight, Mail } from 'lucide-react';
import { STUDIO_INFO } from '../data/portfolioData';
import { SEOHead } from './SEOHead';

interface FormValues {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const PROJECT_TYPE_OPTIONS = [
  'Editorial Fashion',
  'Commercial Campaign',
  'Luxury Product / Still Life',
  'Portraiture Session',
  'Lookbook / Runway',
  'General Inquiry',
];

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState<FormValues>({
    name: '',
    email: '',
    phone: '',
    projectType: 'Editorial Fashion',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const destinationEmail = STUDIO_INFO.email || 'studio@gideonboadi.com';

  // Validation function for each form control
  const validateField = (field: keyof FormValues, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Please provide your full name.';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters.';
        }
        return undefined;

      case 'email':
        if (!value.trim()) {
          return 'Please provide your email address.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@domain.com).';
        }
        return undefined;

      case 'message':
        if (!value.trim()) {
          return 'Please provide a message or brief description.';
        }
        if (value.trim().length < 10) {
          return 'Please provide a little more detail (minimum 10 characters).';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Run full validation on all required fields
  const validateAll = (): FormErrors => {
    const newErrors: FormErrors = {};
    const nameErr = validateField('name', formData.name);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateField('email', formData.email);
    if (emailErr) newErrors.email = emailErr;

    const msgErr = validateField('message', formData.message);
    if (msgErr) newErrors.message = msgErr;

    return newErrors;
  };

  const handleBlur = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: err,
    }));
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);

    // If submit was attempted or field was already touched, validate live
    if (submitAttempted || touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: err,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    const validationErrors = validateAll();
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      message: true,
    });

    // If there are errors, focus the first invalid field and prevent sending
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.name) {
        nameInputRef.current?.focus();
      } else if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.message) {
        messageInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          projectType: formData.projectType,
          message: formData.message,
          destinationEmail,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result?.errors) {
          setErrors(result.errors);
        }
        throw new Error(
          result?.error ||
            `Unable to dispatch message. Please try again or email ${destinationEmail} directly.`
        );
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setServerError(
        err.message ||
          'A transmission error occurred. Please try again or contact us directly via email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      projectType: 'Editorial Fashion',
      message: '',
    });
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setSubmitted(false);
    setServerError(null);
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
            email: destinationEmail,
            url: typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.gideonboadi.com',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'editorial & commercial booking',
              email: destinationEmail,
              availableLanguage: ['English'],
            },
          },
        }}
      />

      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        {/* Header & Introductory Note */}
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <h1 className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] font-medium text-neutral-900">
            Contact & Commissions
          </h1>

          <p className="text-neutral-700 font-light text-[13px] sm:text-[14px] leading-relaxed max-w-md mx-auto">
            Based in Accra and available for campaigns and commissions worldwide.
          </p>

          <p className="text-neutral-500 font-light text-[12px] sm:text-[13px] leading-relaxed max-w-md mx-auto">
            Please fill out the inquiry form below to contact the studio directly,
            <span className="block mt-1">
              or email{' '}
              <a
                href={`mailto:${destinationEmail}`}
                className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-black transition-colors font-medium"
              >
                {destinationEmail}
              </a>
            </span>
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full">
          {submitted ? (
            /* Success Confirmation Screen */
            <div className="border border-neutral-300 p-8 sm:p-12 text-center space-y-4 bg-neutral-50/60 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-sm sm:text-base font-medium uppercase tracking-[0.18em] text-neutral-950 font-display">
                  Message Dispatched
                </h2>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-mono">
                  Delivered to {destinationEmail}
                </p>
              </div>

              <p className="text-xs sm:text-[13px] text-neutral-600 font-light max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="font-medium text-neutral-900">{formData.name}</strong>. Your inquiry has been received and Gideon Boadi will review your project brief and get in touch within 24–48 hours.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 border border-neutral-300 hover:border-neutral-900 text-[11px] uppercase tracking-[0.16em] text-neutral-800 hover:text-black transition-colors cursor-pointer bg-white"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Form Control Alert Banner if user clicked submit with empty/invalid fields */}
              {submitAttempted && Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-3.5 bg-rose-50/90 border border-rose-200 text-rose-900 text-xs rounded-none transition-all"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium block">
                      Please complete the required sections below:
                    </span>
                    <span className="text-[11px] text-rose-700 font-light">
                      {Object.values(errors).join(' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Server-Side Error Alert */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-none"
                >
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{serverError}</p>
                    <p className="mt-1 text-[11px]">
                      You can also reach Gideon directly at{' '}
                      <a href={`mailto:${destinationEmail}`} className="underline font-semibold">
                        {destinationEmail}
                      </a>.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Controls Enclosure */}
              <div className="border border-neutral-300 divide-y divide-neutral-300 bg-white">
                {/* 1. Full Name Input Control */}
                <div className={`p-4 sm:p-5 transition-colors ${errors.name ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="contact-name"
                      className="text-[10px] uppercase tracking-[0.24em] font-medium text-neutral-600 flex items-center gap-1"
                    >
                      <span>Full Name</span>
                      <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    </label>
                    {errors.name && (
                      <span id="name-error" className="text-[11px] text-rose-600 font-normal">
                        {errors.name}
                      </span>
                    )}
                  </div>
                  <input
                    ref={nameInputRef}
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Ama Mensah or Studio Representative"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light py-1 transition-colors ${
                      errors.name ? 'text-rose-950 placeholder:text-rose-300' : ''
                    }`}
                  />
                </div>

                {/* 2. Email Address Input Control */}
                <div className={`p-4 sm:p-5 transition-colors ${errors.email ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-[10px] uppercase tracking-[0.24em] font-medium text-neutral-600 flex items-center gap-1"
                    >
                      <span>Email Address</span>
                      <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    </label>
                    {errors.email && (
                      <span id="email-error" className="text-[11px] text-rose-600 font-normal">
                        {errors.email}
                      </span>
                    )}
                  </div>
                  <input
                    ref={emailInputRef}
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. client@brand.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light py-1 transition-colors ${
                      errors.email ? 'text-rose-950 placeholder:text-rose-300' : ''
                    }`}
                  />
                </div>

                {/* 3. Phone / WhatsApp (Optional) */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="contact-phone"
                      className="text-[10px] uppercase tracking-[0.24em] font-medium text-neutral-600"
                    >
                      <span>Phone / WhatsApp</span>
                      <span className="text-neutral-400 text-[9px] font-normal lowercase tracking-normal ml-1">
                        (optional)
                      </span>
                    </label>
                  </div>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="e.g. +233 20 866 7252"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light py-1"
                  />
                </div>

                {/* 4. Project / Commission Type */}
                <div className="p-4 sm:p-5">
                  <label
                    htmlFor="contact-project-type"
                    className="text-[10px] uppercase tracking-[0.24em] font-medium text-neutral-600 block mb-2"
                  >
                    Project / Campaign Scope
                  </label>
                  <select
                    id="contact-project-type"
                    name="projectType"
                    value={formData.projectType}
                    onChange={(e) => handleChange('projectType', e.target.value)}
                    className="w-full text-xs sm:text-sm text-neutral-900 bg-transparent focus:outline-none font-light cursor-pointer py-1"
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Message / Brief Textarea Control */}
                <div className={`p-4 sm:p-5 transition-colors ${errors.message ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="contact-message"
                      className="text-[10px] uppercase tracking-[0.24em] font-medium text-neutral-600 flex items-center gap-1"
                    >
                      <span>Project Brief & Message</span>
                      <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    </label>
                    {errors.message ? (
                      <span id="message-error" className="text-[11px] text-rose-600 font-normal">
                        {errors.message}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400">
                        {formData.message.length} chars
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={messageInputRef}
                    id="contact-message"
                    name="message"
                    rows={6}
                    required
                    placeholder="Please share timing, campaign deliverables, references, or specific questions..."
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    aria-required="true"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className={`w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none font-light py-1 resize-y min-h-[140px] leading-relaxed transition-colors ${
                      errors.message ? 'text-rose-950 placeholder:text-rose-300' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Form Action & Direct Booking Links */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3 border border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Brief...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1.5 font-light">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    Sent to: <span className="font-mono text-neutral-800">{destinationEmail}</span>
                  </span>

                  {STUDIO_INFO.booking && (
                    <>
                      <span className="text-neutral-300">•</span>
                      <a
                        href={STUDIO_INFO.booking}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-neutral-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-black transition-colors"
                      >
                        Calendar Booking ↗
                      </a>
                    </>
                  )}
                </div>
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
