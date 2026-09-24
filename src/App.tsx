/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { usePublishedProjects, usePortfolioShots, useProductShots } from './hooks/usePortfolioQueries';
import { AnalyticsService } from './features/analytics/services/analyticsService';
import { dbProjectToPortfolioProject } from './features/projects/utils/projectAdapter';
import { SingleShot } from './types';

function dbShotToSingleShot(shot: any): SingleShot {
  return {
    id: shot.id,
    title: shot.title,
    url: shot.url,
    fallbackUrl: shot.fallback_url || undefined,
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

export default function App() {
  // Pure light theme as requested
  const [theme] = useState<ThemeMode>('light');

  // Determine initial route from path or hash (supporting /admin, /about, /contact, #admin, etc.)
  const initialRoute = useMemo(() => {
    if (typeof window === 'undefined') return { page: 'home' as PageView, adminTab: 'overview' as AdminTab, intro: true };
    const hash = window.location.hash || '';
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    
    if (hash.startsWith('#admin') || pathname === '/admin' || pathname.startsWith('/admin/')) {
      const sub = hash.startsWith('#admin') ? hash.replace('#admin', '') : pathname.replace('/admin', '');
      let tab: AdminTab = 'overview';
      if (sub.includes('projects') || sub.includes('project')) tab = 'projects';
      else if (sub.includes('portfolio')) tab = 'portfolio';
      else if (sub.includes('product')) tab = 'products';
      else if (sub.includes('categories')) tab = 'categories';
      else if (sub.includes('media')) tab = 'media';
      else if (sub.includes('analytics')) tab = 'analytics';
      else if (sub.includes('profile')) tab = 'profile';
      return { page: 'admin' as PageView, adminTab: tab, intro: false };
    }
    if (hash === '#about' || pathname === '/about') {
      return { page: 'about' as PageView, adminTab: 'overview' as AdminTab, intro: false };
    }
    if (hash === '#contact' || pathname === '/contact') {
      return { page: 'contact' as PageView, adminTab: 'overview' as AdminTab, intro: false };
    }
    return { page: 'home' as PageView, adminTab: 'overview' as AdminTab, intro: true };
  }, []);

  // Navigation state: 'home' | 'project' | 'about' | 'admin'
  const [activePage, setActivePage] = useState<PageView>(initialRoute.page);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Admin routing state
  const [adminTab, setAdminTab] = useState<AdminTab>(initialRoute.adminTab);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingPortfolioShotId, setEditingPortfolioShotId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // GSAP Intro animation state
  const [introActive, setIntroActive] = useState(initialRoute.intro);
  const navbarLogoRef = useRef<HTMLDivElement>(null);

  // Auth Hook for CMS Access
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Dynamic projects query from Supabase
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

  // Anonymous analytics tracking on page navigation
  useEffect(() => {
    if (activePage !== 'admin') {
      const currentHash = window.location.hash || '#home';
      AnalyticsService.trackView(currentHash, selectedProject?.id);
    }
  }, [activePage, selectedProject]);

  // Synchronize initial URL (path or hash) on mount and listen to navigation events
  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash || '';
      const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

      // Check both path routing (/admin, /admin/projects, etc.) and hash routing (#admin, #admin/projects, etc.)
      const isAdminRoute =
        hash.startsWith('#admin') ||
        pathname === '/admin' ||
        pathname.startsWith('/admin/');

      if (isAdminRoute) {
        setActivePage('admin');
        setSelectedProject(null);

        // Normalize target route from either hash or path
        const adminRoute = hash.startsWith('#admin')
          ? hash
          : `#admin${pathname.slice('/admin'.length)}`;

        if (adminRoute === '#admin' || adminRoute === '#admin/' || adminRoute === '#admin/overview') {
          setAdminTab('overview');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/projects') {
          setAdminTab('projects');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/new-project') {
          setAdminTab('projects');
          setEditingProjectId('new');
        } else if (adminRoute.startsWith('#admin/edit-project-')) {
          const id = adminRoute.replace('#admin/edit-project-', '');
          setAdminTab('projects');
          setEditingProjectId(id);
        } else if (adminRoute === '#admin/portfolio') {
          setAdminTab('portfolio');
          setEditingPortfolioShotId(null);
          setEditingProjectId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/new-portfolio') {
          setAdminTab('portfolio');
          setEditingPortfolioShotId('new');
        } else if (adminRoute.startsWith('#admin/edit-portfolio-')) {
          const id = adminRoute.replace('#admin/edit-portfolio-', '');
          setAdminTab('portfolio');
          setEditingPortfolioShotId(id);
        } else if (adminRoute === '#admin/products') {
          setAdminTab('products');
          setEditingProductId(null);
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
        } else if (adminRoute === '#admin/new-product') {
          setAdminTab('products');
          setEditingProductId('new');
        } else if (adminRoute.startsWith('#admin/edit-product-')) {
          const id = adminRoute.replace('#admin/edit-product-', '');
          setAdminTab('products');
          setEditingProductId(id);
        } else if (adminRoute === '#admin/categories') {
          setAdminTab('categories');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/media') {
          setAdminTab('media');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/analytics') {
          setAdminTab('analytics');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else if (adminRoute === '#admin/profile') {
          setAdminTab('profile');
          setEditingProjectId(null);
          setEditingPortfolioShotId(null);
          setEditingProductId(null);
        } else {
          // Default to overview for any other admin subroute
          setAdminTab('overview');
        }
      } else if (hash === '#about' || pathname === '/about') {
        setActivePage('about');
        setSelectedProject(null);
      } else if (hash === '#contact' || pathname === '/contact') {
        setActivePage('contact');
        setSelectedProject(null);
      } else if (hash.startsWith('#project-') || pathname.startsWith('/project/')) {
        const slug = hash.startsWith('#project-')
          ? hash.replace('#project-', '')
          : pathname.replace('/project/', '');
        const found = publishedProjects.find((p) => p.slug === slug);
        if (found) {
          setSelectedProject(found);
          setActivePage('project');
        }
      } else if (
        !hash ||
        hash === '#' ||
        hash === '#home' ||
        pathname === '/' ||
        pathname === ''
      ) {
        setActivePage('home');
        setSelectedProject(null);
      }
    };

    handleNavigation();
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [publishedProjects]);

  // Apply light theme to document root
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#fafafa';
    document.body.style.color = '#0a0a0a';
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActivePage('project');
    if (window.location.hash !== `#project-${project.slug}`) {
      window.history.pushState(null, '', `#project-${project.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActivePage('home');
    setSelectedProject(null);
    setEditingProjectId(null);
    if (window.location.hash || window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAbout = () => {
    setActivePage('about');
    setSelectedProject(null);
    if (window.location.hash !== '#about') {
      window.history.pushState(null, '', '#about');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateContact = () => {
    setActivePage('contact');
    setSelectedProject(null);
    if (window.location.hash !== '#contact') {
      window.history.pushState(null, '', '#contact');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToPortfolio = () => {
    if (activePage !== 'home') {
      setActivePage('home');
      setSelectedProject(null);
      setTimeout(() => {
        const el = document.getElementById('portfolio-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('portfolio-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToProjects = () => {
    if (activePage !== 'home') {
      setActivePage('home');
      setSelectedProject(null);
      setTimeout(() => {
        const el = document.getElementById('projects-archive-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('projects-archive-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToProducts = () => {
    if (activePage !== 'home') {
      setActivePage('home');
      setSelectedProject(null);
      setTimeout(() => {
        const el = document.getElementById('products-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('products-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIntroActive(true);
  };

  // ADMIN CMS NAVIGATION HANDLERS
  const handleAdminTabChange = (tab: AdminTab) => {
    setAdminTab(tab);
    setEditingProjectId(null);
    setEditingPortfolioShotId(null);
    setEditingProductId(null);
    window.location.hash = `#admin/${tab}`;
  };

  const handleAdminNewProject = () => {
    setAdminTab('projects');
    setEditingProjectId('new');
    setEditingPortfolioShotId(null);
    setEditingProductId(null);
    window.location.hash = '#admin/new-project';
  };

  const handleAdminEditProject = (id: string) => {
    setAdminTab('projects');
    setEditingProjectId(id);
    window.location.hash = `#admin/edit-project-${id}`;
  };

  const handleAdminNewPortfolio = () => {
    setAdminTab('portfolio');
    setEditingPortfolioShotId('new');
    setEditingProjectId(null);
    setEditingProductId(null);
    window.location.hash = '#admin/new-portfolio';
  };

  const handleAdminEditPortfolio = (id: string) => {
    setAdminTab('portfolio');
    setEditingPortfolioShotId(id);
    window.location.hash = `#admin/edit-portfolio-${id}`;
  };

  const handleAdminNewProduct = () => {
    setAdminTab('products');
    setEditingProductId('new');
    setEditingProjectId(null);
    setEditingPortfolioShotId(null);
    window.location.hash = '#admin/new-product';
  };

  const handleAdminEditProduct = (id: string) => {
    setAdminTab('products');
    setEditingProductId(id);
    window.location.hash = `#admin/edit-product-${id}`;
  };

  const handleAdminViewPublicProject = (slug: string) => {
    const found = publishedProjects.find((p) => p.slug === slug);
    if (found) {
      handleSelectProject(found);
    } else {
      window.location.hash = `#project-${slug}`;
    }
  };

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
            onSuccess={() => {
              setAdminTab('overview');
              setEditingProjectId(null);
              setEditingPortfolioShotId(null);
              setEditingProductId(null);
            }}
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
            onBack={() => {
              setEditingProjectId(null);
              setAdminTab('projects');
              window.location.hash = '#admin/projects';
            }}
            onViewPublicProject={handleAdminViewPublicProject}
          />
        ) : editingPortfolioShotId !== null ? (
          <PortfolioEditPage
            shotId={editingPortfolioShotId === 'new' ? null : editingPortfolioShotId}
            onBack={() => {
              setEditingPortfolioShotId(null);
              setAdminTab('portfolio');
              window.location.hash = '#admin/portfolio';
            }}
            onViewPublicPortfolio={handleScrollToPortfolio}
          />
        ) : editingProductId !== null ? (
          <ProductEditPage
            productId={editingProductId === 'new' ? null : editingProductId}
            onBack={() => {
              setEditingProductId(null);
              setAdminTab('products');
              window.location.hash = '#admin/products';
            }}
            onViewPublicProducts={handleScrollToProducts}
          />
        ) : adminTab === 'overview' ? (
          <AdminDashboard
            onNavigateTab={handleAdminTabChange}
            onNavigateToNewProject={handleAdminNewProject}
            onNavigateToNewPortfolio={handleAdminNewPortfolio}
            onNavigateToNewProduct={handleAdminNewProduct}
          />
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
          onComplete={() => setIntroActive(false)}
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
      <main className="w-full overflow-hidden">
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
