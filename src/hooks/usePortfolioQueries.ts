import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../features/projects/services/projectService';
import { CategoryService } from '../features/categories/services/categoryService';
import { MediaService } from '../features/media/services/mediaService';
import { SectionService } from '../features/projects/services/sectionService';
import { AnalyticsService } from '../features/analytics/services/analyticsService';
import { PortfolioService } from '../features/portfolio/services/portfolioService';
import { ProductService } from '../features/products/services/productService';
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
    staleTime: 1000 * 60 * 5,
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

  return {
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
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
    staleTime: 1000 * 60 * 2,
  });
}

export function usePublishedPortfolioShots() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioShots({ status: 'published' }),
    queryFn: () => PortfolioService.getPublishedShots(),
    staleTime: 1000 * 60 * 5,
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

  return {
    createShot,
    updateShot,
    deleteShot,
    duplicateShot,
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
    staleTime: 1000 * 60 * 2,
  });
}

export function usePublishedProductShots() {
  return useQuery({
    queryKey: QUERY_KEYS.productShots({ status: 'published' }),
    queryFn: () => ProductService.getPublishedProducts(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductShot(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.productShot(id || ''),
    queryFn: () => (id ? ProductService.getProductById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
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

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
  };
}

