/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroVideo } from './components/HeroVideo';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetailView } from './components/ProjectDetailView';
import { AboutView } from './components/AboutView';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { GsapIntro } from './components/GsapIntro';
import { PROJECTS } from './data/portfolioData';
import { Project, ThemeMode, PageView } from './types';

export default function App() {
  // Pure light theme as requested
  const [theme] = useState<ThemeMode>('light');

  // Navigation state: 'home' | 'project' | 'about'
  const [activePage, setActivePage] = useState<PageView>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Modals state
  const [isContactOpen, setIsContactOpen] = useState(false);

  // GSAP Intro animation state
  const [introActive, setIntroActive] = useState(true);
  const navbarLogoRef = useRef<HTMLDivElement>(null);

  // Apply light theme to document root
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#fafafa';
    document.body.style.color = '#0a0a0a';
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActivePage('project');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActivePage('home');
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAbout = () => {
    setActivePage('about');
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleReplayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIntroActive(true);
  };

  return (
    <div
      id="deon-studios-app"
      className={`min-h-screen relative font-sans-clean transition-colors duration-500 ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* 
        FEATURE 7:
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
        FEATURE 4 (oghalealex.com inspired):
        Navbar where the logo tracks with scroll down the entire page,
        leaving other navigation links behind.
      */}
      <Navbar
        theme={theme}
        logoRef={navbarLogoRef}
        activePage={activePage}
        onNavigateHome={handleNavigateHome}
        onOpenAbout={handleNavigateAbout}
        onOpenContact={() => setIsContactOpen(true)}
        onScrollToProjects={handleScrollToProjects}
        onReplayIntro={handleReplayIntro}
      />

      {/* Main View Area */}
      <main className="w-full">
        {activePage === 'home' ? (
          <>
            {/* 
              FEATURE 1 (foliobyjake.com inspired):
              Auto-playing background video in the hero section as the page is rendered
            */}
            <HeroVideo
              theme={theme}
              onExploreClick={handleScrollToProjects}
            />

            {/* 
              FEATURE 2 (garrettnaccarato.com inspired):
              Grouped projects presentation indicating which images belong to each project/client.
              Clicking navigates to the dedicated project gallery page.
            */}
            <ProjectsList
              projects={PROJECTS}
              theme={theme}
              onSelectProject={handleSelectProject}
            />
          </>
        ) : activePage === 'about' ? (
          /* 
            Clean, editorial two-column About page view (Garrett Naccarato reference):
            Portrait on the left, clear typography, inquiries, awards, and clients on the right.
          */
          <AboutView onOpenContact={() => setIsContactOpen(true)} />
        ) : selectedProject ? (
          /* 
            FEATURE 3 (chantellekemkemian.com/quick-portfolio inspired):
            Masonry grid style of works displayed for related projects page,
            where clicking an image opens the modal with navigation, close button, and counter.
          */
          <ProjectDetailView
            project={selectedProject}
            allProjects={PROJECTS}
            theme={theme}
            onBack={handleNavigateHome}
            onSelectProject={handleSelectProject}
          />
        ) : null}
      </main>

      {/* Studio Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        theme={theme}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Global Studio Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
