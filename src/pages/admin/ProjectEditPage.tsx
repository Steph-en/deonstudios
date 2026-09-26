import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
  Check,
  Eye,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Globe,
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { projectSchema, ProjectFormData } from '../../lib/validation';
import { slugify } from '../../lib/utils';
import {
  useProject,
  useCategories,
  useProjectMutations,
  useProjectMedia,
  useProjectSections,
} from '../../hooks/usePortfolioQueries';
import { MediaUploader } from '../../components/forms/MediaUploader';
import { GalleryManager } from '../../components/forms/GalleryManager';
import { CaseStudyBuilder } from '../../components/forms/CaseStudyBuilder';
import { MediaService } from '../../features/media/services/mediaService';
import { SectionService } from '../../features/projects/services/sectionService';
import { DbProject, DbProjectMedia, DbProjectSection, ProjectStatus } from '../../types/database';
import { useConfirm, useToast } from '../../context/AdminUIContext';

interface ProjectEditPageProps {
  projectId: string | null; // null means 'new'
  onBack: () => void;
  onViewPublicProject: (slug: string) => void;
}

type TabType = 'details' | 'media' | 'gallery' | 'case_study' | 'seo';

export const ProjectEditPage: React.FC<ProjectEditPageProps> = ({
  projectId,
  onBack,
  onViewPublicProject,
}) => {
  const isNew = !projectId || projectId === 'new';
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: existingProject, isLoading: isProjectLoading } = useProject(projectId);
  const { data: categories } = useCategories();
  const { createProject, updateProject, deleteProject } = useProjectMutations();

  // Media state
  const [galleryItems, setGalleryItems] = useState<DbProjectMedia[]>([]);
  // Case study sections state
  const [sections, setSections] = useState<DbProjectSection[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      slug: '',
      category_id: null,
      client: '',
      year: new Date().getFullYear().toString(),
      role: 'Lead Photographer & Creative Director',
      description: '',
      long_description: '',
      status: 'draft',
      featured: false,
      preview_image: '/assets/gideon_boadi_portrait.png',
      preview_video: null,
      hero_image: '/assets/gideon_boadi_portrait.png',
      hero_video: null,
      og_image: null,
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
    },
  });

  const currentTitle = watch('title');
  const currentSlug = watch('slug');
  const currentStatus = watch('status');
  const isFeatured = watch('featured');
  const previewImage = watch('preview_image');
  const heroImage = watch('hero_image');
  const previewVideo = watch('preview_video');
  const heroVideo = watch('hero_video');
  const ogImage = watch('og_image');

  // Populate form if editing existing project
  useEffect(() => {
    if (existingProject) {
      reset({
        title: existingProject.title,
        slug: existingProject.slug,
        category_id: existingProject.category_id || null,
        client: existingProject.client || '',
        year: existingProject.year || '2025',
        role: existingProject.role || '',
        description: existingProject.description,
        long_description: existingProject.long_description || '',
        status: existingProject.status,
        featured: existingProject.featured,
        preview_image: existingProject.preview_image,
        preview_video: existingProject.preview_video,
        hero_image: existingProject.hero_image,
        hero_video: existingProject.hero_video,
        og_image: existingProject.og_image,
        seo_title: existingProject.seo_title || '',
        seo_description: existingProject.seo_description || '',
        seo_keywords: existingProject.seo_keywords || '',
      });

      if (existingProject.media) {
        setGalleryItems(existingProject.media);
      }
      if (existingProject.sections) {
        setSections(existingProject.sections);
      }
    }
  }, [existingProject, reset]);

  // Auto-generate slug from title for new projects
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('title', e.target.value);
    if (isNew) {
      setValue('slug', slugify(e.target.value));
    }
  };

  const toast = useToast();
  const { confirm } = useConfirm();

  const onSubmit = async (data: ProjectFormData) => {
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      if (isNew) {
        const created = await createProject.mutateAsync(data);
        setSaveSuccess(true);
        toast.success(`Project "${data.title}" created successfully.`, 'PROJECT CREATED');
        setTimeout(() => setSaveSuccess(false), 3000);
        if (created?.id) {
          onBack();
        }
      } else if (projectId) {
        await updateProject.mutateAsync({
          id: projectId,
          updates: data,
        });
        setSaveSuccess(true);
        toast.success(`Project "${data.title}" saved successfully.`, 'CHANGES SAVED');
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error saving project:', err);
      const errText = err.message || 'Unable to save project. Please check your inputs.';
      setErrorMessage(errText);
      toast.error(errText, 'SAVE FAILED');
    }
  };

  // Gallery handlers
  const handleAddGalleryItem = async (item: Partial<DbProjectMedia>) => {
    if (!projectId && isNew) {
      toast.warning('Please save the initial project details before uploading gallery assets.', 'INITIAL SAVE REQUIRED');
      return;
    }
    try {
      const added = await MediaService.addMedia({
        project_id: projectId!,
        media_type: item.media_type || 'image',
        storage_path: item.storage_path!,
        media_url: item.media_url!,
        file_name: item.file_name,
        file_size: item.file_size,
        mime_type: item.mime_type,
        width: item.width,
        height: item.height,
        alt_text: item.alt_text,
        display_order: galleryItems.length + 1,
      });
      setGalleryItems((prev) => [...prev, added]);
      toast.success('Gallery media asset added.', 'MEDIA ADDED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add media asset', 'UPLOAD ERROR');
    }
  };

  const handleDeleteGalleryItem = async (id: string, storagePath: string) => {
    const ok = await confirm({
      title: 'DELETE GALLERY IMAGE',
      subtitle: 'CONFIRMATION REQUIRED',
      message: 'Are you sure you want to permanently delete this media asset from the project gallery?',
      confirmText: 'DELETE IMAGE',
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        const itemToDelete = galleryItems.find((i) => i.id === id);
        await MediaService.deleteMedia(id, storagePath, itemToDelete?.media_url);
        setGalleryItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('Gallery media item was deleted.', 'MEDIA REMOVED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete media', 'DELETE ERROR');
      }
    }
  };

  const handleUpdateGalleryAlt = async (id: string, alt: string) => {
    try {
      await MediaService.updateMedia(id, { alt_text: alt });
      setGalleryItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, alt_text: alt } : i))
      );
      toast.info('Alt description updated.', 'CAPTION SAVED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update alt text', 'UPDATE ERROR');
    }
  };

  const handleReorderGallery = async (newOrder: DbProjectMedia[]) => {
    setGalleryItems(newOrder);
    try {
      await MediaService.reorderMedia(
        newOrder.map((item, idx) => ({ id: item.id, display_order: idx + 1 }))
      );
    } catch (err: any) {
      console.error('Failed to persist gallery reordering:', err);
    }
  };

  // Case Study Sections handlers
  const handleAddSection = async (sec: Partial<DbProjectSection>) => {
    if (!projectId && isNew) {
      toast.warning('Please save the initial project details before adding case study sections.', 'INITIAL SAVE REQUIRED');
      return;
    }
    try {
      const added = await SectionService.addSection({
        project_id: projectId!,
        section_type: sec.section_type || 'overview',
        title: sec.title,
        content: sec.content,
        media_url: sec.media_url,
        display_order: sections.length + 1,
      });
      setSections((prev) => [...prev, added]);
      toast.success('Case study section added.', 'SECTION ADDED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add section', 'ERROR');
    }
  };

  const handleDeleteSection = async (id: string) => {
    const ok = await confirm({
      title: 'DELETE SECTION',
      subtitle: 'CONFIRMATION REQUIRED',
      message: 'Are you sure you want to remove this narrative section from the case study?',
      confirmText: 'DELETE SECTION',
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        await SectionService.deleteSection(id);
        setSections((prev) => prev.filter((s) => s.id !== id));
        toast.success('Case study section removed.', 'SECTION REMOVED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete section', 'ERROR');
      }
    }
  };

  const handleUpdateSection = async (id: string, updates: Partial<DbProjectSection>) => {
    try {
      await SectionService.updateSection(id, updates);
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      toast.info('Case study section saved.', 'SECTION UPDATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update section', 'UPDATE ERROR');
    }
  };

  const handleReorderSections = async (newOrder: DbProjectSection[]) => {
    setSections(newOrder);
    try {
      await SectionService.reorderSections(
        newOrder.map((s, idx) => ({ id: s.id, display_order: idx + 1 }))
      );
    } catch (err: any) {
      console.error('Failed to persist section reordering:', err);
    }
  };

  if (!isNew && isProjectLoading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-neutral-400">
        Loading project...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-neutral-950 font-normal truncate max-w-md">
              {isNew ? 'Create New Project' : currentTitle || 'Edit Project'}
            </h1>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Slug: /{currentSlug || 'untitled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && currentSlug && (
            <button
              type="button"
              onClick={() => onViewPublicProject(currentSlug)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Public
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Project
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          1. Basic Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === 'media'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          2. Hero & Previews
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          3. Gallery ({galleryItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('case_study')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === 'case_study'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          4. Case Study ({sections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === 'seo'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          5. SEO & OpenGraph
        </button>
      </div>

      {/* TAB 1: BASIC DETAILS */}
      {activeTab === 'details' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Project Title *
              </label>
              <input
                type="text"
                {...register('title')}
                onChange={handleTitleChange}
                placeholder="e.g. Helmet of Heritage"
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                {...register('slug')}
                placeholder="e.g. helmet-of-heritage"
                className="w-full text-sm font-mono px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
              {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                {...register('category_id')}
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-medium"
              >
                <option value="">Select a category...</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Client / Publication
              </label>
              <input
                type="text"
                {...register('client')}
                placeholder="e.g. Guzangs Magazine / Vlisco"
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Production Year
              </label>
              <input
                type="text"
                {...register('year')}
                placeholder="2025"
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Role / Creative Scope
              </label>
              <input
                type="text"
                {...register('role')}
                placeholder="e.g. Lead Photographer & Creative Director"
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Short Summary Description *
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Concise overview of the photoshoot concept, casting, and aesthetic..."
              className="w-full text-sm p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Extended Narrative / Long Description
            </label>
            <textarea
              rows={4}
              {...register('long_description')}
              placeholder="In-depth studio notes, lighting decisions, cultural references, and post-production notes..."
              className="w-full text-sm p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>

          {/* Status & Featured */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Publication Status:
              </label>
              <select
                {...register('status')}
                className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:border-neutral-900"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Public)</option>
                <option value="archived">Archived (Unlisted)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
              <input
                type="checkbox"
                {...register('featured')}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-0 cursor-pointer"
              />
              Mark as Featured on Homepage Hero & Top Grid
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: HERO & PREVIEWS */}
      {activeTab === 'media' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              Hero & Preview Media
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              High-resolution photography and video assets for hero presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaUploader
              label="Preview Thumbnail Image"
              description="Displayed in portfolio brick walls and project cards"
              accept="image"
              currentUrl={previewImage}
              projectId={projectId || 'temp'}
              folder="preview"
              onUploadComplete={(res) => setValue('preview_image', res.url, { shouldDirty: true })}
              onRemove={() => setValue('preview_image', null, { shouldDirty: true })}
            />

            <MediaUploader
              label="Hero Cover Image"
              description="Primary banner on project detail page header"
              accept="image"
              currentUrl={heroImage}
              projectId={projectId || 'temp'}
              folder="hero"
              onUploadComplete={(res) => setValue('hero_image', res.url, { shouldDirty: true })}
              onRemove={() => setValue('hero_image', null, { shouldDirty: true })}
            />

            <MediaUploader
              label="Hero Background Video (Optional)"
              description="Auto-playing looping hero background video (MP4/WebM)"
              accept="video"
              currentUrl={heroVideo}
              projectId={projectId || 'temp'}
              folder="videos"
              onUploadComplete={(res) => setValue('hero_video', res.url, { shouldDirty: true })}
              onRemove={() => setValue('hero_video', null, { shouldDirty: true })}
            />

            <MediaUploader
              label="Preview Video Clip (Optional)"
              description="Short video teaser for hover preview"
              accept="video"
              currentUrl={previewVideo}
              projectId={projectId || 'temp'}
              folder="videos"
              onUploadComplete={(res) => setValue('preview_video', res.url, { shouldDirty: true })}
              onRemove={() => setValue('preview_video', null, { shouldDirty: true })}
            />
          </div>
        </div>
      )}

      {/* TAB 3: GALLERY (DND-KIT) */}
      {activeTab === 'gallery' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <GalleryManager
            projectId={projectId || 'new'}
            items={galleryItems}
            onItemsChange={handleReorderGallery}
            onAddItem={handleAddGalleryItem}
            onDeleteItem={handleDeleteGalleryItem}
            onUpdateAlt={handleUpdateGalleryAlt}
          />
        </div>
      )}

      {/* TAB 4: CASE STUDY BUILDER */}
      {activeTab === 'case_study' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <CaseStudyBuilder
            projectId={projectId || 'new'}
            sections={sections}
            onSectionsChange={handleReorderSections}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onUpdateSection={handleUpdateSection}
          />
        </div>
      )}

      {/* TAB 5: SEO & OPENGRAPH */}
      {activeTab === 'seo' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              Search Engine Optimization (SEO) & Social Graph
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Controls meta tags, Twitter summary card, and OpenGraph preview for Google and social crawlers.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                SEO Meta Title
              </label>
              <input
                type="text"
                {...register('seo_title')}
                placeholder={`${currentTitle || 'Project'} — ${watch('client') || 'Client'} | Deon Studios`}
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                SEO Meta Description
              </label>
              <textarea
                rows={3}
                {...register('seo_description')}
                placeholder="Official editorial fashion campaign photography by Gideon Boadi, founder of Deon Studios..."
                className="w-full text-sm p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                SEO Keywords (Comma Separated)
              </label>
              <input
                type="text"
                {...register('seo_keywords')}
                placeholder="Gideon Boadi, Deon Studios, African Fashion, Editorial, High Fashion, Accra"
                className="w-full text-sm px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <MediaUploader
                label="Custom OpenGraph Social Card Image (1200x630px recommended)"
                description="Overrides default preview image when sharing project URL on WhatsApp, iMessage, Twitter, and LinkedIn"
                accept="image"
                currentUrl={ogImage}
                projectId={projectId || 'temp'}
                folder="og"
                onUploadComplete={(res) => setValue('og_image', res.url, { shouldDirty: true })}
                onRemove={() => setValue('og_image', null, { shouldDirty: true })}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
