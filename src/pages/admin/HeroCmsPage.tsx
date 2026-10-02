import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Upload,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  useHeroSettings,
  useUpdateHeroSettings,
} from '../../hooks/usePortfolioQueries';
import {
  HeroSettings,
  DEFAULT_HERO_SETTINGS,
} from '../../services/siteSettingsService';
import { StorageService } from '../../services/storageService';
import { useToast } from '../../context/AdminUIContext';

export const HeroCmsPage: React.FC = () => {
  const toast = useToast();
  const { data: heroSettings, isLoading } = useHeroSettings();
  const updateMutation = useUpdateHeroSettings();

  const [formData, setFormData] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (heroSettings) {
      setFormData({
        ...DEFAULT_HERO_SETTINGS,
        ...heroSettings,
      });
    }
  }, [heroSettings]);

  const handleFileUpload = async (
    file: File,
    field: 'mediaUrl' | 'mobileMediaUrl' | 'fallbackPosterUrl',
    setLoading: (val: boolean) => void
  ) => {
    try {
      setLoading(true);
      const isVideo = file.type.startsWith('video/');
      const res = await StorageService.uploadMedia({
        file,
        destinationPath: 'hero/',
      });
      const uploadedUrl = res.url;

      setFormData((prev) => {
        const next = { ...prev, [field]: uploadedUrl };
        if (field === 'mediaUrl') {
          next.mediaType = isVideo ? 'video' : 'image';
        }
        return next;
      });

      toast.success(
        `${isVideo ? 'Video' : 'Image'} uploaded successfully and set to hero!`,
        'MEDIA UPLOADED'
      );
    } catch (err: any) {
      console.error('Hero file upload error:', err);
      toast.error(err.message || 'Failed to upload media file', 'UPLOAD ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      toast.success(
        'Hero section settings updated and live across the site.',
        'HERO UPDATED'
      );
    } catch (err: any) {
      console.error('Failed to update hero settings:', err);
      toast.error(err.message || 'Failed to update hero settings', 'SAVE ERROR');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset hero settings to default configuration?')) {
      setFormData(DEFAULT_HERO_SETTINGS);
    }
  };

  const currentMediaUrl =
    previewMode === 'mobile' && formData.mobileMediaUrl
      ? formData.mobileMediaUrl
      : formData.mediaUrl;

  const isVideoFormat =
    formData.mediaType === 'video' ||
    (currentMediaUrl && (currentMediaUrl.endsWith('.mp4') || currentMediaUrl.endsWith('.webm')));

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-neutral-400">
        Loading hero section configuration...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-neutral-900 text-white rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-neutral-950">
              Hero Section CMS
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 font-sans-clean">
            Customize the landing page background media with dynamic video or full-bleed image.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Media Format Choice */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              1. Cover Media Format
            </h2>
            <p className="text-xs text-neutral-500">
              Select whether you want the hero background to be a high-definition video or a full-bleed photograph.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  formData.mediaType === 'video'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 font-medium ring-1 ring-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={formData.mediaType === 'video'}
                  onChange={() => setFormData((prev) => ({ ...prev, mediaType: 'video' }))}
                  className="sr-only"
                />
                <Video className="w-4 h-4 text-neutral-900" />
                <div className="text-left">
                  <div className="text-xs">Background Video</div>
                  <div className="text-[10px] text-neutral-400">Autoplay, looping &amp; muted</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  formData.mediaType === 'image'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 font-medium ring-1 ring-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={formData.mediaType === 'image'}
                  onChange={() => setFormData((prev) => ({ ...prev, mediaType: 'image' }))}
                  className="sr-only"
                />
                <ImageIcon className="w-4 h-4 text-neutral-900" />
                <div className="text-left">
                  <div className="text-xs">Full-Bleed Image</div>
                  <div className="text-[10px] text-neutral-400">Responsive viewport fill</div>
                </div>
              </label>
            </div>
          </div>

          {/* Primary Media (Desktop / General) */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              2. Main Hero Media (Desktop &amp; General)
            </h2>
            <p className="text-xs text-neutral-500">
              Upload a video (MP4, WebM) or high-resolution photograph (JPEG, PNG, WebP) for the hero cover.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.mediaUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                  }
                  placeholder="https://... or /videos/hero-desktop.mp4"
                  className="flex-1 px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingDesktop ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    disabled={isUploadingDesktop}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'mediaUrl', setIsUploadingDesktop);
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Supports direct video upload (.mp4) and photography (.jpg, .webp).
              </p>
            </div>
          </div>

          {/* Mobile Media (Optional Portrait Aspect Ratio) */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                3. Mobile Viewport Media (Optional)
              </h2>
              <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                9:16 Portrait Optimized
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Provide a dedicated vertical portrait asset for mobile smartphones so it fits perfectly without zooming. If left blank, the main media will scale to cover the mobile viewport.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.mobileMediaUrl || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mobileMediaUrl: e.target.value }))
                  }
                  placeholder="Optional vertical video or portrait photo for mobile..."
                  className="flex-1 px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingMobile ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    disabled={isUploadingMobile}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'mobileMediaUrl', setIsUploadingMobile);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Video Poster Fallback Image */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              4. Fallback Image (Poster)
            </h2>
            <p className="text-xs text-neutral-500">
              Displayed immediately while video is loading or if the visitor&apos;s device has low power mode / autoplay restrictions enabled.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fallbackPosterUrl || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fallbackPosterUrl: e.target.value }))
                  }
                  placeholder="Fallback photo URL..."
                  className="flex-1 px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPoster ? 'Uploading...' : 'Upload Poster'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingPoster}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'fallbackPosterUrl', setIsUploadingPoster);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Dark Overlay & Scroll Indicator */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              5. Overlay &amp; Indicator
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs text-neutral-700 mb-1.5">
                  <span>Dark Ambient Tint Opacity</span>
                  <span className="font-mono font-medium">
                    {Math.round((formData.overlayOpacity ?? 0.2) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={formData.overlayOpacity ?? 0.2}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      overlayOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-700 mb-1.5">
                  Scroll Indicator Text
                </label>
                <input
                  type="text"
                  value={formData.scrollText || 'SCROLL'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scrollText: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Right Preview Column */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-neutral-900">
                  Live Viewport Preview
                </span>
              </div>

              {/* Viewport switch: Desktop vs Mobile */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                    previewMode === 'desktop'
                      ? 'bg-white text-neutral-950 font-medium shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                    previewMode === 'mobile'
                      ? 'bg-white text-neutral-950 font-medium shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Mobile</span>
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div
              className={`mx-auto bg-neutral-950 relative overflow-hidden transition-all duration-300 rounded-xl border border-neutral-800 shadow-xl ${
                previewMode === 'desktop'
                  ? 'w-full aspect-16/10'
                  : 'w-[240px] aspect-9/16'
              }`}
            >
              {/* Media rendering */}
              {isVideoFormat && currentMediaUrl ? (
                <video
                  key={currentMediaUrl}
                  src={currentMediaUrl}
                  poster={formData.fallbackPosterUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : currentMediaUrl ? (
                <img
                  src={currentMediaUrl}
                  alt="Hero Preview"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 text-xs font-mono p-4 text-center">
                  <AlertCircle className="w-6 h-6 mb-2 text-neutral-500" />
                  No hero media configured
                </div>
              )}

              {/* Tint overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${formData.overlayOpacity ?? 0.2})`,
                }}
              />

              {/* Top Simulated Navbar: Gideon Boadu on top left, logo center, links right */}
              <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between pointer-events-none z-10">
                <div className="flex flex-col items-start leading-none text-white drop-shadow-md">
                  <span className="text-[10px] font-serif font-light">Gideon Boadu</span>
                  <span className="text-[6px] uppercase tracking-[0.2em] text-white/70 font-mono mt-0.5">
                    Photographer
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-[7px] text-white font-bold mix-blend-difference">
                  D
                </div>
                <div className="text-[7px] uppercase tracking-wider text-white/70 font-mono">
                  {previewMode === 'desktop' ? 'Works · About' : '☰'}
                </div>
              </div>

              {/* Bottom scroll indicator */}
              <div className="absolute bottom-2 inset-x-0 flex flex-col items-center pointer-events-none z-10">
                <span className="text-[7px] uppercase tracking-[0.3em] font-mono text-white/80">
                  {formData.scrollText || 'SCROLL'}
                </span>
                <div className="w-[1px] h-3 bg-white/40 mt-1" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Full-viewport bleed with zero black letterbox bars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCmsPage;
