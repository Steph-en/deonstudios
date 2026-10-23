import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../features/projects/services/projectService';
import { CategoryService } from '../features/categories/services/categoryService';
import { MediaService } from '../features/media/services/mediaService';
import { SectionService } from '../features/projects/services/sectionService';
import { AnalyticsService } from '../features/analytics/services/analyticsService';
import { PortfolioService } from '../features/portfolio/services/portfolioService';
import { ProductService } from '../features/products/services/productService';
import {
  SiteSettingsService,
  HeroSettings,
  AboutSettings,
  DEFAULT_HERO_SETTINGS,
  DEFAULT_ABOUT_SETTINGS,
} from '../services/siteSettingsService';
import {
  DbProject,
  DbCategory,
  DbProjectMedia,
  DbProjectSection,
  DbPortfolioShot,
  DbProductShot,
  ProjectStatus,
} from '../types/database';

export const QUERY_KEYS = {
  projects: (filters?: any) => ['projects', filters] as const,
  project: (slugOrId: string) => ['project', slugOrId] as const,
  portfolioShots: (filters?: any) => ['portfolio-shots', filters] as const,
  portfolioShot: (id: string) => ['portfolio-shot', id] as const,
  productShots: (filters?: any) => ['product-shots', filters] as const,
  productShot: (id: string) => ['product-shot', id] as const,
  categories: ['categories'] as const,
  projectMedia: (projectId: string) => ['project-media', projectId] as const,
  projectSections: (projectId: string) => ['project-sections', projectId] as const,
  dashboardStats: ['dashboard-stats'] as const,
  detailedAnalytics: ['detailed-analytics'] as const,
  siteSettings: (key: string) => ['site-settings', key] as const,
};

export function useProjects(options?: {
  status?: 'draft' | 'published' | 'archived' | 'all';
  categoryId?: string;
  search?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.projects(options),
    queryFn: () => ProjectService.getProjects(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePublishedProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects({ status: 'published' }),
    queryFn: () => ProjectService.getPublishedProjects(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProject(slugOrId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.project(slugOrId || ''),
    queryFn: async () => {
      if (!slugOrId) return null;
      // Check if it's a UUID/ID or slug
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(slugOrId) || slugOrId.startsWith('proj-');
      if (isId) {
        return ProjectService.getProjectById(slugOrId);
      }
      return ProjectService.getProjectBySlug(slugOrId);
    },
    enabled: Boolean(slugOrId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => CategoryService.getCategories(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useProjectMedia(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.projectMedia(projectId || ''),
    queryFn: () => (projectId ? MediaService.getMediaForProject(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });
}

export function useProjectSections(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.projectSections(projectId || ''),
    queryFn: () => (projectId ? SectionService.getSectionsForProject(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => AnalyticsService.getDashboardStats(),
    staleTime: 1000 * 30,
  });
}

export function useDetailedAnalytics() {
  return useQuery({
    queryKey: QUERY_KEYS.detailedAnalytics,
    queryFn: () => AnalyticsService.getDetailedAnalytics(),
    staleTime: 1000 * 60 * 2,
  });
}

// MUTATION HOOKS

export function useProjectMutations() {
  const queryClient = useQueryClient();

  const createProject = useMutation({
    mutationFn: (project: Partial<DbProject>) => ProjectService.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbProject> }) =>
      ProjectService.updateProject(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(data.slug) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => ProjectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const duplicateProject = useMutation({
    mutationFn: (id: string) => ProjectService.duplicateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteMultipleProjects = useMutation({
    mutationFn: (ids: string[]) => ProjectService.deleteProjects(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleProjectsStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProjectStatus }) =>
      ProjectService.updateProjectsStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleProjectsFeatured = useMutation({
    mutationFn: ({ ids, featured }: { ids: string[]; featured: boolean }) =>
      ProjectService.updateProjectsFeatured(ids, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const reorderProjects = useMutation({
    mutationFn: (orders: { id: string; display_order: number }[]) =>
      ProjectService.reorderProjects(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    deleteMultipleProjects,
    updateMultipleProjectsStatus,
    updateMultipleProjectsFeatured,
    reorderProjects,
  };
}

// PORTFOLIO / PORTRAIT SHOTS HOOKS

export function usePortfolioShots(options?: {
  status?: ProjectStatus | 'all';
  category?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioShots(options),
    queryFn: () => PortfolioService.getShots(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePublishedPortfolioShots() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioShots({ status: 'published' }),
    queryFn: () => PortfolioService.getPublishedShots(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePortfolioShot(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioShot(id || ''),
    queryFn: () => (id ? PortfolioService.getShotById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePortfolioMutations() {
  const queryClient = useQueryClient();

  const createShot = useMutation({
    mutationFn: (shot: Partial<DbPortfolioShot>) => PortfolioService.createShot(shot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateShot = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbPortfolioShot> }) =>
      PortfolioService.updateShot(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolioShot(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteShot = useMutation({
    mutationFn: (id: string) => PortfolioService.deleteShot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const duplicateShot = useMutation({
    mutationFn: (id: string) => PortfolioService.duplicateShot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteMultipleShots = useMutation({
    mutationFn: (ids: string[]) => PortfolioService.deleteShots(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleShotsStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProjectStatus }) =>
      PortfolioService.updateShotsStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleShotsFeatured = useMutation({
    mutationFn: ({ ids, featured }: { ids: string[]; featured: boolean }) =>
      PortfolioService.updateShotsFeatured(ids, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const reorderShots = useMutation({
    mutationFn: (orderedItems: { id: string; display_order: number }[]) =>
      PortfolioService.reorderShots(orderedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-shots'] });
    },
  });

  return {
    createShot,
    updateShot,
    deleteShot,
    duplicateShot,
    deleteMultipleShots,
    updateMultipleShotsStatus,
    updateMultipleShotsFeatured,
    reorderShots,
  };
}

// PRODUCT SHOTS HOOKS

export function useProductShots(options?: {
  status?: ProjectStatus | 'all';
  category?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.productShots(options),
    queryFn: () => ProductService.getProducts(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePublishedProductShots() {
  return useQuery({
    queryKey: QUERY_KEYS.productShots({ status: 'published' }),
    queryFn: () => ProductService.getPublishedProducts(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProductShot(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.productShot(id || ''),
    queryFn: () => (id ? ProductService.getProductById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (product: Partial<DbProductShot>) => ProductService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbProductShot> }) =>
      ProductService.updateProduct(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productShot(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => ProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const duplicateProduct = useMutation({
    mutationFn: (id: string) => ProductService.duplicateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const deleteMultipleProducts = useMutation({
    mutationFn: (ids: string[]) => ProductService.deleteProducts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleProductsStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProjectStatus }) =>
      ProductService.updateProductsStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const updateMultipleProductsFeatured = useMutation({
    mutationFn: ({ ids, featured }: { ids: string[]; featured: boolean }) =>
      ProductService.updateProductsFeatured(ids, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });

  const reorderProducts = useMutation({
    mutationFn: (orderedItems: { id: string; display_order: number }[]) =>
      ProductService.reorderProducts(orderedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-shots'] });
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    deleteMultipleProducts,
    updateMultipleProductsStatus,
    updateMultipleProductsFeatured,
    reorderProducts,
  };
}

// ----------------------------------------------------------------------------
// SITE SETTINGS (HERO & ABOUT DYNAMIC CMS HOOKS)
// ----------------------------------------------------------------------------

export function useHeroSettings() {
  return useQuery<HeroSettings>({
    queryKey: QUERY_KEYS.siteSettings('hero_settings'),
    queryFn: () => SiteSettingsService.getSettings<HeroSettings>('hero_settings', DEFAULT_HERO_SETTINGS),
    initialData: () => SiteSettingsService.getLocalCache<HeroSettings>('hero_settings') ?? DEFAULT_HERO_SETTINGS,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateHeroSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSettings: HeroSettings) =>
      SiteSettingsService.updateSettings<HeroSettings>('hero_settings', newSettings),
    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEYS.siteSettings('hero_settings'), saved);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.siteSettings('hero_settings') });
    },
  });
}

export function useAboutSettings() {
  return useQuery<AboutSettings>({
    queryKey: QUERY_KEYS.siteSettings('about_settings'),
    queryFn: () => SiteSettingsService.getSettings<AboutSettings>('about_settings', DEFAULT_ABOUT_SETTINGS),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateAboutSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSettings: AboutSettings) =>
      SiteSettingsService.updateSettings<AboutSettings>('about_settings', newSettings),
    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEYS.siteSettings('about_settings'), saved);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.siteSettings('about_settings') });
    },
  });
}

export function useInquiries() {
  return useQuery<any[]>({
    queryKey: ['inquiries'],
    queryFn: async () => {
      // Tier 1: Try /api/inquiries (Server or Vercel serverless)
      let apiItems: any[] = [];
      try {
        const res = await fetch('/api/inquiries', {
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) apiItems = data;
        }
      } catch (err) {
        console.warn('[useInquiries] API fetch note:', err);
      }

      // Tier 2: Try Supabase cloud database directly (guaranteed across all environments including Vercel)
      let cloudItems: any[] = [];
      try {
        const cloudData = await SiteSettingsService.getSettings<any[]>('client_inquiries', []);
        if (Array.isArray(cloudData)) cloudItems = cloudData;
      } catch (err) {
        console.warn('[useInquiries] Supabase fetch note:', err);
      }

      // Tier 3: Try browser storage (instant offline/same-device visibility)
      let localItems: any[] = [];
      try {
        const dispatched = JSON.parse(localStorage.getItem('deon_dispatched_inquiries') || '[]');
        if (Array.isArray(dispatched)) localItems = dispatched;
      } catch {}

      // Deduplicate and merge by inquiry id
      const map = new Map<string, any>();
      // Order: localItems -> cloudItems -> apiItems (newest status / edits take precedence)
      const all = [...localItems, ...cloudItems, ...apiItems];
      for (const inq of all) {
        if (inq && inq.id) {
          if (!map.has(inq.id)) {
            map.set(inq.id, inq);
          } else {
            // Merge fields preferring read status if updated
            const existing = map.get(inq.id);
            if (inq.status === 'read' && existing.status !== 'read') {
              map.set(inq.id, { ...existing, ...inq });
            }
          }
        }
      }

      const merged = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.created_at || a.date || 0).getTime();
        const timeB = new Date(b.created_at || b.date || 0).getTime();
        return timeB - timeA;
      });

      return merged;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: false, // Disabled continuous 10s polling to prevent reload loop and Supabase egress spike
    refetchOnWindowFocus: false,
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'read' | 'unread' }) => {
      // 1. Try API
      try {
        await fetch(`/api/inquiries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch {}

      // 2. Sync to Supabase cloud site_settings
      try {
        const current = await SiteSettingsService.getSettings<any[]>('client_inquiries', []);
        const updated = current.map((item: any) =>
          item.id === id ? { ...item, status } : item
        );
        await SiteSettingsService.updateSettings('client_inquiries', updated);
      } catch {}

      // 3. Sync to browser storage
      try {
        const stored = JSON.parse(localStorage.getItem('deon_dispatched_inquiries') || '[]');
        if (Array.isArray(stored)) {
          const updated = stored.map((item: any) =>
            item.id === id ? { ...item, status } : item
          );
          localStorage.setItem('deon_dispatched_inquiries', JSON.stringify(updated));
        }
      } catch {}

      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['inquiries'] });
      const previousInquiries = queryClient.getQueryData<any[]>(['inquiries']);
      if (previousInquiries) {
        queryClient.setQueryData<any[]>(
          ['inquiries'],
          previousInquiries.map((inq) =>
            inq.id === id ? { ...inq, status } : inq
          )
        );
      }
      return { previousInquiries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousInquiries) {
        queryClient.setQueryData(['inquiries'], context.previousInquiries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Try API
      try {
        await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
      } catch {}

      // 2. Sync to Supabase cloud site_settings
      try {
        const current = await SiteSettingsService.getSettings<any[]>('client_inquiries', []);
        const filtered = current.filter((item: any) => item.id !== id);
        await SiteSettingsService.updateSettings('client_inquiries', filtered);
      } catch {}

      // 3. Sync to browser storage
      try {
        const stored = JSON.parse(localStorage.getItem('deon_dispatched_inquiries') || '[]');
        if (Array.isArray(stored)) {
          const filtered = stored.filter((item: any) => item.id !== id);
          localStorage.setItem('deon_dispatched_inquiries', JSON.stringify(filtered));
        }
      } catch {}

      return { id };
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['inquiries'] });
      const previousInquiries = queryClient.getQueryData<any[]>(['inquiries']);
      if (previousInquiries) {
        queryClient.setQueryData<any[]>(
          ['inquiries'],
          previousInquiries.filter((inq) => inq.id !== id)
        );
      }
      return { previousInquiries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousInquiries) {
        queryClient.setQueryData(['inquiries'], context.previousInquiries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}


