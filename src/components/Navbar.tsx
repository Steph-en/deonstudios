import React, { useState, useRef, useEffect } from 'react';
import { AnimatedNavbarLogo } from './AnimatedNavbarLogo';
import { ThemeMode, PageView } from '../types';

interface NavbarProps {
  theme: ThemeMode;
  logoRef: React.RefObject<HTMLDivElement | null>;
  activePage: PageView;
  onNavigateHome: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onScrollToPortfolio: () => void;
  onScrollToProjects: () => void;
  onScrollToProducts: () => void;
  onReplayIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  logoRef,
  activePage,
  onNavigateHome,
  onOpenAbout,
  onOpenContact,
  onScrollToPortfolio,
  onScrollToProjects,
  onScrollToProducts,
}) => {
  const [isBreadcrumbOpen, setIsBreadcrumbOpen] = useState(false);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const isLightHeader = activePage !== 'home';

  const handlePortfolioClick = () => {
    setIsBreadcrumbOpen(false);
    onScrollToPortfolio();
  };

  const handleProjectsClick = () => {
    setIsBreadcrumbOpen(false);
    onScrollToProjects();
  };

  const handleProductsClick = () => {
    setIsBreadcrumbOpen(false);
    onScrollToProducts();
  };

  const handleAboutClick = () => {
    setIsBreadcrumbOpen(false);
    onOpenAbout();
  };

  const handleContactClick = () => {
    setIsBreadcrumbOpen(false);
    onOpenContact();
  };

  // Close breadcrumb dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        breadcrumbRef.current &&
        !breadcrumbRef.current.contains(event.target as Node)
      ) {
        setIsBreadcrumbOpen(false);
      }
    };

    if (isBreadcrumbOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isBreadcrumbOpen]);

  return (
    <>
      {/* 
        Centered Fixed Logo:
        - Fixed to the viewport on ALL screen sizes (mobile phones & desktop)
        - The ONLY element that stays on screen with page scrolling
        - Seamless contrast across home hero and internal pages
      */}
      <div
        ref={logoRef}
        id="sticky-centered-logo"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onNavigateHome();
        }}
        className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer select-none transition-all duration-300 hover:opacity-90 active:scale-95"
        title="Deon Studios"
        aria-label="Deon Studios Home"
      >
        <AnimatedNavbarLogo
          size={44}
          isLightHeader={isLightHeader}
        />
      </div>

      {/* 
        Top Static Header:
        - Positioned absolutely at the very top of the page
        - Does NOT scroll with the page: stays at the top and scrolls out of view
      */}
      <header
        id="main-top-navigation"
        className="absolute top-0 left-0 right-0 z-40 w-full pointer-events-none"
      >
        <div className="w-full px-5 sm:px-6 md:px-10 py-5 sm:py-6 md:py-8 flex items-center justify-end">
          {/* 
            1. Desktop Nav Links (hidden on smaller displays, visible on md+):
            - Portfolio, Projects, Products, About, Contact on the far right corner
          */}
          <nav
            id="desktop-nav-links"
            className="hidden md:flex pointer-events-auto items-center gap-6 lg:gap-7"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              onClick={handlePortfolioClick}
              className={`text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer ${
                isLightHeader
                  ? 'text-neutral-800 hover:text-black'
                  : 'text-white/80 hover:text-white drop-shadow-sm'
              }`}
            >
              Portfolio
            </button>

            <button
              type="button"
              onClick={handleProjectsClick}
              className={`text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer ${
                isLightHeader
                  ? 'text-neutral-800 hover:text-black'
                  : 'text-white/80 hover:text-white drop-shadow-sm'
              }`}
            >
              Projects
            </button>

            <button
              type="button"
              onClick={handleProductsClick}
              className={`text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer ${
                isLightHeader
                  ? 'text-neutral-800 hover:text-black'
                  : 'text-white/80 hover:text-white drop-shadow-sm'
              }`}
            >
              Products
            </button>

            <button
              type="button"
              onClick={handleAboutClick}
              className={`text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer ${
                isLightHeader
                  ? activePage === 'about'
                    ? 'text-black underline underline-offset-8 decoration-1 font-semibold'
                    : 'text-neutral-800 hover:text-black'
                  : 'text-white/80 hover:text-white drop-shadow-sm'
              }`}
            >
              About
            </button>

            <button
              type="button"
              onClick={handleContactClick}
              className={`text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer ${
                isLightHeader
                  ? 'text-neutral-800 hover:text-black'
                  : 'text-white/80 hover:text-white drop-shadow-sm'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* 
            2. Mobile Three-Dash Breadcrumb Icon (visible on smaller displays, hidden on md+):
            - Three-layered dashes breadcrumb icon (pure icon, no circle outline, no background)
            - When clicked: animates smoothly into an "X" close button
            - When closed: animates back into the three horizontal dashes
          */}
          <div
            ref={breadcrumbRef}
            id="mobile-nav-breadcrumb"
            className="md:hidden relative pointer-events-auto select-none"
          >
            {/* Animated Three-Dash to X Trigger Button (No background, No circle border) */}
            <button
              type="button"
              onClick={() => setIsBreadcrumbOpen((prev) => !prev)}
              aria-expanded={isBreadcrumbOpen}
              aria-haspopup="true"
              aria-label={isBreadcrumbOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 flex items-center justify-center transition-opacity duration-300 hover:opacity-75 focus:outline-hidden cursor-pointer"
            >
              <div className="relative w-5 h-4 flex flex-col justify-between items-center">
                {/* Dash 1 (Top Dash -> 45deg X arm) */}
                <span
                  className={`h-[1.5px] w-full rounded-full transition-all duration-300 ease-out origin-center ${
                    isLightHeader ? 'bg-neutral-900' : 'bg-white drop-shadow-sm'
                  } ${
                    isBreadcrumbOpen
                      ? 'translate-y-[7.25px] rotate-45'
                      : 'translate-y-0 rotate-0'
                  }`}
                />

                {/* Dash 2 (Middle Dash -> fades & scales out) */}
                <span
                  className={`h-[1.5px] w-full rounded-full transition-all duration-200 ease-out origin-center ${
                    isLightHeader ? 'bg-neutral-900' : 'bg-white drop-shadow-sm'
                  } ${
                    isBreadcrumbOpen
                      ? 'opacity-0 scale-x-0'
                      : 'opacity-100 scale-x-100'
                  }`}
                />

                {/* Dash 3 (Bottom Dash -> -45deg X arm) */}
                <span
                  className={`h-[1.5px] w-full rounded-full transition-all duration-300 ease-out origin-center ${
                    isLightHeader ? 'bg-neutral-900' : 'bg-white drop-shadow-sm'
                  } ${
                    isBreadcrumbOpen
                      ? '-translate-y-[7.25px] -rotate-45'
                      : 'translate-y-0 rotate-0'
                  }`}
                />
              </div>
            </button>

            {/* Breadcrumb Menu Dropdown (Clean, unnumbered) */}
            {isBreadcrumbOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className={`absolute right-0 mt-3 w-44 p-2 rounded-2xl border shadow-2xl z-50 animate-fade-in backdrop-blur-2xl ${
                  theme === 'dark'
                    ? 'bg-neutral-950/95 border-neutral-800 text-white shadow-black/80'
                    : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-neutral-500/20'
                }`}
              >
                {/* Menu Items: Portfolio, Projects, Products, About, Contact */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handlePortfolioClick}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.22em] font-medium transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-neutral-200 hover:text-white'
                        : 'hover:bg-neutral-100 text-neutral-800 hover:text-black'
                    }`}
                  >
                    Portfolio
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProjectsClick}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.22em] font-medium transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-neutral-200 hover:text-white'
                        : 'hover:bg-neutral-100 text-neutral-800 hover:text-black'
                    }`}
                  >
                    Projects
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProductsClick}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.22em] font-medium transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-neutral-200 hover:text-white'
                        : 'hover:bg-neutral-100 text-neutral-800 hover:text-black'
                    }`}
                  >
                    Products
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAboutClick}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.22em] font-medium transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-neutral-200 hover:text-white'
                        : 'hover:bg-neutral-100 text-neutral-800 hover:text-black'
                    }`}
                  >
                    About
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleContactClick}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.22em] font-medium transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-neutral-200 hover:text-white'
                        : 'hover:bg-neutral-100 text-neutral-800 hover:text-black'
                    }`}
                  >
                    Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
