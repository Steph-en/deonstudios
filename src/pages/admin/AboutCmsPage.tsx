import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Upload,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Users,
  Share2,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  useAboutSettings,
  useUpdateAboutSettings,
} from '../../hooks/usePortfolioQueries';
import {
  AboutSettings,
  DEFAULT_ABOUT_SETTINGS,
} from '../../services/siteSettingsService';
import { StorageService } from '../../services/storageService';
import { useToast } from '../../context/AdminUIContext';

export const AboutCmsPage: React.FC = () => {
  const toast = useToast();
  const { data: aboutSettings, isLoading } = useAboutSettings();
  const updateMutation = useUpdateAboutSettings();

  const [formData, setFormData] = useState<AboutSettings>(DEFAULT_ABOUT_SETTINGS);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  useEffect(() => {
    if (aboutSettings) {
      setFormData({
        ...DEFAULT_ABOUT_SETTINGS,
        ...aboutSettings,
      });
    }
  }, [aboutSettings]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploadingMedia(true);
      const isVideo = file.type.startsWith('video/');
      const res = await StorageService.uploadMedia({
        file,
        destinationPath: 'about/',
      });
      const uploadedUrl = res.url;

      setFormData((prev) => ({
        ...prev,
        mediaUrl: uploadedUrl,
        mediaType: isVideo ? 'video' : 'image',
      }));

      toast.success(
        `${isVideo ? 'Video' : 'Portrait'} uploaded successfully!`,
        'ABOUT MEDIA UPLOADED'
      );
    } catch (err: any) {
      console.error('About file upload error:', err);
      toast.error(err.message || 'Failed to upload media file', 'UPLOAD ERROR');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      toast.success(
        'About section configuration updated and live.',
        'ABOUT UPDATED'
      );
    } catch (err: any) {
      console.error('Failed to update about settings:', err);
      toast.error(err.message || 'Failed to update about settings', 'SAVE ERROR');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset about settings to standard studio information?')) {
      setFormData(DEFAULT_ABOUT_SETTINGS);
    }
  };

  // Bio paragraphs handling
  const handleParagraphChange = (index: number, val: string) => {
    setFormData((prev) => {
      const next = [...prev.bioParagraphs];
      next[index] = val;
      return { ...prev, bioParagraphs: next };
    });
  };

  const handleAddParagraph = () => {
    setFormData((prev) => ({
      ...prev,
      bioParagraphs: [...prev.bioParagraphs, ''],
    }));
  };

  const handleRemoveParagraph = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bioParagraphs: prev.bioParagraphs.filter((_, i) => i !== index),
    }));
  };

  // Social Links handling
  const handleAddSocial = () => {
    if (!newSocialName.trim() || !newSocialUrl.trim()) {
      toast.error('Please enter both platform name and URL', 'INVALID INPUT');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { name: newSocialName.trim(), url: newSocialUrl.trim() },
      ],
    }));
    setNewSocialName('');
    setNewSocialUrl('');
  };

  const handleRemoveSocial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSocialChange = (index: number, field: 'name' | 'url', val: string) => {
    setFormData((prev) => {
      const next = [...prev.socialLinks];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, socialLinks: next };
    });
  };

  // Client List handling
  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    setFormData((prev) => ({
      ...prev,
      clients: [...prev.clients, newClientName.trim()],
    }));
    setNewClientName('');
  };

  const handleRemoveClient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }));
  };

  const isVideo =
    formData.mediaType === 'video' ||
    (formData.mediaUrl &&
      (formData.mediaUrl.endsWith('.mp4') || formData.mediaUrl.endsWith('.webm')));

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-neutral-400">
        Loading about section configuration...
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
              <UserCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-neutral-950">
              About Section CMS
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 font-sans-clean">
            Manage your artist portrait/video, biographical statements, bookings link, social channels, and client roster.
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
        {/* Main Configuration Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Section 1: Portrait / Video Media */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                1. About Media (Photo or Video)
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Upload an artist portrait photograph or loop video plate to feature on the left column of the About page.
            </p>

            {/* Media Type Switch */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${
                  formData.mediaType === 'image'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 font-medium'
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
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">Portrait Photograph</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${
                  formData.mediaType === 'video'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 font-medium'
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
                <Video className="w-4 h-4" />
                <span className="text-xs">Portrait Video Loop</span>
              </label>
            </div>

            {/* Media URL / Upload Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-700">
                Media File or URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.mediaUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                  }
                  placeholder="https://... or upload local file"
                  className="flex-1 px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingMedia ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    disabled={isUploadingMedia}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Photo Credit */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Photo / Video Credit
              </label>
              <input
                type="text"
                value={formData.mediaCredit || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mediaCredit: e.target.value }))
                }
                placeholder="Nana K. Boakye"
                className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
              />
              <p className="mt-1 text-[11px] text-neutral-400">
                Appears beneath the portrait as &quot;Photo by [Credit]&quot;.
              </p>
            </div>
          </div>

          {/* Section 2: Headline & Title */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                2. Identity &amp; Title
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Artist Full Name
                </label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, artistName: e.target.value }))
                  }
                  placeholder="Gideon Boadu"
                  className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Navbar Role Tag
                </label>
                <input
                  type="text"
                  value={formData.roleTagline || 'Photographer'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, roleTagline: e.target.value }))
                  }
                  placeholder="Photographer"
                  className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Full Headline / Studio Title
              </label>
              <input
                type="text"
                value={formData.artistTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, artistTitle: e.target.value }))
                }
                placeholder="Photographer · Visual Storyteller · Founder of Deon Studios"
                className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
              />
            </div>
          </div>

          {/* Section 3: Biography Narrative */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-700" />
                <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                  3. Biography &amp; Studio Philosophy
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddParagraph}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-md transition"
              >
                <Plus className="w-3 h-3" />
                Add Paragraph
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Each block represents an editorial paragraph rendered on the About page narrative.
            </p>

            <div className="space-y-3">
              {formData.bioParagraphs.map((para, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 mt-2 shrink-0 w-5">
                      P{idx + 1}
                    </span>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => handleParagraphChange(idx, e.target.value)}
                      placeholder="Write editorial paragraph..."
                      className="flex-1 p-2.5 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-sans-clean leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParagraph(idx)}
                      disabled={formData.bioParagraphs.length <= 1}
                      title="Remove paragraph"
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition disabled:opacity-30 cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Social Channels */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                4. Social Media Links
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Add or remove social media links displayed on the About page.
            </p>

            <div className="space-y-2.5">
              {formData.socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => handleSocialChange(idx, 'name', e.target.value)}
                    placeholder="Platform (e.g. Instagram)"
                    className="w-1/3 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg font-mono focus:ring-1 focus:ring-neutral-950"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg font-mono focus:ring-1 focus:ring-neutral-950"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(idx)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new social link */}
            <div className="pt-2 border-t border-neutral-100 flex gap-2">
              <input
                type="text"
                value={newSocialName}
                onChange={(e) => setNewSocialName(e.target.value)}
                placeholder="New platform name (e.g. X, Behance)"
                className="w-1/3 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg font-mono"
              />
              <input
                type="text"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg font-mono"
              />
              <button
                type="button"
                onClick={handleAddSocial}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>
          </div>

          {/* Section 5: Bookings & Inquiries */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                5. Bookings &amp; General Inquiries
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Section Header Label
                </label>
                <input
                  type="text"
                  value={formData.bookingLabel || 'Bookings & General Inquiries'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bookingLabel: e.target.value }))
                  }
                  placeholder="Bookings & General Inquiries"
                  className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Inquiry / Booking Link URL
                </label>
                <input
                  type="text"
                  value={formData.bookingUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bookingUrl: e.target.value }))
                  }
                  placeholder="https://deon-studios.easyweek.de/"
                  className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-950 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Select Clients Roster */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                6. Select Clients Roster
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Add brands, magazines, and commercial clients featured in the Select Clients section.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {formData.clients.map((client, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800"
                >
                  <span>{client}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClient(idx)}
                    className="text-neutral-400 hover:text-red-600 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddClient();
                  }
                }}
                placeholder="Add brand name (e.g. Vogue, Nike, Cartier)..."
                className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg font-mono"
              />
              <button
                type="button"
                onClick={handleAddClient}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Client
              </button>
            </div>
          </div>
        </form>

        {/* Right Live Preview Column */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-neutral-900 pb-2 border-b border-neutral-100">
              Live About Page Preview
            </h3>

            {/* Media representation */}
            <div className="border border-neutral-900/80 bg-neutral-100 aspect-3/4 max-h-[320px] overflow-hidden relative">
              {isVideo && formData.mediaUrl ? (
                <video
                  src={formData.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover grayscale contrast-105"
                />
              ) : formData.mediaUrl ? (
                <img
                  src={formData.mediaUrl}
                  alt={formData.artistName}
                  className="w-full h-full object-cover grayscale contrast-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-xs text-neutral-400">
                  No Portrait
                </div>
              )}
            </div>
            {formData.mediaCredit && (
              <p className="text-[10px] text-neutral-500 font-mono">
                Photo by <span className="underline">{formData.mediaCredit}</span>
              </p>
            )}

            {/* Typography */}
            <div className="border-t border-neutral-200 pt-3">
              <h4 className="font-display text-lg uppercase tracking-tight text-neutral-950 font-normal">
                {formData.artistName}
              </h4>
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-medium mt-0.5">
                {formData.artistTitle}
              </p>
            </div>

            {/* Sample Bio Paragraph */}
            {formData.bioParagraphs[0] && (
              <p className="text-xs text-neutral-700 font-light leading-relaxed line-clamp-3">
                {formData.bioParagraphs[0]}
              </p>
            )}

            {/* Social links sample */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] uppercase tracking-wider font-medium text-neutral-900 pt-2 border-t border-neutral-100">
              {formData.socialLinks.map((s, idx) => (
                <span key={idx} className="underline underline-offset-2">
                  {s.name}
                </span>
              ))}
            </div>

            {/* Bookings */}
            <div className="pt-2 border-t border-neutral-100">
              <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-900 block mb-0.5">
                {formData.bookingLabel || 'Bookings & General Inquiries'}
              </span>
              <span className="text-[10px] text-neutral-600 underline break-all font-mono">
                {formData.bookingUrl}
              </span>
            </div>

            {/* Client tags preview */}
            <div className="pt-2 text-[10px] text-neutral-600 leading-relaxed border-t border-neutral-100">
              <span className="font-medium text-neutral-900">Select Clients: </span>
              {formData.clients.join(' | ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutCmsPage;
