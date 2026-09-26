import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbProject, ProjectWithDetails, ProjectStatus } from '../../../types/database';
import { PROJECTS as STATIC_PROJECTS } from '../../../data/portfolioData';
import { StorageService } from '../../../services/storageService';
import { isMediaDeleted, markMediaAsDeleted } from '../../../services/indexedDbStorage';
import { ApiClient } from '../../../lib/api';

// Local storage key for fallback/demo edits when Supabase is not yet populated
const LOCAL_PROJECTS_KEY = 'deon_cms_local_projects';
const LOCAL_PROJECTS_INITIALIZED = 'deon_cms_projects_initialized';

function getLocalProjects(): ProjectWithDetails[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    const initialized = localStorage.getItem(LOCAL_PROJECTS_INITIALIZED);

    // If already initialized, respect the stored state even if empty array
    if (initialized || raw !== null) {
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ({
            ...p,
            media: Array.isArray(p.media)
              ? p.media.filter((m: any) => !isMediaDeleted(m.id, m.media_url, m.file_name))
              : [],
          }));
        }
      }
      return [];
    }
  } catch {
    // fallback
  }

  // Convert static portfolio data into Supabase format as initial seed ONLY on first visit (3 representative samples)
  const initial: ProjectWithDetails[] = STATIC_PROJECTS.slice(0, 3).map((sp, idx) => ({
    id: sp.id || `proj-${idx + 1}`,
    title: sp.title,
    slug: sp.slug,
    category_id: null,
    client: sp.client,
    year: sp.year,
    role: sp.artDirector || 'Creative Director',
    description: sp.description,
    long_description: sp.description,
    status: 'published' as ProjectStatus,
    featured: idx < 3,
    preview_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
    preview_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
    hero_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
    hero_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
    og_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
    seo_title: `${sp.title} — ${sp.client} | Deon Studios`,
    seo_description: sp.description,
    seo_keywords: `Gideon Boadi, ${sp.client}, ${sp.category}, Photography`,
    published_at: new Date().toISOString(),
    created_at: new Date(Date.now() - idx * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    category: {
      id: 'cat-1',
      name: sp.category,
      slug: sp.category.toLowerCase(),
      description: null,
      color: '#d4d4d4',
      icon: 'folder',
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    media: (sp.images || []).map((img, imgIdx) => ({
      id: `media-${sp.slug}-${imgIdx}`,
      project_id: sp.id || `proj-${idx + 1}`,
      media_type: 'image' as const,
      storage_path: img.url,
      media_url: img.url,
      thumbnail_path: img.url,
      thumbnail_url: img.url,
      file_name: `${sp.slug}-${imgIdx}.jpg`,
      file_size: null,
      mime_type: 'image/jpeg',
      width: 1200,
      height: 1600,
      alt_text: img.caption || `${sp.title} Plate ${imgIdx + 1}`,
      display_order: imgIdx,
      created_at: new Date().toISOString(),
    })),
    sections: [
      {
        id: `sec-${sp.slug}-1`,
        project_id: sp.id || `proj-${idx + 1}`,
        section_type: 'overview' as const,
        title: 'Project Overview & Narrative',
        content: sp.description,
        media_url: sp.images?.[0]?.url || null,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    viewsCount: 420 + idx * 85,
  }));

  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(initial));
    localStorage.setItem(LOCAL_PROJECTS_INITIALIZED, 'true');
  } catch {
    // ignore
  }
  return initial;
}

function saveLocalProjects(projects: ProjectWithDetails[]) {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(LOCAL_PROJECTS_INITIALIZED, 'true');
  } catch {
    // ignore
  }
}

export class ProjectService {
  /**
   * Fetch projects with flexible filters
   */
  static async getProjects(options: {
    status?: ProjectStatus | 'all';
    categoryId?: string;
    search?: string;
    featured?: boolean;
    includeDeleted?: boolean;
  } = {}): Promise<ProjectWithDetails[]> {
    if (!isSupabaseConfigured()) {
      let list: ProjectWithDetails[] = [];
      try {
        list = await ApiClient.get<ProjectWithDetails[]>('/projects');
        saveLocalProjects(list);
      } catch {
        list = getLocalProjects();
      }

      if (!options.includeDeleted) {
        list = list.filter((p) => !p.deleted_at);
      }
      if (options.status && options.status !== 'all') {
        list = list.filter((p) => p.status === options.status);
      }
      if (options.categoryId) {
        list = list.filter((p) => p.category_id === options.categoryId);
      }
      if (options.featured !== undefined) {
        list = list.filter((p) => p.featured === options.featured);
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.client?.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }
      return list;
    }

    let query = supabase
      .from('projects')
      .select(`
        *,
        category:categories(*),
        media:project_media(*),
        sections:project_sections(*)
      `)
      .order('created_at', { ascending: false });

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }
    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options.featured !== undefined) {
      query = query.eq('featured', options.featured);
    }
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,client.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase projects query returned error, falling back to local dataset:', error.message);
      return getLocalProjects();
    }

    return (data as ProjectWithDetails[]) || [];
  }

  /**
   * Fetch published projects for public pages
   */
  static async getPublishedProjects(): Promise<ProjectWithDetails[]> {
    return this.getProjects({ status: 'published' });
  }

  /**
   * Fetch single project by slug with media and sections
   */
  static async getProjectBySlug(slug: string): Promise<ProjectWithDetails | null> {
    if (!isSupabaseConfigured()) {
      try {
        return await ApiClient.get<ProjectWithDetails>(`/projects/${slug}`);
      } catch {
        const list = getLocalProjects();
        return list.find((p) => p.slug === slug && !p.deleted_at) || null;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        category:categories(*),
        media:project_media(*),
        sections:project_sections(*)
      `)
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      // Fallback
      const list = getLocalProjects();
      return list.find((p) => p.slug === slug && !p.deleted_at) || null;
    }

    // Sort media and sections by display_order
    const project = data as ProjectWithDetails;
    if (project.media) {
      project.media.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    if (project.sections) {
      project.sections.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return project;
  }

  /**
   * Fetch project by ID
   */
  static async getProjectById(id: string): Promise<ProjectWithDetails | null> {
    if (!isSupabaseConfigured()) {
      try {
        return await ApiClient.get<ProjectWithDetails>(`/projects/${id}`);
      } catch {
        const list = getLocalProjects();
        return list.find((p) => p.id === id) || null;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        category:categories(*),
        media:project_media(*),
        sections:project_sections(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const list = getLocalProjects();
      return list.find((p) => p.id === id) || null;
    }

    const project = data as ProjectWithDetails;
    if (project.media) {
      project.media.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    if (project.sections) {
      project.sections.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    return project;
  }

  /**
   * Create new project in Supabase or server database
   */
  static async createProject(project: Partial<DbProject>): Promise<DbProject> {
    const slug = project.slug || project.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'project';

    if (!isSupabaseConfigured()) {
      const newProject: ProjectWithDetails = {
        id: `proj-${Date.now()}`,
        title: project.title || 'Untitled Project',
        slug,
        category_id: project.category_id || null,
        client: project.client || '',
        year: project.year || new Date().getFullYear().toString(),
        role: project.role || 'Creative Director',
        description: project.description || '',
        long_description: project.long_description || '',
        status: project.status || 'draft',
        featured: project.featured || false,
        preview_image: project.preview_image || '/assets/gideon_boadi_portrait.png',
        preview_video: project.preview_video || null,
        hero_image: project.hero_image || '/assets/gideon_boadi_portrait.png',
        hero_video: project.hero_video || null,
        og_image: project.og_image || null,
        seo_title: project.seo_title || `${project.title} | Deon Studios`,
        seo_description: project.seo_description || project.description || '',
        seo_keywords: project.seo_keywords || '',
        published_at: project.status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        media: [],
        sections: [],
      };

      try {
        const created = await ApiClient.post<ProjectWithDetails>('/projects', newProject);
        const list = getLocalProjects();
        list.unshift(created);
        saveLocalProjects(list);
        return created;
      } catch {
        const list = getLocalProjects();
        list.unshift(newProject);
        saveLocalProjects(list);
        return newProject;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title!,
        slug,
        category_id: project.category_id,
        client: project.client,
        year: project.year,
        role: project.role,
        description: project.description!,
        long_description: project.long_description,
        status: project.status || 'draft',
        featured: project.featured || false,
        preview_image: project.preview_image,
        preview_video: project.preview_video,
        hero_image: project.hero_image,
        hero_video: project.hero_video,
        og_image: project.og_image,
        seo_title: project.seo_title,
        seo_description: project.seo_description,
        seo_keywords: project.seo_keywords,
        published_at: project.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to create project. Please try again.');
    }

    return data as DbProject;
  }

  /**
   * Update existing project
   */
  static async updateProject(id: string, updates: Partial<DbProject>): Promise<DbProject> {
    if (!isSupabaseConfigured()) {
      try {
        const updated = await ApiClient.put<ProjectWithDetails>(`/projects/${id}`, updates);
        const list = getLocalProjects();
        const idx = list.findIndex((p) => p.id === id);
        if (idx !== -1) {
          list[idx] = updated;
          saveLocalProjects(list);
        }
        return updated;
      } catch {
        const list = getLocalProjects();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Project not found');
        list[idx] = {
          ...list[idx],
          ...updates,
          updated_at: new Date().toISOString(),
          published_at:
            updates.status === 'published' && !list[idx].published_at
              ? new Date().toISOString()
              : list[idx].published_at,
        };
        saveLocalProjects(list);
        return list[idx];
      }
    }

    const updatePayload: Record<string, any> = { ...updates };
    if (updates.status === 'published' && !updates.published_at) {
      updatePayload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to update project. Please try again.');
    }

    return data as DbProject;
  }

  /**
   * Delete project permanently or soft-delete, keeping local cache and Supabase in sync
   */
  static async deleteProject(id: string): Promise<boolean> {
    // 1. Immediately remove from server database
    try {
      await ApiClient.delete(`/projects/${id}`);
    } catch {
      // offline fallback
    }

    // 2. Remove from local cache
    const list = getLocalProjects();
    const target = list.find((p) => p.id === id);
    if (target) {
      const keysToPurge = [
        target.id,
        target.slug,
        target.preview_image,
        target.hero_image,
        ...(target.media || []).flatMap((m) => [m.id, m.media_url, m.file_name]),
      ];
      await markMediaAsDeleted(keysToPurge);
    } else {
      await markMediaAsDeleted([id]);
    }

    const filtered = list.filter((p) => p.id !== id);
    saveLocalProjects(filtered);

    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      // Try hard delete in Supabase first (CASCADE will remove media/sections)
      const { error: hardDeleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (hardDeleteError) {
        // Fallback to soft delete if constraints require
        const { error: softDeleteError } = await supabase
          .from('projects')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (softDeleteError) {
          throw new Error(hardDeleteError.message || softDeleteError.message || 'Failed to delete project');
        }
      }
    } catch (err: any) {
      console.warn('Supabase delete warning:', err);
      throw err;
    }

    return true;
  }

  /**
   * Delete multiple projects in bulk
   */
  static async deleteProjects(ids: string[]): Promise<boolean> {
    try {
      await ApiClient.post('/projects/batch-delete', { ids });
    } catch {
      // offline fallback
    }

    const list = getLocalProjects();
    const idSet = new Set(ids);
    const keysToPurge: string[] = [];

    for (const id of ids) {
      const target = list.find((p) => p.id === id);
      if (target) {
        keysToPurge.push(
          target.id,
          target.slug,
          target.preview_image,
          target.hero_image,
          ...(target.media || []).flatMap((m) => [m.id, m.media_url, m.file_name])
        );
      } else {
        keysToPurge.push(id);
      }
    }

    await markMediaAsDeleted(keysToPurge);
    const filtered = list.filter((p) => !idSet.has(p.id));
    saveLocalProjects(filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('projects').delete().in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk delete warning:', err);
      }
    }

    return true;
  }

  /**
   * Batch update project status
   */
  static async updateProjectsStatus(ids: string[], status: ProjectStatus): Promise<void> {
    try {
      await ApiClient.post('/projects/batch-update', { ids, updates: { status } });
    } catch {
      // fallback
    }

    const list = getLocalProjects();
    const idSet = new Set(ids);
    for (const p of list) {
      if (idSet.has(p.id)) {
        p.status = status;
        p.updated_at = new Date().toISOString();
        if (status === 'published' && !p.published_at) {
          p.published_at = new Date().toISOString();
        }
      }
    }
    saveLocalProjects(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('projects')
          .update({ status, updated_at: new Date().toISOString() })
          .in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk status update warning:', err);
      }
    }
  }

  /**
   * Batch update project featured flag
   */
  static async updateProjectsFeatured(ids: string[], featured: boolean): Promise<void> {
    try {
      await ApiClient.post('/projects/batch-update', { ids, updates: { featured } });
    } catch {
      // fallback
    }

    const list = getLocalProjects();
    const idSet = new Set(ids);
    for (const p of list) {
      if (idSet.has(p.id)) {
        p.featured = featured;
        p.updated_at = new Date().toISOString();
      }
    }
    saveLocalProjects(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('projects')
          .update({ featured, updated_at: new Date().toISOString() })
          .in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk featured update warning:', err);
      }
    }
  }

  /**
   * Seeds 3 sample studio portfolio projects into Supabase (and local storage)
   * This provides a clean template structure showing how projects are organized.
   */
  static async seedProjectsToDatabase(): Promise<ProjectWithDetails[]> {
    // Exactly 3 sample projects representing different creative categories
    const selectedSamples = STATIC_PROJECTS.slice(0, 3);

    const sampleProjects = selectedSamples.map((sp, idx) => ({
      title: sp.title,
      slug: sp.slug,
      client: sp.client,
      year: sp.year,
      role: sp.artDirector || 'Creative Director',
      description: sp.description,
      long_description: sp.description,
      status: 'published' as ProjectStatus,
      featured: idx < 2,
      preview_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
      preview_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
      hero_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
      hero_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
      seo_title: `${sp.title} — ${sp.client} | Deon Studios`,
      seo_description: sp.description,
      published_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured()) {
      for (const p of sampleProjects) {
        try {
          await supabase.from('projects').upsert(p, { onConflict: 'slug' });
        } catch (e) {
          console.warn('Seeding project error:', e);
        }
      }
    }

    if (!isSupabaseConfigured()) {
      try {
        const res = await ApiClient.post<{ projects: ProjectWithDetails[] }>('/projects/seed');
        if (res?.projects) {
          saveLocalProjects(res.projects);
          return res.projects;
        }
      } catch {
        // fallback
      }
    }

    // Also populate local cache with exactly these 3 sample projects
    const initial = selectedSamples.map((sp, idx) => ({
      id: sp.id || `proj-${idx + 1}`,
      title: sp.title,
      slug: sp.slug,
      category_id: null,
      client: sp.client,
      year: sp.year,
      role: sp.artDirector || 'Creative Director',
      description: sp.description,
      long_description: sp.description,
      status: 'published' as ProjectStatus,
      featured: idx < 2,
      preview_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
      preview_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
      hero_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
      hero_video: sp.slug === 'helmet-of-heritage' ? '/videos/hero-desktop.mp4' : null,
      og_image: sp.images?.[0]?.url || '/assets/gideon_boadi_portrait.png',
      seo_title: `${sp.title} — ${sp.client} | Deon Studios`,
      seo_description: sp.description,
      seo_keywords: `Gideon Boadi, ${sp.client}, ${sp.category}, Photography`,
      published_at: new Date().toISOString(),
      created_at: new Date(Date.now() - idx * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      media: (sp.images || []).map((img, imgIdx) => ({
        id: `media-${sp.slug}-${imgIdx}`,
        project_id: sp.id || `proj-${idx + 1}`,
        media_type: 'image' as const,
        storage_path: img.url,
        media_url: img.url,
        thumbnail_path: img.url,
        thumbnail_url: img.url,
        file_name: `${sp.slug}-${imgIdx}.jpg`,
        file_size: null,
        mime_type: 'image/jpeg',
        width: 1200,
        height: 1600,
        alt_text: img.caption || `${sp.title} Plate ${imgIdx + 1}`,
        display_order: imgIdx,
        created_at: new Date().toISOString(),
      })),
      sections: [],
      viewsCount: 250,
    }));

    saveLocalProjects(initial);
    return initial;
  }

  /**
   * Duplicate existing project
   */
  static async duplicateProject(id: string): Promise<DbProject> {
    const original = await this.getProjectById(id);
    if (!original) throw new Error('Original project not found');

    const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    const duplicated = await this.createProject({
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
      featured: false,
      published_at: null,
      created_at: undefined,
      updated_at: undefined,
    });

    return duplicated;
  }

  /**
   * Quick status actions
   */
  static async publishProject(id: string): Promise<DbProject> {
    return this.updateProject(id, { status: 'published', published_at: new Date().toISOString() });
  }

  static async archiveProject(id: string): Promise<DbProject> {
    return this.updateProject(id, { status: 'archived' });
  }

  static async toggleFeatured(id: string, current: boolean): Promise<DbProject> {
    return this.updateProject(id, { featured: !current });
  }
}
