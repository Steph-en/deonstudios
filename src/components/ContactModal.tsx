import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { STUDIO_INFO } from '../data/portfolioData';
import { ThemeMode } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

interface FormValues {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  const [formData, setFormData] = useState<FormValues>({
    name: '',
    email: '',
    projectType: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const destinationEmail = STUDIO_INFO.email || 'studio@gideonboadi.com';

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

  const validateField = (field: keyof FormValues, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Please enter your full name.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address.';
        }
        return undefined;
      case 'message':
        if (!value.trim()) return 'Please provide your message or project brief.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAll = (): FormErrors => {
    const errs: FormErrors = {};
    const n = validateField('name', formData.name);
    if (n) errs.name = n;
    const e = validateField('email', formData.email);
    if (e) errs.email = e;
    const m = validateField('message', formData.message);
    if (m) errs.message = m;
    return errs;
  };

  const handleBlur = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);
    if (submitAttempted || touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    const valErrors = validateAll();
    setErrors(valErrors);
    setTouched({ name: true, email: true, message: true });

    if (Object.keys(valErrors).length > 0) {
      if (valErrors.name) nameRef.current?.focus();
      else if (valErrors.email) emailRef.current?.focus();
      else if (valErrors.message) messageRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          projectType: formData.projectType || 'Studio Inquiry',
          message: formData.message,
          destinationEmail,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors);
        throw new Error(data?.error || `Unable to send to ${destinationEmail}.`);
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Contact modal submit error:', err);
      setServerError(err.message || 'Transmission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="contact-slideover-panel"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        aria-label="Dismiss contact panel"
        className={`fixed inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-Over Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 h-full w-full sm:w-[500px] md:w-[560px] lg:w-[46%] xl:w-[40%] max-w-2xl bg-[#fafafa] text-neutral-900 border-l border-neutral-200 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto transition-transform duration-500 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header: CONTACT Label with extending line + square X button */}
        <div className="flex items-center justify-between gap-4 pt-8 sm:pt-10 px-6 sm:px-12">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-500 font-medium whitespace-nowrap">
              Contact & Inquiries
            </span>
            <div className="h-[1px] bg-neutral-200 flex-1 max-w-md" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact drawer"
            className="p-2 sm:p-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-950 hover:border-neutral-400 transition-colors cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Title & Direct Booking URL */}
          <div className="pt-8 sm:pt-10 pb-6 sm:pb-8 px-6 sm:px-12">
            <h2 className="font-display text-[16px] sm:text-[28px] md:text-[32px] font-medium uppercase tracking-tight text-neutral-950 leading-[1.15]">
              Let's make{' '}
              <span className="font-editorial italic font-normal tracking-wide text-neutral-500">
                something
              </span>{' '}
              great.
            </h2>

            <div className="mt-6 sm:mt-8">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium mb-1.5">
                Direct Studio Destination
              </span>
              <a
                href={`mailto:${destinationEmail}`}
                className="text-[12px] sm:text-[14px] md:text-[14px] text-neutral-950 hover:text-neutral-600 transition-colors font-sans-clean font-medium tracking-wide underline underline-offset-4"
              >
                {destinationEmail}
              </a>
            </div>
          </div>

          {/* Form / Submission State */}
          {submitted ? (
            <div className="px-6 sm:px-12 py-12 flex flex-col items-start gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <h3 className="font-display text-2xl uppercase tracking-tight text-neutral-950">
                Message Dispatched
              </h3>
              <p className="text-sm font-light text-neutral-600 max-w-md">
                Thank you, <strong className="font-medium text-neutral-900">{formData.name}</strong>. Your project brief has been sent to <strong>{destinationEmail}</strong>. Gideon Boadi and our studio will review and reply within 24–48 hours.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', projectType: '', message: '' });
                    setSubmitAttempted(false);
                    setErrors({});
                  }}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 hover:border-neutral-900 text-xs uppercase tracking-[0.16em] text-neutral-900 transition-colors cursor-pointer bg-white"
                >
                  Send Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="px-6 sm:px-12 pb-10 flex flex-col gap-6 sm:gap-7 flex-1">
              {/* Alert banner if invalid fields */}
              {submitAttempted && Object.keys(errors).length > 0 && (
                <div className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Please fill out all required sections marked below.</span>
                </div>
              )}

              {serverError && (
                <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Full Name & Email Address Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
                      Full Name *
                    </label>
                    {errors.name && (
                      <span className="text-[10px] text-rose-600 font-normal">{errors.name}</span>
                    )}
                  </div>
                  <input
                    ref={nameRef}
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`w-full bg-transparent border-b py-2 text-sm text-neutral-900 outline-none transition-colors ${
                      errors.name ? 'border-rose-500' : 'border-neutral-300 focus:border-neutral-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
                      Email Address *
                    </label>
                    {errors.email && (
                      <span className="text-[10px] text-rose-600 font-normal">{errors.email}</span>
                    )}
                  </div>
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`w-full bg-transparent border-b py-2 text-sm text-neutral-900 outline-none transition-colors ${
                      errors.email ? 'border-rose-500' : 'border-neutral-300 focus:border-neutral-950'
                    }`}
                  />
                </div>
              </div>

              {/* Type of Project */}
              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-[0.25em] text-amber-700 font-medium mb-1">
                  Type of Project
                </label>
                <input
                  type="text"
                  placeholder="e.g. Editorial Fashion, Lookbook, Advertising"
                  value={formData.projectType}
                  onChange={(e) => handleChange('projectType', e.target.value)}
                  className="w-full bg-transparent border-b border-neutral-300 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950 transition-colors"
                />
              </div>

              {/* Tell Me About Your Project */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
                    Project Brief & Message *
                  </label>
                  {errors.message && (
                    <span className="text-[10px] text-rose-600 font-normal">{errors.message}</span>
                  )}
                </div>
                <textarea
                  ref={messageRef}
                  rows={4}
                  required
                  placeholder="Tell Gideon about the concept, date, deliverables, or questions..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  className={`w-full bg-transparent border-b py-2 text-sm text-neutral-900 outline-none resize-none leading-relaxed transition-colors ${
                    errors.message ? 'border-rose-500' : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                />
              </div>

              {/* Bottom Row: Response Time Notice + Send Message Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Sent directly to {destinationEmail}
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 text-xs uppercase tracking-[0.22em] font-medium transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Transmitting...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
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
