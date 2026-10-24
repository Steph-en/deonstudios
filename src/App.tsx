/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroVideo } from './components/HeroVideo';
import { PortfolioSection } from './components/PortfolioSection';
import { ProjectsList } from './components/ProjectsList';
import { ProductsSection } from './components/ProductsSection';
import { ProjectDetailView } from './components/ProjectDetailView';
import { AboutView } from './components/AboutView';
import { ContactView } from './components/ContactView';
import { Footer } from './components/Footer';
import { GsapIntro } from './components/GsapIntro';
import { Project, ThemeMode, PageView } from './types';
import { DocumentSeo } from './hooks/useDocumentSeo';
import { motion, AnimatePresence } from 'motion/react';

// Supabase CMS Integrations
import { useAuth } from './features/auth/hooks/useAuth';
import { LoginForm } from './features/auth/components/LoginForm';
import { AdminLayout, AdminTab } from './components/layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProjectListPage } from './pages/admin/ProjectListPage';
import { ProjectEditPage } from './pages/admin/ProjectEditPage';
import { PortfolioListPage } from './pages/admin/PortfolioListPage';
import { PortfolioEditPage } from './pages/admin/PortfolioEditPage';
import { ProductListPage } from './pages/admin/ProductListPage';
import { ProductEditPage } from './pages/admin/ProductEditPage';
import { CategoryManagerPage } from './pages/admin/CategoryManagerPage';
import { MediaManagerPage } from './pages/admin/MediaManagerPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { ProfilePage } from './pages/admin/ProfilePage';
import { HeroCmsPage } from './pages/admin/HeroCmsPage';
import { AboutCmsPage } from './pages/admin/AboutCmsPage';
import { usePublishedProjects, usePortfolioShots, useProductShots } from './hooks/usePortfolioQueries';
import { AnalyticsService } from './features/analytics/services/analyticsService';
import { dbProjectToPortfolioProject } from './features/projects/utils/projectAdapter';
import { SingleShot } from './types';

function dbShotToSingleShot(shot: any): SingleShot {
  return {
    id: shot.id,
    title: shot.title,
    url: shot.url,
    aspectRatio: shot.aspect_ratio || 'portrait',
    category: shot.category || 'Editorial',
    clientOrBrand: shot.client_or_brand || undefined,
    tag: shot.tag || undefined,
    caption: shot.caption || '',
    camera: shot.camera || undefined,
    lens: shot.lens || undefined,
    iso: shot.iso || undefined,
    shutter: shot.shutter || undefined,
    exif: {
      camera: shot.camera || undefined,
      lens: shot.lens || undefined,
      iso: shot.iso || undefined,
      shutter: shot.shutter || undefined,
    },
    status: shot.status,
    featured: shot.featured,
    display_order: shot.display_order,
  };
}

interface ParsedRoute {
  page: PageView;
  adminTab: AdminTab;
  adminSubroute: string;
  editingProjectId: string | null;
  editingPortfolioShotId: string | null;
  editingProductId: string | null;
  projectSlug: string | null;
}

function parseRoute(rawPath: string, rawHash: string): ParsedRoute {
  const hash = rawHash || '';
  const pathname = rawPath.replace(/\/+$/, '') || '/';

  const isAdminRoute =
    hash.startsWith('#admin') ||
    hash.startsWith('#login') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/');

  if (isAdminRoute) {
    const adminRoute = hash.startsWith('#admin')
      ? hash
      : hash.startsWith('#login')
      ? '#admin/overview'
      : pathname.startsWith('/login')
      ? '#admin/overview'
      : `#admin${pathname.slice('/admin'.length)}`;

    let tab: AdminTab = 'overview';
    let editProjectId: string | null = null;
    let editPortfolioId: string | null = null;
    let editProductId: string | null = null;

    if (adminRoute === '#admin' || adminRoute === '#admin/' || adminRoute === '#admin/overview') {
      tab = 'overview';
    } else if (adminRoute === '#admin/hero') {
      tab = 'hero';
    } else if (adminRoute === '#admin/about') {
      tab = 'about';
    } else if (adminRoute === '#admin/projects') {
      tab = 'projects';
    } else if (adminRoute === '#admin/new-project') {
      tab = 'projects';
      editProjectId = 'new';
    } else if (adminRoute.startsWith('#admin/edit-project-')) {
      tab = 'projects';
      editProjectId = adminRoute.replace('#admin/edit-project-', '');
    } else if (adminRoute === '#admin/portfolio') {
      tab = 'portfolio';
    } else if (adminRoute === '#admin/new-portfolio') {
      tab = 'portfolio';
      editPortfolioId = 'new';
    } else if (adminRoute.startsWith('#admin/edit-portfolio-')) {
      tab = 'portfolio';
      editPortfolioId = adminRoute.replace('#admin/edit-portfolio-', '');
    } else if (adminRoute === '#admin/products') {
      tab = 'products';
    } else if (adminRoute === '#admin/new-product') {
      tab = 'products';
      editProductId = 'new';
    } else if (adminRoute.startsWith('#admin/edit-product-')) {
      tab = 'products';
      editProductId = adminRoute.replace('#admin/edit-product-', '');
    } else if (adminRoute === '#admin/categories') {
      tab = 'categories';
    } else if (adminRoute === '#admin/media') {
      tab = 'media';
    } else if (adminRoute === '#admin/analytics') {
      tab = 'analytics';
    } else if (adminRoute === '#admin/profile') {
      tab = 'profile';
    } else {
      tab = 'overview';
    }

    return {
      page: 'admin',
      adminTab: tab,
      adminSubroute: adminRoute,
      editingProjectId: editProjectId,
      editingPortfolioShotId: editPortfolioId,
      editingProductId: editProductId,
      projectSlug: null,
    };
  }

  if (hash === '#about' || pathname === '/about') {
    return {
      page: 'about',
      adminTab: 'overview',
      adminSubroute: '',
      editingProjectId: null,
      editingPortfolioShotId: null,
      editingProductId: null,
      projectSlug: null,
    };
  }

  if (hash === '#contact' || pathname === '/contact') {
    return {
      page: 'contact',
      adminTab: 'overview',
      adminSubroute: '',
      editingProjectId: null,
      editingPortfolioShotId: null,
      editingProductId: null,
      projectSlug: null,
    };
  }

  if (hash.startsWith('#project-') || pathname.startsWith('/project/')) {
    const slug = hash.startsWith('#project-')
      ? hash.replace('#project-', '')
      : pathname.replace('/project/', '');
    return {
      page: 'project',
      adminTab: 'overview',
      adminSubroute: '',
      editingProjectId: null,
      editingPortfolioShotId: null,
      editingProductId: null,
      projectSlug: slug,
    };
  }

  return {
    page: 'home',
    adminTab: 'overview',
    adminSubroute: '',
    editingProjectId: null,
    editingPortfolioShotId: null,
    editingProductId: null,
    projectSlug: null,
  };
}

export default function App() {
  // Pure light theme as requested
  const [theme] = useState<ThemeMode>('light');

  // Track browser location in a single stable state
  const [locationState, setLocationState] = useState(() => ({
    pathname: typeof window !== 'undefined' ? (window.location.pathname.replace(/\/+$/, '') || '/') : '/',
    hash: typeof window !== 'undefined' ? (window.location.hash || '') : '',
  }));

  // Synchronize route calculations with useMemo based on current URL
  const currentRoute = useMemo(
    () => parseRoute(locationState.pathname, locationState.hash),
    [locationState.pathname, locationState.hash]
  );

  const activePage = currentRoute.page;
  const adminTab = currentRoute.adminTab;
  const editingProjectId = currentRoute.editingProjectId;
  const editingPortfolioShotId = currentRoute.editingPortfolioShotId;
  const editingProductId = currentRoute.editingProductId;

  // GSAP Intro animation state
  const [introActive, setIntroActive] = useState(() => {
    if (typeof window === 'undefined') return true;
    const initial = parseRoute(
      window.location.pathname.replace(/\/+$/, '') || '/',
      window.location.hash || ''
    );
    return initial.page === 'home';
  });

  const navbarLogoRef = useRef<HTMLDivElement>(null);

  // Auth Hook for CMS Access
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Dynamic projects query from Supabase / localStorage persister
  const { data: dbProjects } = usePublishedProjects();

  // Dynamic portfolio shots & product shots
  const { data: dbPortfolioShots } = usePortfolioShots({ status: 'published' });
  const { data: dbProductShots } = useProductShots({ status: 'published' });

  // Combined published projects strictly reflecting database state
  const publishedProjects: Project[] = useMemo(() => {
    if (dbProjects) {
      return dbProjects.map(dbProjectToPortfolioProject);
    }
    return [];
  }, [dbProjects]);

  // Combined published portfolio shots strictly reflecting database state
  const publishedPortfolioShots: SingleShot[] = useMemo(() => {
    if (dbPortfolioShots) {
      return dbPortfolioShots.map(dbShotToSingleShot);
    }
    return [];
  }, [dbPortfolioShots]);

  // Combined published product shots strictly reflecting database state
  const publishedProductShots: SingleShot[] = useMemo(() => {
    if (dbProductShots) {
      return dbProductShots.map(dbShotToSingleShot);
    }
    return [];
  }, [dbProductShots]);

  // Memoized resolution of selected project for detail view
  const selectedProject = useMemo(() => {
    if (currentRoute.page === 'project' && currentRoute.projectSlug) {
      return publishedProjects.find((p) => p.slug === currentRoute.projectSlug) || null;
    }
    return null;
  }, [currentRoute.page, currentRoute.projectSlug, publishedProjects]);

  // Listen to popstate and hashchange events for browser forward/back buttons
  useEffect(() => {
    const onLocationChange = () => {
      const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
      const currentHash = window.location.hash || '';
      setLocationState((prev) => {
        if (prev.pathname === currentPath && prev.hash === currentHash) return prev;
        return { pathname: currentPath, hash: currentHash };
      });
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  // Anonymous analytics tracking on page navigation
  useEffect(() => {
    if (activePage !== 'admin') {
      const currentHash = locationState.hash || '#home';
      AnalyticsService.trackView(currentHash, selectedProject?.id);
    }
  }, [activePage, locationState.hash, selectedProject?.id]);

  // Apply light theme to document root
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#fafafa';
    document.body.style.color = '#0a0a0a';
  }, []);

  // Stable navigation helper that synchronously updates location state and URL history
  const navigateTo = useCallback(
    (targetUrl: string, options?: { replace?: boolean; scrollToTop?: boolean }) => {
      if (typeof window === 'undefined') return;

      if (options?.replace) {
        window.history.replaceState(null, '', targetUrl);
      } else {
        window.history.pushState(null, '', targetUrl);
      }

      const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
      const currentHash = window.location.hash || '';
      setLocationState((prev) => {
        if (prev.pathname === currentPath && prev.hash === currentHash) return prev;
        return { pathname: currentPath, hash: currentHash };
      });

      if (options?.scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const handleSelectProject = useCallback(
    (project: Project) => {
      navigateTo(`#project-${project.slug}`, { scrollToTop: true });
    },
    [navigateTo]
  );

  const handleNavigateHome = useCallback(() => {
    navigateTo('/', { scrollToTop: true });
  }, [navigateTo]);

  const handleNavigateAbout = useCallback(() => {
    navigateTo('#about', { scrollToTop: true });
  }, [navigateTo]);

  const handleNavigateContact = useCallback(() => {
    navigateTo('#contact', { scrollToTop: true });
  }, [navigateTo]);

  const handleScrollToPortfolio = useCallback(() => {
    if (activePage !== 'home') {
      navigateTo('/', { scrollToTop: false });
      setTimeout(() => {
        const el = document.getElementById('portfolio-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('portfolio-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePage, navigateTo]);

  const handleScrollToProjects = useCallback(() => {
    if (activePage !== 'home') {
      navigateTo('/', { scrollToTop: false });
      setTimeout(() => {
        const el = document.getElementById('projects-archive-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('projects-archive-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePage, navigateTo]);

  const handleScrollToProducts = useCallback(() => {
    if (activePage !== 'home') {
      navigateTo('/', { scrollToTop: false });
      setTimeout(() => {
        const el = document.getElementById('products-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('products-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePage, navigateTo]);

  const handleIntroComplete = useCallback(() => {
    setIntroActive(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIntroActive(true);
  }, []);

  // ADMIN CMS NAVIGATION HANDLERS
  const handleAdminTabChange = useCallback(
    (tab: AdminTab) => {
      navigateTo(`#admin/${tab}`, { scrollToTop: false });
    },
    [navigateTo]
  );

  const handleAdminNewProject = useCallback(() => {
    navigateTo('#admin/new-project', { scrollToTop: false });
  }, [navigateTo]);

  const handleAdminEditProject = useCallback(
    (id: string) => {
      navigateTo(`#admin/edit-project-${id}`, { scrollToTop: false });
    },
    [navigateTo]
  );

  const handleAdminNewPortfolio = useCallback(() => {
    navigateTo('#admin/new-portfolio', { scrollToTop: false });
  }, [navigateTo]);

  const handleAdminEditPortfolio = useCallback(
    (id: string) => {
      navigateTo(`#admin/edit-portfolio-${id}`, { scrollToTop: false });
    },
    [navigateTo]
  );

  const handleAdminNewProduct = useCallback(() => {
    navigateTo('#admin/new-product', { scrollToTop: false });
  }, [navigateTo]);

  const handleAdminEditProduct = useCallback(
    (id: string) => {
      navigateTo(`#admin/edit-product-${id}`, { scrollToTop: false });
    },
    [navigateTo]
  );

  const handleAdminViewPublicProject = useCallback(
    (slug: string) => {
      navigateTo(`#project-${slug}`, { scrollToTop: true });
    },
    [navigateTo]
  );

  const handleBackToAdminProjects = useCallback(() => {
    navigateTo('#admin/projects', { scrollToTop: false });
  }, [navigateTo]);

  const handleBackToAdminPortfolio = useCallback(() => {
    navigateTo('#admin/portfolio', { scrollToTop: false });
  }, [navigateTo]);

  const handleBackToAdminProducts = useCallback(() => {
    navigateTo('#admin/products', { scrollToTop: false });
  }, [navigateTo]);

  const handleLoginSuccess = useCallback(() => {
    navigateTo('#admin/overview', { scrollToTop: false });
  }, [navigateTo]);

  // -------------------------------------------------------------
  // RENDER ADMIN CMS VIEW
  // -------------------------------------------------------------
  if (activePage === 'admin') {
    if (isAuthLoading) {
      return (
        <>
          <DocumentSeo activePage="admin" selectedProject={null} adminTab="overview" />
          <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center font-mono text-xs text-neutral-400">
            Loading...
          </div>
        </>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <DocumentSeo activePage="admin" selectedProject={null} adminTab="overview" />
          <LoginForm
            onSuccess={handleLoginSuccess}
            onCancel={handleNavigateHome}
          />
        </>
      );
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onNavigateTab={handleAdminTabChange}
        onNavigateToNewProject={handleAdminNewProject}
        onNavigateToNewPortfolio={handleAdminNewPortfolio}
        onNavigateToNewProduct={handleAdminNewProduct}
        onExitAdmin={handleNavigateHome}
      >
        {editingProjectId !== null ? (
          <ProjectEditPage
            projectId={editingProjectId === 'new' ? null : editingProjectId}
            onBack={handleBackToAdminProjects}
            onViewPublicProject={handleAdminViewPublicProject}
          />
        ) : editingPortfolioShotId !== null ? (
          <PortfolioEditPage
            shotId={editingPortfolioShotId === 'new' ? null : editingPortfolioShotId}
            onBack={handleBackToAdminPortfolio}
            onViewPublicPortfolio={handleScrollToPortfolio}
          />
        ) : editingProductId !== null ? (
          <ProductEditPage
            productId={editingProductId === 'new' ? null : editingProductId}
            onBack={handleBackToAdminProducts}
            onViewPublicProducts={handleScrollToProducts}
          />
        ) : adminTab === 'overview' ? (
          <AdminDashboard
            onNavigateTab={handleAdminTabChange}
            onNavigateToNewProject={handleAdminNewProject}
            onNavigateToNewPortfolio={handleAdminNewPortfolio}
            onNavigateToNewProduct={handleAdminNewProduct}
          />
        ) : adminTab === 'hero' ? (
          <HeroCmsPage />
        ) : adminTab === 'about' ? (
          <AboutCmsPage />
        ) : adminTab === 'projects' ? (
          <ProjectListPage
            onEditProject={handleAdminEditProject}
            onNewProject={handleAdminNewProject}
            onViewPublicProject={handleAdminViewPublicProject}
          />
        ) : adminTab === 'portfolio' ? (
          <PortfolioListPage
            onEditShot={handleAdminEditPortfolio}
            onNewShot={handleAdminNewPortfolio}
            onViewPublicPortfolio={handleScrollToPortfolio}
          />
        ) : adminTab === 'products' ? (
          <ProductListPage
            onEditProduct={handleAdminEditProduct}
            onNewProduct={handleAdminNewProduct}
            onViewPublicProducts={handleScrollToProducts}
          />
        ) : adminTab === 'categories' ? (
          <CategoryManagerPage />
        ) : adminTab === 'media' ? (
          <MediaManagerPage />
        ) : adminTab === 'analytics' ? (
          <AnalyticsPage />
        ) : adminTab === 'profile' ? (
          <ProfilePage />
        ) : null}
      </AdminLayout>
    );
  }

  // -------------------------------------------------------------
  // RENDER PUBLIC PORTFOLIO
  // -------------------------------------------------------------
  return (
    <div
      id="deon-studios-app"
      className={`min-h-screen relative font-sans-clean transition-colors duration-500 ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      <DocumentSeo
        activePage={activePage}
        selectedProject={selectedProject}
        adminTab={adminTab}
      />

      {/* 
        GSAP animation of the logo when the page is first loaded,
        then it animates to the navigation bar.
      */}
      {introActive && (
        <GsapIntro
          theme={theme}
          targetLogoRef={navbarLogoRef}
          onComplete={handleIntroComplete}
        />
      )}

      {/* 
        Navbar where the logo tracks with scroll down the entire page,
        leaving other navigation links behind.
        Links: Portfolio, Projects, Products, About, Contact
      */}
      <Navbar
        theme={theme}
        logoRef={navbarLogoRef}
        activePage={activePage}
        onNavigateHome={handleNavigateHome}
        onOpenAbout={handleNavigateAbout}
        onOpenContact={handleNavigateContact}
        onScrollToPortfolio={handleScrollToPortfolio}
        onScrollToProjects={handleScrollToProjects}
        onScrollToProducts={handleScrollToProducts}
        onReplayIntro={handleReplayIntro}
      />

      {/* Main View Area with Framer Motion Fade-In Transition */}
      <main className="w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage === 'project' && selectedProject ? `project-${selectedProject.slug}` : activePage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activePage === 'home' ? (
              <>
                {/* 
                  Auto-playing background video in the hero section as the page is rendered
                */}
                <HeroVideo
                  theme={theme}
                  onExploreClick={handleScrollToPortfolio}
                />

                {/* 
                  PORTFOLIO SECTION:
                  Single shots, portraits, and editorial plates in dynamic masonry brick wall style
                  with hover hand cursor and lightbox view (powered by dynamic Supabase/local CMS)
                */}
                <PortfolioSection
                  shots={publishedPortfolioShots}
                  theme={theme}
                />

                {/* 
                  PROJECTS SECTION:
                  Grand full-scale dynamic project showcase powered by Supabase published projects
                */}
                <ProjectsList
                  projects={publishedProjects}
                  theme={theme}
                  onSelectProject={handleSelectProject}
                />

                {/* 
                  PRODUCTS SECTION:
                  Commercial product photography, still life & objects in masonry brick wall style
                  with hover hand cursor and lightbox view (powered by dynamic Supabase/local CMS)
                */}
                <ProductsSection
                  products={publishedProductShots}
                  theme={theme}
                />
              </>
            ) : activePage === 'about' ? (
              /* 
                Clean, editorial two-column About page view:
                Portrait on the left, clear typography, inquiries, awards, and clients on the right.
              */
              <AboutView onOpenContact={handleNavigateContact} />
            ) : activePage === 'contact' ? (
              /*
                Dedicated full-page Contact view with nav & footer:
                Asymmetrical luxury editorial design with direct bookings, studio correspondence, and briefing inquiry form.
              */
              <ContactView />
            ) : selectedProject ? (
              /* 
                Masonry grid style of works displayed for related projects page,
                including dynamic Case Study narrative sections from Supabase.
              */
              <ProjectDetailView
                project={selectedProject}
                allProjects={publishedProjects}
                theme={theme}
                onBack={handleNavigateHome}
                onSelectProject={handleSelectProject}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Studio Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
